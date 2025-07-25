import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuthContext } from '../auth/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductivityReport } from '../projectsSlice';
import Modal from '../components/ui/Modal';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { ReactComponent as MouseIcon } from '../assets/mouse-svgrepo-com.svg';
import { ReactComponent as KeyboardIcon } from '../assets/keyboard1-svgrepo-com.svg';
import { ReactComponent as ProductivityIcon } from '../assets/productivity-svgrepo-com.svg';

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
  const upcomingMessage = productivityReport?.message;

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
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content (Left) */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-accent">
            {/* Header */}
            <div className="text-xl font-bold bg-primary px-6 py-3 rounded-t-xl flex items-center">
              Activity Calendar
            </div>
            {/* Calendar grid */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Details for {monthNames[selectedMonth]} {selectedDay}, {selectedYear}</div>
                <div className="flex gap-2">
                  <button onClick={handlePrev} className="px-3 py-1 rounded bg-accent font-bold hover:bg-primary/10">
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <button onClick={handleNext} className="px-3 py-1 rounded bg-accent font-bold hover:bg-primary/10">
                    <FiArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            {/* Selected day details: hour-by-hour breakdown */}
            <div className="px-6 pb-6">
              {productivityReportLoading ? (
                <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">Loading...</div>
              ) : upcomingMessage ? (
                <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">{upcomingMessage}</div>
              ) : !summary ? (
                <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">No activity for this day</div>
              ) : (
                <>
                  <div className="mb-2 font-semibold">Screenshots & Activity by Hour:</div>
                  <div className="space-y-2">
                    {hourly.map((hourBlock, idx) => (
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
            </div>
          </div>
        </div>
        {/* Sidebar (Right) */}
        <div className="hidden lg:block w-full max-w-xs flex-shrink-0">
          <div className="bg-white rounded-xl shadow-lg border border-accent p-6 sticky top-8">
            <div className="mb-4">
              <div className="text-lg font-bold mb-1">Summary</div>
              <div className="text-sm text-gray-500">{user?.name ? `User: ${user.name}` : ''}</div>
              <div className="text-sm text-gray-500">Date: {monthNames[selectedMonth]} {selectedDay}, {selectedYear}</div>
            </div>
            {summary && (
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2">
                  <MouseIcon width={16} height={16} className="w-4 h-4" />
                  <span className="font-semibold">{summary?.overall_mouse_activity_percent ?? '-'}%</span>
                  <span className="text-xs text-gray-500">Mouse</span>
                </div>
                <div className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2">
                  <KeyboardIcon width={16} height={16} className="w-4 h-4" />
                  <span className="font-semibold">{summary?.overall_keyboard_activity_percent ?? '-'}%</span>
                  <span className="text-xs text-gray-500">Keyboard</span>
                </div>
                <div className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2">
                  <ProductivityIcon width={16} height={16} className="w-4 h-4" />
                  <span className="font-semibold">{summary?.overall_productivity_percent ?? '-'}%</span>
                  <span className="text-xs text-gray-500">Productivity</span>
                </div>
              </div>
            )}
            {/* Screenshot Gallery */}
            {hourly && hourly.some(h => h.screenshots && h.screenshots.length > 0) && (
              <div>
                <div className="font-semibold mb-2">All Screenshots</div>
                <div className="grid grid-cols-3 gap-2">
                  {hourly.flatMap(h => h.screenshots.map((shot, i) => {
                    const imgUrl = shot.image_path.startsWith('http') ? shot.image_path : `http://localhost:5000/screenshots/${shot.image_path.split('test_screenshots').pop().replace(/^\\|\//, '').replace(/\\/g, '/').replace(/\//g, '/')}`;
                    return (
                      <img
                        key={shot.id || i}
                        src={imgUrl}
                        alt="screenshot"
                        className="w-full h-16 object-cover rounded border border-accent cursor-pointer"
                        onClick={() => setPreviewImg(imgUrl)}
                      />
                    );
                  }))}
                </div>
              </div>
            )}
            {/* Optional: Legend or tips */}
            <div className="mt-6 text-xs text-gray-400">
              <div className="mb-1 font-semibold text-gray-500">Legend:</div>
              <div className="flex items-center gap-2 mb-1"><MouseIcon width={12} height={12} className="w-3 h-3" /> Mouse Activity</div>
              <div className="flex items-center gap-2 mb-1"><KeyboardIcon width={12} height={12} className="w-3 h-3" /> Keyboard Activity</div>
              <div className="flex items-center gap-2"><ProductivityIcon width={12} height={12} className="w-3 h-3" /> Productivity</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 