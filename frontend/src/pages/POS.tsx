import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const branchId = localStorage.getItem('selectedBranch');
  const warehouseId = localStorage.getItem('selectedWarehouse');

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', normalizedSearch],
    queryFn: async () => {
      if (!normalizedSearch) return [];
      const res = await api.get(`/masterdata/products/?search=${encodeURIComponent(normalizedSearch)}`);
      return res.data.results || res.data;
    },
    enabled: normalizedSearch.length > 0,
  });

  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) return [];
    const matchesSearch = (product: Product) => {
      const nameMatch = product.name?.toLowerCase().includes(normalizedSearch);
      const barcodeMatch = product.barcode?.toLowerCase().includes(normalizedSearch);
      return nameMatch || barcodeMatch;
    };

    return (products ?? []).filter(matchesSearch);
  }, [products, normalizedSearch]);

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

  const total = cart.reduce((sum, item) => sum + (parseFloat(item.selling_price) * item.qty), 0);

  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/sales/pos/sale/', data);
      return res.data;
    },
    onSuccess: (data) => {
      setLastReceipt(data);
      setCart([]);
      setIsPaymentOpen(false);
      toast({ title: t('success'), description: t('sale_completed') });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['nearExpiryAlerts'] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || t('sale_failed');
      toast({ variant: 'destructive', title: t('error'), description: errorMsg });
    }
  });

  const handlePrintReceipt = () => {
    if (!lastReceipt) {
      toast({ variant: 'destructive', title: t('error'), description: 'No receipt available to print.' });
      return;
    }

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      toast({ variant: 'destructive', title: t('error'), description: 'Popup blocked. Please allow popups to print.' });
      return;
    }

    const receiptJson = JSON.stringify(lastReceipt, null, 2);
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; padding: 24px; }
            h1 { font-size: 18px; margin-bottom: 16px; }
            pre { white-space: pre-wrap; word-break: break-word; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Receipt</h1>
          <pre>${receiptJson}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };

    toast({ title: t('success'), description: 'Receipt ready to print.' });
  };

  const handleCheckout = () => {
    if (!branchId || !warehouseId) {
      toast({ variant: 'destructive', title: t('error'), description: t('select_branch_warehouse') });
      return;
    }
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: t('error'), description: t('add_item_to_cart') });
      return;
    }
    
    const payload = {
      branch_id: branchId,
      warehouse_id: warehouseId,
      items: cart.map(item => ({ product_id: item.id, qty: item.qty })),
      discount_total: "0.00",
      payments: [{ method: paymentMethod, amount: total.toFixed(2) }]
    };
    createSaleMutation.mutate(payload);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={t('pos_search_placeholder')}
            className="pl-9 h-12 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredProducts.length === 1) {
                addToCart(filteredProducts[0]);
              }
            }}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto content-start">
          {isProductsLoading && <p>{t('loading')}...</p>}
          {filteredProducts.map((product: Product) => (
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
              {cart.map((item) => (
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
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t bg-muted/50 space-y-4">
          <div className="flex justify-between text-2xl font-bold">
            <span>{t('total')}</span>
            <span>${total.toFixed(2)}</span>
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

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('payment')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setPaymentMethod('CASH')}
              >
                <Banknote className="h-6 w-6" />
                {t('cash')}
              </Button>
              <Button 
                variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard className="h-6 w-6" />
                {t('card')}
              </Button>
            </div>
            <div className="text-center text-3xl font-bold py-4">
              ${total.toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCheckout} disabled={createSaleMutation.isPending}>{createSaleMutation.isPending ? t('loading') : t('confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!lastReceipt} onOpenChange={(open) => !open && setLastReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('receipt')}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-xs font-mono">
            <pre>{JSON.stringify(lastReceipt, null, 2)}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLastReceipt(null)}>{t('close')}</Button>
            <Button onClick={handlePrintReceipt}><Printer className="mr-2 h-4 w-4" /> {t('print')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
