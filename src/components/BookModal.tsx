import React, { useState, useEffect } from 'react';
import { Book, ReadingStatus } from '../types/book';
import { X, Calendar, Star, BookOpen, FileText, Image as ImageIcon, Check } from 'lucide-react';
import { format } from 'date-fns';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
  initialData?: Partial<Book> | null;
}

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [error, setError] = useState('');
  const [publisher, setPublisher] = useState('');
  const [language, setLanguage] = useState('');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [publishedDate, setPublishedDate] = useState('');
  const [description, setDescription] = useState('');
  const [isbn, setIsbn] = useState('');
  
  // Tracking fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ReadingStatus>('read');
  const [pagesRead, setPagesRead] = useState<number>(0);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    setError('');
    setPublisher(initialData?.publisher || '');
    setLanguage(initialData?.language || '');
    if (initialData) {
      setTitle(initialData.title || '');
      setAuthors(initialData.authors ? initialData.authors.join(', ') : '');
      setCoverUrl(initialData.cover_url || '');
      setPageCount(initialData.page_count || 0);
      setPublishedDate(initialData.published_date || '');
      setDescription(initialData.description || '');
      setIsbn(initialData.isbn || '');
      
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || '');
      setStatus(initialData.status || 'read');
      setPagesRead(initialData.pages_read || 0);
      setRating(initialData.rating || null);
      setNotes(initialData.notes || '');
    } else {
      // Default new book values
      setTitle('');
      setAuthors('');
      setCoverUrl('');
      setPageCount(0);
      setPublishedDate('');
      setDescription('');
      setIsbn('');
      setStartDate('');
      setEndDate(format(new Date(), 'yyyy-MM-dd'));
      setStatus('read');
      setPagesRead(0);
      setRating(null);
      setNotes('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError('');
    if (startDate && endDate && status === 'read' && endDate < startDate) { setError('La fecha final no puede ser anterior al inicio.'); return; }
    if (pagesRead < 0 || (pageCount > 0 && pagesRead > pageCount)) { setError('Revisa la página actual.'); return; }
    setIsSubmitting(true);
    try {
      const parsedAuthors = authors
        .split(',')
        .map(a => a.trim())
        .filter(Boolean);

      await onSave({
        ...(initialData?.id ? { id: initialData.id } : {}),
        publisher: publisher.trim(), language: language.trim(),
        sessions: initialData?.sessions || [], categories: initialData?.categories || [],
        title: title.trim(),
        authors: parsedAuthors.length > 0 ? parsedAuthors : ['Autor desconocido'],
        cover_url: coverUrl.trim(),
        page_count: Number(pageCount) || 0,
        published_date: publishedDate.trim(),
        description: description.trim(),
        isbn: isbn.trim() || undefined,
        start_date: startDate || null,
        end_date: status === 'read' ? (endDate || null) : null,
        status,
        pages_read: status === 'reading' ? Number(pagesRead) : (status === 'read' ? Number(pageCount) : 0),
        rating: rating,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'No se pudo guardar. Tus cambios siguen aquí.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetTodayEnd = () => {
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSetTodayStart = () => {
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {initialData?.id ? 'Editar lectura' : 'Registrar lectura'}
              </h2>
              <p className="text-xs text-stone-500">
                Configura las fechas de inicio, finalización y valoración
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Cover & Basic Info Row */}
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Cover Preview */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="w-28 aspect-[2/3] rounded-xl overflow-hidden bg-stone-100 shadow-md border border-stone-200 relative group">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Portada"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-stone-400 bg-stone-100">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">Sin portada</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title, Author, Pages, Pub Date */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Título del libro *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Cien años de soledad"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Autor(es) (separados por coma)
                </label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="Ej. Gabriel García Márquez"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Número de páginas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pageCount || ''}
                    onChange={(e) => setPageCount(parseInt(e.target.value) || 0)}
                    placeholder="Ej. 496"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Año / Fecha publicación
                  </label>
                  <input
                    type="text"
                    value={publishedDate}
                    onChange={(e) => setPublishedDate(e.target.value)}
                    placeholder="Ej. 1967"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <fieldset className="grid sm:grid-cols-3 gap-3"><legend className="font-semibold text-sm mb-2">Edición</legend>
          <label className="text-xs">Editorial<input className="w-full border rounded-lg p-2" value={publisher} onChange={e=>setPublisher(e.target.value)} /></label>
          <label className="text-xs">Idioma<input className="w-full border rounded-lg p-2" value={language} onChange={e=>setLanguage(e.target.value)} placeholder="es" /></label>
          <label className="text-xs">ISBN<input className="w-full border rounded-lg p-2" value={isbn} onChange={e=>setIsbn(e.target.value)} /></label>
          </fieldset>
          {/* Status Selector */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Estado de la lectura
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('read')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'read'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                ✓ Terminado (Leído)
              </button>
              <button
                type="button"
                onClick={() => setStatus('reading')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'reading'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                📖 En Lectura
              </button>
              <button
                type="button"
                onClick={() => setStatus('want_to_read')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'want_to_read'
                    ? 'bg-stone-100 border-stone-500 text-stone-900 shadow-xs'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                🔖 Por Leer
              </button>
            </div>
          </div>

          {/* Reading Dates (Manual Entry) */}
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Registro de fechas de lectura</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Día de inicio de lectura
                  </label>
                  <button
                    type="button"
                    onClick={handleSetTodayStart}
                    className="text-[11px] text-amber-700 hover:underline"
                  >
                    Hoy
                  </button>
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* End Date (Only relevant for finished books) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Día de fin de lectura
                  </label>
                  <button
                    type="button"
                    onClick={handleSetTodayEnd}
                    className="text-[11px] text-amber-700 hover:underline"
                  >
                    Hoy
                  </button>
                </div>
                <input
                  type="date"
                  value={endDate}
                  disabled={status !== 'read'}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                    status !== 'read' ? 'opacity-40 cursor-not-allowed bg-stone-100' : ''
                  }`}
                />
              </div>
            </div>

            {/* Reading progress in pages if currently reading */}
            {status === 'reading' && pageCount > 0 && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Páginas leídas hasta ahora ({pagesRead} de {pageCount})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={pageCount}
                    value={pagesRead}
                    onChange={(e) => setPagesRead(parseInt(e.target.value) || 0)}
                    className="flex-1 accent-amber-600"
                  />
                  <input
                    type="number"
                    min="0"
                    max={pageCount}
                    value={pagesRead}
                    onChange={(e) => setPagesRead(Math.min(pageCount, parseInt(e.target.value) || 0))}
                    className="w-20 px-2.5 py-1 text-xs border border-stone-300 rounded-lg text-center"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Valoración personal
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? null : star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 text-stone-300 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoverRating ?? rating ?? 0)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-semibold text-stone-600 ml-2">
                {rating ? `${rating} de 5 estrellas` : 'Sin puntuación'}
              </span>
            </div>
          </div>

          {/* Notes / Review */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Notas, reflexiones y reseña personal
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Qué te ha parecido el libro? Escribe tus citas favoritas, reflexiones o un resumen..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Advanced / Optional: Cover URL direct input */}
          <details className="text-xs text-stone-500">
            <summary className="cursor-pointer font-medium hover:text-stone-700 select-none">
              Avanzado: Enlace personalizado de portada
            </summary>
            <div className="mt-2 pt-2 border-t border-stone-100">
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
              />
            </div>
          </details>

          {error && <p role="alert" className="text-red-700">{error}</p>}
          {/* Submit Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isSubmitting ? 'Guardando...' : 'Guardar lectura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
