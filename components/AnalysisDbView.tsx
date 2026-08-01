import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Database, Calendar, Beaker, ChevronRight, ClipboardList, Trash2, Copy, Search, X, Settings2 } from 'lucide-react';
import { AnalysisSession, AnalysisItem, COMMON_EXAMS } from '../types';
import ScrollingName from './ScrollingName';

interface AnalysisDbViewProps {
  onNavigate: (view: any) => void;
  onBack: () => void;
  activePatientName: string;
  sessions: AnalysisSession[];
  items: AnalysisItem[];
  onDeleteSession: (id: string) => void;
  onSelectSession: (session: AnalysisSession) => void;
  onDuplicateSession: (id: string) => void;
  onManageNames: () => void;
}

// Componente autocomplete per la ricerca
const SearchAutocomplete: React.FC<{
  value: string;
  suggestions: string[];
  onChange: (val: string) => void;
  onClear: () => void;
}> = ({ value, suggestions, onChange, onClear }) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value || value.length < 1) return [];
    return suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 10);
  }, [value, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); onChange(filtered[highlighted]); setOpen(false); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={16} className="text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => { if (value.length >= 1) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Cerca Analisi (es. PSA, Glicemia...)"
        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-800 dark:text-white"
      />
      {value && (
        <button
          onClick={() => { onClear(); setOpen(false); }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
        >
          <X size={16} />
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute left-0 top-full mt-1 z-[200] w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {filtered.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${
                i === highlighted
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{s}</span>
                <ChevronRight size={14} className="opacity-30" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Controlla se il valore è fuori range
const getRangeStatus = (value: string, min?: string, max?: string): 'out' | 'in' | 'none' => {
  const cleanNum = (s: string) => {
    if (!s) return NaN;
    const matched = s.replace(',', '.').match(/[-+]?[0-9]*\.?[0-9]+/);
    return matched ? parseFloat(matched[0]) : NaN;
  };

  const v = cleanNum(value);
  if (isNaN(v)) return 'none';

  const minN = min ? cleanNum(min) : NaN;
  const maxN = max ? cleanNum(max) : NaN;

  if (isNaN(minN) && isNaN(maxN)) return 'none';

  if (!isNaN(minN) && v < minN) return 'out';
  if (!isNaN(maxN) && v > maxN) return 'out';

  return 'in';
};

const AnalysisDbView: React.FC<AnalysisDbViewProps> = ({
  activePatientName,
  sessions,
  items,
  onDeleteSession,
  onSelectSession,
  onDuplicateSession,
  onManageNames
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const suggestionList = useMemo(() => {
    const historicalNames = items.map(i => i.name);
    return Array.from(new Set([...COMMON_EXAMS, ...historicalNames])).sort();
  }, [items]);

  // Ordina le sessioni per data (dalla più recente)
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  // Prepara la lista degli esami filtrati se c'è una ricerca attiva
  const searchedItems = useMemo(() => {
    if (searchQuery.trim() === '') return [];
    const query = searchQuery.toLowerCase();
    
    const matched = items.filter(it => it.name.toLowerCase().includes(query));
    
    const withSessionData = matched.map(item => {
      const session = sessions.find(s => s.id === item.sessionId);
      return {
        ...item,
        sessionDate: session ? session.date : '',
        sessionObj: session
      };
    });
    
    return withSessionData.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [items, sessions, searchQuery]);

  // Formatta la data come GG/MM/AAAA
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 relative">
      
      {/* TESTATA INTERNA FISSA (Paziente e Ricerca) */}
      <div className="fixed top-[4rem] left-0 right-0 z-30 bg-background/95 dark:bg-dark-bg/95 backdrop-blur-md px-4 pt-4 pb-4 border-b dark:border-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
            <p className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Paziente: <span className="text-primary">{activePatientName}</span>
            </p>
          </div>

          <button
            onClick={onManageNames}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hover:bg-gray-50 hover:border-primary/30 transition-all shadow-sm"
          >
            <Settings2 size={16} />
            GESTIONE NOMI ANALISI
          </button>

          <SearchAutocomplete
            value={searchQuery}
            suggestions={suggestionList}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>
      </div>

      {/* Spaziatore per compensare la testata fissa */}
      <div className="h-[175px]"></div>

      {/* Contenuto Principale */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar pb-24">
        {searchQuery.trim() !== '' ? (
          <div className="max-w-3xl mx-auto">
            <h3 className="text-sm font-black text-gray-500 mb-3 px-2 uppercase tracking-widest">
              Risultati per "{searchQuery}"
            </h3>
            {searchedItems.length === 0 ? (
              <p className="text-gray-400 italic text-center py-8 text-sm">Nessun esame trovato.</p>
            ) : (
              <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Data Sessione</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Esame</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Analisi</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Valore</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Unità</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px]">Range Min-Max</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] text-right">Azione</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {searchedItems.map(item => {
                        const status = getRangeStatus(item.value, item.minValue, item.maxValue);
                        const valUpper = item.value?.toUpperCase().trim() || '';
                        const isKo = status === 'out' || valUpper === 'POSITIVO' || valUpper === 'PRESENTE' || valUpper === 'PRESENTI';
                        const isOk = (status === 'in' || status === 'none') && !isKo && valUpper !== '';

                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-4 font-bold text-gray-700 dark:text-gray-300 text-base">
                              {formatDate(item.sessionDate)}
                            </td>
                            <td className="px-4 py-4">
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[9px] font-black uppercase tracking-tighter border border-blue-100 dark:border-blue-800/50">
                                {item.sessionObj?.type || 'Esame'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-normal min-w-[180px] max-w-[300px]">
                              <ScrollingName
                                name={item.name}
                                className="font-black text-gray-800 dark:text-white text-base"
                              />
                            </td>
                            <td className={`px-4 py-4 font-black text-lg ${
                              isKo ? 'text-red-500' : isOk ? 'text-green-500' : 'text-primary'
                            }`}>
                              {item.value}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-500">
                              {item.unit}
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-gray-500">
                              {item.minValue && item.maxValue
                                ? `${item.minValue} – ${item.maxValue}`
                                : item.minValue
                                  ? `> ${item.minValue}`
                                  : item.maxValue
                                    ? `< ${item.maxValue}`
                                    : ''
                              }
                            </td>
                            <td className="px-4 py-4 text-right">
                              {item.sessionObj && (
                                <button
                                  onClick={() => onSelectSession(item.sessionObj!)}
                                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                                >
                                  Sessione <ChevronRight size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : sortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mb-4">
              <Database size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Nessuna analisi salvata</h3>
            <p className="text-xs text-gray-500 max-w-[200px] mt-1">
              Usa il tasto + per inserire la tua prima sessione di analisi.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            {sortedSessions.map((session) => {
              const sessionItems = items.filter(it => it.sessionId === session.id);
              
              let okCount = 0;
              let nokCount = 0;
              
              sessionItems.forEach(item => {
                const status = getRangeStatus(item.value, item.minValue, item.maxValue);
                const valUpper = item.value?.toUpperCase().trim() || '';
                const isKo = status === 'out' || valUpper === 'POSITIVO' || valUpper === 'PRESENTE' || valUpper === 'PRESENTI';
                const isOk = (status === 'in' || status === 'none') && !isKo && valUpper !== '';

                if (isKo) nokCount++;
                else if (isOk) okCount++;
              });

              return (
                <div 
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className="bg-white dark:bg-dark-surface p-4 rounded-[1.8rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                        <Calendar size={18} strokeWidth={2.5} />
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-gray-800 dark:text-white truncate">
                            {formatDate(session.date)}
                          </h4>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[9px] font-black uppercase tracking-tighter border border-blue-100 dark:border-blue-800/50">{session.type || 'Esame'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Beaker size={12} className="text-primary/70" />
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
                            {session.laboratory}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-1.5 justify-end">
                          <ClipboardList size={12} className="text-gray-400" />
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">
                            {sessionItems.length} ANALISI
                            {(okCount > 0 || nokCount > 0) && (
                              <span className="ml-1 font-bold">
                                DI CUI <span className="text-green-500">{okCount} OK</span> E <span className="text-red-500">{nokCount} KO</span>
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateSession(session.id);
                          }}
                          title="Duplica sessione"
                          className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                          }}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="p-2.5 text-gray-400 group-hover:text-primary transition-colors">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge numero esami per mobile */}
                  <div className="sm:hidden mt-3 pt-3 border-t border-gray-50 dark:border-gray-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList size={12} className="text-gray-400" />
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">
                        {sessionItems.length} ANALISI
                        {(okCount > 0 || nokCount > 0) && (
                          <span className="ml-1 font-bold">
                            DI CUI <span className="text-green-500">{okCount} OK</span> E <span className="text-red-500">{nokCount} KO</span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDbView;
