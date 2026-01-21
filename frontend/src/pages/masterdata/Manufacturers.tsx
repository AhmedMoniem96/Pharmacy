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

  type Manufacturer = {
    id: number;
    name: string;
  };

  type ManufacturerFormValues = {
    name: string;
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ManufacturerFormValues>({
    defaultValues: {
      name: ''
    }
  });

  const {
    data: manufacturers,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['manufacturersList', search],
    queryFn: async () => {
      const res = await api.get('/masterdata/manufacturers/', {
        params: { search }
      });
      return res.data.results || res.data;
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('manufacturer_load_failed') });
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: ManufacturerFormValues) => {
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

  const handleEdit = (manufacturer: Manufacturer) => {
    setEditingId(manufacturer.id);
    reset({ name: manufacturer.name });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = (data: ManufacturerFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('manufacturer_management')}</h2>
        <Button onClick={handleCreate} disabled={mutation.isPending}>
          <Plus className="mr-2 h-4 w-4" /> {t('add_manufacturer')}
        </Button>
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
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-destructive">
                  {t('manufacturer_load_failed')}
                </TableCell>
              </TableRow>
            ) : manufacturers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">{t('no_data')}</TableCell>
              </TableRow>
            ) : (
              manufacturers?.map((manufacturer: Manufacturer) => (
                <TableRow key={manufacturer.id}>
                  <TableCell className="font-medium">{manufacturer.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(manufacturer)}
                      disabled={mutation.isPending || deleteMutation.isPending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(manufacturer.id)}
                      disabled={mutation.isPending || deleteMutation.isPending}
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
            <DialogTitle>{editingId ? t('edit_manufacturer') : t('add_manufacturer')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('manufacturer_name')}</Label>
              <Input id="name" {...register('name', { required: true })} />
              {errors.name ? (
                <p className="text-sm text-destructive">{t('required_field')}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={mutation.isPending}>
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
