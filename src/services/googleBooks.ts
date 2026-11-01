import { GoogleBookItem } from '../types/book';

export interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  cover_url: string;
  page_count: number;
  published_date: string;
  description: string;
  isbn?: string;
  publisher?: string;
  language?: string;
  categories: string[];
  source?: 'Google Books' | 'Open Library';
}

const STORAGE_GOOGLE_KEY = 'librarium_google_api_key';

export function getGoogleApiKey(): string {
  return localStorage.getItem(STORAGE_GOOGLE_KEY) || import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '';
}

export function saveGoogleApiKey(key: string) {
  if (key) localStorage.setItem(STORAGE_GOOGLE_KEY, key.trim());
  else localStorage.removeItem(STORAGE_GOOGLE_KEY);
}

/**
 * Searches Open Library API (100% free, open, and no API key required)
 */
export async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const encoded = encodeURIComponent(query.trim());
  const fields = 'title,author_name,cover_i,first_publish_year,number_of_pages_median,isbn,subject,publisher,language';
  const pages = await Promise.allSettled([0, 20].map(async offset => {
    const url = `https://openlibrary.org/search.json?q=${encoded}&fields=${fields}&limit=20&offset=${offset}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error en Open Library API (${response.status})`);
    const data = await response.json();
    return Array.isArray(data.docs) ? data.docs : [];
  }));

  if (pages.every(page => page.status === 'rejected')) throw new Error('Open Library no disponible');
  return pages.flatMap(page => page.status === 'fulfilled' ? page.value : []).map((doc: any, index: number): BookSearchResult => {
    let coverUrl = '';
    if (doc.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    } else if (doc.isbn && doc.isbn.length > 0) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
    }

    const firstIsbn = doc.isbn && doc.isbn.length > 0 ? doc.isbn[0] : undefined;

    return {
      id: `openlib-${doc.cover_i || doc.title}-${index}`,
      title: doc.title || 'Título desconocido',
      authors: doc.author_name && doc.author_name.length > 0 ? doc.author_name : ['Autor desconocido'],
      cover_url: coverUrl,
      page_count: doc.number_of_pages_median || 0,
      published_date: doc.first_publish_year ? String(doc.first_publish_year) : '',
      description: doc.subject && Array.isArray(doc.subject) ? doc.subject.slice(0, 4).join(', ') : '',
      isbn: firstIsbn,
      categories: doc.subject && Array.isArray(doc.subject) ? doc.subject.slice(0, 3) : [],
      source: 'Open Library',
    };
  });
}

/**
 * Searches Google Books API
 */
export async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const encoded = encodeURIComponent(query.trim());
  const apiKey = getGoogleApiKey();
  const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
  const pages = await Promise.allSettled([0, 40].map(async startIndex => {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=40&startIndex=${startIndex}&printType=books${keyParam}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Google Books API HTTP ${response.status}`);
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
  }));

  if (pages.every(page => page.status === 'rejected')) throw new Error('Google Books no disponible');
  return pages.flatMap(page => page.status === 'fulfilled' ? page.value : []).map((item: GoogleBookItem): BookSearchResult => {
    const info = item.volumeInfo || {};
    
    let coverUrl = '';
    if (info.imageLinks) {
      coverUrl = (
        info.imageLinks.extraLarge ||
        info.imageLinks.large ||
        info.imageLinks.medium ||
        info.imageLinks.thumbnail ||
        info.imageLinks.smallThumbnail ||
        ''
      );
    }

    if (coverUrl) {
      coverUrl = coverUrl.replace(/^http:\/\//i, 'https://');
      coverUrl = coverUrl.replace(/&edge=curl/g, '');
    }

    let isbn: string | undefined;
    if (info.industryIdentifiers && info.industryIdentifiers.length > 0) {
      const isbn13 = info.industryIdentifiers.find(i => i.type === 'ISBN_13');
      const isbn10 = info.industryIdentifiers.find(i => i.type === 'ISBN_10');
      isbn = isbn13 ? isbn13.identifier : isbn10 ? isbn10.identifier : info.industryIdentifiers[0].identifier;
    }

    return {
      publisher: info.publisher,
      language: info.language,
      id: item.id,
      title: info.title || 'Título desconocido',
      authors: info.authors && info.authors.length > 0 ? info.authors : ['Autor desconocido'],
      cover_url: coverUrl,
      page_count: info.pageCount || 0,
      published_date: info.publishedDate || '',
      description: info.description || '',
      isbn,
      categories: info.categories || [],
      source: 'Google Books',
    };
  });
}

/**
 * Smart Hybrid Search:
 * Tries Google Books first. If Google Books is rate-limited (HTTP 429) or fails,
 * seamlessly falls back to Open Library so the user always gets results with covers & pages!
 */
export async function searchBooks(query: string): Promise<{ results: BookSearchResult[]; provider: string }> {
  if (!query.trim()) return { results: [], provider: 'none' };

  const [google, openLibrary] = await Promise.allSettled([
    searchGoogleBooks(query),
    searchOpenLibrary(query),
  ]);
  const googleResults = google.status === 'fulfilled' ? google.value : [];
  const openLibraryResults = openLibrary.status === 'fulfilled' ? openLibrary.value : [];

  if (google.status === 'rejected') console.warn('Google Books no disponible:', google.reason);
  if (openLibrary.status === 'rejected') console.warn('Open Library no disponible:', openLibrary.reason);
  if (google.status === 'rejected' && openLibrary.status === 'rejected') {
    throw new Error('No se pudo conectar con Google Books ni Open Library. Revisa tu conexión e inténtalo de nuevo.');
  }

  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizeIsbn = (value: string) => value.replace(/[^0-9X]/gi, '').toUpperCase();
  const seen = new Set<string>();
  const results = [...googleResults, ...openLibraryResults].filter(book => {
    const isbn = normalizeIsbn(book.isbn || '');
    const identity = isbn ? `isbn:${isbn}` : `${normalize(book.title)}:${normalize(book.authors.join(' '))}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });

  return { results, provider: googleResults.length && openLibraryResults.length ? 'Google Books + Open Library' : googleResults.length ? 'Google Books' : 'Open Library' };
}
