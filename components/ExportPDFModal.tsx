import React, { useState, useEffect } from 'react';
import { X, FileText, Check, ChevronRight, Loader2 } from 'lucide-react';

interface ExportPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selections: PDFExportSelections) => Promise<void>;
  patientName: string;
}

export interface PDFExportSelections {
  medications: boolean;
  pressure: boolean;
  weight: boolean;
  glucose: boolean;
  pressureCount: 10 | 20 | 50;
  weightCount: 10 | 20 | 50;
  glucoseCount: 10 | 20 | 50;
}

const ExportPDFModal: React.FC<ExportPDFModalProps> = ({ isOpen, onClose, onExport, patientName }) => {
  const [selections, setSelections] = useState<PDFExportSelections>({
    medications: false,
    pressure: false,
    weight: false,
    glucose: false,
    pressureCount: 20,
    weightCount: 20,
    glucoseCount: 20
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset delle selezioni ogni volta che il modale viene aperto
  useEffect(() => {
    if (isOpen) {
      setSelections({
        medications: false,
        pressure: false,
        weight: false,
        glucose: false,
        pressureCount: 20,
        weightCount: 20,
        glucoseCount: 20
      });
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      await onExport(selections);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAll = () => {
    const allActive = selections.medications && selections.pressure && selections.weight && selections.glucose;
    setSelections({
      ...selections,
      medications: !allActive,
      pressure: !allActive,
      weight: !allActive,
      glucose: !allActive
    });
  };

  const labelClass = "text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1";

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-white/20">

        {/* Header */}
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl"><FileText size={24} /></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Esporta Report PDF</h2>
              <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest opacity-80">Per {patientName}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isProcessing} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={24}/>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">

          <button
            onClick={toggleAll}
            className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
          >
            {selections.medications && selections.pressure && selections.weight ? 'Deseleziona Tutto' : 'Seleziona Tutti i Report'}
          </button>

          <div className="space-y-4">
            <label className={labelClass}>Scegli i documenti da generare</label>

            {/* Piano Terapeutico */}
            <div
              onClick={() => setSelections({...selections, medications: !selections.medications})}
              className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selections.medications ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 opacity-60'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${selections.medications ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                <FileText size={24} />
              </div>
              <div className="flex-1">
                <h3 className={`font-black text-sm ${selections.medications ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>Piano Terapeutico</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Farmaci Attivi</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selections.medications ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                {selections.medications && <Check size={14} strokeWidth={4} />}
              </div>
            </div>

            {/* Pressione Arteriosa */}
            <div className="space-y-3">
              <div
                onClick={() => setSelections({...selections, pressure: !selections.pressure})}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selections.pressure ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 opacity-60'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${selections.pressure ? 'bg-red-500' : 'bg-gray-400'}`}>
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-black text-sm ${selections.pressure ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>Valori Pressione</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Andamento pressorio</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selections.pressure ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                  {selections.pressure && <Check size={14} strokeWidth={4} />}
                </div>
              </div>
              {selections.pressure && (
                <div className="px-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Esporta ultimi:</span>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {[10, 20, 50].map(n => (
                      <button
                        key={n}
                        onClick={() => setSelections({...selections, pressureCount: n as any})}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${selections.pressureCount === n ? 'bg-white dark:bg-gray-700 text-red-500 shadow-sm' : 'text-gray-400'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Andamento Peso */}
            <div className="space-y-3">
              <div
                onClick={() => setSelections({...selections, weight: !selections.weight})}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selections.weight ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 opacity-60'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${selections.weight ? 'bg-blue-500' : 'bg-gray-400'}`}>
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-black text-sm ${selections.weight ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>Valori Peso</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Storico pesate</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selections.weight ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                  {selections.weight && <Check size={14} strokeWidth={4} />}
                </div>
              </div>
              {selections.weight && (
                <div className="px-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Esporta ultimi:</span>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {[10, 20, 50].map(n => (
                      <button
                        key={n}
                        onClick={() => setSelections({...selections, weightCount: n as any})}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${selections.weightCount === n ? 'bg-white dark:bg-gray-700 text-blue-500 shadow-sm' : 'text-gray-400'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Andamento Glicemia */}
            <div className="space-y-3">
              <div
                onClick={() => setSelections({...selections, glucose: !selections.glucose})}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selections.glucose ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 opacity-60'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${selections.glucose ? 'bg-rose-500' : 'bg-gray-400'}`}>
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-black text-sm ${selections.glucose ? 'text-rose-700 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'}`}>Valori Glicemia</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Storico Glicemie</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selections.glucose ? 'bg-rose-500 border-rose-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                  {selections.glucose && <Check size={14} strokeWidth={4} />}
                </div>
              </div>
              {selections.glucose && (
                <div className="px-2 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Esporta ultimi:</span>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {[10, 20, 50].map(n => (
                      <button
                        key={n}
                        onClick={() => setSelections({...selections, glucoseCount: n as any})}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${selections.glucoseCount === n ? 'bg-white dark:bg-gray-700 text-rose-500 shadow-sm' : 'text-gray-400'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t dark:border-gray-800 shrink-0">
          <button
            onClick={handleExport}
            disabled={isProcessing || (!selections.medications && !selections.pressure && !selections.weight && !selections.glucose)}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {isProcessing ? (
              <><Loader2 className="animate-spin" size={20} /> GENERAZIONE IN CORSO...</>
            ) : (
              <><ChevronRight size={20} /> CONFERMA ED ESPORTA</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPDFModal;
