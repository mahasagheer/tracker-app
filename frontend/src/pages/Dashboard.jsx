import React from 'react';
import { useAuthContext } from '../auth/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthContext();
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }
  return (
    <DashboardLayout>
      {/* Top stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-primary/30 rounded-xl p-6 shadow flex flex-col">
          <span className="text-dark text-sm mb-2">Activity</span>
          <span className="text-2xl font-bold text-dark">83%</span>
          <span className="text-xs text-dark/60">Compared to yesterday</span>
        </div>
        <div className="bg-primary/30 rounded-xl p-6 shadow flex flex-col">
          <span className="text-dark text-sm mb-2">Projects</span>
          <span className="text-2xl font-bold text-dark">57%</span>
          <span className="text-xs text-dark/60">Compared to last week</span>
        </div>
        <div className="bg-primary/30 rounded-xl p-6 shadow flex flex-col">
          <span className="text-dark text-sm mb-2">Tasks</span>
          <span className="text-2xl font-bold text-dark">59%</span>
          <span className="text-xs text-dark/60">Compared to last week</span>
        </div>
      </div>
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Weekly Report + Activity Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 shadow mb-6">
            <span className="font-semibold text-dark mb-2 block">Weekly Report</span>
            <div className="h-40 flex items-center justify-center text-dark/30">[Chart Placeholder]</div>
            <div className="flex justify-between mt-4 text-sm text-dark/60">
              <span>Payments <span className="text-primary font-bold">+15%</span></span>
              <span>Active Members <span className="text-primary font-bold">53</span></span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <span className="font-semibold text-dark mb-2 block">Activity</span>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-dark/60">
                    <th className="py-2 px-4 text-left">Employee Name</th>
                    <th className="py-2 px-4 text-left">Team</th>
                    <th className="py-2 px-4 text-left">Start</th>
                    <th className="py-2 px-4 text-left">Contracts</th>
                    <th className="py-2 px-4 text-left">Total Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-4 flex items-center gap-2"><img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Ann" className="w-6 h-6 rounded-full"/> Ann Watson</td>
                    <td className="py-2 px-4">Membo</td>
                    <td className="py-2 px-4">21 Sept, 2021</td>
                    <td className="py-2 px-4 text-primary">Active</td>
                    <td className="py-2 px-4">$6500</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 flex items-center gap-2"><img src="https://randomuser.me/api/portraits/men/45.jpg" alt="Christin" className="w-6 h-6 rounded-full"/> Christin Stuart</td>
                    <td className="py-2 px-4">WireWeb</td>
                    <td className="py-2 px-4">1 Nov, 2021</td>
                    <td className="py-2 px-4 text-dark/60">Paused</td>
                    <td className="py-2 px-4">$3850</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 flex items-center gap-2"><img src="https://randomuser.me/api/portraits/men/46.jpg" alt="John" className="w-6 h-6 rounded-full"/> John Johnson</td>
                    <td className="py-2 px-4">Design Team</td>
                    <td className="py-2 px-4">13 Oct, 2021</td>
                    <td className="py-2 px-4 text-primary">Active</td>
                    <td className="py-2 px-4">$4500</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 flex items-center gap-2"><img src="https://randomuser.me/api/portraits/men/47.jpg" alt="Mike" className="w-6 h-6 rounded-full"/> Mike Landon</td>
                    <td className="py-2 px-4">Team B</td>
                    <td className="py-2 px-4">13 Oct, 2021</td>
                    <td className="py-2 px-4 text-primary">Active</td>
                    <td className="py-2 px-4">$4200</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Right: Performance + Teams */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 shadow flex flex-col items-center">
            <span className="font-semibold text-dark mb-2">Performance</span>
            <div className="w-32 h-32 flex items-center justify-center">
              <svg width="120" height="120"><circle cx="60" cy="60" r="54" stroke="#eafcd7" strokeWidth="12" fill="none"/><circle cx="60" cy="60" r="54" stroke="#C6F36B" strokeWidth="12" fill="none" strokeDasharray="339.292" strokeDashoffset="100"/></svg>
              <span className="absolute text-2xl font-bold text-dark">107</span>
            </div>
            <div className="mt-4 w-full">
              <div className="flex justify-between text-xs text-dark/60 mb-1">
                <span>Completed</span><span>41%</span>
              </div>
              <div className="flex justify-between text-xs text-dark/60 mb-1">
                <span>In Progress</span><span>33%</span>
              </div>
              <div className="flex justify-between text-xs text-dark/60 mb-1">
                <span>In Review</span><span>19%</span>
              </div>
              <div className="flex justify-between text-xs text-dark/60">
                <span>To Do</span><span>7%</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <span className="font-semibold text-dark mb-2 block">Teams</span>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-primary/30 text-dark px-2 py-1 rounded text-xs font-bold">DevOps</span>
                <span className="text-xs text-dark/60">25 projects • 124 tasks</span>
                <span className="flex -space-x-2">
                  <img src="https://randomuser.me/api/portraits/men/48.jpg" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/women/49.jpg" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  <span className="w-6 h-6 rounded-full bg-primary/30 text-dark flex items-center justify-center text-xs font-bold border-2 border-white">+13</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary/30 text-dark px-2 py-1 rounded text-xs font-bold">Membo</span>
                <span className="text-xs text-dark/60">38 projects • 254 tasks</span>
                <span className="flex -space-x-2">
                  <img src="https://randomuser.me/api/portraits/men/50.jpg" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/women/51.jpg" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  <span className="w-6 h-6 rounded-full bg-primary/30 text-dark flex items-center justify-center text-xs font-bold border-2 border-white">+24</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary/30 text-dark px-2 py-1 rounded text-xs font-bold">Design Team</span>
                <span className="text-xs text-dark/60">38 projects • 200 tasks</span>
                <span className="flex -space-x-2">
                  <img src="https://randomuser.me/api/portraits/men/52.jpg" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/women/53.jpg" alt="" className="w-6 h-6 rounded-full border-2 border-white" />
                  <span className="w-6 h-6 rounded-full bg-primary/30 text-dark flex items-center justify-center text-xs font-bold border-2 border-white">+9</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 