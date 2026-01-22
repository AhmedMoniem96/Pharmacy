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
import { Plus, Pencil, Trash2, Search, CheckCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const GoodsReceipts: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, control } = useForm();

  const { data: goodsReceipts, isLoading } = useQuery({
    queryKey: ['goodsReceiptsList', search],
    queryFn: async () => {
      const res = await api.get(`/purchases/goods-receipts/?search=${search}`);
      return res.data.results || res.data;
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliersList'],
    queryFn: async () => {
      const res = await api.get('/purchases/suppliers/');
      return res.data.results || res.data;
    },
  });

  const warehouseId = localStorage.getItem('selectedWarehouse');

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, warehouse: warehouseId };
      if (editingId) {
        return api.put(`/purchases/goods-receipts/${editingId}/`, payload);
      }
      return api.post('/purchases/goods-receipts/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsReceiptsList'] });
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      toast({ title: t('success'), description: t('grn_saved') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('grn_save_failed') });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/purchases/goods-receipts/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsReceiptsList'] });
      toast({ title: t('success'), description: t('grn_deleted') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('grn_delete_failed') });
    }
  });

  const postMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/purchases/goods-receipts/${id}/post/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsReceiptsList'] });
      toast({ title: t('success'), description: t('grn_posted') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('grn_post_failed') });
    }
  });

  const handleEdit = (grn: any) => {
    setEditingId(grn.id);
    setValue('supplier', String(grn.supplier));
    setValue('ref_po_id', grn.ref_po_id);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    if (!warehouseId) {
      toast({ variant: 'destructive', title: t('error'), description: t('select_warehouse') });
      return;
    }
    setEditingId(null);
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const getStatusStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'border-slate-200 bg-slate-100 text-slate-600';
      case 'POSTED':
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
      case 'SUBMITTED':
        return 'border-sky-200 bg-sky-100 text-sky-700';
      case 'CANCELLED':
        return 'border-rose-200 bg-rose-100 text-rose-700';
      case 'COMPLETED':
        return 'border-emerald-200 bg-emerald-100 text-emerald-700';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('goods_receipt')}</h2>
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

      <div className="rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/40">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reference')}</TableHead>
              <TableHead>{t('supplier')}</TableHead>
              <TableHead>{t('warehouse')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">{t('loading')}</TableCell>
              </TableRow>
            ) : goodsReceipts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">{t('no_data')}</TableCell>
              </TableRow>
            ) : (
              goodsReceipts?.map((grn: any) => (
                <TableRow key={grn.id}>
                  <TableCell className="font-medium">{grn.grn_number}</TableCell>
                  <TableCell>{grn.supplier_name || grn.supplier}</TableCell>
                  <TableCell>{grn.warehouse_name || grn.warehouse}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusStyles(
                        grn.status
                      )}`}
                    >
                      {grn.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {grn.status === 'DRAFT' && (
                      <Button variant="ghost" size="icon" onClick={() => postMutation.mutate(grn.id)} disabled={postMutation.isPending}>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(grn)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(grn.id)}>
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
            <DialogTitle>{editingId ? t('edit') : t('create')} {t('goods_receipt')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('supplier')}</Label>
              <Controller
                control={control}
                name="supplier"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('supplier')} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('purchase_order')} ({t('optional')})</Label>
              <Input {...register('ref_po_id')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? t('loading') : t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
