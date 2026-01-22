import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Inventory() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for display
    setTimeout(() => {
        setStock([
            { id: 1, product_name: 'Paracetamol 500mg', batch_no: 'B001', qty: 100, expiry_date: '2025-12-31', status: 'Good' },
            { id: 2, product_name: 'Ibuprofen 400mg', batch_no: 'B002', qty: 50, expiry_date: '2024-06-30', status: 'Low Stock' },
            { id: 3, product_name: 'Amoxicillin 250mg', batch_no: 'B003', qty: 10, expiry_date: '2024-02-15', status: 'Expiring Soon' },
        ]);
        setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good': return 'border-emerald-200 bg-emerald-100 text-emerald-700';
      case 'Low Stock': return 'border-amber-200 bg-amber-100 text-amber-700';
      case 'Expiring Soon': return 'border-rose-200 bg-rose-100 text-rose-700';
      default: return 'border-slate-200 bg-slate-100 text-slate-600';
    }
  };

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold leading-7 text-slate-900 sm:text-3xl sm:truncate dark:text-white">Inventory</h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button type="button" className="ml-3 inline-flex items-center rounded-full border border-transparent bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none">
            Add Stock
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/40">
              <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800/60">
                <thead className="bg-slate-100/60 text-slate-600 dark:bg-slate-900/60 dark:text-slate-300">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">Batch</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Qty</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">Expiry</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 bg-white/80 text-slate-700 dark:divide-slate-800/60 dark:bg-slate-950/40 dark:text-slate-200">
                  {loading ? (
                      <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                  ) : stock.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{item.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{item.batch_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right dark:text-slate-300">{item.qty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right dark:text-slate-300">{item.expiry_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
