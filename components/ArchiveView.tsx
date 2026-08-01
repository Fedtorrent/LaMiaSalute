import React from 'react';
import { FolderSearch, ExternalLink } from 'lucide-react';

interface ArchiveViewProps {
  onNavigate: (view: any) => void;
  onBack: () => void;
  activePatientName: string;
  recordsFolderLink?: string;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({
  activePatientName,
  recordsFolderLink
}) => {
  const handleOpenFolder = () => {
    if (recordsFolderLink) {
      window.open(recordsFolderLink, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300 relative">
      
      {/* TESTATA INTERNA FISSA (Paziente) */}
      <div className="fixed top-[4rem] left-0 right-0 z-30 bg-background/95 dark:bg-dark-bg/95 backdrop-blur-md px-4 pt-4 pb-4 border-b dark:border-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Paziente: <span className="text-primary">{activePatientName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Spaziatore per compensare la testata fissa */}
      <div className="h-[70px]"></div>

      {/* Contenuto Centrale */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
          <FolderSearch size={48} strokeWidth={1.5} />
        </div>
        
        <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-4 leading-tight">
          Archivio Cloud <br /> <span className="text-primary">Referti Medici</span>
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-10 leading-relaxed">
          Accedi alla tua cartella protetta su Google Drive o Dropbox per consultare tutti i tuoi documenti medici originali.
        </p>

        {recordsFolderLink ? (
          <button 
            onClick={handleOpenFolder}
            className="group relative w-full max-w-sm bg-primary text-white py-6 rounded-3xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <ExternalLink size={22} strokeWidth={3} />
            APRI CARTELLA CLOUD
          </button>
        ) : (
          <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border-2 border-dashed border-amber-200 dark:border-amber-900/30 rounded-3xl w-full max-w-sm">
            <p className="text-amber-600 dark:text-amber-400 text-xs font-bold leading-relaxed">
              ⚠️ Nessun link configurato. <br />
              Vai nelle impostazioni del profilo paziente per inserire il link alla cartella dei referti.
            </p>
          </div>
        )}

        <div className="mt-12 p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20 max-w-xs">
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">Nota di Sicurezza</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
            I file vengono aperti esternamente al sicuro nel tuo browser o nell'app del tuo provider cloud preferito.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;
