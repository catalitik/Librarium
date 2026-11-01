import { Book } from '../types/book';
import { getSupabase } from './supabase';
import { fetchBooks, saveLocalBooks } from './storage';
export const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
export function duplicate(a: Partial<Book>, b: Partial<Book>) {
  if (a.isbn && b.isbn) return norm(a.isbn) === norm(b.isbn);
  return norm(a.title || '') === norm(b.title || '') && norm((a.authors || []).join(' ')) === norm((b.authors || []).join(' '));
}
export function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function parseBackup(value: unknown): Book[] {
  const rows = Array.isArray(value) ? value : (value as { books?: unknown })?.books;
  if (!Array.isArray(rows)) throw new Error('El archivo debe contener una lista de libros.');
  return rows.map((row, i) => {
    const fail = () => { throw new Error('Libro ' + (i+1) + ': datos inválidos. Revisa título, autores, fechas, páginas y sesiones.'); };
    if (!row || typeof row !== 'object') return fail();
    const b = row as Book;
    if (typeof b.title !== 'string' || !b.title.trim() || !Array.isArray(b.authors) || !b.authors.every(a=>typeof a==='string') || !['read','reading','want_to_read'].includes(b.status) || !Number.isInteger(b.page_count) || b.page_count < 0) return fail();
    if (b.rating != null && (!Number.isInteger(b.rating) || b.rating < 1 || b.rating > 5)) return fail();
    if ([b.start_date,b.end_date].some(d=>d != null && d !== '' && !validDate(d)) || (b.start_date && b.end_date && b.start_date > b.end_date)) return fail();
    if (b.pages_read != null && (!Number.isInteger(b.pages_read) || b.pages_read < 0 || (b.page_count > 0 && b.pages_read > b.page_count))) return fail();
    for (const key of ['cover_url','published_date','description','isbn','notes','publisher','language'] as const) if (b[key] != null && typeof b[key] !== 'string') return fail();
    if (b.categories != null && (!Array.isArray(b.categories) || !b.categories.every(c=>typeof c==='string'))) return fail();
    if (b.sessions != null && (!Array.isArray(b.sessions) || !b.sessions.every(s=>s && validDate(s.date) && Number.isInteger(s.pages) && s.pages > 0))) return fail();
    const now = new Date().toISOString();
    return { id: crypto.randomUUID(), title:b.title.trim(), authors:b.authors, status:b.status, page_count:b.page_count, cover_url:b.cover_url || '', published_date:b.published_date || '', description:b.description || '', isbn:b.isbn || '', publisher:b.publisher || '', language:b.language || '', notes:b.notes || '', categories:b.categories || [], start_date:b.start_date || null,end_date:b.end_date || null,rating:b.rating ?? null,pages_read:b.pages_read || 0,sessions:(b.sessions || []).map(s=>({...s,id:crypto.randomUUID()})),created_at:now,updated_at:now };
  });
}
export function mergeBooks(existing: Book[], incoming: Book[]) {
  const result = [...existing];
  incoming.forEach(b => { if (!result.some(old=>duplicate(old,b))) result.push(b); });
  return result;
}
export async function importBooks(incoming: Book[], mode: 'merge' | 'replace') {
  const { books, isCloud } = await fetchBooks();
  const merged = mergeBooks(mode === 'merge' ? books : [], incoming);
  if (isCloud) {
    const { error } = await getSupabase()!.rpc('replace_my_library', { payload: merged });
    if (error) throw error;
  } else saveLocalBooks(merged);
  return merged.length;
}
