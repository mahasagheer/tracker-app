import React, { useState, useEffect } from 'react';
import { Play, Pause, X, Camera } from 'lucide-react';

export default function TimerOverlay() {
  const [seconds, setSeconds] = useState(0);
  const [state, setState] = useState('working'); // 'working' or 'paused'
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    let interval;
    if (state === 'working') {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const handler = () => {
        setShowCamera(true);
        setTimeout(() => setShowCamera(false), 2000);
      };
      window.electron.ipcRenderer.on('screenshot-taken', handler);
      return () => {
        window.electron.ipcRenderer.removeListener('screenshot-taken', handler);
      };
    }
  }, []);

  // Listen for inactivity-pause event from main process
  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const pauseHandler = () => {
        setState('paused');
      };
      window.electron.ipcRenderer.on('inactivity-pause', pauseHandler);
      return () => {
        window.electron.ipcRenderer.removeListener('inactivity-pause', pauseHandler);
      };
    }
  }, []);

  // Listen for resume-from-inactivity event from main process
  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const resumeHandler = () => {
        setState('working');
        window.electron.ipcRenderer.send('timer-state', 'working');
      };
      window.electron.ipcRenderer.on('resume-from-inactivity', resumeHandler);
      return () => {
        window.electron.ipcRenderer.removeListener('resume-from-inactivity', resumeHandler);
      };
    }
  }, []);

  // Send initial state to main process on mount
  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('timer-state', state);
    }
    // Only run on mount
    // eslint-disable-next-line
  }, []);

  const pad = n => n.toString().padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const handleToggle = () => {
    const newState = state === 'paused' ? 'working' : 'paused';
    setState(newState);
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('timer-state', newState);
    }
  };

  const icon = state === 'paused' ? <Play size={18} /> : <Pause size={18} />;
  const label = state === 'paused' ? 'Start' : 'Pause';

  return (
    <div
      className="bg-gray-800 shadow-lg flex items-center px-4 py-0 min-w-[180px] min-h-[32px]"
      style={{ WebkitAppRegion: 'drag', cursor: 'move' }}
    >
      <span className="text-white text-base font-bold mr-2 select-none">{pad(hours)}:{pad(minutes)}</span>
      <span className={`text-xs font-semibold select-none ${state === 'working' ? 'text-green-400' : 'text-yellow-400'}`}>{state === 'working' ? 'Working' : 'Paused'}</span>
      {showCamera && (
        <Camera size={18} className="ml-2 text-yellow-300 animate-bounce" title="Screenshot taken" />
      )}
      <button
        className="ml-2 p-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
        aria-label={label}
        title={label}
        onClick={handleToggle}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {icon}
      </button>
      <button
        className="ml-1 p-1 bg-gray-500 text-white rounded hover:bg-gray-700 flex items-center justify-center"
        aria-label="Close"
        title="Close"
        onClick={() => window.close()}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <X size={16} />
      </button>
    </div>
  );
} 