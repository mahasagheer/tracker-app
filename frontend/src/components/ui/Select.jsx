import React from 'react';

export default function Select({ value, onChange, children, className = '', ...props }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`border border-gray-300 rounded px-4 py-2 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${className}`}
      {...props}
    >
      {children}
    </select>
  );
} 