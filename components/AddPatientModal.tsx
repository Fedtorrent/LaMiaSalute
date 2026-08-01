import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Check, Loader2 } from 'lucide-react';
import { Patient, PATIENT_COLORS } from '../types';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (patient: Patient) => Promise<void>;
  initialData?: Patient | null;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose, onAdded, initialData }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PATIENT_COLORS[0]);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [emailPatientName, setEmailPatientName] = useState('');
  const [recordsFolderLink, setRecordsFolderLink] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setColor(initialData.color);
        setDoctorEmail(initialData.doctorEmail || '');
        setDoctorName(initialData.doctorName || '');
        setEmailPatientName(initialData.emailPatientName || '');
        setRecordsFolderLink(initialData.recordsFolderLink || '');
      } else {
        setName('');
        setColor(PATIENT_COLORS[Math.floor(Math.random() * PATIENT_COLORS.length)]);
        setDoctorEmail('');
        setDoctorName('');
        setEmailPatientName('');
        setRecordsFolderLink('');
      }
      setStatus('idle');
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }

    const patientToSave: Patient = {
      id: initialData ? initialData.id : 'p-' + Date.now(),
      name: name.trim(),
      color: color,
      doctorEmail: doctorEmail.trim(),
      doctorName: doctorName.trim(),
      emailPatientName: emailPatientName.trim(),
      recordsFolderLink: recordsFolderLink.trim(),
    };

    try {
      setStatus('saving');
      await onAdded(patientToSave);
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 1500);
    } catch (e) {
      console.error(e);
      setError('Errore durante il salvataggio');
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-primary p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <UserPlus size={20} />
            {initialData ? 'Modifica Profilo' : 'Nuovo Profilo'}
          </h2>
          <button onClick={onClose} disabled={status !== 'idle'} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block">Nome Profilo</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status !== 'idle'}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70"
              placeholder="es: Mario, Mamma, ecc."
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block">Email Medico</label>
              <input
                type="email"
                value={doctorEmail}
                onChange={(e) => setDoctorEmail(e.target.value)}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70"
                placeholder="es: medico@email.it"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block">Nome Medico</label>
              <input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70"
                placeholder="es: Dott. Mario Rossi"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block">Nome Paziente</label>
              <input
                value={emailPatientName}
                onChange={(e) => setEmailPatientName(e.target.value)}
                disabled={status !== 'idle'}
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70"
                placeholder="es: Nome e Cognome"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block italic text-primary">Link Cartella Referti (Cloud)</label>
              <input
                value={recordsFolderLink}
                onChange={(e) => setRecordsFolderLink(e.target.value)}
                disabled={status !== 'idle'}
                className="w-full bg-blue-50/50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-primary/20 dark:border-primary/20 rounded-xl p-3 focus:border-primary outline-none transition-colors font-bold disabled:opacity-70 text-sm"
                placeholder="es: https://drive.google.com/..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block">Colore Identificativo</label>
            <div className="flex flex-wrap gap-3">
              {PATIENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  disabled={status !== 'idle'}
                  className={`w-10 h-10 rounded-full ${c} ${color === c ? 'ring-4 ring-offset-2 ring-primary dark:ring-offset-dark-surface scale-110' : 'opacity-60 hover:opacity-100'} transition-all`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            onClick={handleSave}
            disabled={status !== 'idle'}
            className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 ${
              status === 'success' ? 'bg-green-500 text-white' : status === 'saving' ? 'bg-primary/80 text-white cursor-wait' : 'bg-primary text-white hover:bg-blue-700'
            }`}
          >
            {status === 'saving' ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Salvataggio...
              </>
            ) : status === 'success' ? (
              <>
                <Check size={20} /> Salvato!
              </>
            ) : (
              <>
                <Save size={20} /> {initialData ? 'Salva Modifiche' : 'Crea Profilo'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPatientModal;
