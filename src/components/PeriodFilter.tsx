import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { ReadingPeriodFilter } from '../types/book';

interface PeriodFilterProps {
  filter: ReadingPeriodFilter;
  onChange: (filter: ReadingPeriodFilter) => void;
  availableYears: number[];
  booksCount: number;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  filter,
  onChange,
  availableYears,
  booksCount,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Count */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Periodo de lectura</h3>
            <p className="text-xs text-stone-500">
              {booksCount === 1 ? '1 libro leído' : `${booksCount} libros leídos`} en la selección
            </p>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onChange({ type: 'this_year', year: currentYear })}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              filter.type === 'this_year' && (!filter.year || filter.year === currentYear)
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Este año ({currentYear})
          </button>

          <button
            type="button"
            onClick={() => onChange({ type: 'this_month' })}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              filter.type === 'this_month'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Este mes
          </button>

          {/* Select year if there are multiple years */}
          {availableYears.length > 1 && (
            <select
              value={filter.type === 'this_year' && filter.year ? filter.year : ''}
              onChange={(e) => {
                const yr = parseInt(e.target.value, 10);
                if (yr) onChange({ type: 'this_year', year: yr });
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-stone-100 text-stone-700 border-none cursor-pointer focus:ring-2 focus:ring-amber-500"
            >
              <option value="" disabled>Otro año...</option>
              {availableYears.map(yr => (
                <option key={yr} value={yr}>Año {yr}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => onChange({ type: 'custom', startDate: filter.startDate || '', endDate: filter.endDate || '' })}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              filter.type === 'custom'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Personalizado
          </button>

          <button
            type="button"
            onClick={() => onChange({ type: 'all' })}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              filter.type === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {filter.type === 'custom' && (
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Desde:</span>
            <div className="relative">
              <input
                type="date"
                value={filter.startDate || ''}
                onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Hasta:</span>
            <div className="relative">
              <input
                type="date"
                value={filter.endDate || ''}
                onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {(filter.startDate || filter.endDate) && (
            <button
              type="button"
              onClick={() => onChange({ ...filter, startDate: '', endDate: '' })}
              className="text-xs text-amber-700 hover:underline font-medium ml-auto"
            >
              Limpiar fechas
            </button>
          )}
        </div>
      )}
    </div>
  );
};
