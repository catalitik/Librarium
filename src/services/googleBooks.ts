import { GoogleBookItem } from '../types/book';

export type BookSource = 'Google Books' | 'Open Library' | 'Internet Archive';
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
  source?: BookSource;
}

const STORAGE_GOOGLE_KEY = 'librarium_google_api_key';
const fields = 'title,author_name,cover_i,first_publish_year,number_of_pages_median,isbn,subject,publisher,language';

export function getGoogleApiKey(): string {
  return localStorage.getItem(STORAGE_GOOGLE_KEY) || import.meta.env.VITE_GOOGLE_BOOKS_API_KEY || '';
}
export function saveGoogleApiKey(key: string) {
  if (key) localStorage.setItem(STORAGE_GOOGLE_KEY, key.trim());
  else localStorage.removeItem(STORAGE_GOOGLE_KEY);
}

async function getJson(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
const cleanIsbn = (query: string) => query.replace(/[^\dXx]/g, '').toUpperCase();
const isbnQuery = (query: string) => {
  const isbn = cleanIsbn(query.trim());
  return /^\d{13}$/.test(isbn) || /^\d{9}[\dX]$/.test(isbn);
};
const list = (value: unknown): string[] => Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : typeof value === 'string' ? [value] : [];

async function searchOpenLibraryQuery(url: string): Promise<BookSearchResult[]> {
  const data = await getJson(url);
  return (Array.isArray(data.docs) ? data.docs : []).map((doc: any, index: number): BookSearchResult => {
    const isbns = list(doc.isbn);
    return {
      id: `openlib-${doc.key || doc.cover_i || doc.title}-${index}`,
      title: doc.title || 'Título desconocido',
      authors: list(doc.author_name).length ? list(doc.author_name) : ['Autor desconocido'],
      cover_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : isbns[0] ? `https://covers.openlibrary.org/b/isbn/${isbns[0]}-L.jpg` : '',
      page_count: Number(doc.number_of_pages_median) || 0,
      published_date: doc.first_publish_year ? String(doc.first_publish_year) : '',
      description: list(doc.subject).slice(0, 4).join(', '),
      isbn: isbns.find(isbn => isbn.length === 13) || isbns[0],
      publisher: list(doc.publisher)[0],
      language: list(doc.language)[0],
      categories: list(doc.subject).slice(0, 5),
      source: 'Open Library',
    };
  });
}

export async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const q = encodeURIComponent(query.trim());
  const requests = isbnQuery(query)
    ? [`https://openlibrary.org/search.json?isbn=${encodeURIComponent(cleanIsbn(query))}&fields=${fields}&limit=40`]
    : [
        `https://openlibrary.org/search.json?q=${q}&fields=${fields}&limit=40`,
        `https://openlibrary.org/search.json?title=${q}&fields=${fields}&limit=25`,
        `https://openlibrary.org/search.json?author=${q}&fields=${fields}&limit=15`,
      ];
  const results = await Promise.allSettled(requests.map(searchOpenLibraryQuery));
  if (results.every(result => result.status === 'rejected')) throw new Error('Open Library no disponible');
  return results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
}

async function searchGoogleQuery(query: string, startIndex: number): Promise<GoogleBookItem[]> {
  const params = new URLSearchParams({ q: query, maxResults: '40', startIndex: String(startIndex), printType: 'books' });
  const key = getGoogleApiKey();
  if (key) params.set('key', key);
  const data = await getJson(`https://www.googleapis.com/books/v1/volumes?${params}`);
  return Array.isArray(data.items) ? data.items : [];
}

function mapGoogleItem(item: GoogleBookItem): BookSearchResult {
  const info = item.volumeInfo || {};
  const cover = info.imageLinks?.extraLarge || info.imageLinks?.large || info.imageLinks?.medium || info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
  const identifiers = info.industryIdentifiers || [];
  const isbn = identifiers.find(id => id.type === 'ISBN_13') || identifiers.find(id => id.type === 'ISBN_10') || identifiers[0];
  return {
    id: item.id, title: info.title || 'Título desconocido',
    authors: info.authors?.length ? info.authors : ['Autor desconocido'],
    cover_url: cover.replace(/^http:\/\//i, 'https://').replace(/&edge=curl/g, ''),
    page_count: info.pageCount || 0, published_date: info.publishedDate || '',
    description: info.description || '', isbn: isbn?.identifier,
    publisher: info.publisher, language: info.language,
    categories: info.categories || [], source: 'Google Books',
  };
}

export async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const words = query.trim().split(/\s+/).filter(Boolean);
  const searches = isbnQuery(query)
    ? [`isbn:${cleanIsbn(query)}`]
    : [query.trim(), words.length <= 3 ? `inauthor:${query.trim()}` : `intitle:${query.trim()}`];
  // Keep requests low while choosing the targeted search that fits the query.
  const requests = await Promise.allSettled(searches.map(search => searchGoogleQuery(search, 0)));
  if (requests.every(result => result.status === 'rejected')) {
    const failure = requests.find(result => result.status === 'rejected');
    throw new Error(`Google Books: ${failure?.status === 'rejected' ? failure.reason?.message || 'sin respuesta' : 'no disponible'}`);
  }
  return requests.flatMap(result => result.status === 'fulfilled' ? result.value.map(mapGoogleItem) : []);
}

