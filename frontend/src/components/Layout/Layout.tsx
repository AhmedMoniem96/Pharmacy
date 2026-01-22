import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-foreground font-sans antialiased dark:bg-slate-950">
      <Sidebar />
      <div className="relative flex flex-1 min-w-0 flex-col">
        <Topbar />
        <main className="relative flex-1 overflow-y-auto p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white via-slate-100/60 to-transparent opacity-80 dark:from-slate-900/50 dark:via-slate-950/10" />
          <div className="relative">
            <Outlet /> {/* This is where nested routes will be rendered */}
          </div>
        </main>
      </div>
    </div>
  );
};
