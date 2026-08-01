import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Save, Plus, Beaker, ClipboardList } from 'lucide-react';
import { AnalysisSession, AnalysisItem, COMMON_EXAMS, EXAM_TYPES } from '../types';

interface AddAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (session: AnalysisSession, items: AnalysisItem[]) => Promise<void>;
  activePatientId: string | null;
  allAnalysisItems: AnalysisItem[];
  allSessions?: AnalysisSession[];
}

// Componente autocomplete personalizzato - lista SEMPRE sotto il campo
interface AutocompleteInputProps {
  value: string;
  suggestions: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ value, suggestions, onChange, placeholder, className }) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!value || value.length < 1) return [];
    return suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8);
  }, [value, suggestions]);

  // Chiudi dropdown cliccando fuori
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
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => { if (value.length >= 1) setOpen(true); }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        className={className || "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base font-bold dark:text-white"}
      />
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
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- Componente Principale ---
const AddAnalysisModal: React.FC<AddAnalysisModalProps> = ({
  isOpen,
  onClose,
  onAdded,
  activePatientId,
  allAnalysisItems,
  allSessions = []
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [laboratory, setLaboratory] = useState('');
  const [examType, setExamType] = useState('Sangue');
  const [items, setItems] = useState<{ name: string; value: string; unit: string; min: string; max: string; }[]>(
    [{ name: '', value: '', unit: '', min: '', max: '' }]
  );
  const [isSaving, setIsSaving] = useState(false);

  const suggestionList = useMemo(() => {
    const historicalNames = allAnalysisItems.map(i => i.name);
    return Array.from(new Set([...COMMON_EXAMS, ...historicalNames])).sort();
  }, [allAnalysisItems]);

  const typeSuggestions = useMemo(() => {
    const historicalTypes = allSessions.map(s => s.type).filter((t): t is string => !!t);
    return Array.from(new Set([...EXAM_TYPES, ...historicalTypes])).sort();
  }, [allSessions]);

  if (!isOpen) return null;

  const addItem = () => setItems([...items, { name: '', value: '', unit: '', min: '', max: '' }]);
  const removeItem = (index: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const findLastConfig = (name: string) => {
    const sortedHistory = [...allAnalysisItems].sort((a, b) => b.id.localeCompare(a.id));
    const match = sortedHistory.find(i => i.name.toLowerCase() === name.toLowerCase());
    return match ? { unit: match.unit, min: match.minValue || '', max: match.maxValue || '' } : null;
  };

  const updateItemField = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleNameChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].name = value;
    const config = findLastConfig(value);
    if (config) {
      newItems[index].unit = config.unit;
      newItems[index].min = config.min;
      newItems[index].max = config.max;
    }
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!activePatientId || !laboratory) return;
    setIsSaving(true);
    try {
      const sessionId = 'session-' + Date.now();
      const session: AnalysisSession = { id: sessionId, patientId: activePatientId, date, laboratory, type: examType };
      const analysisItems: AnalysisItem[] = items
        .filter(it => it.name.trim() !== '')
        .map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          sessionId,
          patientId: activePatientId,
          name: it.name,
          value: it.value,
          unit: it.unit,
          minValue: it.min,
          maxValue: it.max
        }));
      await onAdded(session, analysisItems);
      onClose();
      setDate(new Date().toISOString().split('T')[0]);
      setLaboratory('');
      setExamType('Sangue');
      setItems([{ name: '', value: '', unit: '', min: '', max: '' }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl"><Beaker size={24} /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Nuovo Esame</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Data Esame</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-100/50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-2xl p-4 text-base font-bold transition-all dark:text-white outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tipo di Esame</label>
                <AutocompleteInput
                  value={examType}
                  suggestions={typeSuggestions}
                  onChange={setExamType}
                  placeholder="es. Sangue, Urine..."
                  className="w-full bg-gray-100/50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-2xl p-4 text-base font-bold transition-all dark:text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Laboratorio</label>
              <input type="text" placeholder="es. Ospedale Civile..." value={laboratory} onChange={(e) => setLaboratory(e.target.value)}
                className="w-full bg-gray-100/50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-2xl p-4 text-base font-bold transition-all dark:text-white outline-none" />
            </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-500" />
              <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">Elenco Analisi</h3>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 relative group animate-in slide-in-from-bottom-2 duration-300">
                  {items.length > 1 && (
                    <button onClick={() => removeItem(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <X size={14} />
                    </button>
                  )}
                  <div className="space-y-4">
                    {/* Riga 1: Nome Analisi */}
                    <div>
                      <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Nome Analisi</label>
                      <AutocompleteInput
                        value={item.name}
                        suggestions={suggestionList}
                        onChange={(val) => handleNameChange(index, val)}
                        placeholder="es. Glicemia"
                      />
                    </div>

                    {/* Riga 2: Valore e Unità */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Valore</label>
                        <input placeholder="Valore" value={item.value} onChange={(e) => updateItemField(index, 'value', e.target.value)}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base font-bold dark:text-white" />
                      </div>
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Unità</label>
                        <input placeholder="es. mg/dL" value={item.unit} onChange={(e) => updateItemField(index, 'unit', e.target.value)}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base font-bold dark:text-white" />
                      </div>
                    </div>

                    {/* Riga 3: Range Min / Max */}
                    <div>
                      <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Range di Riferimento (Min / Max)</label>
                      <div className="flex items-center gap-3">
                        <input placeholder="Min" value={item.min} onChange={(e) => updateItemField(index, 'min', e.target.value)}
                          className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base font-bold dark:text-white text-center" />
                        <input placeholder="Max" value={item.max} onChange={(e) => updateItemField(index, 'max', e.target.value)}
                          className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-base font-bold dark:text-white text-center" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addItem}
              className="w-full flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black hover:bg-blue-100 transition-all border border-dashed border-blue-200 dark:border-blue-900/40">
              <Plus size={18} /> AGGIUNGI UN ALTRA ANALISI
            </button>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t dark:border-gray-800 shrink-0">
          <button onClick={handleSave}
            disabled={isSaving || !laboratory || items.every(it => it.name === '')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all active:scale-95">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                SALVATAGGIO...
              </span>
            ) : (
              <><Save size={20} /> SALVA SESSIONE ESAME</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAnalysisModal;
