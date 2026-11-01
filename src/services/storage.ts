import { Book, ReadingPeriodFilter, UserStats } from '../types/book';
import { getSupabase } from './supabase';

const LOCAL_STORAGE_BOOKS = 'librarium_local_books';
const LOCAL_STORAGE_GOAL = 'librarium_annual_goal';

const DEFAULT_DEMO_BOOKS: Book[] = [
  {
    id: 'demo-1',
    title: 'Cien años de soledad',
    authors: ['Gabriel García Márquez'],
    cover_url: 'https://books.google.com/books/content?id=GZpEDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
    page_count: 496,
    published_date: '1967-05-30',
    description: 'La historia de la familia Buendía a lo largo de siete generaciones en el mítico pueblo de Macondo.',
    isbn: '9788497592208',
    categories: ['Ficción literaria', 'Realismo mágico'],
    start_date: '2026-01-05',
    end_date: '2026-01-22',
    status: 'read',
    rating: 5,
    notes: 'Una obra de arte absoluta. La prosa de García Márquez es envolvente y cada generación de los Buendía deja una huella imborrable.',
    created_at: new Date('2026-01-22').toISOString(),
    updated_at: new Date('2026-01-22').toISOString(),
  },
  {
    id: 'demo-2',
    title: 'El problema de los tres cuerpos',
    authors: ['Cixin Liu'],
    cover_url: 'https://books.google.com/books/content?id=jN25CgAAQBAJ&printsec=frontcover&img=1&zoom=1',
    page_count: 416,
    published_date: '2008-01-01',
    description: 'En el contexto de la Revolución Cultural china, una señal es enviada al espacio exterior con consecuencias decisivas.',
    isbn: '9788466659734',
    categories: ['Ciencia Ficción'],
    start_date: '2026-02-01',
    end_date: '2026-02-18',
    status: 'read',
    rating: 4,
    notes: 'Conceptos científicos fascinantes y una trama que te mantiene enganchado hasta la última página.',
    created_at: new Date('2026-02-18').toISOString(),
    updated_at: new Date('2026-02-18').toISOString(),
  },
  {
    id: 'demo-3',
    title: 'El imperio final (Nacidos de la Bruma 1)',
    authors: ['Brandon Sanderson'],
    cover_url: 'https://books.google.com/books/content?id=1K0wDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
    page_count: 672,
    published_date: '2006-07-17',
    description: 'Durante mil años han caído las cenizas y nada florece. Un grupo de rebeldes planea derrotar al Lord Legislador.',
    isbn: '9788466658928',
    categories: ['Fantasía épica'],
    start_date: '2026-03-02',
    end_date: '2026-03-28',
    status: 'read',
    rating: 5,
    notes: 'El sistema de magia de la alomancia y el ritmo final son simplemente magistrales.',
    created_at: new Date('2026-03-28').toISOString(),
    updated_at: new Date('2026-03-28').toISOString(),
  },
  {
    id: 'demo-4',
    title: 'Hábitos atómicos',
    authors: ['James Clear'],
    cover_url: 'https://books.google.com/books/content?id=5O2fDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
    page_count: 336,
    published_date: '2018-10-16',
    description: 'Un método sencillo y comprobado para desarrollar buenos hábitos y eliminar los malos.',
    isbn: '9788418118036',
    categories: ['Desarrollo personal'],
    start_date: '2026-04-05',
    end_date: '2026-04-19',
    status: 'read',
    rating: 5,
    notes: 'Práctico y directo. La idea del 1% de mejora diaria cambia completamente la perspectiva de metas a largo plazo.',
    created_at: new Date('2026-04-19').toISOString(),
    updated_at: new Date('2026-04-19').toISOString(),
  },
  {
    id: 'demo-5',
    title: 'Klara y el Sol',
    authors: ['Kazuo Ishiguro'],
    cover_url: 'https://books.google.com/books/content?id=U7sEEAAAQBAJ&printsec=frontcover&img=1&zoom=1',
    page_count: 384,
    published_date: '2021-03-02',
    description: 'Klara, una Amiga Artificial con cualidades de observación excepcionales, espera en la tienda que alguien la elija.',
    isbn: '9788433999238',
    categories: ['Ficción especulativa'],
    start_date: '2026-05-10',
    end_date: '2026-05-25',
    status: 'read',
    rating: 4,
    notes: 'Una mirada conmovedora y melancólica a la humanidad y la soledad a través de los ojos de una IA.',
    created_at: new Date('2026-05-25').toISOString(),
    updated_at: new Date('2026-05-25').toISOString(),
  },
  {
    id: 'demo-6',
    title: 'Dune',
    authors: ['Frank Herbert'],
    cover_url: 'https://books.google.com/books/content?id=XwJ2BAAAQBAJ&printsec=frontcover&img=1&zoom=1',
    page_count: 704,
    published_date: '1965-08-01',
    description: 'En el desértico planeta Arrakis, el joven Paul Atreides se adentra en un destino superior.',
    isbn: '9788466353779',
    categories: ['Ciencia Ficción'],
    start_date: '2026-06-01',
    end_date: null,
    status: 'reading',
    pages_read: 320,
    rating: null,
    notes: 'Leyéndolo actualmente. La construcción de mundo y la ecología de Arrakis son apasionantes.',
    created_at: new Date('2026-06-01').toISOString(),
    updated_at: new Date('2026-06-01').toISOString(),
  }
];

