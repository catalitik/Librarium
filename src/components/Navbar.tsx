import React from 'react';
import { BookOpen, BarChart3, BookmarkCheck, CalendarDays, Plus, Settings, User as UserIcon, LogOut, Cloud, HardDrive } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface NavbarProps {
  activeTab: 'library' | 'dashboard' | 'reading' | 'calendar';
  setActiveTab: (tab: 'library' | 'dashboard' | 'reading' | 'calendar') => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  currentUser: User | null;
  isCloudConnected: boolean;
  activeReadingCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenSettings,
  onOpenAuth,
  onLogout,
  currentUser,
  isCloudConnected,
  activeReadingCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('library')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white shadow-sm shadow-amber-900/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-stone-900 block leading-tight">
                Librarium
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Gestor de Lecturas
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/60">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <BookmarkCheck className="w-4 h-4 text-amber-600" />
              Mis Lecturas
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-600" />
              Estadísticas
            </button>

            <button
              onClick={() => setActiveTab('reading')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'reading'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              En Lectura
              {activeReadingCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-amber-600 rounded-full">
                  {activeReadingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'calendar' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'}`}
            >
              <CalendarDays className="w-4 h-4 text-amber-600" />
              Calendario
            </button>
          </nav>

          {/* Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status / User indicator */}
            {currentUser ? (
              <div
                onClick={onOpenSettings}
                title={`Conectado como ${currentUser.email}`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 cursor-pointer transition-colors"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate max-w-[130px] font-semibold">{currentUser.email}</span>
              </div>
            ) : null}

            {/* Add Book Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Añadir Lectura</span>
              <span className="sm:hidden">Añadir</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Configuración y Nube"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Auth Button */}
            {currentUser ? (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-stone-600 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-50 text-sm font-medium transition-colors cursor-pointer"
                title="Iniciar sesión en la nube"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden border-t border-stone-100 py-2 justify-around">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'library' ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-stone-600'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            Lecturas
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'dashboard' ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-stone-600'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('reading')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${
              activeTab === 'reading' ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-stone-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            En Lectura ({activeReadingCount})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg ${activeTab === 'calendar' ? 'bg-amber-50 text-amber-800 font-semibold' : 'text-stone-600'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Calendario
          </button>
        </div>
      </div>
    </header>
  );
};
