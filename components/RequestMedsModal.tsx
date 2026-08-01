
import React, { useState, useEffect } from 'react';
import { X, Mail, Send, User } from 'lucide-react';
import { Medication, Patient } from '../types';

interface RequestMedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  selectedMeds: Medication[];
  activePatient: Patient | null;
  onUpdatePatient: (p: Patient) => Promise<void>;
}

// I tasti per il localStorage non sono più necessari poiché usiamo il database per paziente

const RequestMedsModal: React.FC<RequestMedsModalProps> = ({ isOpen, onClose, medications, selectedMeds, activePatient, onUpdatePatient }) => {
  const [to, setTo] = useState('');
  const [patientName, setPatientName] = useState('');
  const [subject, setSubject] = useState('Richiesta Ricette');
  const [body, setBody] = useState('');

  // Sincronizza i campi interni con i dati del paziente attivo all'apertura
  useEffect(() => {
    if (isOpen && activePatient) {
      setTo(activePatient.doctorEmail || '');
      setPatientName(activePatient.emailPatientName || activePatient.name || '');

      const doctorSuffix = activePatient.doctorName ? ` - ${activePatient.doctorName}` : '';
      setSubject(`Richiesta Ricette${doctorSuffix}`);
    }
  }, [isOpen, activePatient]);

  useEffect(() => {
    if (isOpen) {
      // Formato richiesto: "avrei bisogno della ricetta per i seguenti farmaci per [Nome Paziente] :"
      let initialBody = `Buongiorno,\n\navrei bisogno della ricetta per i seguenti farmaci per ${patientName || '[Nome Paziente]'} :\n\n`;
      
      if (selectedMeds.length === 0) {
        initialBody += "- [Inserire Farmaco]\n";
      } else {
        selectedMeds.forEach(m => {
          initialBody += `- ${m.name} (${m.dosage} ${m.unit})\n`;
        });
      }
      
      initialBody += "\nInviare via mail\n\nGrazie.\nCordiali saluti.";
      setBody(initialBody);
    }
  }, [isOpen, selectedMeds, patientName]);

  if (!isOpen) return null;

  // Validazione: tutti i campi devono essere compilati (non vuoti)
  const isFormValid = to.trim() !== '' && 
                      patientName.trim() !== '' && 
                      subject.trim() !== '' && 
                      body.trim() !== '';

  const handleSend = async () => {
    if (!isFormValid) return;

    // Salvataggio dei dati nel profilo del paziente per "ricordarli" la prossima volta
    if (activePatient) {
      const updatedPatient: Patient = {
        ...activePatient,
        doctorEmail: to.trim(),
        emailPatientName: patientName.trim()
      };
      await onUpdatePatient(updatedPatient);
    }

    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    onClose();
  };

  const labelClass = "text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5 px-1";
  const inputClass = "w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-4 focus:border-primary outline-none transition-all font-bold text-sm disabled:opacity-70";

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary p-5 flex justify-between items-center text-white shadow-md shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Mail className="w-5 h-5" /> 
            Richiesta Farmaci
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Inviare A:</label>
              <input 
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Email medico/farmacia"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nome Paziente:</label>
              <div className="relative">
                <input 
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nome e Cognome"
                  className={`${inputClass} pl-11`}
                />
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Oggetto:</label>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Corpo del Messaggio:</label>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className={`${inputClass} resize-none font-medium leading-relaxed`}
            />
          </div>

          <button 
            onClick={handleSend}
            disabled={!isFormValid}
            className={`w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-primary/30 disabled:hover:shadow-none`}
          >
            <Send size={18} />
            INVIA MAIL
          </button>
          {!isFormValid && (
            <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-tighter">
              Compila tutti i campi per inviare
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestMedsModal;
