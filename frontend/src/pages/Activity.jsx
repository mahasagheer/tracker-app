import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuthContext } from '../auth/AuthContext';

// Helper to get days in a month
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Only generate activity for weekdays (Mon-Fri)
const generateDayHours = () => {
  const hours = [];
  for (let h = 9; h <= 17; h++) {
    const screenshots = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, (_, idx) => ({
      time: `${h.toString().padStart(2, '0')}:${(idx * 10).toString().padStart(2, '0')}`,
      img: 'https://placehold.co/80x60',
    }));
    hours.push({
      hour: h,
      screenshots,
    });
  }
  return hours;
};

const generateMonthActivity = (year, month) => {
  const daysInMonth = getDaysInMonth(year, month);
  const data = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dateObj = new Date(year, month, i);
    const dayOfWeek = dateObj.getDay();
    // 0: Sunday, 6: Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend: no activity
      data.push({
        date: `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
        mouse: null,
        keyboard: null,
        hours: null,
        isWeekend: true,
      });
    } else {
      // Weekday: random activity or possibly no activity
      const hasActivity = Math.random() > 0.2; // 80% chance to have activity
      data.push({
        date: `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
        mouse: hasActivity ? Math.floor(Math.random() * 100) : null,
        keyboard: hasActivity ? Math.floor(Math.random() * 100) : null,
        hours: hasActivity ? generateDayHours() : [],
        isWeekend: false,
      });
    }
  }
  return data;
};

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

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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
  const initial = getInitialDate();
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(initial.day);
  const [monthActivity, setMonthActivity] = useState(() => generateMonthActivity(initial.year, initial.month));

  React.useEffect(() => {
    setMonthActivity(generateMonthActivity(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const monthMatrix = getMonthMatrix(selectedYear, selectedMonth);
  const selectedData = monthActivity[selectedDay - 1];

  // Only allow selecting weekdays
  const handleDaySelect = (day) => {
    if (!day) return;
    const data = monthActivity[day - 1];
    if (data.isWeekend) return;
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
    } while (generateMonthActivity(year, month)[day - 1]?.isWeekend);
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
    } while (generateMonthActivity(year, month)[day - 1]?.isWeekend);
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
  };

  React.useEffect(() => {
    if (selectedData?.isWeekend) {
      // Auto-select next available weekday
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
      } while (generateMonthActivity(year, month)[day - 1]?.isWeekend);
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedDay(day);
    }
    // eslint-disable-next-line
  }, [selectedMonth, selectedYear]);

  return (
    <DashboardLayout>
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
              const data = day ? monthActivity[day - 1] : null;
              const isWeekend = data?.isWeekend;
              return (
                <div
                  key={idx}
                  className={`h-20 rounded-lg flex flex-col items-center justify-center transition border ${day ? (isWeekend ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : (day === selectedDay ? 'bg-primary text-white border-primary cursor-pointer' : 'bg-white hover:bg-primary/10 border-accent cursor-pointer')) : 'bg-transparent border-transparent cursor-default'}`}
                  onClick={() => handleDaySelect(day)}
                >
                  {day && (
                    <>
                      <div className="font-semibold text-lg">{day}</div>
                      {!isWeekend && data && (
                        <div className="flex gap-1 mt-1">
                          <span className="text-xs">🖱️ {data.mouse !== null ? data.mouse + '%' : '-'}</span>
                          <span className="text-xs">⌨️ {data.keyboard !== null ? data.keyboard + '%' : '-'}</span>
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
          {selectedData?.isWeekend || !selectedData?.hours || selectedData?.hours.length === 0 ? (
            <div className="bg-accent rounded-lg p-6 text-center text-gray-500 font-semibold text-lg">No activity for this day</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-6 items-center mb-4">
                <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium">User: <span className="font-semibold">{user?.name || 'N/A'}</span></div>
                <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium">Mouse Activity: <span className="font-semibold">{selectedData?.mouse ?? '-'}%</span></div>
                <div className="bg-accent rounded-lg px-4 py-2 text-sm font-medium">Keyboard Activity: <span className="font-semibold">{selectedData?.keyboard ?? '-'}%</span></div>
              </div>
              <div className="mb-2 font-semibold">Screenshots by Hour:</div>
              <div className="space-y-4">
                {selectedData?.hours?.map((hourBlock, idx) => (
                  <div key={idx} className="bg-accent rounded-lg p-4">
                    <div className="font-semibold mb-2">{hourBlock.hour}:00 - {hourBlock.hour + 1}:00</div>
                    <div className="flex flex-wrap gap-4">
                      {hourBlock.screenshots.length === 0 ? (
                        <div className="text-gray-500 text-sm">No screenshots</div>
                      ) : (
                        hourBlock.screenshots.map((shot, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <img src={shot.img} alt="screenshot" className="w-20 h-14 object-cover rounded border border-accent mb-1" />
                            <div className="text-xs text-gray-600">{shot.time}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 