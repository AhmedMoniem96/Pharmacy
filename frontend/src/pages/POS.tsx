import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/api/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, Printer } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  barcode: string;
  selling_price: string;
}

interface CartItem extends Product {
  qty: number;
}

export const POS: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [receiptInvoiceId, setReceiptInvoiceId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const branchId = localStorage.getItem('selectedBranch');
  const warehouseId = localStorage.getItem('selectedWarehouse');

  // Focus search on load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Product Search
  const { data: products, isLoading: isProductsLoading, isError: isProductsError } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      if (!search) return [];
      const res = await api.get(`/masterdata/products/?search=${search}`);
      return res.data.results || res.data;
    },
    enabled: search.trim().length > 0,
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load products' });
    }
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setSearch('');
    searchInputRef.current?.focus();
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = useMemo(() => (
    cart.reduce((sum, item) => sum + (parseFloat(item.selling_price) * item.qty), 0)
  ), [cart]);
  const discountTotal = 0;
  const taxTotal = 0;
  const grandTotal = subtotal - discountTotal + taxTotal;

  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sales/pos/sale/', data);
      return res.data;
    },
    onSuccess: (data) => {
      setLastReceipt(data);
      const invoiceId = data?.invoice_id ?? data?.invoice?.id ?? null;
      setReceiptInvoiceId(invoiceId);
      setCart([]);
      setIsPaymentOpen(false);
      toast({ title: t('success'), description: 'Sale completed' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Sale failed' });
    }
  });

  const receiptQuery = useQuery({
    queryKey: ['receipt', receiptInvoiceId],
    queryFn: async () => {
      if (!receiptInvoiceId) return null;
      const res = await api.get(`/sales/pos/${receiptInvoiceId}/receipt/`);
      return res.data;
    },
    enabled: !!receiptInvoiceId && !!lastReceipt,
    onError: () => {
      toast({ variant: 'destructive', title: t('error'), description: 'Failed to load receipt' });
    }
  });

  const handleCheckout = () => {
    if (!branchId || !warehouseId) {
      toast({ variant: 'destructive', title: t('error'), description: 'Select branch & warehouse first' });
      return;
    }
    
    const payload = {
      branch_id: branchId,
      warehouse_id: warehouseId,
      items: cart.map(item => ({ product_id: item.id, qty: item.qty })),
      discount_total: discountTotal.toFixed(2),
      tax_total: taxTotal.toFixed(2),
      payments: [{ method: paymentMethod, amount: grandTotal.toFixed(2) }]
    };
    createSaleMutation.mutate(payload);
  };

  const productResults: Product[] = products || [];
  const showTypeahead = search.trim().length > 0;
  const receiptData = receiptQuery.data ?? lastReceipt;

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      {/* Left: Product Search & Grid */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Scan barcode or search name"
            className="pl-9 h-12 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && productResults.length > 0) {
                addToCart(productResults[0]);
              }
            }}
          />
          {showTypeahead && (
            <div className="absolute z-10 mt-2 w-full rounded-md border bg-background shadow-lg">
              {isProductsLoading ? (
                <div className="p-3 text-sm text-muted-foreground">Loading products...</div>
              ) : isProductsError ? (
                <div className="p-3 text-sm text-destructive">Unable to load products.</div>
              ) : productResults.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No matches found.</div>
              ) : (
                productResults.slice(0, 6).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => addToCart(product)}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.barcode}</div>
                    </div>
                    <div className="whitespace-nowrap font-semibold text-primary">
                      ${product.selling_price}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto content-start">
          {isProductsLoading && (
            <div className="col-span-full text-sm text-muted-foreground">Loading products...</div>
          )}
          {isProductsError && (
            <div className="col-span-full text-sm text-destructive">Unable to load products.</div>
          )}
          {!isProductsLoading && !isProductsError && productResults.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">
              {search.trim().length > 0 ? 'No products found.' : 'Start typing to search products.'}
            </div>
          )}
          {!isProductsLoading && !isProductsError && productResults.map((product: Product) => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:border-primary transition-all"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div className="font-bold truncate">{product.name}</div>
                <div className="text-sm text-muted-foreground">{product.barcode}</div>
                <div className="text-primary font-bold text-lg">${product.selling_price}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <Card className="w-[400px] flex flex-col h-full">
        <div className="p-4 border-b bg-muted/50">
          <h2 className="font-bold text-lg">{t('items')} ({cart.length})</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">{t('name')}</TableHead>
                <TableHead className="text-center">{t('quantity')}</TableHead>
                <TableHead className="text-right">{t('total')}</TableHead>
                <TableHead className="w-[30px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-sm text-muted-foreground">
                    Cart is empty.
                  </TableCell>
                </TableRow>
              ) : (
                cart.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="truncate w-[120px]">{item.name}</div>
                      <div className="text-xs text-muted-foreground">${item.selling_price}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-4 text-center">{item.qty}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${(parseFloat(item.selling_price) * item.qty).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t bg-muted/50 space-y-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t('subtotal')}</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('discount')}</span>
              <span>${discountTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('tax')}</span>
              <span>${taxTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between text-2xl font-bold">
            <span>{t('total')}</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full h-12 text-lg" 
            disabled={cart.length === 0}
            onClick={() => setIsPaymentOpen(true)}
          >
            {t('checkout')}
          </Button>
        </div>
      </Card>

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('payment')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('payment_method')}</label>
              <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'CASH' | 'CARD')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('payment_method')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      {t('cash')}
                    </div>
                  </SelectItem>
                  <SelectItem value="CARD">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t('card')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-center text-3xl font-bold py-4">
              ${grandTotal.toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCheckout} disabled={createSaleMutation.isLoading}>
              {createSaleMutation.isLoading ? t('loading') : t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal (Simple JSON dump for MVP) */}
      <Dialog open={!!lastReceipt} onOpenChange={(open) => {
        if (!open) {
          setLastReceipt(null);
          setReceiptInvoiceId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('receipt')}</DialogTitle>
          </DialogHeader>
          {receiptQuery.isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading receipt...</div>
          ) : (
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-xs font-mono">
              <pre>{JSON.stringify(receiptData, null, 2)}</pre>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setLastReceipt(null);
              setReceiptInvoiceId(null);
            }}>
              {t('close')}
            </Button>
            <Button><Printer className="mr-2 h-4 w-4" /> {t('print')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
