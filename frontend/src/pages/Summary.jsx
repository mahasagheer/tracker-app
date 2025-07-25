import React, { useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuthContext } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import EmployeeCalendar from '../components/team/EmployeeCalendar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMonthlyWeeklyDurations } from '../projectsSlice';

export default function Summary() {
  const { user } = useAuthContext();
  const dispatch = useDispatch();
  const { monthlyWeeklyDurations, durationsLoading } = useSelector(state => state.projects);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchMonthlyWeeklyDurations(user.id));
    }
  }, [dispatch, user]);

  // Transform backend response to calendar events format
  let events = [];
  if (monthlyWeeklyDurations && monthlyWeeklyDurations.month) {
    // monthlyWeeklyDurations.month = { 'Week 1': { Monday: '4h 25m', ... }, ... }
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    Object.entries(monthlyWeeklyDurations.month).forEach(([weekLabel, daysObj], weekIdx) => {
      Object.entries(daysObj).forEach(([day, value]) => {
        if (day === 'Total') return;
        // value is like '4h 25m'
        const [h, m] = value.split('h').map(s => s.trim());
        if (h === '0' && m.startsWith('0')) return; // skip 0 days
        // Find the date for this week and day
        // Week 1 starts from the first Monday of the month
        let firstOfMonth = new Date(year, month, 1);
        let firstMonday = new Date(firstOfMonth);
        while (firstMonday.getDay() !== 1) {
          firstMonday.setDate(firstMonday.getDate() + 1);
        }
        const weekOffset = parseInt(weekLabel.replace('Week ', '')) - 1;
        const dayIdx = ['Monday','Tuesday','Wednesday','Thursday','Friday'].indexOf(day);
        if (dayIdx === -1) return;
        const date = new Date(firstMonday);
        date.setDate(firstMonday.getDate() + weekOffset * 7 + dayIdx);
        // Only include if in this month
        if (date.getMonth() !== month) return;
        // Format for EmployeeCalendar
        events.push({
          date: date.toISOString().slice(0,10),
          times: [value.replace(' ',':').replace('m','').replace('h','')]
        });
      });
    });
  }

  if (!user || user.role !== 'Time Reporter') {
    return <Navigate to="/" replace />;
  }
  return (
    <DashboardLayout>
      <EmployeeCalendar title="User Summary" events={events} />
    </DashboardLayout>
  );
} 