
import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Calendar, Clock, Edit2, Check, Loader2 } from 'lucide-react';
import { Note } from '../types';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (note: Note) => Promise<void>; 
  initialData?: Note | null;
  activePatientId: string | null;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({ isOpen, onClose, onAdded, initialData, activePatientId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  
  // Status state for button feedback
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    if (isOpen) {
      // Reset status when opening
      setStatus('idle');
      
      if (initialData) {
        // Edit Mode
        setTitle(initialData.title);
        setContent(initialData.content);
        setDate(initialData.date);
        setTime(initialData.time);
      } else {
        // New Note Mode (Default to now)
        const now = new Date();
        setTitle('');
        setContent('');
        setDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
        setTime(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'));
      }
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Validation
    if (!title.trim()) { setError('Il titolo è obbligatorio.'); return; }
    if (!content.trim()) { setError('Il contenuto è obbligatorio.'); return; }
    if (!date || !time) { setError('Data e ora sono obbligatorie.'); return; }

    const newNote: Note = {
      id: initialData ? initialData.id : Date.now().toString(),
      patientId: initialData ? initialData.patientId : (activePatientId || 'p-default'),
      title,
      content,
      date,
      time
    };

    try {
      setStatus('saving');
      setError('');
      
      // Wait for parent API call to finish
      await onAdded(newNote);
      
      // Show success state
      setStatus('success');
      
      // Delay closing
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center text-white shadow-md">
          <h2 className="font-bold text-lg flex items-center gap-2">
            {initialData ? <Edit2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />} 
            {initialData ? 'Modifica Nota' : 'Nuova Nota'}
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
        <div className="p-6 overflow-y-auto space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Titolo</label>
              <input 
                value={title} onChange={(e) => setTitle(e.target.value)}
                onFocus={handleFocus}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70" 
                placeholder="Titolo nota..."
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block flex items-center gap-1"><Calendar size={14}/> Data</label>
                 <input 
                  type="date"
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
            
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Contenuto</label>
              <textarea 
                value={content} onChange={(e) => setContent(e.target.value)}
                rows={6}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors resize-none disabled:opacity-70" 
                placeholder="Scrivi qui la tua nota..."
              />
            </div>

            {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}

            <button 
              onClick={handleSave}
              disabled={status !== 'idle'}
              className={`w-full py-4 rounded-xl font-bold mt-2 transition-all duration-300 flex justify-center items-center gap-2 ${
                status === 'success' 
                  ? 'bg-green-500 text-white scale-105 opacity-100 disabled:opacity-100' // Force full opacity
                  : status === 'saving'
                    ? 'bg-primary/80 text-white cursor-wait'
                    : 'bg-primary text-white hover:bg-blue-700'
              }`}
            >
              {status === 'saving' ? (
                <>
                  <Loader2 size={20} className="animate-spin"/> Salvataggio...
                </>
              ) : status === 'success' ? (
                <>
                  <Check size={20}/> {initialData ? 'Nota Modificata!' : 'Nota Salvata!'}
                </>
              ) : (
                <>
                  <Save size={20}/> {initialData ? 'Aggiorna Nota' : 'Salva Nota'}
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;
