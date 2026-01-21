import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Suppliers } from './purchasing/Suppliers';
import { PurchaseOrders } from './purchasing/PurchaseOrders';
import { GoodsReceipts } from './purchasing/GoodsReceipts';
import { SupplierInvoices } from './purchasing/SupplierInvoices';

export const Purchasing: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('suppliers');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t('purchasing')}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">
            {t('suppliers', { defaultValue: 'Suppliers' })}
          </TabsTrigger>
          <TabsTrigger value="orders">
            {t('purchase_orders', { defaultValue: 'Purchase Orders' })}
          </TabsTrigger>
          <TabsTrigger value="receipts">
            {t('goods_receipts', { defaultValue: 'Goods Receipts' })}
          </TabsTrigger>
          <TabsTrigger value="invoices">
            {t('supplier_invoices', { defaultValue: 'Supplier Invoices' })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <Suppliers />
        </TabsContent>
        <TabsContent value="orders" className="space-y-4">
          <PurchaseOrders />
        </TabsContent>
        <TabsContent value="receipts" className="space-y-4">
          <GoodsReceipts />
        </TabsContent>
        <TabsContent value="invoices" className="space-y-4">
          <SupplierInvoices />
        </TabsContent>
      </Tabs>
    </div>
  );
};
