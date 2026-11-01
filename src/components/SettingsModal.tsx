import { BackupPanel } from './BackupPanel';
import React, { useState } from 'react';
import { getSupabase } from '../services/supabase';
import { getGoogleApiKey, saveGoogleApiKey } from '../services/googleBooks';
import { Book } from '../types/book';
import { saveLocalBooks } from '../services/storage';
import { User } from '@supabase/supabase-js';
import {
  X,
  Settings,
  Check,
  Download,
  Upload,
  Cloud,
  Key,
  ShieldCheck,
  User as UserIcon,
  LogOut,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  books: Book[];
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  books,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const [googleKey, setGoogleKey] = useState(getGoogleApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveGoogleApiKey(googleKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefresh();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(books, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mis_lecturas_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          saveLocalBooks(json);
          onRefresh();
          alert(`¡${json.length} libros importados correctamente!`);
        } else {
          alert('El archivo no contiene un formato de lista válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const isConnected = !!getSupabase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Ajustes & Sincronización</h2>
              <p className="text-xs text-stone-500">
                Estado de la cuenta y copia de seguridad
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Cloud Database & Account Status */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-5 h-5 text-amber-700 flex-shrink-0" />
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Base compartida de Librarium
                </span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'
              }`}>
                  {isConnected ? '✓ Conectada' : 'Sin configurar'}
              </span>
            </div>

            {currentUser ? (
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-stone-500" />
                  <span className="text-xs font-semibold text-stone-800">
                    {currentUser.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="pt-1 flex items-center justify-between">
                <p className="text-xs text-stone-600">
                  Inicia sesión para sincronizar tus lecturas en la base compartida de Librarium. No necesitas crear un proyecto Supabase.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors cursor-pointer flex-shrink-0"
                >
                  Entrar / Registrarse
                </button>
              </div>
            )}
          </div>

          {/* Search Options (Optional Google Books Key) */}
          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Clave de Google Books (Opcional)
              </h3>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              El buscador consulta Google Books, Open Library e Internet Archive en paralelo. Google Books realiza una búsqueda general y otra por título; una clave API opcional puede aumentar los límites de consulta.
            </p>
            <input
              type="password"
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              placeholder="AIzaSy... (opcional)"
              className="w-full px-3.5 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> ¡Ajustes guardados!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>

          <BackupPanel books={books} cloud={!!currentUser} onRefresh={onRefresh} />
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
