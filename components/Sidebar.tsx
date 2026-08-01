import React from 'react';
import { X, Settings, Moon, Sun, Pill, Heart, Mail, Download, Bell, BarChart3, Users, Plus, UserCircle, Edit2, Trash2, Menu, FileText, FolderArchive, ChevronRight, Database } from 'lucide-react';
import { Medication, Patient } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: any) => void;
  patients: Patient[];
  activePatientId: string | null;
  onSelectPatient: (id: string) => void;
  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (id: string) => void;
  onRequestMeds: () => void;
  onGenerateReport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectPatient,
  onAddPatient,
  onEditPatient,
  onDeletePatient,
  onRequestMeds,
  onGenerateReport,
  patients,
  activePatientId
}) => {
  const [isPatientsExpanded, setIsPatientsExpanded] = React.useState(false);

  // Reset expanded state when sidebar opens
  React.useEffect(() => {
    if (isOpen) {
      setIsPatientsExpanded(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-white dark:bg-gray-900 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-primary to-blue-700 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center">
            <h2 className="text-xl font-black tracking-tight">Menù</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* PATIENT SWITCHER SECTION */}
          <div className="space-y-2">
            <button
              onClick={() => setIsPatientsExpanded(!isPatientsExpanded)}
              className="w-full flex items-center justify-between px-1 mx-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 py-1 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">I Miei Profili</span>
              </div>
              <ChevronRight size={14} className={`text-gray-400 transition-transform duration-300 ${isPatientsExpanded ? 'rotate-90' : ''}`} />
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${isPatientsExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3 mt-1">
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {patients.length === 0 ? (
                    <p className="text-[10px] text-gray-500 italic px-1">Nessun profilo creato</p>
                  ) : (
                    patients.map(p => (
                      <div key={p.id} className="flex items-center gap-2 group">
                        <button
                          onClick={() => onSelectPatient(p.id)}
                          className={`flex-1 flex items-center gap-3 p-2.5 rounded-xl transition-all ${activePatientId === p.id ? 'bg-white dark:bg-gray-700 shadow-sm border border-primary/20 ring-1 ring-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent opacity-60'}`}
                        >
                          <div className={`w-3 h-3 rounded-full ${p.color} ring-2 ring-offset-2 dark:ring-offset-gray-800 ${activePatientId === p.id ? 'ring-primary' : 'ring-transparent'}`}></div>
                          <span className={`text-xs font-bold truncate ${activePatientId === p.id ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                            {p.name}
                          </span>
                          {activePatientId === p.id && (
                            <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                          )}
                        </button>
                        <div className="flex gap-0.5 opacity-50 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            onClick={() => onEditPatient(p)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg"
                            title="Modifica"
                          >
                            <Edit2 size={12} />
                          </button>
                          {p.id !== 'p-default' && (
                            <button
                              onClick={() => onDeletePatient(p.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg"
                              title="Elimina"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {/* Botton Aggiungi Profilo - In fondo alla lista */}
                  <button
                    onClick={onAddPatient}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group/add mt-1"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover/add:bg-primary/10 transition-colors">
                      <Plus size={14} strokeWidth={3} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 group-hover/add:text-primary transition-colors">Aggiungi Profilo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 px-1 mb-1">
              <Menu size={16} className="text-primary" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Navigazione</span>
            </div>

            {/* Impostazioni */}
            <button
              onClick={() => { onNavigate('settings'); onClose(); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg text-gray-600 dark:text-gray-300 group-hover:rotate-90 transition-transform duration-500">
                <Settings size={20} />
              </div>
              <div className="flex-1">
                <span className="block font-bold text-gray-800 dark:text-white text-sm">Impostazioni</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 italic">Personalizza, Export e Backup</span>
              </div>
            </button>

            {/* Statistiche */}
            <button
              onClick={() => { onNavigate('stats'); onClose(); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="bg-orange-100 dark:bg-orange-900/40 p-2 rounded-lg text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                <BarChart3 size={20} />
              </div>
              <div>
                <span className="block font-bold text-gray-800 dark:text-white text-sm">Statistiche</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Analisi assunzioni</span>
              </div>
            </button>

            {/* Catalogo Farmaci */}
            <button
              onClick={() => { onNavigate('inventory'); onClose(); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Pill size={20} />
              </div>
              <div>
                <span className="block font-bold text-gray-800 dark:text-white text-sm">Catalogo Farmaci</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Gestisci scorte e dosaggi</span>
              </div>
            </button>

            {/* Mail Richiesta Ricetta */}
            <button
              onClick={() => { onRequestMeds(); onClose(); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Mail size={20} />
              </div>
              <div>
                <span className="block font-bold text-gray-800 dark:text-white text-sm">Richiesta Ricetta</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Elenco per il medico</span>
              </div>
            </button>

            {/* Archivio Referti ed Esami */}
            <button
              onClick={() => { onNavigate('archive'); onClose(); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                <FolderArchive size={20} />
              </div>
              <div>
                <span className="block font-bold text-gray-800 dark:text-white text-sm">Archivio Referti ed Esami</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Documenti ed esami salvati</span>
              </div>
            </button>

            {/* Database Esami */}
            <button
              onClick={() => { onNavigate('analysis_db'); onClose(); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Database size={20} />
              </div>
              <div>
                <span className="block font-bold text-gray-800 dark:text-white text-sm">DataBase Esami</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Storico valori clinici</span>
              </div>
            </button>

            {/* Esporta Report PDF */}
            <button
              onClick={() => { onGenerateReport(); onClose(); }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
            >
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <FileText size={20} />
              </div>
              <div>
                <span className="block font-bold text-gray-800 dark:text-white text-sm">Esporta Report in PDF</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Crea ed Esporta i tuoi Report</span>
              </div>
            </button>

          </div>
        </div>

        {/* Bottom Section: Footer */}
        <div className="p-4 pt-0 shrink-0">
          <div className="px-2 flex flex-col items-center gap-1">
            {/* Spazio vuoto come richiesto */}
          </div>
        </div>

      </div>
    </>
  );
};

export default Sidebar;
