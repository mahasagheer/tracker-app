import React from 'react';

const AVATAR_COLORS = [
  "#3b82f6", // blue-500
  "#0ea5e9", // sky-500
  "#06b6d4", // cyan-500
  "#10b981", // green-500
  "#6366f1", // indigo-500
  "#64748b", // slate-500
  "#f59e42", // orange-400
  "#a21caf", // purple-700
  "#f43f5e", // rose-500
  "#eab308", // yellow-500
];
function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function LeaderboardCardList({ employees }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {employees.map(emp => (
        <div key={emp.id} className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
          <div
            className="w-16 h-16 flex items-center justify-center rounded-full mb-2 text-white text-2xl font-bold uppercase"
            style={{ background: getAvatarColor(emp.id || emp.name || '') }}
          >
            {emp.name ? emp.name.charAt(0) : '?'}
          </div>
          <h3 className="text-lg font-bold">{emp.name}</h3>
          <p className="text-dark/60">{emp.email}</p>
          <p className="text-dark/80">{emp.role}</p>
        </div>
      ))}
    </div>
  );
} 