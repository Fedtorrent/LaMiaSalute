
import React, { useState } from 'react';
import { X, Download, FileText, Activity, Scale, Pill, Check } from 'lucide-react';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selections: ExportSelections) => void;
}

export interface ExportSelections {
  notes: boolean;
  pressure: boolean;
  weight: boolean;
  medications: boolean;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({ isOpen, onClose, onExport }) => {
  const [selections, setSelections] = useState<ExportSelections>({
    notes: true,
    pressure: true,
    weight: true,
    medications: true,
  });

  if (!isOpen) return null;

  const toggleSelection = (key: keyof ExportSelections) => {
    setSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = () => {
    onExport(selections);
    onClose();
  };

  const hasSelection = Object.values(selections).some(v => v);

  const SelectionItem = ({ id, label, icon: Icon, selected }: { id: keyof ExportSelections, label: string, icon: any, selected: boolean }) => (
    <button
      onClick={() => toggleSelection(id)}
      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
        selected 
          ? 'border-primary bg-primary/5 dark:bg-primary/10' 
          : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${selected ? 'text-primary bg-white dark:bg-gray-800' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'}`}>
          <Icon size={20} />
        </div>
        <span className={`font-bold text-sm ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{label}</span>
      </div>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
        selected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-700'
      }`}>
        {selected && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary p-5 flex justify-between items-center text-white shadow-md">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Download className="w-5 h-5" /> 
            Esporta Dati
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Cosa desideri scaricare?</p>
          
          <div className="space-y-3">
            <SelectionItem id="notes" label="Note Personali" icon={FileText} selected={selections.notes} />
            <SelectionItem id="pressure" label="Pressione Arteriosa" icon={Activity} selected={selections.pressure} />
            <SelectionItem id="weight" label="Andamento Peso" icon={Scale} selected={selections.weight} />
            <SelectionItem id="medications" label="Catalogo Farmaci" icon={Pill} selected={selections.medications} />
          </div>

          <div className="pt-4">
            <button 
              onClick={handleExport}
              disabled={!hasSelection}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={18} />
              SCARICA CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDataModal;
