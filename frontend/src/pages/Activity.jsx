import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuthContext } from '../auth/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductivityReport } from '../projectsSlice';
import Modal from '../components/ui/Modal';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthMatrix(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const matrix = [];
  let week = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

function getInitialDate() {
  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  let day = today.getDate();
  let dateObj = new Date(year, month, day);
  let dayOfWeek = dateObj.getDay();
  // If today is a weekend, find the next available weekday
  if (dayOfWeek === 0) {
    // Sunday: move to Monday
    day += 1;
    if (day > getDaysInMonth(year, month)) {
      day = 1;
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  } else if (dayOfWeek === 6) {
    // Saturday: move to Monday
    day += 2;
    if (day > getDaysInMonth(year, month)) {
      day = day - getDaysInMonth(year, month);
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  }
  return { year, month, day };
}

export default function Activity() {
  const { user } = useAuthContext();
  const dispatch = useDispatch();
  const initial = getInitialDate();
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(initial.day);
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const monthMatrix = getMonthMatrix(selectedYear, selectedMonth);
  const selectedDateStr = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;

  const { productivityReport, productivityReportLoading } = useSelector(state => state.projects);
  const [previewImg, setPreviewImg] = useState(null);

  // Fetch productivity report when user or selected date changes
  useEffect(() => {
    if (user?.id && selectedDateStr) {
      dispatch(fetchProductivityReport({ userId: user.id, date: selectedDateStr }));
    }
  }, [user, selectedDateStr, dispatch]);

  // Only allow selecting weekdays
  const handleDaySelect = (day) => {
    if (!day) return;
    const dateObj = new Date(selectedYear, selectedMonth, day);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return; // skip weekends
    setSelectedDay(day);
  };

  const handleNext = () => {
    let day = selectedDay;
    let month = selectedMonth;
    let year = selectedYear;
    do {
      if (day < daysInMonth) {
        day++;
      } else {
        if (month === 11) {
          year++;
          month = 0;
        } else {
          month++;
        }
        day = 1;
      }
    } while ([0, 6].includes(new Date(year, month, day).getDay()));
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
  };

  const handlePrev = () => {
    let day = selectedDay;
    let month = selectedMonth;
    let year = selectedYear;
    do {
      if (day > 1) {
        day--;
      } else {
        if (month === 0) {
          year--;
          month = 11;
        } else {
          month--;
        }
        day = getDaysInMonth(year, month);
      }
    } while ([0, 6].includes(new Date(year, month, day).getDay()));
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
  };

  // Prepare data for selected day
  const summary = productivityReport?.summary;
  const hourly = productivityReport?.hourly || [];

  return (
    <DashboardLayout>
      {/* Screenshot Preview Modal */}
      <Modal isOpen={!!previewImg} onClose={() => setPreviewImg(null)}>
        {previewImg && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-50">
            <img
              src={previewImg}
              alt="Screenshot Preview"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-lg"
              style={{ width: '100vw', height: '100vh' }}
            />
            <button
              onClick={() => setPreviewImg(null)}
              className="absolute top-6 right-6 p-3 bg-primary text-white rounded-full text-lg font-bold shadow-lg hover:bg-primary/80 transition flex items-center justify-center"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </Modal>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-accent">
        {/* Header */}
        <div className="text-xl font-bold bg-primary text-white px-6 py-3 rounded-t-xl flex items-center">
          Activity Calendar
        </div>
        {/* Calendar grid */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">{monthNames[selectedMonth]} {selectedYear}</div>
            <div className="flex gap-2">
              <button onClick={handlePrev} className="px-3 py-1 rounded bg-accent text-primary font-bold hover:bg-primary/10">Prev</button>
              <button onClick={handleNext} className="px-3 py-1 rounded bg-accent text-primary font-bold hover:bg-primary/10">Next</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 bg-accent rounded-lg p-2">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="text-center font-bold text-primary">{d}</div>
            ))}
            {monthMatrix.flat().map((day, idx) => {
              const dateObj = day ? new Date(selectedYear, selectedMonth, day) : null;
              const isWeekend = dateObj ? [0, 6].includes(dateObj.getDay()) : false;
              return (
                <div
                  key={idx}
                  className={`h-20 rounded-lg flex flex-col items-center justify-center transition border ${day ? (isWeekend ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : (day === selectedDay ? 'bg-primary text-white border-primary cursor-pointer' : 'bg-white hover:bg-primary/10 border-accent cursor-pointer')) : 'bg-transparent border-transparent cursor-default'}`}
                  onClick={() => handleDaySelect(day)}
                >
                  {day && (
                    <>
                      <div className="font-semibold text-lg">{day}</div>
                      {!isWeekend && (
                        <div className="flex gap-1 mt-1">
                          {/* Optionally show summary info here */}
                        </div>
                      )}
                      {isWeekend && <div className="text-xs mt-1">No activity</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Selected day details: hour-by-hour breakdown */}
        <div className="px-6 pb-6">
          <div className="mb-2 text-lg font-semibold text-primary">Details for {monthNames[selectedMonth]} {selectedDay}, {selectedYear}</div>
          {productivityReportLoading ? (
            <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">Loading...</div>
          ) : !summary ? (
            <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">No activity for this day</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-6 items-center mb-4">
                <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium">User: <span className="font-semibold">{user?.name || 'N/A'}</span></div>
                <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium">Mouse Activity: <span className="font-semibold">{summary?.total_mouse_activity ?? '-'}</span></div>
                <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium">Keyboard Activity: <span className="font-semibold">{summary?.total_keyboard_activity ?? '-'}</span></div>
                <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium">Overall Productivity: <span className="font-semibold">{summary?.overall_productivity_percent ?? '-'}</span></div>
              </div>
              <div className="mb-2 font-semibold">Screenshots & Activity by Hour:</div>
              <div className="space-y-4">
                {/* Show hours starting from 10 AM */}
                {(() => {
                  // Reorder hourly blocks: 10 AM (10) to 23, then 0 to 9
                  const startHour = 10;
                  const ordered = [
                    ...hourly.slice(startHour, 24),
                    ...hourly.slice(0, startHour)
                  ];
                  return ordered.map((hourBlock, idx) => {
                    const hour12 = ((hourBlock.hour + 11) % 12 + 1);
                    const ampm = hourBlock.hour < 12 ? 'AM' : 'PM';
                    const hourLabel = `${hour12} ${ampm}`;
                    return (
                      <div key={hourBlock.hour} className="bg-accent rounded-lg p-4">
                        <div className="font-semibold mb-2">{hourLabel}</div>
                        <div className="flex flex-wrap gap-4 items-center">
                          <div className="text-sm text-gray-700">Mouse: <span className="font-bold">{hourBlock.mouse_activity}</span></div>
                          <div className="text-sm text-gray-700">Keyboard: <span className="font-bold">{hourBlock.keyboard_activity}</span></div>
                          <div className="text-sm text-gray-700">Productivity: <span className="font-bold">{hourBlock.productivity_score ?? '-'}</span></div>
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
                    );
                  });
                })()}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 