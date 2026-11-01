import React, { useState } from 'react';
import { Search, Loader2, BookOpen, AlertCircle, Sparkles, X, PlusCircle, Database } from 'lucide-react';
import { searchBooks, BookSearchResult } from '../services/googleBooks';

interface BookSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: BookSearchResult) => void;
  onManualAdd: () => void;
}

export const BookSearchModal: React.FC<BookSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectBook,
  onManualAdd,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [provider, setProvider] = useState<string>('');
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchBooks(query);
      setResults(data.results);
      setProvider(data.provider);
      setUnavailable(data.unavailable);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo conectar con la base de datos de libros. Revisa tu conexión a internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = (term: string) => {
    setQuery(term);
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    searchBooks(term)
      .then((data) => {
        setResults(data.results);
        setProvider(data.provider);
        setUnavailable(data.unavailable);
      })
      .catch(() => setError('Error buscando sugerencia.'))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900">Buscar libro</h2>
                {provider && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                    Fuente: {provider}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Obtén automáticamente la portada, número de páginas y fecha de publicación
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

        {/* Search Input Bar */}
        <div className="p-5 sm:p-6 pb-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Escribe el título, autor o ISBN (ej. Cien años de soledad)..."
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </button>
          </form>

          {/* Quick Suggestions */}
          {!hasSearched && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
              <span>Sugerencias:</span>
              {['Cien años de soledad', 'Dune Frank Herbert', '1984 George Orwell', 'Hábitos atómicos', 'El principito'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleQuickSuggestion(s)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-2 divide-y divide-stone-100">
          {isLoading && (
            <div className="py-16 text-center text-stone-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-2" />
              <p className="text-sm">Buscando portadas y datos bibliográficos...</p>
            </div>
          )}

          {error && (
            <div className="my-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && hasSearched && unavailable.length > 0 && !error && (
            <div className="my-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <p className="font-semibold">Algunas fuentes no respondieron:</p>
              <ul className="mt-1 list-disc pl-4">{unavailable.map((item) => <li key={item}>{item}</li>)}</ul>
              <p className="mt-1">Los catálogos abiertos pueden no incluir novedades editoriales recientes.</p>
            </div>
          )}

          {!isLoading && hasSearched && results.length === 0 && !error && (
            <div className="py-12 text-center text-stone-500">
              <BookOpen className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              <p className="text-sm font-medium text-stone-700">No se encontraron libros con esa búsqueda.</p>
              <p className="text-xs text-stone-500 mt-1">Prueba con palabras clave más específicas o añade el libro manualmente.</p>
            </div>
          )}

          {!isLoading && results.map((book) => (
            <div
              key={book.id}

              className="py-3 sm:py-4 flex items-center gap-4 hover:bg-amber-50/50 p-2 rounded-2xl cursor-pointer transition-colors group"
            >
              {/* Cover Preview */}
              <div className="w-14 sm:w-16 aspect-[2/3] rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 shadow-xs border border-stone-200 relative">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-200 text-[10px] text-center p-1">
                    Sin portada
                  </div>
                )}
              </div>

              {/* Information */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                  {book.title}
                </h4>
                <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">
                  {book.authors.join(', ')}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-500">
                  {book.publisher && <span>{book.publisher}</span>}
                  {book.language && <span>Idioma: {book.language}</span>}
                  {book.source === 'Open Library' && <span>Datos de la obra: verifica la edición y las páginas</span>}
                  {book.source === 'Internet Archive' && <span>Ejemplar digitalizado: las páginas pueden ser aproximadas</span>}
                  {book.page_count > 0 && (
                    <span><strong>{book.page_count}</strong> páginas</span>
                  )}
                  {book.published_date && (
                    <span>Año: {book.published_date.substring(0, 4)}</span>
                  )}
                  {book.isbn && (
                    <span className="hidden sm:inline">ISBN: {book.isbn}</span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onSelectBook(book)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-800 group-hover:text-white text-xs font-semibold transition-all flex-shrink-0"
              >
                Seleccionar
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-stone-400" />
            Búsqueda: Google Books + Open Library + Internet Archive
          </span>
          <button
            type="button"
            onClick={onManualAdd}
            className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-semibold hover:underline cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            ¿No encuentras el libro? Añadir manualmente
          </button>
        </div>
      </div>
    </div>
  );
};
