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

export const Suppliers: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliersList', search],
    queryFn: async () => {
      const res = await api.get(`/purchases/suppliers/?search=${search}`);
      return res.data.results || res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return api.put(`/purchases/suppliers/${editingId}/`, data);
      }
      return api.post('/purchases/suppliers/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliersList'] });
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      toast({ title: t('success'), description: 'Supplier saved' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to save supplier' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/purchases/suppliers/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliersList'] });
      toast({ title: t('success'), description: 'Supplier deleted' });
    }
  });

  const handleEdit = (supplier: any) => {
    setEditingId(supplier.id);
    setValue('name', supplier.name);
    setValue('contact_person', supplier.contact_person);
    setValue('phone', supplier.phone);
    setValue('email', supplier.email);
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
        <h2 className="text-xl font-bold">{t('supplier')}</h2>
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> {t('create')}</Button>
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
              <TableHead>{t('contact_person')}</TableHead>
              <TableHead>{t('phone')}</TableHead>
              <TableHead>{t('email')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">{t('loading')}</TableCell>
              </TableRow>
            ) : suppliers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">{t('no_data')}</TableCell>
              </TableRow>
            ) : (
              suppliers?.map((supplier: any) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(supplier.id)}>
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
            <DialogTitle>{editingId ? t('edit') : t('create')} {t('supplier')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('name')}</Label>
              <Input {...register('name', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('contact_person')}</Label>
              <Input {...register('contact_person')} />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input type="email" {...register('email')} />
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