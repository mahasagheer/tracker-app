import React from 'react';

export default function Table({ columns, data, renderRow, emptyText = 'No data found.' }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="py-2 px-4 text-left font-semibold text-dark/80">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-4 text-dark/60">{emptyText}</td></tr>
          ) : (
            data.map((row, i) => renderRow(row, i))
          )}
        </tbody>
      </table>
    </div>
  );
} 