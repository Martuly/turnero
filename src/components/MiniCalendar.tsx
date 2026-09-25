import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, format, isSameDay, isSameMonth, isToday, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

interface MiniCalendarProps {
  selectedDate: string | null; // ISO yyyy-MM-dd
  onSelect: (iso: string) => void;
  isDateDisabled: (date: Date) => boolean;
  minDate?: Date;
}

export function MiniCalendar({ selectedDate, onSelect, isDateDisabled, minDate = new Date() }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => (selectedDate ? parseISO(selectedDate) : new Date()));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const selected = selectedDate ? parseISO(selectedDate) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-900 capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, viewMonth);
          const isSel = selected ? isSameDay(day, selected) : false;
          const disabled = day < minDate || isDateDisabled(day);
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={`h-9 w-full rounded-lg text-sm transition-colors
                ${!inMonth ? 'text-slate-300' : 'text-slate-700'}
                ${isToday(day) && !isSel ? 'ring-1 ring-slate-300' : ''}
                ${isSel ? 'bg-slate-900 text-white font-semibold' : 'hover:bg-slate-100'}
                ${disabled ? 'text-slate-200 cursor-not-allowed hover:bg-transparent' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
