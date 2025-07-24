import React, { useState, useRef } from 'react';
import Button from '../ui/Button';
import { useAuthContext } from '../../auth/AuthContext';
import { FiSun, FiMoon, FiMonitor, FiLogOut, FiSettings, FiBook, FiShoppingBag, FiUsers } from 'react-icons/fi';

export default function Topbar({ onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef();
  const { user, logout } = useAuthContext();

  React.useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="top-0 z-20 flex items-center justify-between px-6 py-4 bg-transperent">
      <div className="flex-1 flex items-center">
        <input
          type="text"
          placeholder="Search for anything"
          className="w-full max-w-xs px-4 py-2 rounded-lg border border-accent bg-white text-dark focus:outline-none focus:ring-2 focus:ring-primary"
          value={search}
          onChange={handleSearchChange}
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(v => !v)} className="flex items-center gap-2 focus:outline-none">
            <img src={user?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'} alt="avatar" className="w-9 h-9 rounded-full border-2 border-primary" />
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 py-4 px-4 flex flex-col gap-2">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-2">
                <img src={user?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'} alt="avatar" className="w-12 h-12 rounded-full border-2 border-primary" />
                <div>
                  <div className="font-bold text-dark">{user?.name}</div>
                  <div className="text-xs text-dark/60">{user?.email}</div>
                </div>
              </div>
              {/* Toggle Buttons */}
              <div className="flex justify-between items-center bg-accent rounded-lg p-2 mb-2">
                <button className="p-2 rounded-lg hover:bg-white"><FiSun /></button>
                <button className="p-2 rounded-lg hover:bg-white"><FiMoon /></button>
              </div>
              {/* Menu Items */}
             {/** <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-dark text-sm font-medium">
                <FiShoppingBag /> Your Shop
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-dark text-sm font-medium">
                <FiBook /> Documentation
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-dark text-sm font-medium">
                <FiUsers /> Affiliate
              </button> */}
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-dark text-sm font-medium">
                <FiSettings /> Settings
              </button>
              <div className="border-t my-2" />
              {/* Logout */}
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 text-sm font-semibold"
                onClick={handleLogout}
              >
                <FiLogOut /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 