export function getLocalBooks(): Book[] {
  const data = localStorage.getItem(LOCAL_STORAGE_BOOKS);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_BOOKS, JSON.stringify(DEFAULT_DEMO_BOOKS));
    return DEFAULT_DEMO_BOOKS;
  }
  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) throw new Error('La biblioteca local no es una lista.');
    return parsed;
  } catch (e) {
    console.error('Error parseando libros locales:', e);
    throw new Error('La biblioteca local no se puede leer. Conserva una copia antes de restaurarla.');
  }
}

export function saveLocalBooks(books: Book[]) {
  localStorage.setItem(LOCAL_STORAGE_BOOKS, JSON.stringify(books));
}

export type BookInput = Omit<Book, 'id' | 'created_at' | 'updated_at'> & { id?: string };
async function destination() {
  const client = getSupabase();
  if (!client) return null;
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  return session ? { client, user: session.user } : null;
}
export async function fetchBooks(): Promise<{ books: Book[]; isCloud: boolean }> {
  const remote = await destination();
  if (remote) {
    const { data, error } = await remote.client.from('books').select('*').eq('user_id', remote.user.id).order('end_date', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return { books: data || [], isCloud: true };
  }
  return { books: getLocalBooks(), isCloud: false };
}
export async function saveBook(book: BookInput): Promise<Book> {
  const remote = await destination();
  const now = new Date().toISOString();
  if (remote) {
    const { id, user_id, ...fields } = book;
    const query = id
      ? remote.client.from('books').update({ ...fields, updated_at: now }).eq('id', id).eq('user_id', remote.user.id)
      : remote.client.from('books').insert({ ...fields, user_id: remote.user.id, updated_at: now });
    const { data, error } = await query.select().single();
    if (error) throw error;
    return data as Book;
  }
  const books = getLocalBooks();
  const old = books.find(b => b.id === book.id);
  if (book.id && !old) throw new Error('No se encuentra el libro local.');
  const saved = { ...old, ...book, id: book.id || crypto.randomUUID(), created_at: old?.created_at || now, updated_at: now } as Book;
  saveLocalBooks(old ? books.map(b => b.id === saved.id ? saved : b) : [saved, ...books]);
  return saved;
}
export async function deleteBook(id: string): Promise<void> {
  const remote = await destination();
  if (remote) {
    const { error } = await remote.client.from('books').delete().eq('id', id).eq('user_id', remote.user.id);
    if (error) throw error;
  } else saveLocalBooks(getLocalBooks().filter(b => b.id !== id));
}
export function getAnnualGoal(year = new Date().getFullYear()): number {
  const value = Number(localStorage.getItem('librarium_annual_goal_' + year) || (year === new Date().getFullYear() ? localStorage.getItem(LOCAL_STORAGE_GOAL) : null) || 20);
  return Number.isInteger(value) && value > 0 ? value : 20;
}
export async function fetchAnnualGoal(year: number): Promise<number> {
  const remote = await destination();
  if (!remote) return getAnnualGoal(year);
  const { data, error } = await remote.client.from('reading_goals').select('goal').eq('user_id', remote.user.id).eq('year', year).maybeSingle();
  if (error) throw error;
  return data?.goal || 20;
}
export async function setAnnualGoal(goal: number, year = new Date().getFullYear()) {
  if (!Number.isInteger(goal) || goal < 1 || goal > 500) throw new Error('El objetivo debe estar entre 1 y 500.');
  const remote = await destination();
  if (remote) {
    const { error } = await remote.client.from('reading_goals').upsert({ user_id: remote.user.id, year, goal });
    if (error) throw error;
  } else localStorage.setItem('librarium_annual_goal_' + year, String(goal));
}

export function filterBooksByPeriod(books: Book[], filter: ReadingPeriodFilter): Book[] {
  return books.filter(book => {
    // Only consider finished books when filtering by read dates
    if (book.status !== 'read') {
      return false;
    }

    if (!book.end_date) {
      return filter.type === 'all';
    }

    const endDate = new Date(book.end_date);
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth(); // 0 to 11

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (filter.type) {
      case 'all':
        return true;
      case 'this_year':
        return endYear === (filter.year || currentYear);
      case 'this_month':
        return endYear === currentYear && endMonth === currentMonth;
      case 'custom': {
        if (!filter.startDate && !filter.endDate) return true;
        const bookTime = endDate.getTime();
        const start = filter.startDate ? new Date(filter.startDate).getTime() : -Infinity;
        // Include the entire end date
        const end = filter.endDate ? new Date(filter.endDate + 'T23:59:59').getTime() : Infinity;
        return bookTime >= start && bookTime <= end;
      }
      default:
        return true;
    }
  });
}

export function calculateStats(books: Book[], filter: ReadingPeriodFilter, goal: number): UserStats {
  const filtered = filterBooksByPeriod(books, filter);

  const totalBooksRead = filtered.length;
  const totalPagesRead = filtered.reduce((acc, b) => acc + (b.page_count || 0), 0);

  // Ratings calculation
  const ratedBooks = filtered.filter(b => b.rating && b.rating > 0);
  const averageRating = ratedBooks.length > 0
    ? ratedBooks.reduce((acc, b) => acc + (b.rating || 0), 0) / ratedBooks.length
    : 0;

  const averagePagesPerBook = totalBooksRead > 0 ? Math.round(totalPagesRead / totalBooksRead) : 0;

  // Average days per book (for books with both start_date and end_date)
  let totalDays = 0;
  let booksWithDates = 0;

  filtered.forEach(b => {
    if (b.start_date && b.end_date) {
      const s = new Date(b.start_date).getTime();
      const e = new Date(b.end_date).getTime();
      const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
      totalDays += diff;
      booksWithDates++;
    }
  });

  const averageDaysPerBook = booksWithDates > 0 ? Math.round(totalDays / booksWithDates) : 0;

  // Annual goal: count books finished in the selected/current year
  const targetYear = new Date().getFullYear();
  const booksThisYear = books.filter(b => {
    if (b.status !== 'read' || !b.end_date) return false;
    return new Date(b.end_date).getFullYear() === targetYear;
  }).length;

  const annualGoalProgress = Math.min(100, Math.round((booksThisYear / (goal || 1)) * 100));

  const monthly = new Map<string, { books: number; pages: number }>();
  filtered.forEach(book => {
    if (!book.end_date) return;
    const key = book.end_date.slice(0, 7);
    const item = monthly.get(key) || { books: 0, pages: 0 };
    item.books++; item.pages += book.page_count; monthly.set(key, item);
  });
  const booksByMonth = [...monthly].sort(([a], [b]) => a.localeCompare(b)).map(([month, data]) => ({ month, ...data }));
  const sessions = books.flatMap(book => book.sessions || []).filter(session =>
    filterBooksByPeriod([{ status: 'read', end_date: session.date } as Book], filter).length > 0);
  const activityMap = new Map<string, number>();
  sessions.forEach(session => {
    const key = session.date.slice(0, 7);
    activityMap.set(key, (activityMap.get(key) || 0) + session.pages);
  });
  const weekly = new Map<string, number>();
  sessions.forEach(session => {
    const date = new Date(session.date + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay()+6)%7);
    const key = date.toISOString().slice(0,10);
    weekly.set(key, (weekly.get(key) || 0) + session.pages);
  });
  const weeklyActivity = [...weekly].sort(([a],[b])=>a.localeCompare(b)).map(([month,pages])=>({month,pages}));
  const activity = [...activityMap].sort(([a], [b]) => a.localeCompare(b)).map(([month, pages]) => ({ month, pages }));

  // Ratings distribution 1..5
  const ratingsMap: { [stars: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  filtered.forEach(b => {
    if (b.rating && b.rating >= 1 && b.rating <= 5) {
      ratingsMap[b.rating] = (ratingsMap[b.rating] || 0) + 1;
    }
  });

  const ratingsDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: ratingsMap[stars] || 0,
  }));

  return {
    totalBooksRead,
    totalPagesRead,
    averageRating: Math.round(averageRating * 10) / 10,
    averagePagesPerBook,
    averageDaysPerBook,
    annualBooksRead: booksThisYear,
    goalYear: targetYear,
    sessionPages: sessions.reduce((sum, s) => sum + s.pages, 0),
    sessionCount: sessions.length,
    activity, weeklyActivity,
    annualGoal: goal,
    annualGoalProgress,
    booksByMonth,
    ratingsDistribution,
  };
}
