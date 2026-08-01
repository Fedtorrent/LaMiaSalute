import React from 'react';
import { X, ShieldAlert, Check, XCircle } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  mode: 'first-launch' | 'view-only';
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose, onAccept, onDecline, mode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">

        {/* Header */}
        <div className="bg-primary p-6 flex justify-between items-center text-white shadow-md shrink-0">
          <h2 className="font-black text-xl flex items-center gap-3 uppercase tracking-tighter">
            <ShieldAlert className="w-6 h-6" />
            La Mia Salute
          </h2>
          {mode === 'view-only' && (
            <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
              <X size={24}/>
            </button>
          )}
        </div>

{/* Content */}
<div className="p-8 overflow-y-auto space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
  {/* Titolo centrato */}
  <div className="text-center space-y-1">
    <h3 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-widest">
      Informativa e Disclaimer
    </h3>
  </div>

  {/* Testo allineato a sinistra */}
  <div className="space-y-4">
    <p>
      Questa applicazione non è un dispositivo medico. I dati inseriti restano esclusivamente sul tuo dispositivo.
      Lo sviluppatore non si assume alcuna responsabilità per l'uso delle informazioni fornite o per eventuali decisioni mediche prese dall'utente.
    </p>

    <div className="italic space-y-3">
      <p>
        <strong>1. Nessuna responsabilità medica</strong><br />
        Questa app serve solo a registrare i tuoi dati sanitari e a fornire link a foglietti illustrativi di farmaci.
        Le informazioni non sostituiscono il parere di un medico. Qualsiasi decisione sulla tua salute deve essere presa dopo aver consultato un professionista sanitario. L’app non risponde di danni derivanti dal suo utilizzo.
      </p>

      <p>
        <strong>2. Dati sanitari: restano solo sul tuo dispositivo</strong><br />
        Tutti i dati che inserisci vengono salvati esclusivamente in locale sul tuo telefono/tablet.
        Nessun dato viene inviato a me (sviluppatore) né a server esterni.
        I backup li gestisci tu manualmente su supporti fisici (es. scheda SD, computer). Sei l’unico responsabile della loro sicurezza e riservatezza.
      </p>

      <p>
        <strong>3. Link ai foglietti illustrativi</strong><br />
        I link portano a siti esterni (es. AIFA, EMA). Quando clicchi su un link, lasci l’app. L’app non condivide i tuoi dati sanitari con quei siti. Leggi le loro privacy policy per i dettagli.
      </p>

      <p>
        <strong>4. Dati tecnici</strong><br />
        L’app non raccoglie indirizzi IP, identificatori di dispositivo, statistiche di utilizzo o crash report.
      </p>

      <p>
        <strong>5. Tuoi diritti</strong><br />
        Poiché i tuoi dati restano solo sul tuo dispositivo, puoi cancellarli, modificarli o esportarli direttamente dal tuo telefono. Io non posso accedervi.
      </p>

      <p>
        <strong>6. Accettazione</strong><br />
        Proseguendo nell’uso dell’app dichiari di aver letto e compreso quanto sopra.
      </p>
    </div>
  </div>
</div>

        {/* Footer Buttons */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-800 shrink-0">
          {mode === 'first-launch' ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={onAccept}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check size={20} strokeWidth={3} />
                ACCETTO E CONTINUO
              </button>
              <button
                onClick={onDecline}
                className="w-full py-3 bg-white dark:bg-dark-surface text-red-500 border-2 border-red-500/20 rounded-2xl font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <XCircle size={16} />
                NON ACCETTO
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              OK, HO CAPITO
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
