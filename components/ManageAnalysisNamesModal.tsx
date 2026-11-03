import React, { useState, useMemo, useEffect } from 'react';
import { X, Edit2, Trash2, Check, Search, AlertTriangle } from 'lucide-react';
import { AnalysisItem } from '../types';
import ScrollingName from './ScrollingName';

interface ManageAnalysisNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisNames?: string[];
  analysisItems?: AnalysisItem[];
  onRename: (oldName: string, newName: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

const ManageAnalysisNamesModal: React.FC<ManageAnalysisNamesModalProps> = ({
  isOpen,
  onClose,
  analysisNames,
  analysisItems = [],
  onRename,
  onDelete
}) => {
  const [searchTerm, setSearchQuery] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Stati per la conferma della modifica ed eliminazione
  const [renameTarget, setRenameTarget] = useState<{ oldName: string; newName: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const uniqueNames = useMemo(() => {
    if (analysisNames) return [...analysisNames].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
    const names = analysisItems.map(i => i.name).filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }, [analysisNames, analysisItems]);

  // Svuota la ricerca e gli stati di modifica quando il modale viene aperto/chiuso
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setEditingName(null);
      setRenameTarget(null);
      setDeleteTarget(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const filteredNames = useMemo(() => {
    return uniqueNames.filter(name =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueNames, searchTerm]);

  if (!isOpen) return null;

  const handleStartEdit = (name: string) => {
    setEditingName(name);
    setNewName(name);
  };

  const handleRequestSaveRename = () => {
    if (editingName && newName.trim() && newName.trim() !== editingName) {
      setRenameTarget({ oldName: editingName, newName: newName.trim() });
    } else {
      setEditingName(null);
    }
  };

  const handleConfirmRename = async () => {
    if (!renameTarget) return;
    setIsProcessing(true);
    try {
      await onRename(renameTarget.oldName, renameTarget.newName);
      setRenameTarget(null);
      setEditingName(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 relative">

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black tracking-tight">Gestione Nomi Analisi</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {/* Search */}
        <div className="p-4 border-b dark:border-gray-800">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca nome analisi..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredNames.length === 0 ? (
            <p className="text-center py-10 text-gray-400 italic text-sm">Nessun nome trovato.</p>
          ) : (
            filteredNames.map(name => (
              <div key={name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 group">
                {editingName === name ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRequestSaveRename();
                        if (e.key === 'Escape') setEditingName(null);
                      }}
                      className="flex-1 bg-white dark:bg-gray-700 border-2 border-blue-500 rounded-lg px-3 py-1 text-sm font-bold dark:text-white outline-none"
                    />
                    <button onClick={handleRequestSaveRename} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><Check size={16} strokeWidth={3}/></button>
                    <button onClick={() => setEditingName(null)} className="p-2 bg-gray-300 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-400 transition-colors"><X size={16}/></button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <ScrollingName
                        name={name}
                        className="font-bold text-sm dark:text-gray-200"
                      />
                    </div>
                    <div className="flex gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleStartEdit(name)} title="Modifica nome" className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => setDeleteTarget(name)} title="Elimina dai nomi proposti" className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t dark:border-gray-800 flex justify-center shrink-0">
          <button onClick={onClose} className="w-full py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-black text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 transition-all uppercase tracking-widest">
            Chiudi
          </button>
        </div>

        {/* Modal Avviso Conferma Modifica */}
        {renameTarget && (
          <div className="absolute inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 text-center space-y-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-800 dark:text-white">Modifica Nome Analisi</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                La modifica interesserà <strong>solo i nuovi inserimenti</strong>.<br />
                Le analisi già inserite nel database rimarranno con il nome originale ("{renameTarget.oldName}").
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                Nuovo nome: <span className="text-blue-600 dark:text-blue-400 font-black">{renameTarget.newName}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  disabled={isProcessing}
                  onClick={() => setRenameTarget(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Annulla
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleConfirmRename}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1"
                >
                  {isProcessing ? 'Salvataggio...' : 'Conferma'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Avviso Conferma Eliminazione */}
        {deleteTarget && (
          <div className="absolute inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-800 dark:text-white">Elimina Nome Analisi</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Le analisi già inserite con il nome "<strong>{deleteTarget}</strong>" <strong>lo manterranno nel database</strong>, ma non verrà più proposto nella lista dei nomi per i nuovi inserimenti.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  disabled={isProcessing}
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Annulla
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-1"
                >
                  {isProcessing ? 'Eliminazione...' : 'Elimina'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManageAnalysisNamesModal;
