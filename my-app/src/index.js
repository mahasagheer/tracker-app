import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import App from './App';
import TimerOverlay from './components/TimerOverlay';
import InactivityOverlay from './components/InactivityOverlay';

const params = new URLSearchParams(window.location.search);

const handleResumeFromInactivity = () => {
  if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.send('resume-from-inactivity');
  }
};

if (params.get('inactivity') === '1') {
  const projects = ['Project A', 'Project B'];
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <InactivityOverlay
        visible={true}
        idleTime={0}
        onAdd={handleResumeFromInactivity}
        onSkip={handleResumeFromInactivity}
        projects={projects}
      />
    </React.StrictMode>
  );
} else {
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {params.get('timer') === '1' ? <TimerOverlay hidden={window.electron?.timerHidden} /> : <App />}
  </React.StrictMode>
);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
