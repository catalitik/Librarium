import { QuickReading } from './QuickReading';
import React, { useState } from 'react';
import { Book } from '../types/book';
import { Calendar, FileText, Star, Edit3, Trash2, Clock, CheckCircle2, Bookmark } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onSave: (book: Book) => Promise<void>;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onEdit, onDelete, onSave }) => {
  const [imgError, setImgError] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Format dates safely
  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(parseISO(dateStr), "d 'de' MMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  // Calculate reading duration in days
  const getDurationDays = () => {
    if (!book.start_date || !book.end_date) return null;
    try {
      const s = new Date(book.start_date).getTime();
      const e = new Date(book.end_date).getTime();
      const days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
      return days === 1 ? '1 día' : `${days} días`;
    } catch {
      return null;
    }
  };

  const duration = getDurationDays();

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top Section with Cover & Meta */}
      <div className="flex p-4 sm:p-5 gap-4">
        {/* Book Cover */}
        <div className="relative flex-shrink-0 w-24 sm:w-28 aspect-[2/3] rounded-xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200/60">
          {!imgError && book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-stone-200 to-stone-300 text-stone-600">
              <Bookmark className="w-6 h-6 mb-1 text-stone-400" />
              <span className="text-[10px] font-semibold line-clamp-3 leading-tight">{book.title}</span>
            </div>
          )}

          {/* Status Badge Over Cover */}
          <div className="absolute top-1.5 left-1.5">
            {book.status === 'read' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600 text-white shadow-xs">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Leído
              </span>
            )}
            {book.status === 'reading' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-600 text-white shadow-xs">
                <Clock className="w-2.5 h-2.5" />
                Leyendo
              </span>
            )}
            {book.status === 'want_to_read' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-stone-600 text-white shadow-xs">
                Por leer
              </span>
            )}
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 leading-snug line-clamp-2 group-hover:text-amber-800 transition-colors">
              {book.title}
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5 line-clamp-1">
              {book.authors && book.authors.length > 0 ? book.authors.join(', ') : 'Autor no especificado'}
            </p>

            <p className="text-xs text-stone-500">{[book.publisher,book.language,book.isbn].filter(Boolean).join(' · ')}</p>
            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-stone-500">
              {book.page_count > 0 && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  {book.page_count} páginas
                </span>
              )}
              {book.published_date && (
                <span>
                  Pub: {book.published_date.length > 4 ? book.published_date.substring(0, 4) : book.published_date}
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="mt-3 flex items-center justify-between">
            {book.rating ? (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (book.rating || 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-stone-700 ml-1">
                  {book.rating}/5
                </span>
              </div>
            ) : (
              <span className="text-xs text-stone-400 italic">Sin valorar</span>
            )}
          </div>
        </div>
      </div>

      {/* Reading In Progress Bar */}
      {book.status === 'reading' && book.page_count > 0 && book.pages_read !== undefined && (
        <div className="px-4 pb-2">
          <div className="flex justify-between text-xs text-stone-600 mb-1">
            <span>Progreso</span>
            <span className="font-medium">
              {book.pages_read} / {book.page_count} pág. ({Math.round(((book.pages_read || 0) / book.page_count) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round(((book.pages_read || 0) / book.page_count) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Reading Dates info bar */}
      {(book.start_date || book.end_date) && (
        <div className="px-4 py-2 bg-stone-50/80 border-t border-stone-100 text-xs text-stone-600 flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>
              {book.start_date ? formatDateString(book.start_date) : 'Inicio no reg.'}
              {' → '}
              {book.end_date ? formatDateString(book.end_date) : 'En curso'}
            </span>
          </div>

          {duration && (
            <span className="font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
              {duration}
            </span>
          )}
        </div>
      )}

      {/* Notes / Review snippet */}
      {book.notes && (
        <div className="px-4 py-2.5 bg-stone-50/40 border-t border-stone-100 text-xs text-stone-700">
          <div className="flex items-start justify-between gap-2">
            <p className={`italic ${!showNotes ? 'line-clamp-2' : ''}`}>
              "{book.notes}"
            </p>
            {book.notes.length > 90 && (
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="text-[11px] text-amber-700 hover:underline font-medium flex-shrink-0"
              >
                {showNotes ? 'Menos' : 'Más'}
              </button>
            )}
          </div>
        </div>
      )}

      <QuickReading key={book.id + book.updated_at} book={book} onSave={onSave} />
      {/* Card Footer Actions */}
      <div className="mt-auto px-4 py-2.5 border-t border-stone-100 flex items-center justify-end gap-2 bg-white">
        <button
          onClick={() => onEdit(book)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Editar
        </button>
        <button
          onClick={() => onDelete(book.id)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );
};
