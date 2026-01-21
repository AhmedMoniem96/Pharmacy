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

export const PurchaseOrders: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ['purchaseOrdersList', search],
    queryFn: async () => {
      const res = await api.get(`/purchases/purchase-orders/?search=${search}`);
      return res.data.results || res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return api.put(`/purchases/purchase-orders/${editingId}/`, data);
      }
      return api.post('/purchases/purchase-orders/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrdersList'] });
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      toast({ title: t('success'), description: 'Purchase Order saved' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to save Purchase Order' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/purchases/purchase-orders/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrdersList'] });
      toast({ title: t('success'), description: 'Purchase Order deleted' });
    }
  });

  const handleEdit = (po: any) => {
    setEditingId(po.id);
    setValue('reference', po.reference);
    setValue('supplier', po.supplier); // This would ideally be a supplier ID
    setValue('status', po.status);
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
        <h2 className="text-xl font-bold">{t('purchase_order')}</h2>
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
              <TableHead>{t('reference')}</TableHead>
              <TableHead>{t('supplier')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">{t('loading')}</TableCell>
              </TableRow>
            ) : purchaseOrders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">{t('no_data')}</TableCell>
              </TableRow>
            ) : (
              purchaseOrders?.map((po: any) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.reference}</TableCell>
                  <TableCell>{po.supplier_name || po.supplier}</TableCell> {/* Assuming supplier_name or just ID */}
                  <TableCell>{po.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(po)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(po.id)}>
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
            <DialogTitle>{editingId ? t('edit') : t('create')} {t('purchase_order')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('reference')}</Label>
              <Input {...register('reference', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('supplier')}</Label>
              <Input {...register('supplier', { required: true })} /> {/* This should be a select for supplier ID */}
            </div>
            <div className="space-y-2">
              <Label>{t('status')}</Label>
              <Input {...register('status')} /> {/* This should be a select for status */}
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