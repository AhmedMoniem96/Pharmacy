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
import { Controller, useForm } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type GoodsReceiptFormValues = {
  supplier: string;
  warehouse: string;
  ref_po_id?: string;
};

export const GoodsReceipts: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors }
  } = useForm<GoodsReceiptFormValues>({
    defaultValues: {
      supplier: '',
      warehouse: '',
      ref_po_id: ''
    }
  });

  const { data: goodsReceipts, isLoading, isFetching } = useQuery({
    queryKey: ['goodsReceiptsList', search],
    queryFn: async () => {
      const res = await api.get(`/purchases/goods-receipts/?search=${search}`);
      return res.data.results || res.data;
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load goods receipts' });
    }
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['goodsReceiptSuppliers'],
    queryFn: async () => {
      const res = await api.get('/purchases/suppliers/');
      return res.data.results || res.data;
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load suppliers' });
    }
  });

  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ['goodsReceiptWarehouses'],
    queryFn: async () => {
      const res = await api.get('/masterdata/warehouses/');
      return res.data.results || res.data;
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load warehouses' });
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: GoodsReceiptFormValues) => {
      if (editingId) {
        return api.put(`/purchases/goods-receipts/${editingId}/`, data);
      }
      return api.post('/purchases/goods-receipts/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsReceiptsList'] });
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      toast({ title: t('success'), description: 'Goods Receipt saved' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to save Goods Receipt' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/purchases/goods-receipts/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsReceiptsList'] });
      toast({ title: t('success'), description: 'Goods Receipt deleted' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to delete Goods Receipt' });
    }
  });

  const postMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/purchases/goods-receipts/${id}/post/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goodsReceiptsList'] });
      toast({ title: t('success'), description: 'Goods Receipt posted' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to post Goods Receipt' });
    }
  });

  const handleEdit = (grn: any) => {
    setEditingId(grn.id);
    setValue('supplier', String(grn.supplier_id ?? grn.supplier ?? ''));
    setValue('warehouse', String(grn.warehouse_id ?? grn.warehouse ?? ''));
    setValue('ref_po_id', grn.ref_po_id);
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

  const receipts = goodsReceipts ?? [];

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
        {isFetching && !isLoading && (
          <span className="text-xs text-muted-foreground">{t('loading')}</span>
        )}
      </div>

      <div className="border rounded-md">
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
            ) : receipts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex flex-col items-center gap-1 py-4 text-muted-foreground">
                    <span>{t('no_data')}</span>
                    <span className="text-xs">Try adjusting your search.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              receipts.map((grn: any) => (
                <TableRow key={grn.id}>
                  <TableCell className="font-medium">{grn.reference || grn.grn_no}</TableCell>
                  <TableCell>{grn.supplier_name || grn.supplier || '—'}</TableCell>
                  <TableCell>{grn.warehouse_name || grn.warehouse || '—'}</TableCell>
                  <TableCell>{grn.status || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => postMutation.mutate(grn.id)}
                      disabled={postMutation.isPending || grn.status !== 'DRAFT'}
                    >
                      Post
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(grn)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(grn.id)}
                    >
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
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={suppliersLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('supplier')} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.length ? (
                        suppliers.map((supplier: any) => (
                          <SelectItem key={supplier.id} value={String(supplier.id)}>
                            {supplier.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          {suppliersLoading ? t('loading') : t('no_data')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.supplier && (
                <p className="text-sm text-destructive">This field is required.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('warehouse')}</Label>
              <Controller
                control={control}
                name="warehouse"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={warehousesLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('warehouse')} />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.length ? (
                        warehouses.map((warehouse: any) => (
                          <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                            {warehouse.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          {warehousesLoading ? t('loading') : t('no_data')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.warehouse && (
                <p className="text-sm text-destructive">This field is required.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('purchase_order')}</Label>
              <Input {...register('ref_po_id')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('loading') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
