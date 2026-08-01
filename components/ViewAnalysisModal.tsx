import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Edit2, Trash2, Save, Beaker, Check, AlertCircle, Plus, LayoutGrid, Table } from 'lucide-react';
import { AnalysisSession, AnalysisItem, COMMON_EXAMS, EXAM_TYPES } from '../types';
import ScrollingName from './ScrollingName';

interface ViewAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AnalysisSession | null;
  items: AnalysisItem[];
  onUpdateItem: (item: AnalysisItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onAddItem: (item: AnalysisItem) => Promise<void>;
  onUpdateSession: (id: string, date: string, laboratory: string, type: string) => Promise<void>;
  allAnalysisItems: AnalysisItem[];
  allSessions?: AnalysisSession[];
}

// Componente autocomplete personalizzato
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
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute left-0 top-full mt-1 z-[200] w-full min-w-[220px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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

const emptyNewItem = () => ({ name: '', value: '', unit: '', min: '', max: '' });

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

const ViewAnalysisModal: React.FC<ViewAnalysisModalProps> = ({
  isOpen, onClose, session, items, onUpdateItem, onDeleteItem, onAddItem, onUpdateSession, allAnalysisItems, allSessions = []
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<AnalysisItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState(emptyNewItem());
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editHeader, setEditHeader] = useState({ date: '', laboratory: '', type: 'Sangue' });
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const suggestionList = useMemo(() => {
    const historicalNames = allAnalysisItems.map(i => i.name);
    return Array.from(new Set([...COMMON_EXAMS, ...historicalNames])).sort();
  }, [allAnalysisItems]);

  const typeSuggestions = useMemo(() => {
    const historicalTypes = (allSessions || []).map(s => s.type).filter((t): t is string => !!t);
    return Array.from(new Set([...EXAM_TYPES, ...historicalTypes])).sort();
  }, [allSessions]);

  const findLastConfig = (name: string) => {
    const sortedHistory = [...allAnalysisItems].sort((a, b) => b.id.localeCompare(a.id));
    const match = sortedHistory.find(i => i.name.toLowerCase() === name.toLowerCase());
    return match ? { unit: match.unit, min: match.minValue || '', max: match.maxValue || '' } : null;
  };

  const handleEditNameChange = (val: string) => {
    if (!editValues) return;
    const config = findLastConfig(val);
    if (config) {
      setEditValues({
        ...editValues,
        name: val,
        unit: config.unit,
        minValue: config.min,
        maxValue: config.max
      });
    } else {
      setEditValues({ ...editValues, name: val });
    }
  };

  const handleNewNameChange = (val: string) => {
    const config = findLastConfig(val);
    if (config) {
      setNewItem({
        ...newItem,
        name: val,
        unit: config.unit,
        min: config.min,
        max: config.max
      });
    } else {
      setNewItem({ ...newItem, name: val });
    }
  };

  // Reset dello stato quando il modale viene chiuso
  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setEditValues(null);
      setIsAddingNew(false);
      setNewItem(emptyNewItem());
      setIsEditingHeader(false);
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const startEdit = (item: AnalysisItem) => {
    setEditingId(item.id);
    setEditValues({ ...item });
    setIsAddingNew(false);
  };

  const handleSaveEdit = async () => {
    if (editValues) {
      await onUpdateItem(editValues);
      setEditingId(null);
      setEditValues(null);
    }
  };

  const handleSaveNew = async () => {
    if (!newItem.name.trim() || !session) return;
    setIsSavingNew(true);
    try {
      const item: AnalysisItem = {
        id: `item-${Date.now()}`,
        sessionId: session.id,
        patientId: session.patientId,
        name: newItem.name,
        value: newItem.value,
        unit: newItem.unit,
        minValue: newItem.min,
        maxValue: newItem.max
      };
      await onAddItem(item);
      setNewItem(emptyNewItem());
      setIsAddingNew(false);
    } finally {
      setIsSavingNew(false);
    }
  };

  const handleSaveHeader = async () => {
    if (!session) return;
    await onUpdateSession(session.id, editHeader.date, editHeader.laboratory, editHeader.type);
    setIsEditingHeader(false);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="bg-white/20 p-3 rounded-2xl shadow-inner shrink-0 self-start"><Beaker size={28} /></div>
            {isEditingHeader ? (
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editHeader.date}
                    onChange={(e) => setEditHeader(v => ({ ...v, date: e.target.value }))}
                    className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-white"
                  />
                  <AutocompleteInput
                    value={editHeader.type}
                    suggestions={typeSuggestions}
                    onChange={(val) => setEditHeader(v => ({ ...v, type: val }))}
                    placeholder="Tipo"
                    className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-white"
                  />
                </div>
                <input
                  type="text"
                  value={editHeader.laboratory}
                  onChange={(e) => setEditHeader(v => ({ ...v, laboratory: e.target.value }))}
                  placeholder="Laboratorio"
                  className="w-full bg-white/20 text-white placeholder-white/50 border border-white/30 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-white"
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingHeader(false)}
                    className="px-3 py-1 text-[10px] font-black bg-white/20 hover:bg-white/30 rounded-lg uppercase tracking-widest transition-all">Annulla</button>
                  <button onClick={handleSaveHeader}
                    className="px-3 py-1 text-[10px] font-black bg-white text-blue-700 hover:bg-blue-50 rounded-lg uppercase tracking-widest transition-all flex items-center gap-1">
                    <Check size={10} strokeWidth={3} /> Salva
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black tracking-tight">{session.date.split('-').reverse().join('/')}</h2>
                <p className="text-xs font-bold text-blue-100 mt-0.5 uppercase tracking-widest">{session.type || 'Esame'}</p>
                <p className="text-xs font-medium text-blue-100/70 truncate mt-0.5">{session.laboratory}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-3 ml-2">
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors shrink-0 -mt-2 -mr-2">
              <X size={24} />
            </button>

            {!isEditingHeader && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditHeader({ date: session.date, laboratory: session.laboratory, type: session.type || 'Sangue' }); setIsEditingHeader(true); }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                  title="Modifica testata"
                >
                  <Edit2 size={16} />
                </button>

                <div className="h-6 w-px bg-white/20 mx-1"></div>

                <div className="flex bg-white/10 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white text-blue-700 shadow-md' : 'text-white/60 hover:text-white'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-blue-700 shadow-md' : 'text-white/60 hover:text-white'}`}
                  >
                    <Table size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">

          {/* Lista esami esistenti */}
          {items.length === 0 && !isAddingNew ? (
            <p className="text-center py-8 text-gray-400 italic text-sm">Nessun esame in questa sessione.</p>
          ) : viewMode === 'cards' ? (
            /* CARD VIEW */
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-all">
                  {editingId === item.id ? (
                    /* EDIT MODE */
                    <div className="space-y-4">
                      {/* Riga 1: Nome Analisi */}
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Nome Analisi</label>
                        <AutocompleteInput
                          value={editValues?.name || ''}
                          suggestions={suggestionList}
                          onChange={handleEditNameChange}
                          placeholder="es. Glicemia"
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white"
                        />
                      </div>

                      {/* Riga 2: Valore e Unità */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Valore</label>
                          <input value={editValues?.value} onChange={(e) => setEditValues(v => v ? { ...v, value: e.target.value } : null)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white" />
                        </div>
                        <div>
                          <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Unità</label>
                          <input value={editValues?.unit} onChange={(e) => setEditValues(v => v ? { ...v, unit: e.target.value } : null)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white" />
                        </div>
                      </div>

                      {/* Riga 3: Range Min / Max */}
                      <div>
                        <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Range di Riferimento (Min / Max)</label>
                        <div className="flex items-center gap-3">
                          <input value={editValues?.minValue || ''} placeholder="Min" onChange={(e) => setEditValues(v => v ? { ...v, minValue: e.target.value } : null)}
                            className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white text-center" />
                          <input value={editValues?.maxValue || ''} placeholder="Max" onChange={(e) => setEditValues(v => v ? { ...v, maxValue: e.target.value } : null)}
                            className="w-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white text-center" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors uppercase tracking-widest">Annulla</button>
                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-500 text-white text-xs font-black rounded-xl shadow-lg shadow-green-500/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
                          <Check size={14} strokeWidth={3} /> Salva
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE */
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <ScrollingName
                          name={item.name}
                          className="text-base font-black text-gray-800 dark:text-white uppercase tracking-tight"
                        />
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {(() => {
                            const status = getRangeStatus(item.value, item.minValue, item.maxValue);
                            const valUpper = item.value?.toUpperCase().trim() || '';
                            const isKo = status === 'out' || valUpper === 'POSITIVO' || valUpper === 'PRESENTE' || valUpper === 'PRESENTI';
                            const isOk = (status === 'in' || status === 'none') && !isKo && valUpper !== '';

                            return (
                              <>
                                {/* Riga 1: Valore + Unità */}
                                <span className={`text-base font-black ${
                                  isKo ? 'text-red-500' : isOk ? 'text-green-500' : 'text-primary'
                                }`}>
                                  {item.value}
                                </span>
                                <span className="text-xs font-bold text-gray-400 uppercase">{item.unit}</span>

                                {/* Riga 2: Range + Badge */}
                                {(item.minValue || item.maxValue) && (
                                  <div className="w-full flex items-center gap-2 mt-1 flex-wrap">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Range:</span>
                                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-300">
                                        {item.minValue && item.maxValue
                                          ? `${item.minValue} – ${item.maxValue}`
                                          : item.minValue
                                            ? `> ${item.minValue}`
                                            : item.maxValue
                                              ? `< ${item.maxValue}`
                                              : ''
                                        }
                                      </span>
                                    </div>
                                    {status === 'out' && (
                                      <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-tighter border border-red-100 dark:border-red-800">
                                        ⚠ Fuori range
                                      </span>
                                    )}
                                    {status === 'in' && (
                                      <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-tighter border border-green-100 dark:border-green-800">
                                        ✓ Nella norma
                                      </span>
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(item)} className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDeleteItem(item.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Analisi</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Valore</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Unità</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Range</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item) => {
                    const status = getRangeStatus(item.value, item.minValue, item.maxValue);
                    const valUpper = item.value?.toUpperCase().trim() || '';
                    const isKo = status === 'out' || valUpper === 'POSITIVO' || valUpper === 'PRESENTE' || valUpper === 'PRESENTI';
                    const isOk = (status === 'in' || status === 'none') && !isKo && valUpper !== '';
                    const isEditing = editingId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-4 whitespace-normal min-w-[150px]">
                          {isEditing ? (
                            <AutocompleteInput
                              value={editValues?.name || ''}
                              suggestions={suggestionList}
                              onChange={handleEditNameChange}
                              placeholder="Analisi"
                              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold dark:text-white"
                            />
                          ) : (
                            <ScrollingName
                              name={item.name}
                              className="font-black text-gray-800 dark:text-white"
                            />
                          )}
                        </td>
                        <td className={`px-4 py-4 font-black text-base ${
                          isKo ? 'text-red-500' : isOk ? 'text-green-500' : 'text-primary'
                        }`}>
                          {isEditing ? (
                            <input
                              value={editValues?.value}
                              onChange={(e) => setEditValues(v => v ? { ...v, value: e.target.value } : null)}
                              className="w-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold dark:text-white"
                            />
                          ) : item.value}
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-gray-500">
                          {isEditing ? (
                            <input
                              value={editValues?.unit}
                              onChange={(e) => setEditValues(v => v ? { ...v, unit: e.target.value } : null)}
                              className="w-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold dark:text-white"
                            />
                          ) : item.unit}
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-gray-500">
                          {isEditing ? (
                            <div className="flex gap-1">
                              <input
                                value={editValues?.minValue || ''} placeholder="Min"
                                onChange={(e) => setEditValues(v => v ? { ...v, minValue: e.target.value } : null)}
                                className="w-14 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold dark:text-white"
                              />
                              <input
                                value={editValues?.maxValue || ''} placeholder="Max"
                                onChange={(e) => setEditValues(v => v ? { ...v, maxValue: e.target.value } : null)}
                                className="w-14 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-bold dark:text-white"
                              />
                            </div>
                          ) : (
                            item.minValue && item.maxValue
                              ? `${item.minValue} – ${item.maxValue}`
                              : item.minValue
                                ? `> ${item.minValue}`
                                : item.maxValue
                                  ? `< ${item.maxValue}`
                                  : ''
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
                                  <Check size={16} strokeWidth={3} />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => onDeleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Form nuovo esame */}
          {isAddingNew && (
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/30 p-4 animate-in slide-in-from-bottom-2 duration-300 space-y-4">
              <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Nuova Analisi</h4>

              {/* Riga 1: Nome Analisi */}
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Nome Analisi</label>
                <AutocompleteInput
                  value={newItem.name}
                  suggestions={suggestionList}
                  onChange={handleNewNameChange}
                  placeholder="es. Glicemia"
                  className="w-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white"
                />
              </div>

              {/* Riga 2: Valore e Unità */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Valore</label>
                  <input value={newItem.value} placeholder="Valore" onChange={(e) => setNewItem(v => ({ ...v, value: e.target.value }))}
                    className="w-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Unità</label>
                  <input value={newItem.unit} placeholder="es. mg/dL" onChange={(e) => setNewItem(v => ({ ...v, unit: e.target.value }))}
                    className="w-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white" />
                </div>
              </div>

              {/* Riga 3: Range Min / Max */}
              <div>
                <label className="text-[11px] font-black text-gray-400 uppercase ml-1 block mb-1">Range di Riferimento (Min / Max)</label>
                <div className="flex items-center gap-3">
                  <input value={newItem.min} placeholder="Min" onChange={(e) => setNewItem(v => ({ ...v, min: e.target.value }))}
                    className="w-1/2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white text-center" />
                  <input value={newItem.max} placeholder="Max" onChange={(e) => setNewItem(v => ({ ...v, max: e.target.value }))}
                    className="w-1/2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-700 rounded-xl p-2.5 text-base font-bold dark:text-white text-center" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setIsAddingNew(false); setNewItem(emptyNewItem()); }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-colors uppercase tracking-widest">Annulla</button>
                <button onClick={handleSaveNew} disabled={isSavingNew || !newItem.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50">
                  {isSavingNew ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={14} strokeWidth={3} />}
                  Salva
                </button>
              </div>
            </div>
          )}

          {/* Pulsante aggiungi */}
          {!isAddingNew && (
            <button onClick={() => { setIsAddingNew(true); setEditingId(null); }}
              className="w-full flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-black hover:bg-blue-100 transition-all border border-dashed border-blue-200 dark:border-blue-900/40">
              <Plus size={18} /> AGGIUNGI UN'ALTRA ANALISI
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t dark:border-gray-800 flex justify-center shrink-0">
          <button onClick={onClose} className="px-8 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-xs font-black text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 transition-all uppercase tracking-widest">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAnalysisModal;
