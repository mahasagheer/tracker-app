import React from 'react';
import LeaderboardRow from './LeaderboardRow';

export default function LeaderboardTable({ employees = [] }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-dark">All Teams</span>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-dark/60">
            <th className="py-2 px-4 text-left">#</th>
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-left">Email</th>
            <th className="py-2 px-4 text-left">Role</th>
            <th className="py-2 px-4 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-4 text-dark/60">No employees found.</td></tr>
          ) : (
            employees.map((emp, i) => (
              <tr key={emp.id}>
                <td className="py-2 px-4">{i + 1}</td>
                <td className="py-2 px-4">{emp.name}</td>
                <td className="py-2 px-4">{emp.email}</td>
                <td className="py-2 px-4">{emp.role}</td>
                <td className="py-2 px-4">{emp.is_active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 