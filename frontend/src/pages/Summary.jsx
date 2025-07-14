import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuthContext } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import EmployeeCalendar from '../components/team/EmployeeCalendar';

// Example events (replace with your real data)
const events = [
  { date: '2025-06-30', times: ['06:27', '00:10'] },
  { date: '2025-07-01', times: ['06:54', '00:10'] },
  { date: '2025-07-02', times: ['07:04'] },
  { date: '2025-07-03', times: ['06:45'] },
  { date: '2025-07-04', times: ['07:00'] },
  { date: '2025-07-05', times: ['05:46'] },
  { date: '2025-07-07', times: ['04:19'] },
  { date: '2025-07-08', times: ['06:31'] },
  { date: '2025-07-09', times: ['07:52'] },
  { date: '2025-07-10', times: ['06:58'] },
  { date: '2025-07-11', times: ['02:53'] },
];

export default function Summary() {
  const { user } = useAuthContext();
  if (!user || user.role !== 'Time Reporter') {
    return <Navigate to="/" replace />;
  }
  return (
    <DashboardLayout>
      <EmployeeCalendar title="User Summary" events={events} />
    </DashboardLayout>
  );
} 