import { duplicate, today } from './services/library';
import React, { useState, useEffect, useMemo } from 'react';
import { Book, ReadingPeriodFilter } from './types/book';
import {
  fetchBooks,
  fetchAnnualGoal,
  saveBook,
  deleteBook,
  filterBooksByPeriod,
  calculateStats,
  getAnnualGoal,
  setAnnualGoal,
} from './services/storage';
import { getSupabase, getCurrentUser } from './services/supabase';
import { BookSearchResult } from './services/googleBooks';
import { Navbar } from './components/Navbar';
import { PeriodFilter } from './components/PeriodFilter';
import { BookCard } from './components/BookCard';
import { BookModal } from './components/BookModal';
import { BookSearchModal } from './components/BookSearchModal';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { ReadingCalendar } from './components/ReadingCalendar';
import { BookOpen, Plus, Loader2, Sparkles, Filter, Library } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export function App() {
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('date');
  const [searchStatus, setSearchStatus] = useState<'read'|'reading'>('read');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'library' | 'dashboard' | 'reading' | 'calendar'>('library');
  
  const currentYear = new Date().getFullYear();
  const [filter, setFilter] = useState<ReadingPeriodFilter>({
    type: 'this_year',
    year: currentYear,
  });

  const [annualGoal, setGoal] = useState<number>(() => getAnnualGoal());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);

  // Load books & Supabase auth status
  const loadData = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      const { books: loadedBooks, isCloud } = await fetchBooks();
      setBooks(loadedBooks);
      setIsCloudConnected(isCloud);
      setGoal(await fetchAnnualGoal(currentYear));
    } catch (err) {
      setBooks([]);
      setLoadError('No se pudieron cargar tus datos. ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to Supabase auth state changes if client exists
    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setCurrentUser(session?.user ?? null);
        setTimeout(() => loadData(), 0);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      loadData();
    }
  };

  // Handle book save (create or update)
  const handleSaveBook = async (bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => {
    try {
      if (!bookData.id && books.some(b => duplicate(b, bookData)) && !window.confirm('Ya existe un libro similar o con el mismo ISBN. ¿Añadir otra lectura?')) throw new Error('Guardado cancelado: posible duplicado.');
      const saved = await saveBook(bookData);
      setBooks(prev => {
        const exists = prev.some(b => b.id === saved.id);
        if (exists) {
          return prev.map(b => b.id === saved.id ? saved : b);
        } else {
          return [saved, ...prev];
        }
      });
    } catch (err) {
      console.error('Error guardando libro:', err);
      throw err;
    }
  };

  // Handle book delete
  const handleDeleteBook = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta lectura?')) {
      try {
        await deleteBook(id);
        setBooks(prev => prev.filter(b => b.id !== id));
      } catch (err) {
        console.error('Error eliminando libro:', err);
        alert('Error al eliminar el libro.');
      }
    }
  };

  // From Search to Edit Modal
  const handleSelectFromSearch = (searchResult: BookSearchResult) => {
    setIsSearchOpen(false);
    setEditingBook({
      title: searchResult.title,
      authors: searchResult.authors,
      cover_url: searchResult.cover_url,
      page_count: searchResult.page_count,
      published_date: searchResult.published_date,
      description: searchResult.description,
      isbn: searchResult.isbn,
      publisher: searchResult.publisher, language: searchResult.language,
      categories: searchResult.categories,
      status: searchStatus,
      rating: null,
      notes: '',
      start_date: searchStatus === 'reading' ? today() : '',
      end_date: searchStatus === 'read' ? today() : null,
    });
    setIsBookModalOpen(true);
  };

  const handleManualAdd = () => {
    setIsSearchOpen(false);
    setEditingBook({status: searchStatus, start_date: searchStatus === 'reading' ? today() : null, end_date: searchStatus === 'read' ? today() : null});
    setIsBookModalOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setIsBookModalOpen(true);
  };

  const handleUpdateGoal = async (newGoal: number) => {
    await setAnnualGoal(newGoal, currentYear); setGoal(newGoal);
  };
  const visible = (items: Book[]) => items.filter(b => [b.title, ...b.authors, b.isbn || ''].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b) => sort === 'title' ? a.title.localeCompare(b.title,'es') : sort === 'author' ? (a.authors[0]||'').localeCompare(b.authors[0]||'','es') : sort === 'rating' ? (b.rating||0)-(a.rating||0) : (b.end_date||b.start_date||b.created_at).localeCompare(a.end_date||a.start_date||a.created_at));

  // Available years from books
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    books.forEach(b => {
      if (b.end_date) {
        const y = new Date(b.end_date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [books, currentYear]);

  // Finished books filtered by the active period
  const filteredReadBooks = useMemo(() => {
    return filterBooksByPeriod(books, filter);
  }, [books, filter]);

  // In-progress books
  const readingBooks = useMemo(() => {
    return books.filter(b => b.status === 'reading');
  }, [books]);

  // Want-to-read books
  const wantToReadBooks = useMemo(() => {
    return books.filter(b => b.status === 'want_to_read');
  }, [books]);

  // Statistics calculation
  const stats = useMemo(() => {
    return calculateStats(books, filter, annualGoal);
  }, [books, filter, annualGoal]);

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => {setSearchStatus('read');setIsSearchOpen(true);}}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
        isCloudConnected={isCloudConnected}
        activeReadingCount={readingBooks.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loadError && <div role="alert" className="p-4 bg-red-50 text-red-800 rounded-xl mb-4">{loadError} <button onClick={loadData}>Reintentar</button></div>}
        {!loadError && <div className="mb-5 flex flex-wrap gap-3 items-center text-sm">
          <span className="rounded-full bg-white border px-3 py-2">{isCloudConnected ? 'Guardando en tu cuenta' : 'Guardando en este navegador'}</span>
          {activeTab !== 'dashboard' && <><input aria-label="Buscar en mi biblioteca" className="border rounded-xl px-3 py-2 flex-1" placeholder="Buscar por título, autor o ISBN" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="Ordenar biblioteca" className="border rounded-xl p-2" value={sort} onChange={e=>setSort(e.target.value)}><option value="date">Fecha más reciente</option><option value="title">Título</option><option value="author">Autor</option><option value="rating">Mejor valoración</option></select></>}
        </div>}
        {loadError ? null : isLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 mb-3" />
            <p className="text-sm font-medium text-stone-600">Cargando tu biblioteca...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: Mis Lecturas (Library & Timeline) */}
            {activeTab === 'library' && (
              <div className="space-y-6">
                {/* Period Filter Bar */}
                <PeriodFilter
                  filter={filter}
                  onChange={setFilter}
                  availableYears={availableYears}
                  booksCount={filteredReadBooks.length}
                />

                {/* Empty State */}
                {filteredReadBooks.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300 max-w-xl mx-auto shadow-xs">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4">
                      <Library className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
                      No hay lecturas registradas en este periodo
                    </h3>
                    <p className="text-sm text-stone-500 mb-6 max-w-sm mx-auto">
                      Añade los libros que has leído buscando en Google Books para cargar automáticamente portadas y número de páginas.
                    </p>
                    <button
                      onClick={() => {setSearchStatus('read');setIsSearchOpen(true);}}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      Añadir lectura
                    </button>
                  </div>
                ) : (
                  /* Books Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visible(filteredReadBooks).map(book => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onEdit={handleEditBook}
                        onDelete={handleDeleteBook}
                        onSave={handleSaveBook}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: Estadísticas (Dashboard) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Period Filter inside dashboard so user can analyze any period */}
                <PeriodFilter
                  filter={filter}
                  onChange={setFilter}
                  availableYears={availableYears}
                  booksCount={filteredReadBooks.length}
                />

                <Dashboard
                  stats={stats}
                  filter={filter}
                  onFilterChange={setFilter}
                  onUpdateGoal={handleUpdateGoal}
                />
              </div>
            )}

            {/* VIEW 3: Libros actualmente en lectura */}
            {activeTab === 'reading' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-stone-900">
                      Lecturas en Curso ({readingBooks.length})
                    </h2>
                    <p className="text-xs text-stone-500">
                      Libros que estás leyendo ahora mismo. Puedes registrar tu página actual y marcar como terminados cuando finalices.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchStatus('reading');
                      setIsSearchOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Empezar un libro
                  </button>
                </div>

                {readingBooks.length === 0 ? (
                  <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-stone-300 max-w-md mx-auto">
                    <BookOpen className="w-10 h-10 mx-auto text-amber-600 mb-2" />
                    <h3 className="font-bold text-stone-800 text-sm">No tienes ninguna lectura en curso</h3>
                    <p className="text-xs text-stone-500 mt-1 mb-4">¿Qué libro estás empezando a leer?</p>
                    <button
                      onClick={() => {setSearchStatus('reading');setIsSearchOpen(true);}}
                      className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                    >
                      Buscar libro
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visible(readingBooks).map(book => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onEdit={handleEditBook}
                        onDelete={handleDeleteBook}
                        onSave={handleSaveBook}
                      />
                    ))}
                  </div>
                )}

                {/* Want to Read section */}
                {wantToReadBooks.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-stone-200">
                    <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">
                      Pendientes / Quiero Leer ({wantToReadBooks.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {visible(wantToReadBooks).map(book => (
                        <BookCard
                          key={book.id}
                          book={book}
                          onEdit={handleEditBook}
                          onDelete={handleDeleteBook}
                        onSave={handleSaveBook}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'calendar' && (
              <ReadingCalendar books={books} onEdit={handleEditBook} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={handleSelectFromSearch}
        onManualAdd={handleManualAdd}
      />

      <BookModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSave={handleSaveBook}
        initialData={editingBook}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={loadData}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onRefresh={loadData}
        books={books}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
