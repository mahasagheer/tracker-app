import React from 'react';
import { FiArrowUp, FiArrowDown, FiMinus } from 'react-icons/fi';

export default function LeaderboardRow({ position, change, name, avatar, meetings, total, previous, changeValue, changeType }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 px-4 font-bold text-dark flex items-center gap-2">
        {position}
        {change > 0 && <span className="text-green-600 flex items-center text-xs"><FiArrowUp />{change}</span>}
        {change < 0 && <span className="text-red-500 flex items-center text-xs"><FiArrowDown />{Math.abs(change)}</span>}
        {change === 0 && <span className="text-dark/40 flex items-center text-xs"><FiMinus /></span>}
      </td>
      <td className="py-2 px-4 flex items-center gap-2">
        <img src={avatar} alt={name} className="w-7 h-7 rounded-full" />
        <span className="text-dark font-medium">{name}</span>
      </td>
      <td className="py-2 px-4 text-dark/80">{meetings}</td>
      <td className="py-2 px-4 text-dark/80">{total}</td>
      <td className="py-2 px-4 text-dark/80">{previous}</td>
      <td className="py-2 px-4">
        {changeType === 'up' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><FiArrowUp />{changeValue}</span>}
        {changeType === 'down' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><FiArrowDown />{changeValue}</span>}
        {changeType === 'neutral' && <span className="bg-accent text-dark px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><FiMinus />{changeValue}</span>}
      </td>
      <td className="py-2 px-4 text-right text-dark/40">...</td>
    </tr>
  );
} 