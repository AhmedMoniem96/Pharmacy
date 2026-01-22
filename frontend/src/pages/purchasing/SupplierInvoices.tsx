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
import { useForm, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const SupplierInvoices: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, control } = useForm();

  const { data: supplierInvoices, isLoading } = useQuery({
    queryKey: ['supplierInvoicesList', search],
    queryFn: async () => {
      const res = await api.get(`/purchases/supplier-invoices/?search=${search}`);
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

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return api.put(`/purchases/supplier-invoices/${editingId}/`, data);
      }
      return api.post('/purchases/supplier-invoices/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierInvoicesList'] });
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      toast({ title: t('success'), description: t('si_saved') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('si_save_failed') });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/purchases/supplier-invoices/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierInvoicesList'] });
      toast({ title: t('success'), description: t('si_deleted') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('si_delete_failed') });
    }
  });

  const handleEdit = (invoice: any) => {
    setEditingId(invoice.id);
    setValue('supplier', String(invoice.supplier));
    setValue('invoice_number', invoice.invoice_number);
    setValue('amount', invoice.amount);
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
        <h2 className="text-xl font-bold">{t('supplier_invoice')}</h2>
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
              <TableHead>{t('invoice_number')}</TableHead>
              <TableHead>{t('supplier')}</TableHead>
              <TableHead className="text-right">{t('amount')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">{t('loading')}</TableCell>
              </TableRow>
            ) : supplierInvoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">{t('no_data')}</TableCell>
              </TableRow>
            ) : (
              supplierInvoices?.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.supplier_name || invoice.supplier}</TableCell>
                  <TableCell className="text-right">${invoice.amount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(invoice)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(invoice.id)}>
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
            <DialogTitle>{editingId ? t('edit') : t('create')} {t('supplier_invoice')}</DialogTitle>
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
              <Label>{t('invoice_number')}</Label>
              <Input {...register('invoice_number', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t('amount')}</Label>
              <Input type="number" step="0.01" {...register('amount', { required: true })} />
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