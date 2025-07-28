import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
} from 'date-fns';

export default function EmployeeCalendar({ title, events = [], initialMonth, onDateClick }) {
  const [currentMonth, setCurrentMonth] = React.useState(initialMonth || new Date());

  function getEventsForDate(date) {
    const d = format(date, 'yyyy-MM-dd');
    return events.find(e => e.date === d)?.times || [];
  }

  function sumWeekHours(week) {
    let totalMinutes = 0;
    week.forEach(day => {
      const times = getEventsForDate(day);
      times.forEach(t => {
        const [h, m] = t.split(':').map(Number);
        totalMinutes += h * 60 + (m || 0);
      });
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return totalMinutes > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : '0';
  }

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  // Find the first Sunday of the grid
  let startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const rows = [];
  let days = [];
  let day = startDate;
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  return (
    <div className="rounded-xl shadow-lg p-0 overflow-hidden border border-accent mb-8">
      {title && (
        <div className="text-lg font-bold mb-0 bg-primary px-6 py-3 rounded-t-xl flex items-center">
          {title}
        </div>
      )}
      <div className="flex items-center justify-between px-6 py-2 border-b border-accent text-sm font-medium">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-2 py-1 rounded hover:bg-primary/10 font-bold">&#8592;</button>
        <span className="font-semibold text-dark">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-2 py-1 rounded hover:bg-primary/10 font-bold">&#8594;</button>
      </div>
      <div className="p-6">
        <table className="w-full text-center border-collapse rounded-xl overflow-hidden bg-white">
          <thead>
            <tr className="bg-accent border-b border-accent text-dark">
              <th className="p-2">Su</th>
              <th className="p-2">Mo</th>
              <th className="p-2">Tu</th>
              <th className="p-2">We</th>
              <th className="p-2">Th</th>
              <th className="p-2">Fr</th>
              <th className="p-2">Sa</th>
              <th className="p-2 text-right">Week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((week, idx) => (
              <tr key={idx} className="border-b last:border-0">
                {week.map((date, i) => {
                  const isCurrentMonth = isSameMonth(date, monthStart);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  return (
                    <td
                      key={i}
                      className={`align-top p-2 border border-accent/30 ${!isCurrentMonth ? 'text-gray-300 bg-accent/50' : 'bg-white'} ${isSameDay(date, new Date()) ? 'border-primary border-2' : ''}`}
                      style={{ minWidth: 80, height: 80 }}
                      onClick={isCurrentMonth && onDateClick ? () => onDateClick(dateStr) : undefined}
                    >
                      <div className="text-xs font-semibold text-dark flex items-center gap-1 justify-center">
                        {format(date, 'd')}
                        {isSameDay(date, new Date()) && <span className="ml-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">TODAY</span>}
                      </div>
                      <div className="flex flex-col items-center mt-1">
                        {getEventsForDate(date).map((t, j) => (
                          <span key={j} className="text-primary text-sm font-mono">{t}</span>
                        ))}
                      </div>
                    </td>
                  );
                })}
                <td className="text-right font-bold text-primary pr-2 align-middle">
                  {sumWeekHours(week)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 