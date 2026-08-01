
import React, { useState, useEffect } from 'react';
import { X, Check, Pill, AlertCircle } from 'lucide-react';
import { Medication, Patient } from '../types';
import ScrollingName from './ScrollingName';

interface SelectMedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  medications: Medication[];
  activePatient: Patient | null;
  onConfirm: (selectedMeds: Medication[]) => void;
}

const SelectMedsModal: React.FC<SelectMedsModalProps> = ({ isOpen, onClose, medications, activePatient, onConfirm }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const initialSelected = new Set<string>();
      medications.forEach(m => {
        if (m.remainingQuantity <= (m.minQuantity || 0)) {
          initialSelected.add(m.id);
        }
      });
      setSelectedIds(initialSelected);
    }
  }, [isOpen, medications]);

  if (!isOpen) return null;

  const toggleMedication = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selectedMeds = medications.filter(m => selectedIds.has(m.id));
    onConfirm(selectedMeds);
  };

  const labelClass = "text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5 px-1";

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-blue-600 p-5 flex justify-between items-center text-white shadow-md shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Seleziona Farmaci
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-1">
            Seleziona i farmaci che desideri richiedere nella mail per {activePatient?.name || 'il paziente'}.
          </p>

          <div className="space-y-2">
            {medications.length === 0 ? (
              <p className="text-center py-10 opacity-50 italic text-sm">Nessun farmaco nel catalogo</p>
            ) : (
              medications.map(med => {
                const isSelected = selectedIds.has(med.id);
                const isLowStock = med.remainingQuantity <= (med.minQuantity || 0);

                return (
                  <div
                    key={med.id}
                    onClick={() => toggleMedication(med.id)}
                    className={`p-4 rounded-2xl flex items-center gap-4 border-2 transition-all cursor-pointer active:scale-[0.99] ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${med.isActive ? med.color : 'bg-gray-400'}`}>
                      <Pill size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <ScrollingName
                        name={med.name}
                        className={`flex-1 min-w-0 font-bold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-white'}`}
                      />
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">
                          Scorta: {med.remainingQuantity} pz
                        </span>
                        {isLowStock && (
                          <span className="flex items-center gap-0.5 text-[9px] font-black text-red-500 uppercase tracking-tighter">
                            <AlertCircle size={10} /> Sotto minima
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && <Check size={14} strokeWidth={4} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg transition-all active:scale-[0.98] hover:shadow-blue-500/30"
          >
            CONFERMA SELEZIONE ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectMedsModal;
