
import React from 'react';
import { X, Info } from 'lucide-react';

interface BPLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BPLegendModal: React.FC<BPLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const legendData = [
    { label: 'Ottimale', sys: '< 120', dia: '< 80', color: 'bg-blue-500', text: 'text-white' },
    { label: 'Normale', sys: '120-129', dia: '80-84', color: 'bg-cyan-400', text: 'text-gray-900' },
    { label: 'Ai limiti superiori', sys: '130-139', dia: '85-89', color: 'bg-green-500', text: 'text-white' },
    { label: 'Ipertensione lieve', sys: '140-159', dia: '90-99', color: 'bg-yellow-500', text: 'text-gray-900' },
    { label: 'Ipertensione media', sys: '160-179', dia: '100-109', color: 'bg-orange-500', text: 'text-white' },
    { label: 'Ipertensione severa', sys: '≥ 180', dia: '≥ 110', color: 'bg-red-600', text: 'text-white' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center text-white shadow-md">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Info className="w-5 h-5" /> 
            Valori di Riferimento
          </h2>
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
             Classificazione della pressione arteriosa (linee guida ESH/ESC). Il colore è determinato dal valore più alto tra sistolica e diastolica.
           </p>

           <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-sm">
              <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-gray-100 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-200 p-2 border-b border-gray-200 dark:border-gray-700">
                 <div>Categoria</div>
                 <div className="text-center">Min (PAD)</div>
                 <div className="text-center">Max (PAS)</div>
              </div>
              
              {legendData.map((item, idx) => (
                <div key={idx} className={`${item.color} ${item.text} grid grid-cols-[1.5fr_1fr_1fr] p-2.5 items-center border-b border-white/10 last:border-0`}>
                   <div className="font-bold leading-tight">{item.label}</div>
                   <div className="text-center font-mono">{item.dia}</div>
                   <div className="text-center font-mono">{item.sys}</div>
                </div>
              ))}
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-center">
           <button 
             onClick={onClose}
             className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors"
           >
             Chiudi
           </button>
        </div>
      </div>
    </div>
  );
};

export default BPLegendModal;
