import React, { useEffect, useState } from 'react';
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

type Category = {
  id: number;
  name: string;
};

type CategoryFormValues = {
  name: string;
};

export const Categories: React.FC = () => {
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
    formState: { errors }
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: ''
    }
  });

  const {
    data: categories = [],
    isLoading,
    isError
  } = useQuery<Category[]>({
    queryKey: ['categoriesList', search],
    queryFn: async () => {
      const res = await api.get('/masterdata/categories/', {
        params: { search }
      });
      return res.data.results || res.data;
    }
  });

  useEffect(() => {
    if (isError) {
      toast({ variant: 'destructive', title: t('error'), description: t('category_load_failed') });
    }
  }, [isError, t, toast]);

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      if (editingId) {
        return api.put(`/masterdata/categories/${editingId}/`, data);
      }
      return api.post('/masterdata/categories/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriesList'] });
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      toast({ title: t('success'), description: t('category_saved') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('category_save_failed') });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/masterdata/categories/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categoriesList'] });
      toast({ title: t('success'), description: t('category_deleted') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('category_delete_failed') });
    }
  });

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    reset({ name: category.name });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = (data: CategoryFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t('category_management')}</h2>
        <Button onClick={handleCreate} disabled={mutation.isPending}>
          <Plus className="mr-2 h-4 w-4" /> {t('add_category')}
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
                  {t('category_load_failed')}
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">{t('no_data')}</TableCell>
              </TableRow>
            ) : (
              categories.map((category: Category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                      disabled={mutation.isPending || deleteMutation.isPending}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(category.id)}
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
            <DialogTitle>{editingId ? t('edit_category') : t('add_category')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('category_name')}</Label>
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
