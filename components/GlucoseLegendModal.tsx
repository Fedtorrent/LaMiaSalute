
import React from 'react';
import { X, Info } from 'lucide-react';
import glucoseChart from '../assets/VALORI SOGLIA DEL DIABETE.jpg';

interface GlucoseLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlucoseLegendModal: React.FC<GlucoseLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center text-white shadow-md">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Info className="w-5 h-5" />
            Valori Glicemici
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[70vh]">
           <img
             src={glucoseChart}
             alt="Tabella Valori Glicemia"
             className="w-full h-auto rounded-lg shadow-sm border border-gray-100 dark:border-gray-800"
           />
           <p className="text-[10px] text-gray-400 mt-4 text-center italic uppercase font-bold tracking-widest">
             Le informazioni fornite sono a scopo puramente informativo.
             Consulta sempre il tuo medico per una diagnosi corretta.
           </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-center border-t dark:border-gray-800">
           <button
             onClick={onClose}
             className="w-full py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all active:scale-[0.98] uppercase text-xs tracking-widest"
           >
             Ho capito
           </button>
        </div>
      </div>
    </div>
  );
};

export default GlucoseLegendModal;
