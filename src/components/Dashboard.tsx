import React, { useState } from 'react';
import { UserStats, ReadingPeriodFilter } from '../types/book';
import { BookOpen, FileText, Award, Calendar, Star, TrendingUp, Sparkles, Target, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardProps {
  stats: UserStats;
  filter: ReadingPeriodFilter;
  onFilterChange: (filter: ReadingPeriodFilter) => void;
  onUpdateGoal: (newGoal: number) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  filter,
  onFilterChange,
  onUpdateGoal,
}) => {
  const [activityPeriod, setActivityPeriod] = useState('month');
  const [goalError, setGoalError] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(stats.annualGoal.toString());

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goalInput, 10);
    if (val && val > 0) {
      setSavingGoal(true); setGoalError('');
      try { await onUpdateGoal(val); } catch (e) { setGoalError((e as Error).message); return; } finally { setSavingGoal(false); }
      setIsEditingGoal(false);
      if (stats.annualBooksRead >= val) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  const triggerCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Top Banner / Goal Section */}
      <div className="bg-gradient-to-br from-amber-900 via-stone-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold mb-3">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Reto de Lectura Anual {stats.goalYear}
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              {stats.annualBooksRead >= stats.annualGoal ? (
                <span className="flex items-center gap-2 text-amber-300">
                  ¡Meta alcanzada! 🎉
                </span>
              ) : (
                `Has leído ${stats.annualBooksRead} de tu meta de ${stats.annualGoal} libros`
              )}
            </h2>

            <p className="text-stone-300 text-sm mt-1.5 leading-relaxed">
              {stats.annualGoalProgress >= 100
                ? '¡Felicidades! Has completado tu reto de lectura de este año. Puedes ampliar tu meta si quieres seguir superándote.'
                : `Estás al ${stats.annualGoalProgress}% de tu objetivo para este año. ¡Sigue disfrutando de tus lecturas!`}
            </p>

            {goalError && <p role="alert">{goalError}</p>}
            {/* Edit Goal inline */}
            <div className="mt-4 flex items-center gap-3">
              {isEditingGoal ? (
                <form onSubmit={handleSaveGoal} className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="w-20 px-2.5 py-1 text-sm bg-white/10 border border-white/20 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={savingGoal}
                    className="px-3 py-1 text-xs font-semibold bg-amber-500 text-stone-900 rounded-lg hover:bg-amber-400 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="text-xs text-stone-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setGoalInput(stats.annualGoal.toString());
                    setIsEditingGoal(true);
                  }}
                  className="text-xs font-semibold text-amber-300 hover:text-amber-200 underline decoration-dotted underline-offset-4"
                >
                  Cambiar objetivo ({stats.annualGoal} libros)
                </button>
              )}

              {stats.annualBooksRead >= stats.annualGoal && (
                <button
                  type="button"
                  onClick={triggerCelebrate}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-amber-400/20 text-amber-300 rounded-full hover:bg-amber-400/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Celebrar
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar & Percentage */}
          <div className="w-full lg:w-72 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs flex flex-col justify-center">
            <div className="flex items-end justify-between mb-2">
              <span className="text-xs text-stone-300 font-medium">Progreso Anual</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {stats.annualGoalProgress}%
              </span>
            </div>

            <div className="w-full bg-stone-800 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, stats.annualGoalProgress)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-stone-400 mt-2">
              <span>{stats.annualBooksRead} leídos</span>
              <span>
                {Math.max(0, stats.annualGoal - stats.annualBooksRead)} restantes
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-2xl p-5 border space-y-3">
        <h3 className="font-semibold">Actividad registrada en el periodo</h3><label>Agrupar por <select value={activityPeriod} onChange={e=>setActivityPeriod(e.target.value)}><option value="month">Mes</option><option value="week">Semana (desde el lunes)</option></select></label>
        <p>{stats.sessionPages} páginas en {stats.sessionCount} sesiones. Solo incluye avances registrados; no atribuye todo el libro al día de finalización.</p>
        {stats.activity.length ? <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={activityPeriod === 'month' ? stats.activity : stats.weeklyActivity}><XAxis dataKey="month"/><YAxis/><Tooltip/><Bar dataKey="pages" name="Páginas de sesiones" fill="#d97706"/></BarChart></ResponsiveContainer></div> : <p>Añade tu primera sesión desde una lectura en curso.</p>}
      </section>
      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Books */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Libros leídos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-stone-900 font-mono">
                {stats.totalBooksRead}
              </span>
              <span className="text-xs text-stone-400">en el periodo</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Pages */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Páginas leídas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-stone-900 font-mono">
                {stats.totalPagesRead.toLocaleString('es-ES')}
              </span>
              <span className="text-xs text-stone-400">páginas</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Reading Pace (Days per book) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Ritmo promedio</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-stone-900 font-mono">
                {stats.averageDaysPerBook > 0 ? stats.averageDaysPerBook : '—'}
              </span>
              <span className="text-xs text-stone-400">días / libro</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Average Rating */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium block">Valoración media</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-stone-900 font-mono">
                {stats.averageRating > 0 ? stats.averageRating : '—'}
              </span>
              <span className="text-xs text-stone-400">/ 5 estrellas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Books & Pages read by month (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">Lecturas por mes</h3>
              <p className="text-xs text-stone-500">
                Distribución de libros y páginas terminadas a lo largo del año
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-stone-700">
                <span className="w-3 h-3 rounded-sm bg-amber-600 inline-block" />
                Libros
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.booksByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ece6" />
                <XAxis dataKey="month" stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#a8a29e" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#fef3c7', opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white px-3 py-2 rounded-xl text-xs shadow-lg space-y-1">
                          <p className="font-bold text-amber-300">{data.month}</p>
                          <p>{data.books} {data.books === 1 ? 'libro' : 'libros'} leídos</p>
                          <p className="text-stone-300">{data.pages} páginas</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="books" fill="#d97706" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ratings Breakdown (1 col) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">Distribución de valoraciones</h3>
                <p className="text-xs text-stone-500">Tus notas a los libros leídos</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {stats.ratingsDistribution.map((item) => {
                const totalRated = stats.ratingsDistribution.reduce((acc, curr) => acc + curr.count, 0);
                const percent = totalRated > 0 ? Math.round((item.count / totalRated) * 100) : 0;

                return (
                  <div key={item.stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12 text-xs font-semibold text-stone-700">
                      <span>{item.stars}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>

                    <div className="flex-1 bg-stone-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <span className="w-8 text-right text-xs font-mono font-medium text-stone-500">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
            <span>Páginas de media por libro:</span>
            <span className="font-bold text-stone-800 font-mono">
              {stats.averagePagesPerBook > 0 ? `${stats.averagePagesPerBook} págs.` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
