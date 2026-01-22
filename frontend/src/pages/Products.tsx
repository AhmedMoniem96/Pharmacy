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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Categories } from './masterdata/Categories';
import { Manufacturers } from './masterdata/Manufacturers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ProductFormValues = {
  name: string;
  barcode: string;
  sku: string;
  cost: number | null;
  selling_price: number | null;
  category: string;
  manufacturer: string;
};

export const Products: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, control } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      barcode: '',
      sku: '',
      cost: null,
      selling_price: null,
      category: '',
      manufacturer: '',
    },
  });

  const productParams = useMemo(() => ({
    search,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    manufacturer: manufacturerFilter === 'all' ? undefined : manufacturerFilter,
  }), [categoryFilter, manufacturerFilter, search]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['productsList', productParams],
    queryFn: async () => {
      const res = await api.get('/masterdata/products/', { params: productParams });
      return res.data.results || res.data;
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: async () => {
      const res = await api.get('/masterdata/categories/');
      return res.data.results || res.data;
    },
  });

  const { data: manufacturers, isLoading: manufacturersLoading } = useQuery({
    queryKey: ['manufacturersList'],
    queryFn: async () => {
      const res = await api.get('/masterdata/manufacturers/');
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
      toast({ title: t('success'), description: t('product_saved') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('product_save_failed') });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/masterdata/products/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productsList'] });
      toast({ title: t('success'), description: t('product_deleted') });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: t('product_delete_failed') });
    }
  });

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setValue('name', product.name);
    setValue('barcode', product.barcode);
    setValue('sku', product.sku);
    setValue('selling_price', product.selling_price ?? null);
    setValue('cost', product.cost ?? null);
    setValue('category', product.category ? String(product.category) : '');
    setValue('manufacturer', product.manufacturer ? String(product.manufacturer) : '');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    reset();
    setIsModalOpen(true);
  };

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      category: data.category ? Number(data.category) : null,
      manufacturer: data.manufacturer ? Number(data.manufacturer) : null,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('products')}</h1>
      
      <Tabs defaultValue="product-details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="product-details">{t('product_details')}</TabsTrigger>
          <TabsTrigger value="category-management">{t('category_management')}</TabsTrigger>
          <TabsTrigger value="manufacturer-management">{t('manufacturer_management')}</TabsTrigger>
        </TabsList>

        <TabsContent value="product-details" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{t('products')}</h2>
            <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> {t('add_product')}</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={categoriesLoading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                {categories?.length ? (
                  categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {categoriesLoading ? t('loading') : t('no_data')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter} disabled={manufacturersLoading}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder={t('manufacturer')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                {manufacturers?.length ? (
                  manufacturers.map((man: any) => (
                    <SelectItem key={man.id} value={String(man.id)}>{man.name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {manufacturersLoading ? t('loading') : t('no_data')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('barcode')}</TableHead>
                  <TableHead>{t('sku')}</TableHead>
                  <TableHead>{t('category')}</TableHead>
                  <TableHead>{t('manufacturer')}</TableHead>
                  <TableHead className="text-right">{t('selling_price')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">{t('loading')}</TableCell>
                  </TableRow>
                ) : products?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">{t('no_data')}</TableCell>
                  </TableRow>
                ) : (
                  products?.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.category_name || product.category}</TableCell>
                      <TableCell>{product.manufacturer_name || product.manufacturer}</TableCell>
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
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input id="name" {...register('name', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">{t('barcode')}</Label>
                  <Input id="barcode" {...register('barcode')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">{t('sku')}</Label>
                  <Input id="sku" {...register('sku')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price">{t('selling_price')}</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    {...register('selling_price', { required: true, valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">{t('cost')}</Label>
                  <Input id="cost" type="number" step="0.01" {...register('cost', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category')}</Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={categoriesLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('category')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.length ? (
                            categories.map((cat: any) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              {categoriesLoading ? t('loading') : t('no_data')}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">{t('manufacturer')}</Label>
                  <Controller
                    control={control}
                    name="manufacturer"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={manufacturersLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('manufacturer')} />
                        </SelectTrigger>
                        <SelectContent>
                          {manufacturers?.map((man: any) => (
                            <SelectItem key={man.id} value={String(man.id)}>{man.name}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            {manufacturersLoading ? t('loading') : t('no_data')}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
                  <Button type="submit">{t('save')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="category-management" className="space-y-4">
          <Categories />
        </TabsContent>

        <TabsContent value="manufacturer-management" className="space-y-4">
          <Manufacturers />
        </TabsContent>
      </Tabs>
    </div>
  );
};