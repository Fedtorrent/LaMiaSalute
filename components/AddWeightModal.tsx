
import React, { useState, useEffect } from 'react';
import { X, Save, Scale, Calendar, Clock, Check, Loader2, Edit2 } from 'lucide-react';
import { WeightLog } from '../types';

interface AddWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (weight: WeightLog) => Promise<void>;
  initialData?: WeightLog | null;
  activePatientId: string | null;
}

const AddWeightModal: React.FC<AddWeightModalProps> = ({ isOpen, onClose, onAdded, initialData, activePatientId }) => {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      
      if (initialData) {
        setWeight(String(initialData.weight));
        setDate(initialData.date);
        setTime(initialData.time);
      } else {
        const now = new Date();
        setWeight('');
        setDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
        setTime(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'));
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!weight) { setError('Il peso è obbligatorio.'); return; }
    if (!date || !time) { setError('Data e ora sono obbligatorie.'); return; }

    // Validation: Future Date Check
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (date > today) {
       setError('Non puoi inserire date future.');
       return;
    }

    const newWeight: WeightLog = {
      id: initialData ? initialData.id : Date.now().toString(),
      patientId: initialData ? initialData.patientId : (activePatientId || 'p-default'),
      weight: Number(weight),
      date,
      time
    };

    try {
      setStatus('saving');
      setError('');
      await onAdded(newWeight);
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

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  const nowForToday = new Date();
  const today = `${nowForToday.getFullYear()}-${String(nowForToday.getMonth() + 1).padStart(2, '0')}-${String(nowForToday.getDate()).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-primary p-4 flex justify-between items-center text-white shadow-md">
          <h2 className="font-bold text-lg flex items-center gap-2">
            {initialData ? <Edit2 className="w-5 h-5"/> : <Scale className="w-5 h-5" />} 
            {initialData ? 'Modifica Peso' : 'Registra Peso'}
          </h2>
          <button 
            onClick={onClose} 
            disabled={status !== 'idle'} 
            className="hover:bg-white/20 p-1 rounded-full disabled:opacity-50 transition-colors"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Peso (kg)</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.1"
                  value={weight} onChange={(e) => setWeight(e.target.value)}
                  onFocus={handleFocus}
                  disabled={status !== 'idle'}
                  className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 pr-10 focus:border-primary outline-none transition-colors font-bold text-lg disabled:opacity-70" 
                  placeholder="0.0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">kg</span>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block flex items-center gap-1"><Calendar size={14}/> Data</label>
                 <input 
                  type="date"
                  max={today}
                  value={date} onChange={(e) => setDate(e.target.value)}
                  onFocus={handleFocus}
                  disabled={status !== 'idle'}
                  className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors disabled:opacity-70" 
                />
              </div>
              <div className="w-1/3">
                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block flex items-center gap-1"><Clock size={14}/> Ora</label>
                 <input 
                  type="time"
                  value={time} onChange={(e) => setTime(e.target.value)}
                  onFocus={handleFocus}
                  disabled={status !== 'idle'}
                  className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors text-center disabled:opacity-70" 
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}

            <button 
              onClick={handleSave}
              disabled={status !== 'idle'}
              className={`w-full py-4 rounded-xl font-bold mt-2 transition-all duration-300 flex justify-center items-center gap-2 ${
                status === 'success' 
                  ? 'bg-green-500 text-white scale-105 opacity-100 disabled:opacity-100'
                  : status === 'saving'
                    ? 'bg-primary/80 text-white cursor-wait'
                    : 'bg-primary text-white hover:bg-blue-700'
              }`}
            >
              {status === 'saving' ? (
                <><Loader2 size={20} className="animate-spin"/> Salvataggio...</>
              ) : status === 'success' ? (
                <><Check size={20}/> {initialData ? 'Peso Aggiornato!' : 'Peso Salvato!'}</>
              ) : (
                <><Save size={20}/> {initialData ? 'Aggiorna' : 'Salva'}</>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddWeightModal;
