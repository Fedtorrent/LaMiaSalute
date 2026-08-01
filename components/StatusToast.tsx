
import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface StatusToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const StatusToast: React.FC<StatusToastProps> = ({ show, message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  if (!show) return null;

  const config = {
    success: {
      icon: <CheckCircle2 size={20} className="text-green-500" />,
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800'
    },
    error: {
      icon: <XCircle size={20} className="text-red-500" />,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-100 dark:border-red-800'
    },
    info: {
      icon: <Info size={20} className="text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-800'
    }
  };

  const { icon, bg, border } = config[type];

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`${bg} ${border} border backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-3`}>
        <div className="shrink-0">
          {icon}
        </div>
        <p className="text-sm font-bold text-gray-800 dark:text-white flex-1 leading-tight">
          {message}
        </p>
      </div>
    </div>
  );
};

export default StatusToast;
