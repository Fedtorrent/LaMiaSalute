import React, { useState, useMemo, useEffect } from 'react';
import { X, Edit2, Trash2, Check, Search, Save } from 'lucide-react';
import { AnalysisItem } from '../types';
import ScrollingName from './ScrollingName';

interface ManageAnalysisNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisItems: AnalysisItem[];
  onRename: (oldName: string, newName: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

const ManageAnalysisNamesModal: React.FC<ManageAnalysisNamesModalProps> = ({
  isOpen,
  onClose,
  analysisItems,
  onRename,
  onDelete
}) => {
  const [searchTerm, setSearchQuery] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const uniqueNames = useMemo(() => {
    const names = analysisItems.map(i => i.name);
    return Array.from(new Set(names)).sort();
  }, [analysisItems]);

  // Svuota la ricerca ogni volta che il modale viene aperto
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setEditingName(null);
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

  const handleSaveRename = async () => {
    if (editingName && newName.trim() && newName !== editingName) {
      await onRename(editingName, newName.trim());
    }
    setEditingName(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">

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
                      className="flex-1 bg-white dark:bg-gray-700 border-2 border-blue-500 rounded-lg px-3 py-1 text-sm font-bold dark:text-white outline-none"
                    />
                    <button onClick={handleSaveRename} className="p-2 bg-green-500 text-white rounded-lg"><Check size={16} strokeWidth={3}/></button>
                    <button onClick={() => setEditingName(null)} className="p-2 bg-gray-300 dark:bg-gray-600 text-white rounded-lg"><X size={16}/></button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <ScrollingName
                        name={name}
                        className="font-bold text-sm dark:text-gray-200"
                      />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleStartEdit(name)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => onDelete(name)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16}/></button>
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
      </div>
    </div>
  );
};

export default ManageAnalysisNamesModal;
