import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFolder, FiCheckCircle, FiUsers, FiCreditCard, FiCalendar, FiSettings, FiChevronLeft, FiChevronRight, FiBarChart2, FiList, FiMessageCircle } from 'react-icons/fi';
import { useAuthContext } from '../../auth/AuthContext';

const adminNavItems = [
  { label: 'Dashboard', icon: <FiHome size={24} />, to: '/dashboard' },
  { label: 'Projects', icon: <FiFolder size={24} />, to: '/projects' },
  { label: 'Team', icon: <FiUsers size={24} />, to: '/team' },
  { label: 'Calendar', icon: <FiCalendar size={24} />, to: '/calendar' },
];

const employeeNavItems = [
  { label: 'Summary', icon: <FiBarChart2 size={24} />, to: '/summary' },
  { label: 'Activity', icon: <FiHome size={24} />, to: '/activity' },
  { label: 'Project', icon: <FiFolder size={24} />, to: '/projects' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuthContext();
  const navItems = user?.role === 'Time Reporter' ? employeeNavItems : adminNavItems;

  return (
    <aside className={`fixed left-0 top-0 ${collapsed ? 'w-20' : 'w-64'} bg-light  flex flex-col py-6 h-screen z-30 transition-all duration-300`}>
      <div className={`mb-10 ${collapsed ? 'ml-0 flex justify-center' : 'ml-5'}`}>
      <span className="font-bold text-2xl text-dark tracking-tight flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#C6F36B"/>
              <path d="M10 22L22 10M10 10H22V22" stroke="#222B20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={collapsed ? 'hidden' : ''}>GreenVision            </span>

          </span>      </div>
      <nav className="flex-1 flex flex-col gap-2 w-full">
        {navItems.map(item => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-lg mx-2 text-base font-medium transition hover:bg-primary/10 hover:text-dark ${isActive ? 'bg-primary text-dark' : 'text-dark'}`
            }
            end
          >
            <span className="w-6 h-6 flex items-center justify-center">{item.icon}</span>
            <span className={collapsed ? 'hidden' : ''}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <button
        onClick={onToggle}
        className={`absolute top-20 -right-2 bg-white border rounded-full shadow p-1 transition-transform ${collapsed ? 'rotate-180' : ''}`}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
      </button>
    </aside>
  );
} 