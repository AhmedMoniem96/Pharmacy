import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet /> {/* This is where nested routes will be rendered */}
        </main>
      </div>
    </div>
  );
};