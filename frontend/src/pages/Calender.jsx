import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuthContext } from '../auth/AuthContext';
import EmployeeCalendar from '../components/team/EmployeeCalendar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminMonthlyWeeklySummary, fetchProductivityReport } from '../projectsSlice';
import Drawer from '../components/ui/Drawer';
import { ReactComponent as MouseIcon } from '../assets/mouse-svgrepo-com.svg';
import { ReactComponent as KeyboardIcon } from '../assets/keyboard1-svgrepo-com.svg';
import { ReactComponent as ProductivityIcon } from '../assets/productivity-svgrepo-com.svg';
import Modal from '../components/ui/Modal';

export default function Calendar() {
  const { user } = useAuthContext();
  const dispatch = useDispatch();
  const reporters = useSelector(state => state.projects.adminMonthlyWeeklySummary);
  const loading = useSelector(state => state.projects.adminMonthlyWeeklySummaryLoading);
  const { productivityReport, productivityReportLoading } = useSelector(state => state.projects);
  const [selectedReporter, setSelectedReporter] = useState(null);
  const [events, setEvents] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  // Handler for date click in EmployeeCalendar
  const handleDateClick = (date) => {
    setDrawerDate(date);
    setDrawerOpen(true);
    if (selectedReporter && date) {
      dispatch(fetchProductivityReport({ userId: selectedReporter, date }));
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin' && user.id) {
      dispatch(fetchAdminMonthlyWeeklySummary(user.id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (reporters.length > 0 && !selectedReporter) {
      setSelectedReporter(reporters[0].reporterId);
    }
  }, [reporters, selectedReporter]);

  useEffect(() => {
    // Map the selected reporter's month summary to EmployeeCalendar events
    if (!selectedReporter || !reporters.length) {
      setEvents([]);
      return;
    }
    const reporter = reporters.find(r => r.reporterId === selectedReporter);
    if (!reporter || !reporter.month) {
      setEvents([]);
      return;
    }
    // Convert the month summary to EmployeeCalendar events format
    // { date: 'YYYY-MM-DD', times: ['6:27', ...] }
    const eventsArr = [];
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    Object.entries(reporter.month).forEach(([weekLabel, daysObj], weekIdx) => {
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
        eventsArr.push({
          date: date.toISOString().slice(0,10),
          times: [value.replace(' ',':').replace('m','').replace('h','')]
        });
      });
    });
    setEvents(eventsArr);
  }, [selectedReporter, reporters]);

  const reporterName = reporters.find(r => r.reporterId === selectedReporter)?.name || '';

  return (
    <DashboardLayout>
      {/* Screenshot Preview Modal */}
      <Modal isOpen={!!previewImg} onClose={() => setPreviewImg(null)}>
        {previewImg && (
          <div className="fixed inset-0 z-80 flex flex-col items-center justify-center bg-black bg-opacity-50">
            <img
              src={previewImg}
              alt="Screenshot Preview"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-lg"
              style={{ width: '100vw', height: '100vh' }}
            />
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute top-2 right-2 p-2 bg-primary text-white rounded-full text-lg font-bold shadow-lg hover:bg-primary/80 transition flex items-center justify-center"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg"  width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </Modal>
      <div className='flex items-center justify-between'>
      <h1 className="text-xl font-bold mb-6">Time Reporter Calendar</h1>
      {user?.role === 'Admin' && (
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <select
            className="border rounded px-3 py-2"
            value={selectedReporter || ''}
            onChange={e => setSelectedReporter(e.target.value)}
          >
            {reporters.map(r => (
              <option key={r.reporterId} value={r.reporterId}>{r.name}</option>
            ))}
          </select>
        </div>
      )}
      </div>
      {loading ? (
        <div className="text-dark/60">Loading...</div>
      ) : (
        <EmployeeCalendar
          title={reporterName ? `${reporterName} Summary` : 'Reporter Summary'}
          events={events}
          onDateClick={handleDateClick}
        />
      )}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="font-bold text-lg mb-4">Activity for {drawerDate} ({reporterName})</div>
        {/* Activity UI from Activity.jsx, using productivityReport */}
        {productivityReportLoading ? (
          <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">Loading...</div>
        ) : productivityReport?.message ? (
          <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">{productivityReport.message}</div>
        ) : !productivityReport?.summary ? (
          <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">No activity for this day</div>
        ) : (
          <>
            <div className="flex gap-6 items-center mb-4">
              <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium flex gap-2">
                <MouseIcon width={20} height={20} className="w-4 h-4" />
                <span className="font-semibold">{productivityReport.summary.overall_mouse_activity_percent ?? '-'}%</span>
              </div>
              <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2">
                <KeyboardIcon width={20} height={20} className="w-4 h-4" />
                <span className="font-semibold">{productivityReport.summary.overall_keyboard_activity_percent ?? '-'}%</span>
              </div>
              <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2">
                <ProductivityIcon width={20} height={20} className="w-4 h-4" />
                <span className="font-semibold">{productivityReport.summary.overall_productivity_percent ?? '-'}%</span>
              </div>
            </div>
            <div className="mb-2 font-semibold">Screenshots & Activity by Hour:</div>
            <div className="space-y-2">
              {productivityReport.hourly && productivityReport.hourly.map((hourBlock, idx) => (
                <div key={hourBlock.hour} className="bg-accent rounded-lg p-4">
                  <div className="font-semibold mb-2">{hourBlock.label}</div>
                  <div className='flex flex-row'>
                    <div className="w-32">
                      <div className="flex flex-col gap-2 w-auto">
                        <div className="flex items-center text-sm text-gray-700">
                          <MouseIcon width={20} height={20} className="w-4 h-4 mr-1" />
                          <span className="font-bold">{hourBlock.mouse_activity_percent ?? '-'}%</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <KeyboardIcon width={20} height={20} className="w-4 h-4 mr-1" />
                          <span className="font-bold">{hourBlock.keyboard_activity_percent ?? '-'}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row flex-wrap gap-2 items-center ml-4">
                      {hourBlock.screenshots.length === 0 ? (
                        <div className="text-gray-500 text-sm">No screenshots</div>
                      ) : (
                        hourBlock.screenshots.map((shot, i) => {
                          const imgUrl = shot.image_path.startsWith('http') ? shot.image_path : `http://localhost:5000/screenshots/${shot.image_path.split('test_screenshots').pop().replace(/^\\|\//, '').replace(/\\/g, '/').replace(/\//g, '/')}`;
                          return (
                            <div key={i} className="flex flex-col items-center cursor-pointer" onClick={() => setPreviewImg(imgUrl)}>
                              <img src={imgUrl} alt="screenshot" className="w-20 h-14 object-cover rounded border border-accent mb-1" />
                              <div className="text-xs text-gray-600">{new Date(shot.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Drawer>
    </DashboardLayout>
  );
} 