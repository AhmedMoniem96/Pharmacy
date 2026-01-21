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

export const Manufacturers: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: manufacturers, isLoading } = useQuery({
    queryKey: ['manufacturersList', search],
    queryFn: async () => {
      const res = await api.get(`/masterdata/manufacturers/?search=${search}`);
      return res.data.results || res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingId) {
        return api.put(`/masterdata/manufacturers/${editingId}/`, data);
      }
      return api.post('/masterdata/manufacturers/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturersList'] });
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      toast({ title: t('success'), description: t('manufacturer_saved') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('manufacturer_save_failed') });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/masterdata/manufacturers/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturersList'] });
      toast({ title: t('success'), description: t('manufacturer_deleted') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('manufacturer_delete_failed') });
    }
  });

  const handleEdit = (manufacturer: any) => {
    setEditingId(manufacturer.id);
    setValue('name', manufacturer.name);
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
        <h2 className="text-xl font-bold">{t('manufacturer_management')}</h2>
        <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> {t('add_manufacturer')}</Button>
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
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">{t('loading')}</TableCell>
              </TableRow>
            ) : manufacturers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">{t('no_data')}</TableCell>
              </TableRow>
            ) : (
              manufacturers?.map((manufacturer: any) => (
                <TableRow key={manufacturer.id}>
                  <TableCell className="font-medium">{manufacturer.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(manufacturer)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(manufacturer.id)}>
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
            <DialogTitle>{editingId ? t('edit_manufacturer') : t('add_manufacturer')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('manufacturer_name')}</Label>
              <Input id="name" {...register('name', { required: true })} />
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