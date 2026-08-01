
import React, { useState, useMemo } from 'react';
import { Pill, CheckCircle2, XCircle, ChevronLeft, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import { Medication, IntakeLog } from '../types';

interface StatsViewProps {
  medications: Medication[];
  logs: IntakeLog[];
}

const StatsView: React.FC<StatsViewProps> = ({ medications, logs }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  // Helper per calcolare i giorni di un mese
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper per verificare se un farmaco era previsto in una certa data (isMedicationDue semplificato)
  const isMedicationDueOnDate = (med: Medication, dateIso: string) => {
    const start = med.startDate;
    if (dateIso < start) return false;

    const [y, m, d] = dateIso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const [sy, sm, sd] = start.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);

    let occurrenceIndex = 0;

    if (med.frequency === 'weekly') {
      if (med.dayOfWeek !== date.getDay()) return false;
      let firstOccurrence = new Date(startDate);
      while (firstOccurrence.getDay() !== med.dayOfWeek) {
        firstOccurrence.setDate(firstOccurrence.getDate() + 1);
      }
      if (date < firstOccurrence) return false;
      occurrenceIndex = Math.round((date.getTime() - firstOccurrence.getTime()) / (7 * 24 * 60 * 60 * 1000));
    } else if (med.frequency === 'monthly') {
      if (med.dayOfMonth !== d) return false;
      occurrenceIndex = (y - sy) * 12 + (m - sm);
      if (sd > med.dayOfMonth) occurrenceIndex--;
      if (occurrenceIndex < 0) return false;
    } else {
      // daily
      occurrenceIndex = Math.round((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    }

    if (med.durationDays && med.durationDays > 0 && occurrenceIndex >= med.durationDays) return false;

    return true;
  };

  const stats = useMemo(() => {
    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const prefix = `${selectedYear}-${monthStr}`;
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

    const filteredLogs = logs.filter(l => l.date.startsWith(prefix));

    // Per calcolare i "pendenti" storici, dobbiamo scansionare ogni giorno del mese
    // e ogni orario di ogni farmaco per vedere se c'è un log.
    // Solo per date <= oggi.
    const now = new Date();
    const todayIso = now.toISOString().split('T')[0];

    const medStats = medications.map(med => {
      let mTaken = 0;
      let mSkipped = 0;
      let mPending = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateIso = `${selectedYear}-${monthStr}-${String(day).padStart(2, '0')}`;

        // Non contiamo i pendenti per il futuro
        if (dateIso > todayIso) break;

        if (isMedicationDueOnDate(med, dateIso)) {
          med.schedule.forEach(slot => {
            const time = slot.time.length === 5 ? slot.time : `0${slot.time}`.slice(-5);
            const log = filteredLogs.find(l =>
              String(l.medicationId) === String(med.id) &&
              l.date === dateIso &&
              (l.time.length === 5 ? l.time : `0${l.time}`.slice(-5)) === time
            );

            if (log) {
              if (log.status === 'taken') mTaken++;
              else if (log.status === 'skipped') mSkipped++;
            } else {
              mPending++;
            }
          });
        }
      }

      return {
        ...med,
        taken: mTaken,
        skipped: mSkipped,
        pending: mPending,
        total: mTaken + mSkipped + mPending
      };
    }).filter(m => m.total > 0);

    const totalTaken = medStats.reduce((acc, m) => acc + m.taken, 0);
    const totalSkipped = medStats.reduce((acc, m) => acc + m.skipped, 0);
    const totalPending = medStats.reduce((acc, m) => acc + m.pending, 0);

    return {
      totalTaken,
      totalSkipped,
      totalPending,
      medStats
    };
  }, [logs, medications, selectedMonth, selectedYear]);

  const adherenceRate = useMemo(() => {
    const total = stats.totalTaken + stats.totalSkipped + stats.totalPending;
    if (total === 0) return 0;
    return Math.round((stats.totalTaken / total) * 100);
  }, [stats]);

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Month Selector */}
      <div className="bg-white dark:bg-dark-surface p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-[calc(4rem+env(safe-area-inset-top))] z-40 backdrop-blur-md bg-white/90 dark:bg-dark-surface/90">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-primary border border-gray-100 dark:border-gray-700">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-black uppercase tracking-widest text-primary">{months[selectedMonth]}</span>
          <span className="text-xs font-bold text-gray-400">{selectedYear}</span>
        </div>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-primary border border-gray-100 dark:border-gray-700">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-dark-surface p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-2">
            <CheckCircle2 size={20} />
          </div>
          <span className="text-xl font-black text-gray-800 dark:text-white leading-none">{stats.totalTaken}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">Assunti</span>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-2">
            <XCircle size={20} />
          </div>
          <span className="text-xl font-black text-gray-800 dark:text-white leading-none">{stats.totalSkipped}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">Saltati</span>
        </div>
        <div className="bg-white dark:bg-dark-surface p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-2">
            <Clock size={20} />
          </div>
          <span className="text-xl font-black text-gray-800 dark:text-white leading-none">{stats.totalPending}</span>
          <span className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-tighter">Mancanti</span>
        </div>
      </div>

      {/* Adherence Rate Card */}
      <div className="bg-gradient-to-br from-primary to-blue-700 p-6 rounded-3xl shadow-lg text-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest">Aderenza Terapia</h3>
          </div>
          <span className="text-3xl font-black">{adherenceRate}%</span>
        </div>
        <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden mb-2">
          <div className="bg-white h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${adherenceRate}%` }}></div>
        </div>
        <p className="text-[10px] font-bold opacity-80 text-center uppercase tracking-tighter">Percentuale di assunzioni portate a termine</p>
      </div>

      {/* Detailed List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Dettaglio Farmaci</h3>
        {stats.medStats.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface p-10 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
            <p className="text-sm text-gray-400 italic">Nessun dato registrato per questo mese</p>
          </div>
        ) : (
          stats.medStats.map(med => (
            <div key={med.id} className="bg-white dark:bg-dark-surface p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 group transition-all">
              <div className="flex items-center gap-4">
                <div className={`${med.color} p-3 rounded-2xl text-white shadow-sm ring-4 ring-gray-50 dark:ring-gray-800/50 group-hover:scale-105 transition-transform`}>
                  <Pill size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-800 dark:text-white truncate leading-none mb-1">{med.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{med.dosage} {med.unit}</p>
                </div>
                <div className="flex gap-2.5 text-right">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-green-500">{med.taken}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Ass.</span>
                  </div>
                  <div className="flex flex-col items-center border-l dark:border-gray-800 pl-2.5">
                    <span className="text-sm font-black text-red-500">{med.skipped}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Salt.</span>
                  </div>
                  <div className="flex flex-col items-center border-l dark:border-gray-800 pl-2.5">
                    <span className="text-sm font-black text-amber-500">{med.pending}</span>
                    <span className="text-[8px] font-bold text-gray-400 uppercase">Man.</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StatsView;
