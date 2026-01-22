import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, ShoppingCart, Truck, Calculator, LogOut, Moon, Sun, Languages, Menu } from 'lucide-react';
import api from '../api/axios';

export default function Layout() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    api.get('/accounts/me/')
      .then(res => setUser(res.data))
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  const navItems = [
    { path: '/', label: 'dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/inventory', label: 'inventory', icon: <Package size={20} /> },
    { path: '/sales', label: 'pos', icon: <ShoppingCart size={20} /> },
    { path: '/purchases', label: 'purchasing', icon: <Truck size={20} /> },
    { path: '/accounting', label: 'accounting', icon: <Calculator size={20} /> },
  ];

  if (!user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex transition-colors duration-300">
      
      {/* Sidebar */}
      <aside className={`bg-white dark:bg-gray-800 shadow-lg flex flex-col transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
          <h1 className={`font-bold text-indigo-600 dark:text-indigo-400 text-xl transition-all ${!sidebarOpen && 'hidden'}`}>
            {t('app_name')}
          </h1>
          {!sidebarOpen && <span className="text-indigo-600 font-bold text-xl">PS</span>}
        </div>

        <nav className="flex-1 py-4 space-y-2 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path 
                  ? 'bg-indigo-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="mx-3 font-medium">{t(item.label)}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t dark:border-gray-700">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="mx-3 font-medium">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6 transition-colors duration-300">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <Menu size={24} />
          </button>

          <div className="flex items-center space-x-4">
            <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
              <Languages size={20} />
            </button>

            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.user.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.company?.name}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}