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
  let weeklyTotals = {};
  if (monthlyWeeklyDurations && monthlyWeeklyDurations.month) {
    events = Object.entries(monthlyWeeklyDurations.month).map(([date, value]) => ({
      date, // already in YYYY-MM-DD format
      times: [value.replace(' ',':').replace('m','').replace('h','')]
    }));
    if (monthlyWeeklyDurations.weekly) {
      weeklyTotals = monthlyWeeklyDurations.weekly;
    }
  }

  if (!user || user.role !== 'Time Reporter') {
    return <Navigate to="/" replace />;
  }
  return (
    <DashboardLayout>
      <EmployeeCalendar title="User Summary" events={events} weeklyTotals={weeklyTotals} />
    </DashboardLayout>
  );
} 