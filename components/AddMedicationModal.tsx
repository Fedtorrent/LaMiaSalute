import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Clock, Trash2, Calendar, Edit2, Check, Loader2, ChevronDown } from 'lucide-react';
import { Medication, MED_COLORS, COLOR_LABELS, ScheduleItem, MEASUREMENT_UNITS } from '../types';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (med: Medication) => Promise<void>;
  initialData?: Medication | null;
  activePatientId: string | null;
}

const AddMedicationModal: React.FC<AddMedicationModalProps> = ({ isOpen, onClose, onAdded, initialData, activePatientId }) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg'); 
  const [qty, setQty] = useState<string | number>(20);
  const [minQty, setMinQty] = useState<string | number>(5);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([{ time: '09:00', quantity: 1 }]);
  const [isTemporary, setIsTemporary] = useState(false);
  const [durationDays, setDurationDays] = useState<string | number>(7);
  const [isActive, setIsActive] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dayOfWeek, setDayOfWeek] = useState(new Date().getDay());
  const [dayOfMonth, setDayOfMonth] = useState(new Date().getDate());
  const [leafletUrl, setLeafletUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState(MED_COLORS[0]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [error, setError] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      
      if (initialData) {
        setName(initialData.name);
        setDosage(initialData.dosage);
        setUnit(initialData.unit || 'mg');
        setQty(0);
        setMinQty(initialData.minQuantity || 5);
        setSchedule(initialData.schedule.length > 0 ? initialData.schedule : [{ time: '09:00', quantity: 1 }]);
        setIsTemporary(!!initialData.durationDays);
        setDurationDays(initialData.durationDays || 7);
        setIsActive(initialData.isActive !== false);
        setNotificationsEnabled(initialData.notificationsEnabled !== false);
        setNotes(initialData.notes || '');
        setFrequency(initialData.frequency || 'daily');
        setDayOfWeek(initialData.dayOfWeek ?? new Date().getDay());
        setDayOfMonth(initialData.dayOfMonth ?? new Date().getDate());
        setLeafletUrl(initialData.leafletUrl || '');
        setSelectedColor(initialData.color || MED_COLORS[0]);
      } else {
        setName('');
        setDosage('');
        setUnit('mg');
        setQty(20);
        setMinQty(5);
        setSchedule([{ time: '09:00', quantity: 1 }]);
        setIsTemporary(false);
        setDurationDays(7);
        setIsActive(true);
        setNotificationsEnabled(true);
        setNotes('');
        setFrequency('daily');
        setDayOfWeek(new Date().getDay());
        setDayOfMonth(new Date().getDate());
        setLeafletUrl('');
        setSelectedColor(MED_COLORS[Math.floor(Math.random() * MED_COLORS.length)]);
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleFinalSave = async () => {
    if (!name) {
      setError('Il nome è obbligatorio.');
      return;
    }

    const medToSave: Medication = {
      id: initialData ? initialData.id : Date.now().toString(),
      patientId: initialData ? initialData.patientId : (activePatientId || 'p-default'),
      name,
      dosage,
      unit,
      totalQuantity: initialData ? initialData.totalQuantity + Number(qty) : Number(qty),
      remainingQuantity: initialData ? (initialData.remainingQuantity + Number(qty)) : Number(qty),
      minQuantity: Number(minQty),
      schedule: schedule.sort((a, b) => a.time.localeCompare(b.time)),
      color: selectedColor,
      icon: 'pill',
      isActive: isActive,
      startDate: (() => {
        const now = new Date();
        const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        // Se è un farmaco temporaneo ed è stato riattivato (o era inattivo e viene salvato attivo), azzeriamo il contatore impostando startDate a oggi
        if (isTemporary && isActive && initialData && !initialData.isActive) {
          return todayIso;
        }
        return initialData ? initialData.startDate : todayIso;
      })(),
      durationDays: isTemporary ? Number(durationDays) : undefined,
      notificationsEnabled,
      notes,
      frequency,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      leafletUrl: leafletUrl || undefined,
    };

    try {
      setStatus('saving');
      setError('');
      await onAdded(medToSave);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 1500);
    } catch (e) {
      console.error(e);
      setError('Errore durante il salvataggio.');
      setStatus('idle');
    }
  };

  const addTimeSlot = () => setSchedule([...schedule, { time: '08:00', quantity: 1 }]);
  
  const updateSchedule = (idx: number, field: keyof ScheduleItem, val: string | number) => {
    const newSched = [...schedule];
    if (field === 'quantity') {
      newSched[idx].quantity = val === '' ? 0 : Number(val);
    } else {
      newSched[idx].time = String(val);
    }
    setSchedule(newSched);
  };
  
  const removeTimeSlot = (idx: number) => {
    setSchedule(schedule.filter((_, i) => i !== idx));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  // Calcolo dinamico della quantità attuale + aggiunta
  const displayedCurrentQty = initialData 
    ? (initialData.remainingQuantity + Number(qty)) 
    : Number(qty);

  // Stile comune per le etichette per garantire coerenza totale
  const labelClass = "text-sm font-bold text-gray-700 dark:text-white mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center text-white shadow-md shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            {initialData ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />} 
            {initialData ? 'Modifica Farmaco' : 'Aggiungi Farmaco'}
          </h2>
          <button 
            onClick={onClose} 
            disabled={status !== 'idle'} 
            className="hover:bg-white/20 p-1 rounded-full disabled:opacity-50 transition-colors"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Riga 1: Nome Farmaco */}
          <div className="w-full">
            <label className={labelClass}>Nome Farmaco</label>
            <input 
              value={name} onChange={(e) => setName(e.target.value)}
              onFocus={handleFocus}
              disabled={status !== 'idle'}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70" 
              placeholder="es: Tachipirina"
            />
          </div>
          
          {/* Riga 2: Dosaggio e Unità */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Dosaggio</label>
              <input 
                value={dosage} onChange={(e) => setDosage(e.target.value)}
                onFocus={handleFocus}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70 text-center" 
                placeholder="es: 500"
              />
            </div>
            <div>
              <label className={labelClass}>Unità</label>
              <select 
                value={unit} onChange={(e) => setUnit(e.target.value)}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70"
              >
                {MEASUREMENT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Scelta Colore Custom Dropdown */}
          <div>
            <label className={labelClass}>Colore Identificativo</label>
            <div className="relative">
              <button
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 flex items-center justify-between hover:border-primary transition-colors disabled:opacity-70"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${selectedColor} border-2 border-white dark:border-gray-700 shadow-sm`}></div>
                  <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">Seleziona colore</span>
                </div>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isColorPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {isColorPickerOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-7 gap-3">
                    {MED_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedColor(c);
                          setIsColorPickerOpen(false);
                        }}
                        className={`w-8 h-8 rounded-full ${c} border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                          selectedColor === c ? 'border-gray-800 dark:border-white scale-110 shadow-md' : 'border-transparent'
                        }`}
                      >
                        {selectedColor === c && <Check size={14} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Riga 3: Q.tà Attuale, +/-, Scorta Min. */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Q.tà Attuale</label>
              <input 
                type="number"
                value={displayedCurrentQty}
                readOnly
                className="w-full bg-gray-50 dark:bg-gray-900 text-primary dark:text-primary font-black border-2 border-gray-100 dark:border-gray-800 rounded-xl p-3 outline-none text-center" 
              />
            </div>
            <div>
              <label className={labelClass}>+/-</label>
              <input 
                type="number"
                value={qty} onChange={(e) => setQty(e.target.value)}
                onFocus={handleFocus}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold text-center disabled:opacity-70" 
              />
            </div>
            <div>
              <label className={labelClass}>Scorta Min.</label>
              <input 
                type="number"
                value={minQty} onChange={(e) => setMinQty(e.target.value)}
                onFocus={handleFocus}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold text-center disabled:opacity-70" 
              />
            </div>
          </div>

          <div className="border-t dark:border-gray-800 pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className={`${labelClass} flex items-center gap-2 mb-0`}>
                <Clock className="w-4 h-4"/> Orari Assunzione
              </label>
              <button 
                onClick={addTimeSlot}
                disabled={status !== 'idle'}
                className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
              >
                <Plus size={14}/> Aggiungi Orario
              </button>
            </div>
            
            <div className="space-y-3">
              {schedule.map((slot, idx) => (
                <div key={idx} className="flex items-center gap-3 animate-in slide-in-from-left-2 duration-200">
                  <input 
                    type="time" 
                    value={slot.time} 
                    onChange={(e) => updateSchedule(idx, 'time', e.target.value)}
                    disabled={status !== 'idle'}
                    className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 outline-none focus:border-primary transition-colors text-center font-bold"
                  />
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1.5">
                    <span className="text-[10px] font-bold text-gray-400 px-1 uppercase">Qt:</span>
                    <input 
                      type="number" 
                      value={slot.quantity} 
                      onChange={(e) => updateSchedule(idx, 'quantity', e.target.value)}
                      onFocus={handleFocus}
                      disabled={status !== 'idle'}
                      className="w-12 bg-transparent text-gray-900 dark:text-white outline-none font-bold text-center"
                    />
                  </div>
                  {schedule.length > 1 && (
                    <button 
                      onClick={() => removeTimeSlot(idx)}
                      disabled={status !== 'idle'}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={18}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t dark:border-gray-800 pt-4 flex items-center justify-between">
            <div>
              <label className={`${labelClass} mb-0`}>Farmaco Temporaneo?</label>
              <p className="text-[10px] text-gray-500">Si disattiverà dopo il numero di assunzioni impostate</p>
            </div>
            <button 
              onClick={() => setIsTemporary(!isTemporary)}
              disabled={status !== 'idle'}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isTemporary ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isTemporary ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>

          {isTemporary && (
            <div className="animate-in slide-in-from-top-2">
              <label className={`${labelClass} flex items-center gap-1`}>
                <Calendar size={14}/> Numero di assunzioni
              </label>
              <input 
                type="number"
                value={durationDays} onChange={(e) => setDurationDays(e.target.value)}
                onFocus={handleFocus}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70 text-center" 
              />
            </div>
          )}

          <div className="border-t dark:border-gray-800 pt-4 flex items-center justify-between">
            <div>
              <label className={`${labelClass} mb-0`}>Farmaco Attivo?</label>
              <p className="text-[10px] text-gray-500">Se disattivato, non apparirà nella home</p>
            </div>
            <button 
              onClick={() => setIsActive(!isActive)}
              disabled={status !== 'idle'}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isActive ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>

          <div className="border-t dark:border-gray-800 pt-4 flex items-center justify-between">
            <div>
              <label className={`${labelClass} mb-0`}>Notifiche Attive?</label>
              <p className="text-[10px] text-gray-500">Ricevi avvisi per questo farmaco</p>
            </div>
            <button 
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              disabled={status !== 'idle'}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${notificationsEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${notificationsEnabled ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>

          <div className="border-t dark:border-gray-800 pt-4">
            <label className={labelClass}>Frequenza Assunzione</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { id: 'daily', label: 'Ogni giorno' },
                { id: 'weekly', label: 'Settimanale' },
                { id: 'monthly', label: 'Mensile' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFrequency(f.id as any)}
                  disabled={status !== 'idle'}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold border-2 transition-all ${
                    frequency === f.id 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-gray-100 dark:border-gray-800 text-gray-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {frequency === 'weekly' && (
              <div className="mt-4 animate-in slide-in-from-top-2">
                <label className={labelClass}>Giorno della settimana</label>
                <select 
                  value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold"
                >
                  {['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'].map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div className="mt-4 animate-in slide-in-from-top-2">
                <label className={labelClass}>Giorno del mese</label>
                <select 
                  value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border-t dark:border-gray-800 pt-4">
            <label className={labelClass}>Note (opzionale)</label>
            <textarea 
              value={notes} onChange={(e) => setNotes(e.target.value)}
              disabled={status !== 'idle'}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-medium disabled:opacity-70 text-sm h-24 resize-none" 
              placeholder="Inserisci note aggiuntive..."
            />
          </div>

          {/* Bugiardino Digitale */}
          <div className="border-t dark:border-gray-800 pt-4">
            <div className="flex justify-between items-center mb-1">
              <label className={labelClass}>Bugiardino Digitale</label>
              {leafletUrl && (
                <button 
                  onClick={() => setLeafletUrl('')}
                  className="text-[10px] font-bold text-red-500 hover:underline"
                >
                  Pulisci link
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                value={leafletUrl} onChange={(e) => setLeafletUrl(e.target.value)}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 pr-10 focus:border-primary outline-none transition-colors font-medium text-xs disabled:opacity-70" 
                placeholder="URL del foglietto illustrativo..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Clock size={16} className={leafletUrl ? "text-primary" : "opacity-30"} />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic">Il link viene salvato automaticamente dopo la prima ricerca.</p>
          </div>

          {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}

          <button 
            onClick={handleFinalSave}
            disabled={status !== 'idle'}
            className={`w-full py-4 rounded-xl font-bold mt-2 transition-all duration-300 flex justify-center items-center gap-2 ${
              status === 'success' 
                ? 'bg-green-500 text-white scale-105 opacity-100'
                : status === 'saving'
                  ? 'bg-primary/80 text-white cursor-wait'
                  : 'bg-primary text-white hover:bg-blue-700'
            }`}
          >
            {status === 'saving' ? (
              <><Loader2 size={20} className="animate-spin"/> Salvataggio...</>
            ) : status === 'success' ? (
              <><Check size={20}/> {initialData ? 'Modificato!' : 'Salvato!'}</>
            ) : (
              <><Save size={20}/> {initialData ? 'Salva Modifiche' : 'Conferma Farmaco'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMedicationModal;
