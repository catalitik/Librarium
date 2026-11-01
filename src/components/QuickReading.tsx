import { useState } from 'react';
import { Book } from '../types/book';
import { today } from '../services/library';
export function QuickReading({book,onSave}:{book:Book;onSave:(book:Book)=>Promise<void>}) {
 const [page,setPage]=useState(book.pages_read || 0);
 const [date,setDate]=useState(today());
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const run=async(action:'start'|'session'|'finish')=>{
  setError('');setBusy(true);
  try {
   if (!date || date>today() || (book.start_date && date<book.start_date)) throw new Error('Revisa la fecha de la sesión.');
   if(action==='session' && (!Number.isInteger(page) || page <= (book.pages_read||0) || (book.page_count>0 && page>book.page_count))) throw new Error('La página debe avanzar sin superar el total. Para corregirla, usa Editar.');
   const next={...book};
   if(action==='start'){next.status='reading';next.start_date=today();next.end_date=null;}
   if(action==='session'){next.pages_read=page;next.sessions=[...(book.sessions||[]),{id:crypto.randomUUID(),date,pages:page-(book.pages_read||0)}];}
   if(action==='finish'){next.status='read';next.end_date=today();next.pages_read=book.page_count;}
   await onSave(next);
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 return <div className="px-4 py-3 border-t space-y-2 text-xs">
 <div className="flex flex-wrap gap-2 items-end">
 {book.status==='want_to_read' && <button disabled={busy} onClick={()=>run('start')}>Empezar hoy</button>}
 {book.status==='reading' && <>
 <label>Página actual<input className="block border rounded p-1 w-20" type="number" min={(book.pages_read||0)+1} max={book.page_count||undefined} value={page} onChange={e=>setPage(Number(e.target.value))}/></label>
 <label>Fecha<input className="block border rounded p-1" type="date" max={today()} min={book.start_date||undefined} value={date} onChange={e=>setDate(e.target.value)}/></label>
 <button disabled={busy} onClick={()=>run('session')}>Guardar sesión</button>
 <button disabled={busy} onClick={()=>run('finish')}>Terminar hoy</button>
 </>}
 </div>
 {book.status==='reading' && <p className="text-stone-500">Registra el avance antes de terminar para incluirlo en la actividad.</p>}
 {!!book.sessions?.length && <details><summary>{book.sessions.length} sesiones registradas</summary><ul>{[...book.sessions].sort((a,b)=>b.date.localeCompare(a.date)).map(s=><li key={s.id}>{s.date}: {s.pages} páginas</li>)}</ul></details>}
 {error && <p role="alert" className="text-red-700">{error}</p>}
 </div>;
}
