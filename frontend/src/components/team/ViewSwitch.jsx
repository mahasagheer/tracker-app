import React from 'react';
import { FiTable, FiGrid } from 'react-icons/fi';

export default function ViewSwitch({ view, setView }) {
  return (
    <div className="flex gap-1 rounded px-1 py-1">
      <button
        className={`px-2 py-2 rounded ${view === 'table' ? 'bg-primary text-dark font-bold' : 'text-dark/60'}`}
        onClick={() => setView('table')}
        aria-label="Table view"
      >
        <FiTable />
      </button>
      <button
        className={`px-2 py-2 rounded ${view === 'card' ? 'bg-primary text-dark font-bold' : 'bg-accent text-dark/60'}`}
        onClick={() => setView('card')}
        aria-label="Card view"
      >
        <FiGrid />
      </button>
    </div>
  );
} 