/** Internet Archive adds a separate catalogue of digitized and historic books. */
export async function searchInternetArchive(query: string): Promise<BookSearchResult[]> {
  if (isbnQuery(query)) return [];
  const terms = query.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  const escaped = terms.map(term => `"${term.replace(/[+\-&|!(){}\[\]^"~*?:\\/]/g, ' ')}"`).join(' AND ');
  const params = new URLSearchParams();
  params.set('q', `mediatype:texts AND (title:(${escaped}) OR creator:(${escaped}))`);
  params.set('fl[]', 'identifier,title,creator,year,date,publisher,language,isbn,description,imagecount');
  params.set('rows', '30');
  params.set('page', '1');
  params.set('output', 'json');
  const data = await getJson(`https://archive.org/advancedsearch.php?${params}`);
  const docs = Array.isArray(data.response?.docs) ? data.response.docs : [];
  return docs.map((doc: any): BookSearchResult => {
    const identifier = String(doc.identifier || '');
    const language = list(doc.language)[0];
    return {
      id: `archive-${identifier}`, title: doc.title || 'Título desconocido',
      authors: list(doc.creator).length ? list(doc.creator) : ['Autor desconocido'],
      cover_url: identifier ? `https://archive.org/services/img/${encodeURIComponent(identifier)}` : '',
      page_count: Number(doc.imagecount) || 0,
      published_date: String(doc.date || doc.year || ''), description: list(doc.description).join(' ').slice(0, 500),
      isbn: list(doc.isbn)[0], publisher: list(doc.publisher)[0], language,
      categories: [], source: 'Internet Archive',
    };
  });
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const wordsForSearch = (value: string): string[] => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+/g) || [];
const normalizeIsbn = (value: string) => value.replace(/[^0-9X]/gi, '').toUpperCase();
function mergeResults(groups: BookSearchResult[][], query: string) {
  const byIdentity = new Map<string, BookSearchResult>();
  const queryTerms = wordsForSearch(query).filter(term => term.length > 1);
  for (const book of groups.flat()) {
    if (!book.title || book.title === 'Título desconocido') continue;
    const isbn = normalizeIsbn(book.isbn || '');
    const identity = isbn ? `isbn:${isbn}` : `${normalize(book.title)}:${normalize(book.authors.join(' '))}`;
    const old = byIdentity.get(identity);
    if (!old) { byIdentity.set(identity, book); continue; }
    const preferred = book.source === 'Google Books' ? book : old;
    byIdentity.set(identity, {
      ...preferred,
      cover_url: preferred.cover_url || book.cover_url,
      description: preferred.description || book.description,
      page_count: preferred.page_count || book.page_count,
      published_date: preferred.published_date || book.published_date,
      isbn: preferred.isbn || book.isbn,
      publisher: preferred.publisher || book.publisher,
      language: preferred.language || book.language,
      categories: preferred.categories.length ? preferred.categories : book.categories,
      source: preferred.source,
    });
  }
  return [...byIdentity.values()].map((book, index) => {
    const titleTerms = wordsForSearch(book.title);
    const authorTerms = wordsForSearch(book.authors.join(' '));
    const matchedTerms = isbnQuery(query)
      ? (normalizeIsbn(book.isbn || '') === normalizeIsbn(query) ? queryTerms : [])
      : queryTerms.filter(term => titleTerms.includes(term) || authorTerms.includes(term));
    const score = matchedTerms.reduce((sum, term) => sum + (titleTerms.includes(term) ? 4 : authorTerms.includes(term) ? 2 : 0), 0)
      + (book.cover_url ? 1 : 0) + (book.isbn ? 1 : 0) + (book.page_count ? 0.5 : 0);
    const coverage = queryTerms.length ? matchedTerms.length / queryTerms.length : 0;
    return { book, index, score, coverage, matches: matchedTerms.length };
  }).filter(item => isbnQuery(query)
    ? item.coverage === 1
    : item.coverage >= 0.5 && (queryTerms.length < 3 || item.matches >= 2))
    .sort((a, b) => b.coverage - a.coverage || b.score - a.score || a.index - b.index)
    .map(({ book }) => book);
}

export async function searchBooks(query: string): Promise<{ results: BookSearchResult[]; provider: string; unavailable: string[] }> {
  if (!query.trim()) return { results: [], provider: 'none', unavailable: [] };
  const sources = await Promise.allSettled([searchGoogleBooks(query), searchOpenLibrary(query), searchInternetArchive(query)]);
  const names = ['Google Books', 'Open Library', 'Internet Archive'];
  const groups = sources.map(result => result.status === 'fulfilled' ? result.value : []);
  sources.forEach((result, index) => { if (result.status === 'rejected') console.warn(`${names[index]} no disponible:`, result.reason); });
  if (sources.every(result => result.status === 'rejected')) throw new Error('No se pudo conectar con los catálogos. Revisa tu conexión e inténtalo de nuevo.');
  const available = sources.flatMap((result, index) => result.status === 'fulfilled' ? [names[index]] : []);
  const unavailable = sources.flatMap((result, index) => result.status === 'rejected'
    ? [`${names[index]}: ${result.reason?.message || 'no disponible'}`]
    : []);
  return { results: mergeResults(groups, query), provider: available.join(' + ') || 'Sin resultados', unavailable };
}
