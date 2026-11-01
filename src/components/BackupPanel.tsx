import { useState } from 'react';
import { Book } from '../types/book';
import { getLocalBooks } from '../services/storage';
import { importBooks, mergeBooks, parseBackup } from '../services/library';
export function BackupPanel({ books, cloud, onRefresh }: { books: Book[]; cloud: boolean; onRefresh: () => void }) {
 const [incoming,setIncoming] = useState<Book[] | null>(null);
 const [mode,setMode] = useState<'merge'|'replace'>('merge');
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState('');
 const load = (value: unknown) => { try { setIncoming(parseBackup(value)); setMessage(''); } catch(e) {setIncoming(null);setMessage((e as Error).message);} };
 const confirm = async () => { if (!incoming) return; setBusy(true); try { const count = await importBooks(incoming,mode); setIncoming(null); setMessage('Biblioteca guardada: '+count+' libros.'); onRefresh(); } catch(e) {setMessage('No se ha importado: '+(e as Error).message);} finally {setBusy(false);} };
 return <section className="space-y-3 border-t pt-4">
 <h3 className="font-semibold">Copias y traslado de biblioteca</h3>
 <p className="text-sm">Destino: {cloud ? 'tu cuenta en la nube' : 'este navegador'}. Las sesiones se incluyen en la copia.</p>
 <div className="flex flex-wrap gap-3">
 <button type="button" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:2,books},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='librarium.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}>Descargar copia</button>
 <label className="cursor-pointer">Abrir copia JSON<input aria-label="Abrir copia JSON" type="file" accept=".json" disabled={busy} className="block text-xs" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{load(JSON.parse(await file.text()));}catch{setMessage('No se pudo leer el JSON.');}e.target.value='';}} /></label>
 {cloud && <button type="button" disabled={busy} onClick={()=>{setMode('merge');load(getLocalBooks().filter(b=>!b.id.startsWith('demo-')));}}>Trasladar libros locales a mi cuenta</button>}
 </div>
 {incoming && <div className="rounded-xl bg-amber-50 p-4 space-y-3">
 <p>{incoming.length} libros en el archivo · {incoming.length-(mergeBooks(books,incoming).length-books.length)} duplicados al combinar.</p>
 <label>Acción <select value={mode} disabled={busy} onChange={e=>setMode(e.target.value as 'merge'|'replace')}><option value="merge">Combinar y conservar los existentes</option><option value="replace">Sustituir toda la biblioteca del destino</option></select></label>
 <p>Resultado: {mergeBooks(mode==='merge'?books:[],incoming).length} libros. {mode==='replace' && 'Los libros actuales del destino se sustituirán.'}</p>
 <ul className="max-h-32 overflow-auto text-sm">{incoming.map(b=><li key={b.id}>{b.title} — {b.authors.join(', ')}</li>)}</ul>
 <button type="button" disabled={busy} onClick={confirm}>{busy?'Guardando…':'Confirmar importación'}</button> <button type="button" disabled={busy} onClick={()=>setIncoming(null)}>Cancelar</button>
 </div>}
 {message && <p role="status" className="text-sm">{message}</p>}
 </section>;
}
