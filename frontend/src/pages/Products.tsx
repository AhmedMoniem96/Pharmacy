import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';

export const Products: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: products, isLoading } = useQuery({
    queryKey: ['productsList', search],
    queryFn: async () => {
      const res = await api.get(`/masterdata/products/?search=${search}`);
      return res.data.results || res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return api.put(`/masterdata/products/${editingId}/`, data);
      }
      return api.post('/masterdata/products/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsList'] });
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      toast({ title: t('success'), description: 'Product saved' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to save product' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/masterdata/products/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsList'] });
      toast({ title: t('success'), description: 'Product deleted' });
    }
  });

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setValue('name', product.name);
    setValue('barcode', product.barcode);
    setValue('sku', product.sku);
    setValue('selling_price', product.selling_price);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('products')}</h1>
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> {t('add_product')}</Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder={t('search_placeholder')} 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('barcode')}</TableHead>
              <TableHead>{t('sku')}</TableHead>
              <TableHead className="text-right">{t('price')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">{t('loading')}</TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">{t('no_data')}</TableCell>
              </TableRow>
            ) : (
              products?.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.barcode}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell className="text-right">${product.selling_price}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(product.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t('edit') : t('create')} {t('products')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('name')}</Label>
              <Input {...register('name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('barcode')}</Label>
              <Input {...register('barcode')} />
            </div>
            <div className="space-y-2">
              <Label>{t('sku')}</Label>
              <Input {...register('sku')} />
            </div>
            <div className="space-y-2">
              <Label>{t('selling_price')}</Label>
              <Input type="number" step="0.01" {...register('selling_price', { required: true })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
              <Button type="submit">{t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};