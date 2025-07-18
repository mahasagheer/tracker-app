import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuthContext } from '../../auth/AuthContext';

export default function DashboardLayout({ children, onSearch }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 'w-20' : 'w-64';
  const mainMargin = collapsed ? 'ml-20' : 'ml-64';
  const { userType } = useAuthContext();

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className={`transition-all duration-300 ${mainMargin} flex flex-col`}>
        <Topbar onSearch={onSearch} />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 