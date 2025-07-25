import React from 'react';

export default function Drawer({ isOpen = true, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-end bg-black bg-opacity-30">
      <div
        className="bg-white shadow-xl h-full p-6 relative animate-slide-in-right overflow-y-auto"
        style={{ width: '45vw', maxWidth: '100vw' }}
      >
        <button
          className="absolute top-4 right-0 text-white bg-primary rounded-full z-10"
          onClick={onClose}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        {children}
      </div>
    </div>
  );
}

// Add a simple slide-in animation
// In your global CSS (e.g., index.css or tailwind.css), add:
// @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
// .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.4,0,0.2,1); } 