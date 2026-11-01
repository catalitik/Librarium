import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Book } from '../types/book';

const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function booksForDate(books: Book[], date: string): Book[] {
  return books.filter(book => {
    const hasSession = book.sessions?.some(session => session.date === date);
    const inReadingRange = !!book.start_date && book.start_date <= date &&
      (book.end_date ? date <= book.end_date : book.status === 'reading' && date <= isoDate(new Date()));
    return hasSession || inReadingRange;
  });
}

export const ReadingCalendar: React.FC<{ books: Book[]; onEdit: (book: Book) => void }> = ({ books, onEdit }) => {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const days = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - offset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = isoDate(date);
      return { date, key, books: booksForDate(books, key) };
    });
  }, [books, month]);

  const today = isoDate(new Date());

  return (
    <section className="space-y-5" aria-label="Calendario de lectura">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-stone-200 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div>
          <div>
            <h2 className="font-serif text-xl font-bold capitalize">{monthFormatter.format(month)}</h2>
            <p className="text-xs text-stone-500">Tus lecturas por día</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mes anterior" className="p-2 rounded-lg border hover:bg-stone-50"><ChevronLeft className="w-4 h-4" /></button>
          <button type="button" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="px-3 py-2 rounded-lg border text-sm hover:bg-stone-50">Hoy</button>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Mes siguiente" className="p-2 rounded-lg border hover:bg-stone-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50">
          {weekDays.map(day => <div key={day} className="py-2 text-center text-xs font-semibold text-stone-500">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map(({ date, key, books: dayBooks }) => {
            const inMonth = date.getMonth() === month.getMonth();
            const isToday = key === today;
            return <div key={key} className={`min-h-24 sm:min-h-32 p-1.5 sm:p-2 border-r border-b border-stone-100 ${inMonth ? 'bg-white' : 'bg-stone-50/70'} ${isToday ? 'ring-2 ring-inset ring-amber-500' : ''}`}>
              <div className={`text-xs font-semibold mb-1 ${inMonth ? 'text-stone-700' : 'text-stone-300'} ${isToday ? 'text-amber-700' : ''}`}>{date.getDate()}</div>
              <div className="space-y-1">
                {dayBooks.slice(0, 3).map(book => <button key={book.id} type="button" onClick={() => onEdit(book)} title={`${book.title}${book.status === 'reading' ? ' · En lectura' : ''}`} className="w-full flex items-center gap-1.5 rounded-md bg-amber-50 hover:bg-amber-100 p-1 text-left text-[10px] sm:text-xs text-amber-950 overflow-hidden">
                  {book.cover_url ? <img src={book.cover_url} alt="" loading="lazy" className="w-6 h-8 sm:w-7 sm:h-10 rounded object-cover shrink-0" /> : <span className="w-6 h-8 sm:w-7 sm:h-10 rounded bg-amber-200 shrink-0 flex items-center justify-center"><CalendarDays className="w-3 h-3" /></span>}
                  <span className="line-clamp-2 leading-tight">{book.title}</span>
                </button>)}
                {dayBooks.length > 3 && <div className="text-[10px] text-stone-500 pl-1">+{dayBooks.length - 3} más</div>}
              </div>
            </div>;
          })}
        </div>
      </div>
      <p className="text-xs text-stone-500">Los días se marcan según las fechas de lectura y las sesiones registradas. Selecciona una portada para editar ese libro.</p>
    </section>
  );
};
