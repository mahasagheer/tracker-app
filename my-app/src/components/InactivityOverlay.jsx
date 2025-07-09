import React, { useEffect, useState } from 'react';

export default function InactivityOverlay({ visible, idleTime, onAdd, onSkip, projects }) {
  const [reason, setReason] = useState('');
  const [selectedProject, setSelectedProject] = useState(projects[0] || '');
  const [timer, setTimer] = useState(idleTime);

  useEffect(() => {
    if (!visible) return;
    setTimer(idleTime);
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [visible, idleTime]);

  if (visible) {
    console.log('[DEBUG] InactivityOverlay is rendering');
  }
  if (!visible) return null;

  return (
    <div className="fixed inset-0 w-full h-full bg-white flex items-center justify-center z-50">
      <div className="flex flex-col items-center w-full max-w-lg px-8 py-12 rounded-lg shadow-2xl bg-white border border-gray-200">
        <span className="text-6xl text-blue-700 mb-4 tracking-wide drop-shadow-lg"> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
        <span className="text-xl text-gray-700 mb-8">Hey There! Looks Like You Took a Break</span>
        <input
          className="border border-gray-300 bg-white text-gray-800 rounded px-4 py-3 w-full mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 transition"
          placeholder="Reason for inactivity"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <select
          className="border border-gray-300 bg-white text-gray-800 rounded px-4 py-3 w-full mb-8 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          {projects.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex w-full justify-between mt-2 gap-4">
          <button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
             onClick={() => onAdd(reason, selectedProject)}
          >Add</button>
          <button
           className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2 rounded"            onClick={onSkip}
          >Skip</button>
        </div>
      </div>
    </div>
  );
} 