import React, { useState } from 'react';
import { 
  Bell, Moon, Sun, Download, 
  ChevronRight, Database, Upload, ShieldAlert, FileText, FolderArchive, Search, Info, X, ExternalLink
} from 'lucide-react';

interface SettingsViewProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onExportData: () => void;
  onViewDisclaimer: () => void;
  onBackup: () => void;
  onRestore: (data: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  onToggleTheme,
  notificationsEnabled,
  onToggleNotifications,
  onExportData,
  onViewDisclaimer,
  onBackup,
  onRestore
}) => {
  const [showNotifyInfo, setShowNotifyInfo] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onRestore(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Group 1: Personalizzazione & Notifiche */}
      <section className="space-y-3">
        <h3 className="px-4 pt-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferenze App</h3>
        <div className="bg-white dark:bg-dark-surface rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          
          {/* Notifications Row */}
          <div className="flex items-center gap-4 p-5">
            <div
              onClick={onToggleNotifications}
              className={`p-3 rounded-2xl cursor-pointer transition-colors ${notificationsEnabled ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}
            >
              <Bell size={22} />
            </div>
            <div className="flex-1 flex flex-col cursor-pointer" onClick={onToggleNotifications}>
              <div className="flex items-center gap-2">
                <span className="font-black text-gray-800 dark:text-white text-sm">Notifiche Promemoria</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowNotifyInfo(!showNotifyInfo); }}
                  className={`p-1 rounded-full transition-colors ${showNotifyInfo ? 'bg-primary text-white' : 'text-primary hover:bg-primary/10'}`}
                >
                  <Info size={14} strokeWidth={3} />
                </button>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {notificationsEnabled ? 'Riceverai avvisi per i farmaci' : 'Nessun avviso attivo'}
              </span>
            </div>
            <button
              onClick={onToggleNotifications}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative shrink-0 ${notificationsEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${notificationsEnabled ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>

          {/* Info Banner for Notifications */}
          {showNotifyInfo && (
            <div className="mx-5 mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 animate-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Consigli per le Notifiche</h4>
                <button onClick={() => setShowNotifyInfo(false)} className="text-blue-400 hover:text-blue-600"><X size={14}/></button>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed space-y-2">
                Per assicurarti di non perdere mai un promemoria:<br/>
                <span className="font-bold">1.</span> Verifica che il volume <span className="font-bold">"Notifiche"</span> del telefono sia alto.<br/>
                <span className="font-bold">2.</span> Vai in <span className="italic">Impostazioni &gt; App &gt; La Mia Salute &gt; Notifiche</span> e attiva l'opzione <span className="font-bold text-blue-600 dark:text-blue-400">"Prioritaria"</span> o <span className="font-bold text-blue-600 dark:text-blue-400">"Ignora Non disturbare"</span> per il canale "Promemoria Farmaci".
              </p>
            </div>
          )}

          <div className="h-[1px] bg-gray-50 dark:bg-gray-800 mx-5" />

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
          >
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-orange-100 text-orange-500'}`}>
              {darkMode ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div className="flex-1">
              <span className="block font-black text-gray-800 dark:text-white text-sm">Aspetto Interfaccia</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {darkMode ? 'Modalità Scura attiva' : 'Modalità Chiara attiva'}
              </span>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-colors relative ${darkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`}></div>
            </div>
          </button>
        </div>
      </section>

      {/* Group 2: Dati & Backup */}
      <section className="space-y-3">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dati & Backup Locali</h3>
        <div className="bg-white dark:bg-dark-surface rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          
          {/* Backup Button */}
          <button
            onClick={onBackup}
            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
          >
            <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-2xl">
              <Database size={22} />
            </div>
            <div className="flex-1">
              <span className="block font-black text-gray-800 dark:text-white text-sm">Esegui Backup Completo</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Scarica file JSON di sicurezza</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>

          <div className="h-[1px] bg-gray-50 dark:bg-gray-800 mx-5" />

          {/* Restore Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
          >
            <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 rounded-2xl">
              <Upload size={22} />
            </div>
            <div className="flex-1">
              <span className="block font-black text-gray-800 dark:text-white text-sm">Ripristina Backup</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Carica un file JSON salvato</span>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".json"
            />
            <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>

          <div className="h-[1px] bg-gray-50 dark:bg-gray-800 mx-5" />

          {/* Export CSV Data */}
          <button
            onClick={onExportData}
            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
          >
            <div className="p-3 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-2xl">
              <Download size={22} />
            </div>
            <div className="flex-1">
              <span className="block font-black text-gray-800 dark:text-white text-sm">Esporta i Dati in CSV</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Crea File per Excel o simili</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </section>

      {/* Group 3: Info App */}
      <section className="space-y-3">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Info App</h3>
        <div className="bg-white dark:bg-dark-surface rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">

          {/* Version Info Row */}
          <div className="flex items-center gap-4 p-5 bg-gray-50/50 dark:bg-gray-800/30">
            <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-2xl">
              <Info size={22} />
            </div>
            <div className="flex-1">
              <span className="block font-black text-gray-800 dark:text-white text-sm">Versione Applicazione</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">1.0.0</span>
            </div>
          </div>

          <div className="h-[1px] bg-gray-50 dark:bg-gray-800 mx-5" />

          {/* View Disclaimer (Moved here) */}
          <button
            onClick={onViewDisclaimer}
            className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
          >
            <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-2xl">
              <ShieldAlert size={22} />
            </div>
            <div className="flex-1">
              <span className="block font-black text-gray-800 dark:text-white text-sm">Note Legali & Disclaimer</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Informativa sulla responsabilità e dati</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
          </button>

          <div className="h-[1px] bg-gray-50 dark:bg-gray-800 mx-5" />

          {/* Sviluppato da Section (Replicated from Spese 730) */}
          <div className="p-6 flex flex-col items-center gap-1">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Sviluppato da</p>
            <a
              href="https://fedtorrent.github.io/LeMieApp.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2 active:scale-95 transition-all p-4 rounded-[2rem] bg-gray-50/50 dark:bg-gray-800/20 border border-transparent hover:border-primary/20"
            >
              <img
                src="IconaPersonale.png"
                alt="Firma Programmatore"
                className="h-16 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 dark:bg-primary/10 text-[10px] text-primary font-black uppercase tracking-wider border border-primary/10">
                <span>Visita il sito</span>
                <ExternalLink size={12} strokeWidth={3} />
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
