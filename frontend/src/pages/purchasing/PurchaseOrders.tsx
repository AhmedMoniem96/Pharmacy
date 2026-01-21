import React, { useMemo, useState } from 'react';
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

type PurchaseOrderFormValues = {
  reference: string;
  supplier: string;
  status: string;
};

export const PurchaseOrders: React.FC = () => {
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
  } = useForm<PurchaseOrderFormValues>({
    defaultValues: {
      reference: '',
      supplier: '',
      status: ''
    }
  });

  const statusOptions = useMemo(
    () => [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'SENT', label: 'Sent' },
      { value: 'RECEIVED', label: 'Received' },
      { value: 'CANCELED', label: 'Canceled' }
    ],
    []
  );

  const { data: purchaseOrders, isLoading, isFetching } = useQuery({
    queryKey: ['purchaseOrdersList', search],
    queryFn: async () => {
      const res = await api.get(`/purchases/purchase-orders/?search=${search}`);
      return res.data.results || res.data;
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load purchase orders' });
    }
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['purchaseOrderSuppliers'],
    queryFn: async () => {
      const res = await api.get('/purchases/suppliers/');
      return res.data.results || res.data;
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load suppliers' });
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: PurchaseOrderFormValues) => {
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
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to delete Purchase Order' });
    }
  });

  const handleEdit = (po: any) => {
    setEditingId(po.id);
    setValue('reference', po.reference || po.po_no || '');
    setValue('supplier', String(po.supplier_id ?? po.supplier ?? ''));
    setValue('status', po.status || '');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = (data: PurchaseOrderFormValues) => {
    mutation.mutate(data);
  };

  const orders = purchaseOrders ?? [];

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
              <TableHead>{t('status')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">{t('loading')}</TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <div className="flex flex-col items-center gap-1 py-4 text-muted-foreground">
                    <span>{t('no_data')}</span>
                    <span className="text-xs">Try adjusting your search.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((po: any) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.reference || po.po_no}</TableCell>
                  <TableCell>{po.supplier_name || po.supplier || '—'}</TableCell>
                  <TableCell>{po.status}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(po)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate(po.id)}
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

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            reset();
            setEditingId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t('edit') : t('create')} {t('purchase_order')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('reference')}</Label>
              <Input {...register('reference', { required: true })} />
              {errors.reference && (
                <p className="text-sm text-destructive">This field is required.</p>
              )}
            </div>
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
              <Label>{t('status')}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('status')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
