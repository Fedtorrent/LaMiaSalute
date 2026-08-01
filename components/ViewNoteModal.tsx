
import React from 'react';
import { X, Calendar, Clock, FileText } from 'lucide-react';
import { Note } from '../types';

interface ViewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
}

const ViewNoteModal: React.FC<ViewNoteModalProps> = ({ isOpen, onClose, note }) => {
  if (!isOpen || !note) return null;

  // Helper per formattare la data
  const formatDateIT = (isoDate: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center text-white shadow-md shrink-0">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" /> 
            Dettaglio Nota
          </h2>
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
           <div className="flex items-center gap-4 mb-6 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                 <Calendar size={16} className="text-primary"/> 
                 <span className="font-mono font-medium">{formatDateIT(note.date)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                 <Clock size={16} className="text-primary"/> 
                 <span className="font-mono font-medium">{note.time}</span>
              </div>
           </div>

           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
             {note.title}
           </h3>

           <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/20">
             <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-base">
               {note.content}
             </p>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
           >
             Chiudi
           </button>
        </div>

      </div>
    </div>
  );
};

export default ViewNoteModal;
