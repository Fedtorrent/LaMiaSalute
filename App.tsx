import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Plus, Pill, Trash2, Check, Loader2, X, ChevronLeft, ChevronRight, Edit2, StickyNote, Scale, Menu, LineChart, List, Activity, Heart, Info, Settings, Search, AlertCircle, Calendar, Clock, Home, BarChart3, Download, FolderSearch, FileText, Database, Droplets } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Patient, Medication, IntakeLog, AppData, Note, WeightLog, BloodPressureLog, GlucoseLog, ExportSelections, AnalysisSession, AnalysisItem } from './types';
import { db } from './services/db';
import { NotificationService } from './services/notificationService';
import AddMedicationModal from './components/AddMedicationModal';
import AddNoteModal from './components/AddNoteModal';
import AddWeightModal from './components/AddWeightModal';
import AddGlucoseModal from './components/AddGlucoseModal';
import AddBloodPressureModal from './components/AddBloodPressureModal';
import AddPatientModal from './components/AddPatientModal';
import ViewNoteModal from './components/ViewNoteModal';
import SelectMedsModal from './components/SelectMedsModal';
import RequestMedsModal from './components/RequestMedsModal';
import ExportPDFModal, { PDFExportSelections } from './components/ExportPDFModal';
import ExportDataModal from './components/ExportDataModal';
import BPLegendModal from './components/BPLegendModal';
import GlucoseLegendModal from './components/GlucoseLegendModal';
import ConfirmModal from './components/ConfirmModal';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import StatsView from './components/StatsView';
import DisclaimerModal from './components/DisclaimerModal';
import StatusToast from './components/StatusToast';
import { generateMedicationReport, generatePressureReport, generateWeightReport, generateGlucoseReport, saveReportToCache, shareMultipleReports } from './services/reportService';
import { LeafletService } from './services/leafletService';
import ArchiveView from './components/ArchiveView';
import AnalysisDbView from './components/AnalysisDbView';
import AddAnalysisModal from './components/AddAnalysisModal';
import ViewAnalysisModal from './components/ViewAnalysisModal';
import ManageAnalysisNamesModal from './components/ManageAnalysisNamesModal';
import ScrollingName from './components/ScrollingName';


const App = () => {
  const [view, setView] = useState<'home' | 'medications' | 'inventory' | 'notes' | 'weights' | 'glucose' | 'pressure' | 'settings' | 'stats' | 'archive' | 'analysis_db'>('home');

  const [data, setData] = useState<AppData>({
    patients: [], medications: [], logs: [], notes: [], weights: [], glucoseLogs: [], bloodPressureLogs: [], analysisSessions: [], analysisItems: []
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      if (a.id === 'p-default') return -1;
      if (b.id === 'p-default') return 1;
      return 0;
    });
  }, [patients]);

  const [activePatientId, setActivePatientId] = useState<string | null>(() => localStorage.getItem('activePatientId'));

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isViewNoteModalOpen, setIsViewNoteModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isGlucoseModalOpen, setIsGlucoseModalOpen] = useState(false);
  const [isBPModalOpen, setIsBPModalOpen] = useState(false);
  const [isBPLegendOpen, setIsBPLegendOpen] = useState(false);
  const [isGlucoseLegendOpen, setIsGlucoseLegendOpen] = useState(false);
  const [isSelectMedsModalOpen, setIsSelectMedsModalOpen] = useState(false);
  const [isRequestMedsModalOpen, setIsRequestMedsModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isViewAnalysisModalOpen, setIsViewAnalysisModalOpen] = useState(false);
  const [isExportPDFModalOpen, setIsExportPDFModalOpen] = useState(false);
  const [isManageNamesModalOpen, setIsManageNamesModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AnalysisSession | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState(false);
  const [disclaimerMode, setDisclaimerMode] = useState<'first-launch' | 'view-only'>('view-only');

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingWeight, setEditingWeight] = useState<WeightLog | null>(null);
  const [editingGlucose, setEditingGlucose] = useState<GlucoseLog | null>(null);
  const [editingBP, setEditingBP] = useState<BloodPressureLog | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedMedsForRequest, setSelectedMedsForRequest] = useState<Medication[]>([]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteAnalysisName, setDeleteAnalysisName] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'medication' | 'note' | 'weight' | 'glucose' | 'pressure' | 'disconnect' | 'patient' | 'analysis_session' | 'analysis_item' | 'analysis_name_all'>('medication');

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Caricamento...');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Memoized Filtered Data
  const activePatient = useMemo(() => patients.find(p => p.id === activePatientId) || patients[0] || null, [patients, activePatientId]);

  const filteredMedications = useMemo(() =>
    data.medications.filter(m => m.patientId === activePatientId || (!m.patientId && patients.length > 0 && activePatientId === patients[0].id)),
    [data.medications, activePatientId, patients]);

  const filteredLogs = useMemo(() =>
    data.logs.filter(l => l.patientId === activePatientId || (!l.patientId && patients.length > 0 && activePatientId === patients[0].id)),
    [data.logs, activePatientId, patients]);

  const filteredNotes = useMemo(() =>
    data.notes.filter(n => n.patientId === activePatientId || (!n.patientId && patients.length > 0 && activePatientId === patients[0].id)),
    [data.notes, activePatientId, patients]);

  const filteredWeights = useMemo(() =>
    data.weights.filter(w => w.patientId === activePatientId || (!w.patientId && patients.length > 0 && activePatientId === patients[0].id)),
    [data.weights, activePatientId, patients]);

  const filteredGlucose = useMemo(() =>
    data.glucoseLogs.filter(g => g.patientId === activePatientId || (!g.patientId && patients.length > 0 && activePatientId === patients[0].id)),
    [data.glucoseLogs, activePatientId, patients]);

  const filteredBP = useMemo(() =>
    data.bloodPressureLogs.filter(b => b.patientId === activePatientId || (!b.patientId && patients.length > 0 && activePatientId === patients[0].id)),
    [data.bloodPressureLogs, activePatientId, patients]);

  const filteredAnalysisSessions = useMemo(() =>
    data.analysisSessions.filter(s => s.patientId === activePatientId),
    [data.analysisSessions, activePatientId]);

  const filteredAnalysisItems = useMemo(() =>
    data.analysisItems.filter(i => i.patientId === activePatientId),
    [data.analysisItems, activePatientId]);

  const proposedAnalysisNames = useMemo(() => {
    if (!activePatientId) return [];
    const patientItems = data.analysisItems.filter(i => i.patientId === activePatientId);
    const historicalNames = patientItems.map(i => i.name).filter(Boolean);
    const patientCustom = (data.customAnalysisNames || []).filter(c => c.patientId === activePatientId);

    const deletedSet = new Set(patientCustom.filter(c => c.isDeleted).map(c => c.name));
    const activeCustomSet = new Set(patientCustom.filter(c => !c.isDeleted).map(c => c.name));

    const resultSet = new Set<string>();
    for (const name of historicalNames) {
      if (!deletedSet.has(name)) {
        resultSet.add(name);
      }
    }
    for (const name of activeCustomSet) {
      if (!deletedSet.has(name)) {
        resultSet.add(name);
      }
    }
    return Array.from(resultSet).sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }, [data.analysisItems, data.customAnalysisNames, activePatientId]);


  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'none' | 'left' | 'right'>('none');

  // Stato per feedback immediato (presa/annullamento farmaco in corso)
  const [processingLogs, setProcessingLogs] = useState<Record<string, 'taken' | 'skipped' | 'undo'>>({});

  const [notificationQueue, setNotificationQueue] = useState<{ med: Medication, time: string }[]>([]);
  const notifiedMedsRef = useRef<Set<string>>(new Set());

  const [weightView, setWeightView] = useState<'list' | 'chart'>('list');
  const [chartPeriod, setChartPeriod] = useState<'10' | '20' | '30' | '7G' | '30G' | '365G'>('10');
  const [selectedWeightIndex, setSelectedWeightIndex] = useState<number | null>(null);

  const [glucoseView, setGlucoseView] = useState<'list' | 'chart'>('list');
  const [glucoseChartPeriod, setGlucoseChartPeriod] = useState<'10' | '20' | '30' | '7G' | '30G' | '365G'>('10');
  const [selectedGlucoseIndex, setSelectedGlucoseIndex] = useState<number | null>(null);

  const [bpView, setBpView] = useState<'list' | 'chart'>('list');
  const [bpChartPeriod, setBpChartPeriod] = useState<'10' | '20' | '30' | '7G' | '30G' | '365G'>('10');
  const [selectedBPIndex, setSelectedBPIndex] = useState<number | null>(null);

  const handleExportPDF = async (selections: PDFExportSelections) => {
    if (!activePatient) return;

    setLoading(true);
    setLoadingMessage("Generazione Report...");

    try {
      const uris: string[] = [];

      // 1. Piano Terapeutico
      if (selections.medications) {
        const activeMeds = filteredMedications.filter(m => m.isActive);
        if (activeMeds.length > 0) {
          const doc = await generateMedicationReport(activePatient, activeMeds);
          const uri = await saveReportToCache(doc, activePatient.name, "Farmaci");
          uris.push(uri);
        } else {
          showToast("Nessun farmaco attivo da esportare.", 'info');
        }
      }

      // 2. Pressione
      if (selections.pressure) {
        const sortedLogs = [...filteredBP].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
        const limitedLogs = sortedLogs.slice(0, selections.pressureCount);
        if (limitedLogs.length > 0) {
          const doc = await generatePressureReport(activePatient, limitedLogs);
          const uri = await saveReportToCache(doc, activePatient.name, "Pressione");
          uris.push(uri);
        } else {
          showToast("Nessun dato pressione da esportare.", 'info');
        }
      }

      // 3. Peso
      if (selections.weight) {
        const sortedLogs = [...filteredWeights].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
        const limitedLogs = sortedLogs.slice(0, selections.weightCount);
        if (limitedLogs.length > 0) {
          const doc = await generateWeightReport(activePatient, limitedLogs);
          const uri = await saveReportToCache(doc, activePatient.name, "Peso");
          uris.push(uri);
        } else {
          showToast("Nessun dato peso da esportare.", 'info');
        }
      }

      // 4. Glicemia
      if (selections.glucose) {
        const sortedLogs = [...filteredGlucose].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
        const limitedLogs = sortedLogs.slice(0, selections.glucoseCount);
        if (limitedLogs.length > 0) {
          const doc = await generateGlucoseReport(activePatient, limitedLogs);
          const uri = await saveReportToCache(doc, activePatient.name, "Glicemia");
          uris.push(uri);
        } else {
          showToast("Nessun dato glicemia da esportare.", 'info');
        }
      }

      if (uris.length > 0) {
        await shareMultipleReports(uris, activePatient.name);
        showToast('Report PDF generati con successo!');
      }
    } catch (error: any) {
      console.error("Errore generazione report:", error);
      showToast(`Errore: ${error.message || 'Generazione fallita'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePatient = (id: string) => {
    setDeleteType('patient');
    setConfirmDeleteId(id);
  };

  const handleSelectPatient = (id: string) => {
    setActivePatientId(id);
    localStorage.setItem('activePatientId', id);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await db.initDatabase();
        const allData = await db.getAllData();

        let finalPatients = allData.patients;
        let finalActiveId = activePatientId;

        if (finalPatients.length === 0) {
          const defaultPatient: Patient = { id: 'p-default', name: 'Mio Profilo', color: 'bg-blue-500' };
          await db.upsertPatient(defaultPatient);
          finalPatients = [defaultPatient];
          finalActiveId = defaultPatient.id;
        } else if (!activePatientId || !finalPatients.find(p => p.id === activePatientId)) {
          finalActiveId = finalPatients[0].id;
        }

        setData(allData);
        setPatients(finalPatients);
        setActivePatientId(finalActiveId);
        if (finalActiveId) localStorage.setItem('activePatientId', finalActiveId);

        // Verifica disclaimer
        const isAccepted = localStorage.getItem('disclaimer_accepted');
        if (!isAccepted) {
          setDisclaimerMode('first-launch');
          setIsDisclaimerModalOpen(true);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Errore fatale all'avvio:", err);
        setLoadingMessage(err.message || "Errore sconosciuto all'avvio");
      }
    };

    init();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
        const { action, medId, time } = event.data;
        if (action === 'take') handleTakeMed(medId, time);
        else if (action === 'skip') handleSkipMed(medId, time);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    const setupListener = async () => {
      if (Capacitor.isNativePlatform()) {
        return await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          const { actionId, notification } = notificationAction;

          // Porta l'utente alla vista farmaci
          setView('medications');

          const { medId, time, date } = notification.extra;
          if (actionId === 'take') handleTakeMed(medId, time, date);
          else if (actionId === 'skip') handleSkipMed(medId, time, date);
        });
      }
      return null;
    };

    const listenerPromise = setupListener();

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
      listenerPromise.then(h => h?.remove());
    };
  }, [data.medications]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
    if (Capacitor.isNativePlatform()) rescheduleAllNativeNotifications();
  }, [notificationsEnabled, filteredMedications, filteredLogs]);

  useEffect(() => {
    const setupNotifications = async () => {
      if (Capacitor.isNativePlatform()) {
        const permission = await LocalNotifications.requestPermissions();
        if (permission.display === 'granted') {
          rescheduleAllNativeNotifications();
        }
      } else if ("Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          Notification.requestPermission();
        }
      }
    };
    setupNotifications();
  }, []);

  const loadAllData = async () => {
    const allData = await db.getAllData();
    setData(allData);
    setPatients(allData.patients);
  };

  const normalizeTime = (t: string) => {
    if (!t) return '';
    const parts = t.trim().split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  };

  const formatDateIT = (iso: string) => iso.split('-').reverse().join('/');
  const isToday = selectedDate === (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  const changeDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);

    // Gestione animazione basata sulla direzione
    if (days > 0) setSlideDirection('right'); // Prossimo giorno -> slide da destra
    else setSlideDirection('left'); // Giorno precedente -> slide da sinistra

    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const resetToToday = () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (selectedDate === today) return;
    setSlideDirection(selectedDate < today ? 'right' : 'left');
    setSelectedDate(today);
  };

  // Helper per aggiungere giorni a una data ISO senza fuso orario
  const addDays = (dateStr: string, days: number) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Swipe Handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const isMedicationDue = (med: Medication, dateIso: string) => {
    const start = med.startDate;
    if (dateIso < start) return false;

    let isMatchingFrequency = false;
    let occurrenceIndex = 0; // Indice dell'occorrenza (0-based)

    if (med.frequency === 'weekly') {
      const [y, m, d] = dateIso.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (med.dayOfWeek !== date.getDay()) return false;

      isMatchingFrequency = true;

      // Calcoliamo quante settimane sono passate dalla prima occorrenza valida
      const [sy, sm, sd] = start.split('-').map(Number);
      let firstOccurrence = new Date(sy, sm - 1, sd);
      while (firstOccurrence.getDay() !== med.dayOfWeek) {
        firstOccurrence.setDate(firstOccurrence.getDate() + 1);
      }

      if (date < firstOccurrence) return false;

      const diffTime = date.getTime() - firstOccurrence.getTime();
      occurrenceIndex = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
    } else if (med.frequency === 'monthly') {
      const [y, m, d] = dateIso.split('-').map(Number);
      if (med.dayOfMonth !== d) return false;

      isMatchingFrequency = true;

      const [sy, sm, sd] = start.split('-').map(Number);
      // Calcoliamo quanti mesi di differenza
      occurrenceIndex = (y - sy) * 12 + (m - sm);
      // Se il giorno di inizio era successivo al giorno di assunzione del mese, 
      // il conteggio deve partire dal mese successivo
      if (sd > med.dayOfMonth) {
        occurrenceIndex--;
      }

      if (occurrenceIndex < 0) return false;
    } else {
      // daily
      isMatchingFrequency = true;
      const [y, m, d] = dateIso.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const [sy, sm, sd] = start.split('-').map(Number);
      const startDate = new Date(sy, sm - 1, sd);

      const diffTime = date.getTime() - startDate.getTime();
      occurrenceIndex = Math.round(diffTime / (24 * 60 * 60 * 1000));
    }

    if (isMatchingFrequency && med.durationDays && med.durationDays > 0) {
      if (occurrenceIndex >= med.durationDays) return false;
    }

    return isMatchingFrequency;
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe da destra a sinistra -> Giorno Successivo
      changeDate(1);
    } else if (isRightSwipe) {
      // Swipe da sinistra a destra -> Giorno Precedente
      changeDate(-1);
    }
  };

  const getBPCategoryColor = (sys: number, dia: number) => {
    if (sys >= 180 || dia >= 110) return { bg: 'bg-red-500/20', dot: 'bg-red-600', text: 'text-red-600' };
    if (sys >= 160 || dia >= 100) return { bg: 'bg-orange-500/20', dot: 'bg-orange-500', text: 'text-orange-500' };
    if (sys >= 140 || dia >= 90) return { bg: 'bg-yellow-500/20', dot: 'bg-yellow-500', text: 'text-yellow-600' };
    if (sys >= 130 || dia >= 85) return { bg: 'bg-green-500/20', dot: 'bg-green-500', text: 'text-green-600' };
    if (sys >= 120 || dia >= 80) return { bg: 'bg-cyan-500/20', dot: 'bg-cyan-500', text: 'text-cyan-600' };
    return { bg: 'bg-blue-500/20', dot: 'bg-blue-500', text: 'text-blue-600' };
  };

  const getGlucoseCategoryColor = (val: number) => {
    if (val >= 126) return { bg: 'bg-red-500/20', dot: 'bg-red-600', text: 'text-red-600', label: 'Diabete' };
    if (val >= 100) return { bg: 'bg-yellow-500/20', dot: 'bg-yellow-500', text: 'text-yellow-600', label: 'Prediabete' };
    if (val >= 70) return { bg: 'bg-green-500/20', dot: 'bg-green-500', text: 'text-green-600', label: 'Normale' };
    return { bg: 'bg-blue-500/20', dot: 'bg-blue-500', text: 'text-blue-600', label: 'Ipoglicemia' };
  };

  const getDeterministicId = (medId: string, date: string, slotIndex: number): number => {
    const str = `${medId}-${date}-${slotIndex}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const rescheduleAllNativeNotifications = async () => {
    if (!Capacitor.isNativePlatform() || !notificationsEnabled) return;
    try {
      const activeMeds = data.medications.filter(m => m.isActive && (m.patientId === activePatientId || (!m.patientId && patients.length > 0 && activePatientId === patients[0].id)));
      const relevantLogs = data.logs.filter(l => l.patientId === activePatientId || (!l.patientId && patients.length > 0 && activePatientId === patients[0].id));
      await NotificationService.scheduleMedicationNotifications(activeMeds, relevantLogs, patients);
    } catch (e) {
      console.error("Errore rischedulazione notifiche:", e);
    }
  };

  const getStockColorClass = (med: Medication) => {
    const min = med.minQuantity || 0;
    const rem = med.remainingQuantity;
    if (rem <= 0) return 'text-red-500';
    if (rem <= min) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleTakeMed = async (medId: string, time: string, dateOverride?: string) => {
    const targetDate = dateOverride || selectedDate;
    setNotificationQueue(prev => prev.filter(n => !(n.med.id === medId && n.time === time)));

    if (Capacitor.isNativePlatform()) {
      const med = data.medications.find(m => String(m.id) === String(medId));
      if (med) {
        const slotIndex = med.schedule.findIndex(s => normalizeTime(s.time) === normalizeTime(time));
        if (slotIndex !== -1) {
          const notificationId = getDeterministicId(medId, targetDate, slotIndex);
          LocalNotifications.cancel({ notifications: [{ id: notificationId }] }).catch(() => { });
        }
      }
    }

    const key = `${medId}-${time}`;
    setProcessingLogs(prev => ({ ...prev, [key]: 'taken' }));

    const log: IntakeLog = {
      id: 'log-' + Date.now(),
      medicationId: medId,
      date: targetDate,
      time: normalizeTime(time),
      status: 'taken',
      patientId: activePatientId || undefined
    };

    await db.addLog(log);
    await loadAllData();

    setTimeout(() => {
      setProcessingLogs(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 1000);
  };

  const handleSkipMed = async (medId: string, time: string, dateOverride?: string) => {
    const targetDate = dateOverride || selectedDate;
    setNotificationQueue(prev => prev.filter(n => !(n.med.id === medId && n.time === time)));

    if (Capacitor.isNativePlatform()) {
      const med = data.medications.find(m => String(m.id) === String(medId));
      if (med) {
        const slotIndex = med.schedule.findIndex(s => normalizeTime(s.time) === normalizeTime(time));
        if (slotIndex !== -1) {
          const notificationId = getDeterministicId(medId, targetDate, slotIndex);
          LocalNotifications.cancel({ notifications: [{ id: notificationId }] }).catch(() => { });
        }
      }
    }

    const key = `${medId}-${time}`;
    setProcessingLogs(prev => ({ ...prev, [key]: 'skipped' }));

    const log: IntakeLog = {
      id: 'log-' + Date.now(),
      medicationId: medId,
      date: targetDate,
      time: normalizeTime(time),
      status: 'skipped',
      patientId: activePatientId || undefined
    };

    await db.addLog(log);
    await loadAllData();

    setTimeout(() => {
      setProcessingLogs(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 1000);
  };

  const handleUndo = async (medId: string, time: string) => {
    const key = `${medId}-${time}`;
    const log = data.logs.find(l => String(l.medicationId) === String(medId) && normalizeTime(l.time) === normalizeTime(time) && l.date === selectedDate);
    if (log) {
      setProcessingLogs(prev => ({ ...prev, [key]: 'undo' }));
      await db.deleteLog(log.id);
      await loadAllData();

      setTimeout(() => {
        setProcessingLogs(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 1000);
    }
  };

  const triggerDelete = (id: string, type: any) => {
    setConfirmDeleteId(id || 'confirm_placeholder');
    setDeleteType(type);
  };

  const confirmDelete = async () => {
    const targetId = confirmDeleteId;
    const type = deleteType;
    if (!targetId) return;

    setConfirmDeleteId(null);

    if (type === 'medication') await db.deleteMedication(targetId);
    else if (type === 'note') await db.deleteNote(targetId);
    else if (type === 'weight') await db.deleteWeight(targetId);
    else if (type === 'glucose') await db.deleteGlucose(targetId);
    else if (type === 'pressure') await db.deleteBloodPressure(targetId);
    else if (type === 'patient') await db.deletePatient(targetId);
    else if (type === 'analysis_session') {
      await db.deleteAnalysisSession(targetId);
      showToast('Sessione eliminata!');
    }
    else if (type === 'analysis_item') {
      await db.deleteAnalysisItem(targetId);
      showToast('Analisi eliminata!');
    }
    else if (type === 'analysis_name_all' && deleteAnalysisName && activePatientId) {
      await db.deleteAnalysisName(deleteAnalysisName, activePatientId);
      setDeleteAnalysisName(null);
      showToast('Tutte le occorrenze dell\'analisi eliminate!');
    }

    await loadAllData();

    if (type === 'patient' && activePatientId === targetId) {
      setPatients(prev => {
        const remaining = prev.filter(p => p.id !== targetId);
        if (remaining.length > 0) {
          setActivePatientId(remaining[0].id);
          localStorage.setItem('activePatientId', remaining[0].id);
        }
        return remaining;
      });
    }
  };

  const handleAddPatient = async (p: Patient) => {
    await db.upsertPatient(p);
    await loadAllData();
    if (!activePatientId) setActivePatientId(p.id);
  };


  const handleEditPatient = (p: Patient) => {
    setEditingPatient(p);
    setIsPatientModalOpen(true);
  };

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimer_accepted', 'true');
    setIsDisclaimerModalOpen(false);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleDeclineDisclaimer = async () => {
    if (Capacitor.isNativePlatform()) {
      CapApp.exitApp();
    } else {
      showToast("Per utilizzare l'app è necessario accettare i termini.", 'error');
    }
  };

  const handleAddAnalysis = async (session: AnalysisSession, items: AnalysisItem[]) => {
    await db.addAnalysisSession(session, items);
    await loadAllData();
    showToast('Analisi salvate correttamente!');
  };

  const handleUpdateAnalysisItem = async (item: AnalysisItem) => {
    await db.updateAnalysisItem(item);
    await loadAllData();
    showToast('Analisi aggiornata!');
  };

  const handleUpdateAnalysisSession = async (id: string, date: string, laboratory: string, type: string) => {
    await db.updateAnalysisSession(id, date, laboratory, type);
    await loadAllData();
    // Aggiorna lo stato della sessione selezionata per riflettere le modifiche nel modale aperto
    setSelectedSession(prev => prev ? { ...prev, date, laboratory, type } : null);
    showToast('Sessione aggiornata!');
  };

  const handleDeleteAnalysisItem = async (id: string) => {
    setDeleteType('analysis_item');
    setConfirmDeleteId(id);
  };

  const handleAddAnalysisItem = async (item: AnalysisItem) => {
    await db.addAnalysisItem(item);
    await loadAllData();
    showToast('Analisi aggiunta!');
  };

  const handleDeleteAnalysisSession = async (id: string) => {
    setDeleteType('analysis_session');
    setConfirmDeleteId(id);
  };

  const handleDuplicateAnalysisSession = async (id: string) => {
    await db.duplicateAnalysisSession(id, activePatientId!, data.analysisItems);
    await loadAllData();
    showToast('Sessione duplicata con la data di oggi!');
  };

  const handleRenameAnalysisName = async (oldName: string, newName: string) => {
    if (!activePatientId) return;
    try {
      await db.renameAnalysisName(oldName, newName, activePatientId);
      await loadAllData();
      showToast('Nome analisi modificato per i nuovi inserimenti');
    } catch (e) {
      console.error(e);
      showToast('Errore durante la modifica del nome.', 'error');
    }
  };

  const handleDeleteAnalysisName = async (name: string) => {
    if (!activePatientId) return;
    try {
      await db.deleteAnalysisName(name, activePatientId);
      await loadAllData();
      showToast('Nome analisi rimosso dai nomi proposti');
    } catch (e) {
      console.error(e);
      showToast('Errore durante l\'eliminazione del nome.', 'error');
    }
  };

  const handleAddButtonClick = () => {
    if (view === 'notes') { setEditingNote(null); setIsNoteModalOpen(true); }
    else if (view === 'weights') { setEditingWeight(null); setIsWeightModalOpen(true); }
    else if (view === 'glucose') { setEditingGlucose(null); setIsGlucoseModalOpen(true); }
    else if (view === 'pressure') { setEditingBP(null); setIsBPModalOpen(true); }
    else if (view === 'analysis_db') { setIsAnalysisModalOpen(true); }
    else if (view === 'archive') { handlePickMedicalRecords(); }
    else { setEditingMed(null); setIsMedModalOpen(true); }
  };

  const handlePickMedicalRecords = async () => {
    showToast('Funzionalità in attesa di nuova implementazione.', 'info');
  };
  const dashboardItems = useMemo(() => {
    const items: any[] = [];
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const target = selectedDate;

    filteredMedications.forEach(med => {
      // FIX BUG: Se non attivo, mostra solo per date passato (storico). 
      // Per OGGI e FUTURO solo se attivo.
      const shouldShowByStatus = med.isActive || target < todayIso;

      if (shouldShowByStatus && isMedicationDue(med, target)) {
        med.schedule.forEach(slot => {
          const time = normalizeTime(slot.time);
          const log = filteredLogs.find(l => String(l.medicationId) === String(med.id) && normalizeTime(l.time) === time && l.date === selectedDate);
          items.push({ time, med, quantity: slot.quantity, status: log ? log.status : 'pending' });
        });
      }
    });
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredMedications, filteredLogs, selectedDate, addDays, isMedicationDue]);

  const dashboardStats = useMemo(() => {
    const total = dashboardItems.length;
    const taken = dashboardItems.filter(i => i.status === 'taken').length;
    const skipped = dashboardItems.filter(i => i.status === 'skipped').length;
    return { total, taken, skipped, pending: total - taken - skipped };
  }, [dashboardItems]);

  const sortedWeights = useMemo(() => [...filteredWeights].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)), [filteredWeights]);
  const sortedGlucose = useMemo(() => [...filteredGlucose].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)), [filteredGlucose]);
  const sortedNotes = useMemo(() => [...filteredNotes].filter(n => n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) || n.content.toLowerCase().includes(noteSearchQuery.toLowerCase())).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)), [filteredNotes, noteSearchQuery]);
  const sortedBP = useMemo(() => [...filteredBP].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)), [filteredBP]);

  const weightChartData = useMemo(() => {
    let filtered = [...filteredWeights].sort((a, b) => a.date.localeCompare(b.date));
    const nowRef = new Date();

    if (chartPeriod === '7G') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(w => w.date >= start);
    } else if (chartPeriod === '30G') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(w => w.date >= start);
    } else if (chartPeriod === '365G') {
      const d = new Date();
      d.setDate(d.getDate() - 365);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(w => w.date >= start);
    } else if (!isNaN(parseInt(chartPeriod))) {
      filtered = filtered.slice(-parseInt(chartPeriod));
    }

    if (filtered.length === 0) return [];

    const values = filtered.map(w => Number(w.weight));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;

    return filtered.map(w => ({
      ...w,
      weight: Number(w.weight),
      h: values.length === 1 ? 70 : ((Number(w.weight) - min) / range) * 70 + 20
    }));
  }, [filteredWeights, chartPeriod]);

  const selectedWeightIndexDetail = useMemo(() => {
    if (selectedWeightIndex === null || !weightChartData[selectedWeightIndex]) return null;
    return weightChartData[selectedWeightIndex];
  }, [selectedWeightIndex, weightChartData]);

  const glucoseChartData = useMemo(() => {
    let filtered = [...filteredGlucose].sort((a, b) => a.date.localeCompare(b.date));

    if (glucoseChartPeriod === '7G') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(g => g.date >= start);
    } else if (glucoseChartPeriod === '30G') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(g => g.date >= start);
    } else if (glucoseChartPeriod === '365G') {
      const d = new Date();
      d.setDate(d.getDate() - 365);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(g => g.date >= start);
    } else if (!isNaN(parseInt(glucoseChartPeriod))) {
      filtered = filtered.slice(-parseInt(glucoseChartPeriod));
    }

    if (filtered.length === 0) return [];

    const values = filtered.map(g => Number(g.glucose));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;

    return filtered.map(g => ({
      ...g,
      glucose: Number(g.glucose),
      h: values.length === 1 ? 70 : ((Number(g.glucose) - min) / range) * 70 + 20
    }));
  }, [filteredGlucose, glucoseChartPeriod]);

  const selectedGlucoseIndexDetail = useMemo(() => {
    if (selectedGlucoseIndex === null || !glucoseChartData[selectedGlucoseIndex]) return null;
    return glucoseChartData[selectedGlucoseIndex];
  }, [selectedGlucoseIndex, glucoseChartData]);

  const bpChartData = useMemo(() => {
    let filtered = [...filteredBP].sort((a, b) => a.date.localeCompare(b.date));
    const nowRef = new Date();
    if (bpChartPeriod === '7G') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(b => b.date >= start);
    } else if (bpChartPeriod === '30G') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(b => b.date >= start);
    } else if (bpChartPeriod === '365G') {
      const d = new Date();
      d.setDate(d.getDate() - 365);
      const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      filtered = filtered.filter(b => b.date >= start);
    } else if (!isNaN(parseInt(bpChartPeriod))) {
      filtered = filtered.slice(-parseInt(bpChartPeriod));
    }

    if (filtered.length === 0) return [];
    const allVal = [...filtered.map(b => b.systolic), ...filtered.map(b => b.diastolic)];
    const min = Math.min(...allVal) - 10, max = Math.max(...allVal) + 10, range = (max - min) || 1;
    return filtered.map(b => ({
      ...b,
      sH: ((b.systolic - min) / range) * 100,
      dH: ((b.diastolic - min) / range) * 100
    }));
  }, [filteredBP, bpChartPeriod]);

  const selectedBPIndexDetail = useMemo(() => {
    if (selectedBPIndex === null || !bpChartData[selectedBPIndex]) return null;
    return bpChartData[selectedBPIndex];
  }, [selectedBPIndex, bpChartData]);

  const homeStats = useMemo(() => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const monthPrefix = todayIso.substring(0, 7);

    // Monthly
    const monthlyLogs = filteredLogs.filter(l => l.date.startsWith(monthPrefix));
    const monthlyTaken = monthlyLogs.filter(l => l.status === 'taken').length;
    const monthlySkipped = monthlyLogs.filter(l => l.status === 'skipped').length;

    // Daily (Today)
    const todayItems: any[] = [];
    filteredMedications.forEach(med => {
      if (med.isActive && isMedicationDue(med, todayIso)) {
        med.schedule.forEach(slot => {
          const slotTime = normalizeTime(slot.time);
          const log = filteredLogs.find(l => String(l.medicationId) === String(med.id) && normalizeTime(l.time) === slotTime && l.date === todayIso);
          todayItems.push({ status: log ? log.status : 'pending' });
        });
      }
    });
    const todayTaken = todayItems.filter(i => i.status === 'taken').length;
    const todaySkipped = todayItems.filter(i => i.status === 'skipped').length;
    const todayPending = todayItems.length - todayTaken - todaySkipped;

    const monthlyTotal = monthlyTaken + monthlySkipped;
    const monthlyPercent = monthlyTotal > 0 ? Math.round((monthlyTaken / monthlyTotal) * 100) : 0;

    const lastBP = sortedBP[0];
    const lastWeight = sortedWeights[0];
    const lastGlucose = sortedGlucose[0];
    const lastNote = sortedNotes[0];

    return {
      monthlyMeds: { taken: monthlyTaken, skipped: monthlySkipped, percent: monthlyPercent },
      todayMeds: { taken: todayTaken, skipped: todaySkipped, pending: todayPending },
      lastBP,
      lastWeight,
      lastGlucose,
      lastNote
    };
  }, [filteredMedications, filteredLogs, sortedBP, sortedWeights, sortedGlucose, sortedNotes, isMedicationDue]);



  // CSV EXPORT LOGIC
  const downloadCSV = async (rows: any[], filename: string, headers: string[]) => {
    if (rows.length === 0) return;
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    if (Capacitor.isNativePlatform()) {
      try {
        const fileName = `${filename}_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.csv`;

        const result = await Filesystem.writeFile({
          path: fileName,
          data: csvContent,
          directory: Directory.Cache,
          encoding: 'utf8' as any
        });

        await Share.share({
          title: fileName,
          url: result.uri,
          dialogTitle: 'Condividi CSV'
        });
      } catch (err) {
        console.error('Errore durante l\'esportazione CSV nativa:', err);
      }
    } else {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportCSV = async (selections: ExportSelections) => {
    const patientName = activePatient?.name || 'Paziente';
    const safePatientName = patientName.replace(/\s+/g, '_');
    const now = new Date();
    const isoDate = now.toISOString().split('T')[0];

    let fullCsvContent = '';

    if (selections.notes) {
      fullCsvContent += '--- NOTE PERSONALI ---\n';
      fullCsvContent += ['Data', 'Ora', 'Titolo', 'Contenuto'].join(',') + '\n';
      fullCsvContent += filteredNotes.map(row => [row.date, row.time, row.title, row.content].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n\n';
    }

    if (selections.pressure) {
      fullCsvContent += '--- PRESSIONE ARTERIOSA ---\n';
      fullCsvContent += ['Data', 'Ora', 'Sistolica', 'Diastolica', 'Battiti'].join(',') + '\n';
      fullCsvContent += filteredBP.map(row => [row.date, row.time, row.systolic, row.diastolic, row.pulse].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n\n';
    }

    if (selections.weight) {
      fullCsvContent += '--- ANDAMENTO PESO ---\n';
      fullCsvContent += ['Data', 'Ora', 'Peso'].join(',') + '\n';
      fullCsvContent += filteredWeights.map(row => [row.date, row.time, row.weight].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n\n';
    }

    if (selections.glucose) {
      fullCsvContent += '--- MONITORAGGIO GLICEMIA ---\n';
      fullCsvContent += ['Data', 'Ora', 'Valore', 'Nota'].join(',') + '\n';
      fullCsvContent += filteredGlucose.map(row => [row.date, row.time, row.glucose, row.note].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n\n';
    }

    if (selections.medications) {
      fullCsvContent += '--- CATALOGO FARMACI ---\n';
      fullCsvContent += ['Nome', 'Dosaggio', 'Unità', 'Rimanente', 'Totale', 'Data Inizio', 'Attivo'].join(',') + '\n';
      fullCsvContent += filteredMedications.map(row => [row.name, row.dosage, row.unit, row.remainingQuantity, row.totalQuantity, row.startDate, row.isActive ? 'Sì' : 'No'].map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n\n';
    }

    if (fullCsvContent) {
      const fileName = `${isoDate}_Report_Salute_${safePatientName}.csv`;

      if (Capacitor.isNativePlatform()) {
        try {
          await Filesystem.writeFile({
            path: fileName,
            data: fullCsvContent,
            directory: Directory.Cache,
            encoding: 'utf8' as any
          });

          const uriResult = await Filesystem.getUri({
            directory: Directory.Cache,
            path: fileName
          });

          await Share.share({
            title: fileName,
            files: [uriResult.uri],
            dialogTitle: 'Condividi Report CSV'
          });
          showToast('Report CSV generato con successo!');
        } catch (err) {
          console.error('Errore durante l\'esportazione CSV:', err);
          showToast('Errore durante l\'esportazione del file.', 'error');
        }
      } else {
        const blob = new Blob([fullCsvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Report CSV generato con successo!');
      }
    }
  };

  const prepareCSVFile = async (filename: string, content: string): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
      const result = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: 'utf8' as any
      });
      return result.uri;
    } else {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      return '';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-background dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors`}>
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/60 dark:bg-dark-bg/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="p-8 bg-white dark:bg-dark-surface rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-gray-100 dark:border-gray-800">
            <Loader2 className="animate-spin text-primary" size={48} />
            <div className="text-center">
              <p className="font-black text-gray-800 dark:text-white uppercase tracking-tighter">{loadingMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER FISSO CON SUPPORTO SAFE AREA */}
      <header className="fixed top-0 inset-x-0 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md z-50 border-b dark:border-gray-800 flex flex-col">
        <div className="pt-safe" />
        <div className="h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><Menu size={24} /></button>
            <h1 className="text-xl font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
              <span className={`${view === 'home' ? 'bg-green-500 shadow-green-500/20' : 'bg-primary shadow-primary/20'} text-white p-1.5 rounded-lg shadow-lg`}>
                {view === 'weights' ? <Scale size={18} strokeWidth={3} /> :
                  view === 'glucose' ? <Droplets size={18} strokeWidth={3} /> :
                  view === 'pressure' ? <Heart size={18} strokeWidth={3} /> :
                    view === 'notes' ? <StickyNote size={18} strokeWidth={3} /> :
                      view === 'inventory' ? <List size={18} strokeWidth={3} /> :
                        view === 'archive' ? <FileText size={18} strokeWidth={3} /> :
                          view === 'settings' ? <Settings size={18} strokeWidth={3} /> :
                            view === 'stats' ? <BarChart3 size={18} strokeWidth={3} /> :
                              view === 'home' ? <Home size={18} strokeWidth={3} /> :
                                <Pill size={18} strokeWidth={3} />}
              </span>
              {view === 'medications' ? `Farmaci di ${activePatient?.name || 'Mio Profilo'}` :
                view === 'inventory' ? 'Catalogo Farmaci' :
                  view === 'notes' ? `Note di ${activePatient?.name || 'Mio Profilo'}` :
                    view === 'weights' ? `Peso di ${activePatient?.name || 'Mio Profilo'}` :
                      view === 'glucose' ? `Glicemia di ${activePatient?.name || 'Mio Profilo'}` :
                        view === 'pressure' ? `Pressione di ${activePatient?.name || 'Mio Profilo'}` :
                        view === 'settings' ? 'Impostazioni' :
                          view === 'stats' ? 'Statistiche' :
                            view === 'archive' ? 'Archivio Referti' :
                              view === 'analysis_db' ? 'Database Esami' :
                                `Riepilogo di ${activePatient?.name || 'Mio Profilo'}`}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {(view === 'pressure' || view === 'glucose') && (
              <button
                onClick={() => view === 'pressure' ? setIsBPLegendOpen(true) : setIsGlucoseLegendOpen(true)}
                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
              >
                <Info size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={setView}
        patients={sortedPatients}
        activePatientId={activePatientId}
        onSelectPatient={handleSelectPatient}
        onAddPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
        onEditPatient={handleEditPatient}
        onDeletePatient={(id) => triggerDelete(id, 'patient')}
        onRequestMeds={() => { setIsSelectMedsModalOpen(true); setIsSidebarOpen(false); }}
        onGenerateReport={() => setIsExportPDFModalOpen(true)}
      />

      <main
        className="max-w-3xl mx-auto p-4 pb-24 pt-[calc(4rem+env(safe-area-inset-top))] min-h-screen"
        onTouchStart={view === 'medications' ? onTouchStart : undefined}
        onTouchMove={view === 'medications' ? onTouchMove : undefined}
        onTouchEnd={view === 'medications' ? onTouchEnd : undefined}
      >
        {view === 'home' && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Tile 1: Farmaci Oggi */}
              <div
                onClick={() => setView('medications')}
                className="bg-white dark:bg-dark-surface p-4 rounded-[1.8rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group flex flex-col gap-3 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Clock size={60} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 text-green-600 rounded-[1rem]">
                    <List size={20} />
                  </div>
                  <h3 className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">Farmaci Oggi</h3>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex gap-3">
                    <div className="flex flex-col text-center">
                      <span className="text-2xl font-black text-green-500 leading-tight">{homeStats.todayMeds.taken}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Assunti</span>
                    </div>
                    <div className="flex flex-col border-l dark:border-gray-800 pl-3 text-center">
                      <span className="text-2xl font-black text-red-500 leading-tight">{homeStats.todayMeds.skipped}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Saltati</span>
                    </div>
                    <div className="flex flex-col border-l dark:border-gray-800 pl-3 text-center">
                      <span className="text-2xl font-black text-primary leading-tight">{homeStats.todayMeds.pending}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Rimanenti</span>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors mb-1" size={20} />
                </div>
              </div>

              {/* Tile 2: Farmaci Mese */}
              <div
                onClick={() => setView('stats')}
                className="bg-white dark:bg-dark-surface p-4 rounded-[1.8rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group flex flex-col gap-3 relative overflow-hidden md:col-span-2"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Pill size={60} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-[1rem]">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">Farmaci ({new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(new Date()).toUpperCase()})</h3>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-1 items-end gap-6">
                    <div className="flex gap-4">
                      <div className="flex flex-col text-center">
                        <span className="text-2xl font-black text-green-500 leading-tight">{homeStats.monthlyMeds.taken}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Assunti</span>
                      </div>
                      <div className="flex flex-col border-l dark:border-gray-800 pl-4 text-center">
                        <span className="text-2xl font-black text-red-500 leading-tight">{homeStats.monthlyMeds.skipped}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Saltati</span>
                      </div>
                    </div>

                    {/* Barra percentuale compatta */}
                    <div className="flex-1 pb-1 max-w-[120px]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Aderenza</span>
                        <span className="text-[10px] font-black text-primary">{homeStats.monthlyMeds.percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${homeStats.monthlyMeds.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors mb-1" size={20} />
                </div>
              </div>

              {/* Tile 3: Pressione */}
              {homeStats.lastBP && (
                <div
                  onClick={() => setView('pressure')}
                  className="bg-white dark:bg-dark-surface p-3 px-4 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group flex flex-col gap-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Activity size={40} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-500/10 text-red-500 rounded-[0.8rem]">
                      <Heart size={16} />
                    </div>
                    <h3 className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">Ultima Pressione</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">{formatDateIT(homeStats.lastBP.date)}</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black leading-tight ${getBPCategoryColor(homeStats.lastBP.systolic, homeStats.lastBP.diastolic).text}`}>{homeStats.lastBP.systolic}/{homeStats.lastBP.diastolic}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">mmHg</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500 font-black">
                        <Heart size={11} className="fill-current" />
                        <span className="text-lg leading-none">{homeStats.lastBP.pulse}</span>
                        <span className="text-[8px] uppercase opacity-60">bpm</span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
                  </div>
                </div>
              )}

              {/* Tile 4: Peso */}
              {homeStats.lastWeight && (
                <div
                  onClick={() => setView('weights')}
                  className="bg-white dark:bg-dark-surface p-3 px-4 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group flex flex-col gap-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Scale size={40} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/10 text-primary rounded-[0.8rem]">
                      <Scale size={16} />
                    </div>
                    <h3 className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">Ultimo Peso</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">{formatDateIT(homeStats.lastWeight.date)}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-primary leading-tight">{homeStats.lastWeight.weight}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">kg</span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
                  </div>
                </div>
              )}

              {/* Tile 5: Glicemia */}
              {homeStats.lastGlucose && (
                <div
                  onClick={() => setView('glucose')}
                  className="bg-white dark:bg-dark-surface p-3 px-4 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group flex flex-col gap-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Droplets size={40} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-[0.8rem]">
                      <Droplets size={16} />
                    </div>
                    <h3 className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">Ultima Glicemia</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter">{formatDateIT(homeStats.lastGlucose.date)}</span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black leading-tight ${getGlucoseCategoryColor(homeStats.lastGlucose.glucose).text}`}>{homeStats.lastGlucose.glucose}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">mg/dL</span>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20} />
                  </div>
                </div>
              )}

              {/* Tile 6: Note */}
              {homeStats.lastNote && (
                <div
                  onClick={() => setView('notes')}
                  className="bg-white dark:bg-dark-surface p-3 px-4 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group flex flex-col gap-1 relative overflow-hidden md:col-span-2"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <StickyNote size={40} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-500/10 text-yellow-600 rounded-[0.8rem]">
                      <StickyNote size={16} />
                    </div>
                    <h3 className="font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest text-[9px]">Ultima Nota</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-3 overflow-hidden">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter shrink-0">{formatDateIT(homeStats.lastNote.date)}</span>
                      <p className="text-base font-black text-gray-800 dark:text-white truncate leading-tight">{homeStats.lastNote.title}</p>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors shrink-0" size={20} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'medications' && (

          <div className="space-y-4">
            {/* STICKY DATE SELECTOR CON POSIZIONE CALCOLATA */}
            <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-40 -mx-4 px-4 py-2 bg-background/95 dark:bg-dark-bg/95 backdrop-blur-md shadow-sm border-b dark:border-gray-800 mb-4">
              <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-2 space-y-1 relative">
                <div className="flex items-center justify-between px-2 py-1">
                  <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ChevronLeft size={18} /></button>
                  <div
                    className="text-center group flex flex-col items-center flex-1"
                  >
                    <div className="font-bold text-gray-800 dark:text-white text-base leading-none py-1.5 flex items-center gap-2">
                      <div
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                      >
                        <Calendar size={16} className="text-primary" />
                        <span className="font-black">{formatDateIT(selectedDate)}</span>
                      </div>
                      {!isToday && (
                        <span
                          onClick={() => {
                            resetToToday();
                            setIsCalendarOpen(false);
                          }}
                          className="font-black text-primary/80 dark:text-primary text-xs ml-1 cursor-pointer hover:underline"
                        >
                          • Oggi
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ChevronRight size={18} /></button>
                </div>

                {isCalendarOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-surface border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      type="date"
                      className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-xl border-none focus:ring-2 focus:ring-primary font-bold outline-none"
                      value={selectedDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSlideDirection(e.target.value > selectedDate ? 'right' : 'left');
                          setSelectedDate(e.target.value);
                          setIsCalendarOpen(false);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        resetToToday();
                        setIsCalendarOpen(false);
                      }}
                      className="w-full mt-2 py-2 text-xs font-black text-primary uppercase tracking-widest hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      Vai a oggi
                    </button>
                  </div>
                )}

                <div className="flex justify-around items-center border-t dark:border-gray-800 pt-1 pb-1">
                  <div className="text-center"><p className="text-base font-black leading-none">{dashboardStats.total}</p><p className="text-[10px] uppercase font-bold text-gray-400">Pianificati</p></div>
                  <div className="text-center"><p className="text-base font-black text-green-500 Gabriel leading-none">{dashboardStats.taken}</p><p className="text-[10px] uppercase font-bold text-green-500/60">Assunti</p></div>
                  <div className="text-center"><p className="text-base font-black text-red-500 leading-none">{dashboardStats.skipped}</p><p className="text-[10px] uppercase font-bold text-red-500/60">Saltati</p></div>
                  <div className="text-center"><p className="text-base font-black text-primary leading-none">{dashboardStats.pending}</p><p className="text-[10px] uppercase font-bold text-primary/60">Rimanenti</p></div>
                </div>
              </div>
            </div>

            <div
              key={selectedDate}
              className={`space-y-4 ${slideDirection === 'right' ? 'slide-in-right' : slideDirection === 'left' ? 'slide-in-left' : 'animate-in fade-in duration-300'}`}
              onAnimationEnd={() => setSlideDirection('none')}
            >
              {dashboardItems.length === 0 ? <p className="text-center py-10 opacity-50 text-sm italic">Nessuna attività</p> :
                dashboardItems.map((item, i) => {
                  const stock = item.med.remainingQuantity;
                  const min = item.med.minQuantity || 0;
                  const isLowStock = stock <= min;
                  let stockColorClass = stock <= 0 ? "text-red-500" : stock <= min ? "text-yellow-400" : "text-white";

                  const itemKey = `${item.med.id}-${item.time}`;
                  const isProcessing = processingLogs[itemKey];

                  return (
                    <div key={i} className="bg-white dark:bg-dark-surface p-2 rounded-2xl flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.status === 'taken' ? 'bg-green-500' : item.status === 'skipped' ? 'bg-red-500' : 'bg-primary'}`}></div>
                      <div className="flex flex-col items-center min-w-[3.2rem] bg-gray-800 dark:bg-gray-900 p-1.5 rounded-xl text-white">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white ${item.med.color}`}><Pill size={16} /></div>
                        <span className="text-sm font-black mt-1">{item.time}</span>
                      </div>
                      <div className="flex-1 min-w-0 py-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <ScrollingName
                            name={item.med.name}
                            className="flex-1 min-w-0 font-bold text-gray-800 dark:text-white text-sm"
                            containerWidth="100%"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              LeafletService.openLeaflet(item.med.leafletUrl, item.med.name).then(url => {
                                if (url && url !== item.med.leafletUrl) {
                                  db.upsertMedication({ ...item.med, leafletUrl: url }).then(() => loadAllData());
                                }
                              });
                            }}
                            className="p-1 text-primary hover:bg-primary/10 rounded-full transition-colors"
                            title="Bugiardino"
                          >
                            <Info size={14} />
                          </button>
                        </div>

                        <p className="text-[10px] text-gray-500 truncate">{item.med.dosage} {item.med.unit}. - {item.quantity} pz.</p>
                        <p className="text-[10px] mt-1 flex items-center gap-1">
                          <span className="text-gray-400 font-medium uppercase">Scorta:</span>
                          <span className={`px-1.5 py-0.5 rounded bg-gray-900 dark:bg-black/60 ${stockColorClass} font-bold`}>{stock} pz</span>
                        </p>
                        {isLowStock && (
                          <p className="text-[10px] font-black text-red-600 dark:text-red-400 mt-1 uppercase animate-pulse flex items-center gap-1">
                            <AlertCircle size={9} strokeWidth={3} /> {stock <= 0 ? 'Scorta esaurita!' : 'Scorta in esaurimento!'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0 items-center justify-center min-w-[5rem]">
                        {isProcessing ? (
                          <div className="animate-in zoom-in duration-300">
                            {/* Spunta verde per Assunto o Annulla, X rossa per Saltato */}
                            {(isProcessing === 'taken' || isProcessing === 'undo') ? (
                              <Check size={28} className="text-green-500" strokeWidth={3} />
                            ) : (
                              <X size={28} className="text-red-500" strokeWidth={3} />
                            )}
                          </div>
                        ) : item.status === 'pending' ? (
                          <>
                            <button onClick={() => handleSkipMed(item.med.id, item.time)} className="p-2 bg-red-500/10 text-red-500 rounded-full"><X size={16} /></button>
                            <button onClick={() => handleTakeMed(item.med.id, item.time)} className="p-2 bg-green-500/10 text-green-600 rounded-full"><Check size={16} /></button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 min-w-[3rem]">
                            {item.status === 'taken' ? (
                              <Check size={22} className="text-green-500 animate-in zoom-in duration-300" strokeWidth={4} />
                            ) : (
                              <X size={22} className="text-red-500 animate-in zoom-in duration-300" strokeWidth={4} />
                            )}
                            <button onClick={() => handleUndo(item.med.id, item.time)} className="text-[9px] text-primary font-bold underline opacity-80 hover:opacity-100">Annulla</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-4 mt-6">
            {filteredMedications.length === 0 ? <p className="text-center py-20 opacity-50 text-sm">Catalogo vuoto</p> :
              filteredMedications.map(med => {
                const isLowStock = med.remainingQuantity <= (med.minQuantity || 0);
                return (
                  <div
                    key={med.id}
                    onClick={() => { setEditingMed(med); setIsMedModalOpen(true); }}
                    className="bg-white dark:bg-dark-surface p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:scale-[1.01] cursor-pointer active:scale-[0.99] group"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 ${med.isActive ? med.color : 'bg-gray-400 dark:bg-gray-600'}`}>
                      <Pill size={24} />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center gap-2 pr-2">
                        <ScrollingName
                          name={med.name + (!med.isActive ? ' (Sospeso)' : '')}
                          className={`flex-1 min-w-0 font-bold group-hover:text-primary transition-colors ${med.isActive ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}
                          containerWidth="100%"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            LeafletService.openLeaflet(med.leafletUrl, med.name).then(url => {
                              if (url && url !== med.leafletUrl) {
                                db.upsertMedication({ ...med, leafletUrl: url }).then(() => loadAllData());
                              }
                            });
                          }}
                          className="p-1 text-primary hover:bg-primary/10 rounded-full transition-colors shrink-0"
                          title="Bugiardino"
                        >
                          <Info size={14} />
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5">{med.dosage} {med.unit} • Scorta: <span className={`font-black ${med.isActive ? getStockColorClass(med) : 'text-gray-400'}`}>{med.remainingQuantity}</span> pz</p>
                      {med.isActive && isLowStock && (
                        <p className="text-[11px] font-black text-red-600 dark:text-red-400 mt-1 uppercase animate-pulse flex items-center gap-1">
                          <AlertCircle size={10} strokeWidth={3} /> {med.remainingQuantity <= 0 ? 'Scorta esaurita!' : 'Scorta in esaurimento!'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 items-center justify-center border-l dark:border-gray-800 pl-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingMed(med); setIsMedModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => triggerDelete(med.id, 'medication')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                      <button
                        onClick={async () => {
                          const updatedMed = { ...med, isActive: !med.isActive };
                          await db.upsertMedication(updatedMed);
                          await loadAllData();
                        }}
                        className={`w-10 h-6 rounded-full p-1 transition-colors relative ${med.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                        title={med.isActive ? 'Disattiva' : 'Attiva'}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${med.isActive ? 'translate-x-4' : ''}`}></div>
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {view === 'weights' && (
          <div className="space-y-4">
            {/* STICKY TOGGLE BAR CON POSIZIONE CALCOLATA */}
            <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-40 -mx-4 px-4 py-2 bg-background/95 dark:bg-dark-bg/95 backdrop-blur-md border-b dark:border-gray-800 shadow-sm">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                <button onClick={() => setWeightView('list')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${weightView === 'list' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}><List size={18} /> ELENCO</button>
                <button onClick={() => setWeightView('chart')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${weightView === 'chart' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}><LineChart size={18} /> GRAFICI</button>
              </div>
            </div>

            {weightView === 'list' ? (
              <div className="space-y-3 pt-2">
                {sortedWeights.length === 0 ? <p className="text-center py-10 opacity-50 italic">Nessun dato registrato</p> :
                  sortedWeights.map(w => (
                    <div key={w.id} className="bg-white dark:bg-dark-surface p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center font-black"><Scale size={20} /></div>
                        <div>
                          <p className="text-lg font-black text-gray-800 dark:text-white leading-none">{w.weight} <span className="text-sm font-medium text-gray-400">kg</span></p>
                          <p className="text-xs text-gray-500 mt-1">{formatDateIT(w.date)} • {w.time}</p>
                        </div>
                      </div>
                      <div className="flex-1 px-4"></div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingWeight(w); setIsWeightModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => triggerDelete(w.id, 'weight')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              /* GRAFICO SENZA SCROLL VERTICALE - ALTEZZA FISSA AGGIORNATA A h-60 */
              <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden space-y-6">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="font-black uppercase tracking-widest text-xs text-gray-400">Andamento Peso</h3>
                  <select value={chartPeriod} onChange={(e) => setChartPeriod(e.target.value as any)} className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold p-2 rounded-lg border-none focus:ring-1 focus:ring-primary outline-none">
                    <option value="10">Ultimi 10</option>
                    <option value="20">Ultimi 20</option>
                    <option value="30">Ultimi 30</option>
                    <option value="7G">Ultimi 7 gg</option>
                    <option value="30G">Ultimi 30 gg</option>
                    <option value="365G">Ultimo anno</option>
                  </select>
                </div>

                <div className="h-60 w-full relative pt-6 px-2">
                  {weightChartData.length < 2 ? <div className="h-full flex items-center justify-center italic text-xs text-gray-400">Dati insufficienti per il trend</div> : (
                    <div className="relative w-full h-full">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                          d={`M 0 100 ${weightChartData.map((w, i) => `L ${(i / (weightChartData.length - 1)) * 100} ${100 - w.h}`).join(' ')} L 100 100 Z`}
                          fill="url(#weight-grad)"
                          className="transition-all duration-700"
                        />
                        <path
                          d={weightChartData.map((w, i) => `${i === 0 ? 'M' : 'L'} ${(i / (weightChartData.length - 1)) * 100} ${100 - w.h}`).join(' ')}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          className="transition-all duration-700"
                        />
                        {selectedWeightIndex !== null && weightChartData[selectedWeightIndex] && (
                          <circle
                            cx={(selectedWeightIndex / (weightChartData.length - 1)) * 100}
                            cy={100 - weightChartData[selectedWeightIndex].h}
                            r="3"
                            fill="#3b82f6"
                            stroke="white"
                            strokeWidth="1"
                            className="animate-in fade-in duration-300"
                          />
                        )}
                        <defs>
                          <linearGradient id="weight-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex">
                        {weightChartData.map((_, i) => (
                          <div key={i} className="flex-1 h-full cursor-pointer group" onClick={() => setSelectedWeightIndex(selectedWeightIndex === i ? null : i)}>
                            <div className={`w-[1px] h-full mx-auto bg-primary/0 transition-colors ${selectedWeightIndex === i ? 'bg-primary/20' : 'group-hover:bg-primary/10'}`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 min-h-[5.5rem] flex items-center justify-center text-center shrink-0">
                  {selectedWeightIndexDetail ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Misurazione Selezionata</p>
                      <div className="flex items-center gap-3 justify-center">
                        <span className="text-2xl font-black text-primary">{selectedWeightIndexDetail.weight} <span className="text-xs font-bold text-gray-400">kg</span></span>
                        <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase leading-none">{formatDateIT(selectedWeightIndexDetail.date)}</p>
                          <p className="text-[10px] font-medium text-gray-400 uppercase mt-1">{selectedWeightIndexDetail.time}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-medium italic">Seleziona una barra per vedere i dettagli</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'glucose' && (
          <div className="space-y-4">
            <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-40 -mx-4 px-4 py-2 bg-background/95 dark:bg-dark-bg/95 backdrop-blur-md border-b dark:border-gray-800 shadow-sm">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                <button onClick={() => setGlucoseView('list')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${glucoseView === 'list' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}><List size={18} /> ELENCO</button>
                <button onClick={() => setGlucoseView('chart')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${glucoseView === 'chart' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}><LineChart size={18} /> GRAFICI</button>
              </div>
            </div>

            {glucoseView === 'list' ? (
              <div className="space-y-4 pt-2">
                {sortedGlucose.length === 0 ? <p className="text-center py-10 opacity-50 italic">Nessun dato registrato</p> :
                  sortedGlucose.map(g => {
                    const colors = getGlucoseCategoryColor(g.glucose);
                    return (
                      <div key={g.id} className="bg-white dark:bg-dark-surface rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.dot}`}></div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${colors.bg} ${colors.text}`}>
                                {colors.label}
                              </div>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-2xl font-black ${colors.text}`}>{g.glucose}</span>
                              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest ml-1">mg/dL</span>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              <p className="text-xs text-gray-400 font-medium">{formatDateIT(g.date)} • {g.time}</p>
                              {g.note && <p className="text-[11px] text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700/50 mt-1 line-clamp-2">"{g.note}"</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditingGlucose(g); setIsGlucoseModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => triggerDelete(g.id, 'glucose')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden space-y-6">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="font-black uppercase tracking-widest text-xs text-gray-400">Andamento Glicemia</h3>
                  <select value={glucoseChartPeriod} onChange={(e) => setGlucoseChartPeriod(e.target.value as any)} className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold p-2 rounded-lg border-none focus:ring-1 focus:ring-primary outline-none">
                    <option value="10">Ultimi 10</option>
                    <option value="20">Ultimi 20</option>
                    <option value="30">Ultimi 30</option>
                    <option value="7G">Ultimi 7 gg</option>
                    <option value="30G">Ultimi 30 gg</option>
                    <option value="365G">Ultimo anno</option>
                  </select>
                </div>

                <div className="h-60 w-full relative pt-6 px-2">
                  {glucoseChartData.length < 2 ? <div className="h-full flex items-center justify-center italic text-xs text-gray-400">Dati insufficienti per il trend</div> : (
                    <div className="relative w-full h-full">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                          d={`M 0 100 ${glucoseChartData.map((g, i) => `L ${(i / (glucoseChartData.length - 1)) * 100} ${100 - g.h}`).join(' ')} L 100 100 Z`}
                          fill="url(#glucose-grad)"
                          className="transition-all duration-700"
                        />
                        <path
                          d={glucoseChartData.map((g, i) => `${i === 0 ? 'M' : 'L'} ${(i / (glucoseChartData.length - 1)) * 100} ${100 - g.h}`).join(' ')}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          className="transition-all duration-700"
                        />
                        {selectedGlucoseIndex !== null && glucoseChartData[selectedGlucoseIndex] && (
                          <circle
                            cx={(selectedGlucoseIndex / (glucoseChartData.length - 1)) * 100}
                            cy={100 - glucoseChartData[selectedGlucoseIndex].h}
                            r="3"
                            fill="#f43f5e"
                            stroke="white"
                            strokeWidth="1"
                            className="animate-in fade-in duration-300"
                          />
                        )}
                        <defs>
                          <linearGradient id="glucose-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex">
                        {glucoseChartData.map((_, i) => (
                          <div key={i} className="flex-1 h-full cursor-pointer group" onClick={() => setSelectedGlucoseIndex(selectedGlucoseIndex === i ? null : i)}>
                            <div className={`w-[1px] h-full mx-auto bg-rose-500/0 transition-colors ${selectedGlucoseIndex === i ? 'bg-rose-500/20' : 'group-hover:bg-rose-500/10'}`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 min-h-[5.5rem] flex items-center justify-center text-center shrink-0">
                  {selectedGlucoseIndexDetail ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Misurazione Selezionata</p>
                      <div className="flex items-center gap-3 justify-center">
                        <span className="text-2xl font-black text-rose-500">{selectedGlucoseIndexDetail.glucose} <span className="text-xs font-bold text-gray-400">mg/dL</span></span>
                        <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase leading-none">{formatDateIT(selectedGlucoseIndexDetail.date)}</p>
                          <p className="text-[10px] font-medium text-gray-400 uppercase mt-1">{selectedGlucoseIndexDetail.time}</p>
                        </div>
                      </div>
                      {selectedGlucoseIndexDetail.note && <p className="text-[10px] text-gray-500 mt-2 italic">"{selectedGlucoseIndexDetail.note}"</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 font-medium italic">Seleziona una barra per vedere i dettagli</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'pressure' && (
          <div className="space-y-4">
            {/* STICKY TOGGLE BAR CON POSIZIONE CALCOLATA */}
            <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-40 -mx-4 px-4 py-2 bg-background/95 dark:bg-dark-bg/95 backdrop-blur-md border-b dark:border-gray-800 shadow-sm">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                <button onClick={() => setBpView('list')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${bpView === 'list' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}><List size={18} /> ELENCO</button>
                <button onClick={() => setBpView('chart')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${bpView === 'chart' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}><LineChart size={18} /> GRAFICI</button>
              </div>
            </div>

            {bpView === 'list' ? (
              <div className="space-y-4 pt-2">
                {sortedBP.length === 0 ? <p className="text-center py-10 opacity-50 italic">Nessuna misurazione registrata</p> :
                  sortedBP.map(b => {
                    const colors = getBPCategoryColor(b.systolic, b.diastolic);
                    return (
                      <div key={b.id} className="bg-white dark:bg-dark-surface rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.dot}`}></div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${colors.bg} ${colors.text}`}>
                                {b.systolic >= 180 || b.diastolic >= 110 ? 'Ipert. Severa' :
                                  b.systolic >= 160 || b.diastolic >= 100 ? 'Ipert. Media' :
                                    b.systolic >= 140 || b.diastolic >= 90 ? 'Ipert. Lieve' :
                                      b.systolic >= 130 || b.diastolic >= 85 ? 'Limiti Sup.' :
                                        b.systolic >= 120 || b.diastolic >= 80 ? 'Normale' : 'Ottimale'}
                              </div>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-2xl font-black ${colors.text}`}>{b.systolic}</span>
                              <span className="text-lg font-black text-gray-300 dark:text-gray-600">/</span>
                              <span className={`text-2xl font-black ${colors.text}`}>{b.diastolic}</span>
                              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest ml-1">mmHg</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-400 font-medium">{formatDateIT(b.date)} • {b.time}</p>
                              <p className="flex items-center gap-1 text-xs text-red-500 font-black"><Heart size={12} /> {b.pulse} <span className="text-[10px] uppercase opacity-60">bpm</span></p>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditingBP(b); setIsBPModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 size={18} /></button>
                            <button onClick={() => triggerDelete(b.id, 'pressure')} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="bg-white dark:bg-dark-surface p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase tracking-widest text-xs text-gray-400">Trend Pressione</h3>
                    <select value={bpChartPeriod} onChange={(e) => setBpChartPeriod(e.target.value as any)} className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold p-2 rounded-lg border-none focus:ring-1 focus:ring-primary outline-none">
                      <option value="10">Ultimi 10</option>
                      <option value="20">Ultimi 20</option>
                      <option value="30">Ultimi 30</option>
                      <option value="7G">Ultimi 7 gg</option>
                      <option value="30G">Ultimi 30 gg</option>
                      <option value="365G">Ultimo anno</option>
                    </select>
                  </div>

                  <div className="h-60 w-full relative pt-6 px-2"> {/* AGGIORNATA ALTEZZA A h-60 */}
                    {bpChartData.length < 2 ? <div className="h-full flex items-center justify-center italic text-xs text-gray-400">Dati insufficienti per il trend</div> : (
                      <div className="relative w-full h-full">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path d={`M 0 100 ${bpChartData.map((b, i) => `L ${(i / (bpChartData.length - 1)) * 100} ${100 - b.dH}`).join(' ')} L 100 100 Z`} fill="url(#bp-dia-grad)" className="transition-all duration-700" />
                          <path d={`M 0 100 ${bpChartData.map((b, i) => `L ${(i / (bpChartData.length - 1)) * 100} ${100 - b.sH}`).join(' ')} L 100 100 Z`} fill="url(#bp-sys-grad)" className="transition-all duration-700" />
                          <path d={bpChartData.map((b, i) => `${i === 0 ? 'M' : 'L'} ${(i / (bpChartData.length - 1)) * 100} ${100 - b.sH}`).join(' ')} fill="none" stroke="#ef4444" strokeWidth="1.0" className="transition-all duration-700" />
                          <path d={bpChartData.map((b, i) => `${i === 0 ? 'M' : 'L'} ${(i / (bpChartData.length - 1)) * 100} ${100 - b.dH}`).join(' ')} fill="none" stroke="#3b82f6" strokeWidth="1.0" className="transition-all duration-700" />
                          {selectedBPIndex !== null && bpChartData[selectedBPIndex] && (
                            <g className="animate-in fade-in duration-300">
                              <circle cx={(selectedBPIndex / (bpChartData.length - 1)) * 100} cy={100 - bpChartData[selectedBPIndex].sH} r="3" fill="#ef4444" stroke="white" strokeWidth="1" />
                              <circle cx={(selectedBPIndex / (bpChartData.length - 1)) * 100} cy={100 - bpChartData[selectedBPIndex].dH} r="3" fill="#3b82f6" stroke="white" strokeWidth="1" />
                            </g>
                          )}
                          <defs>
                            <linearGradient id="bp-sys-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="bp-dia-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex">
                          {bpChartData.map((_, i) => (
                            <div key={i} className="flex-1 h-full cursor-pointer group" onClick={() => setSelectedBPIndex(selectedBPIndex === i ? null : i)}>
                              <div className={`w-[1px] h-full mx-auto bg-primary/0 transition-colors ${selectedBPIndex === i ? 'bg-primary/20' : 'group-hover:bg-primary/10'}`}></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between mt-4">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Sistolica</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Diastolica</span></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 min-h-[5.5rem] flex items-center justify-center text-center">
                    {selectedBPIndexDetail ? (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Misurazione Selezionata</p>
                        <div className="flex items-center gap-4 justify-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-baseline gap-1">
                              <span className={`text-2xl font-black leading-none ${getBPCategoryColor(selectedBPIndexDetail.systolic, selectedBPIndexDetail.diastolic).text}`}>{selectedBPIndexDetail.systolic}</span>
                              <span className="text-lg font-black text-gray-300">/</span>
                              <span className={`text-2xl font-black leading-none ${getBPCategoryColor(selectedBPIndexDetail.systolic, selectedBPIndexDetail.diastolic).text}`}>{selectedBPIndexDetail.diastolic}</span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">mmHg</span>
                          </div>
                          <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-red-500">
                              <Heart size={14} className="fill-current" />
                              <span className="text-xl font-black">{selectedBPIndexDetail.pulse}</span>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">bpm</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 font-medium italic">Seleziona un punto sul grafico per i dettagli</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'notes' && (
          <div className="space-y-4">
            {/* STICKY SEARCH BAR CON POSIZIONE CALCOLATA */}
            <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-40 -mx-4 px-4 py-2 bg-background/95 dark:bg-dark-bg/95 backdrop-blur-md border-b dark:border-gray-800 mb-2 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="notes-search-input"
                  value={noteSearchQuery} onChange={(e) => setNoteSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-dark-surface p-4 pl-12 pr-12 rounded-2xl border border-gray-100 dark:border-gray-800 focus:border-primary outline-none shadow-sm transition-all"
                  placeholder="Cerca nelle tue note..."
                />
                {noteSearchQuery && (
                  <button
                    onClick={() => {
                      setNoteSearchQuery('');
                      document.getElementById('notes-search-input')?.blur();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {sortedNotes.length === 0 ? <p className="col-span-full text-center py-20 opacity-50 italic">Nessuna nota trovata</p> :
                sortedNotes.map(n => (
                  <div key={n.id} onClick={() => { setViewingNote(n); setIsViewNoteModalOpen(true); }} className="bg-white dark:bg-dark-surface p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3 group cursor-pointer hover:border-primary transition-all">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 dark:text-white truncate pr-2 group-hover:text-primary transition-colors">{n.title}</h3>
                      <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditingNote(n); setIsNoteModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => triggerDelete(n.id, 'note')} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{n.content}</p>
                    <div className="flex items-center gap-2 mt-auto pt-2 text-[10px] font-bold text-gray-400 uppercase">
                      <Calendar size={12} /> {formatDateIT(n.date)} • <Clock size={12} /> {n.time}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {view === 'settings' && (
          <SettingsView
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode(!darkMode)}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={() => {
              if (!notificationsEnabled && "Notification" in window) {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') setNotificationsEnabled(true);
                });
              } else {
                setNotificationsEnabled(!notificationsEnabled);
              }
            }}
            onExportData={() => setIsExportModalOpen(true)}
            onViewDisclaimer={() => {
              setDisclaimerMode('view-only');
              setIsDisclaimerModalOpen(true);
            }}
            onBackup={async () => {
              try {
                const exportData = await db.exportBackup();
                const date = new Date().toISOString().split('T')[0];
                const fileName = `${date} Backup La Mia Salute.json`;

                if (Capacitor.isNativePlatform()) {
                  // Su Android/iOS usiamo il plugin Share
                  const result = await Filesystem.writeFile({
                    path: fileName,
                    data: exportData,
                    directory: Directory.Cache,
                    encoding: 'utf8' as any
                  });

                  await Share.share({
                    title: `${date} Backup La Mia Salute.json`,
                    url: result.uri,
                    dialogTitle: 'Salva il tuo backup'
                  });
                } else {
                  // Fallback per browser
                  const blob = new Blob([exportData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  a.click();
                  URL.revokeObjectURL(url);
                }
                showToast('Backup creato con successo! Ricorda: i file dei referti non sono inclusi.');
              } catch (err) {
                console.error('Errore durante il backup:', err);
                showToast('Errore durante la creazione del backup.', 'error');
              }
            }}
            onRestore={async (json) => {
              try {
                setLoadingMessage('Ripristino Backup...');
                setLoading(true);
                await db.importBackup(json);
                await loadAllData();
                setLoading(false);
                showToast("Backup ripristinato con successo!");
              } catch (e) {
                setLoading(false);
                showToast("Errore durante il ripristino del backup.", 'error');
              }
            }}
          />
        )}

        {view === 'archive' && (
          <ArchiveView
            onNavigate={(v) => setView(v)}
            onBack={() => setView('home')}
            activePatientName={activePatient?.name || 'Paziente'}
            recordsFolderLink={activePatient?.recordsFolderLink}
          />
        )}

        {view === 'analysis_db' && (
          <AnalysisDbView
            onNavigate={(v) => setView(v)}
            onBack={() => setView('home')}
            activePatientName={activePatient?.name || 'Paziente'}
            sessions={filteredAnalysisSessions}
            items={filteredAnalysisItems}
            onDeleteSession={handleDeleteAnalysisSession}
            onSelectSession={(s) => { setSelectedSession(s); setIsViewAnalysisModalOpen(true); }}
            onDuplicateSession={handleDuplicateAnalysisSession}
            onManageNames={() => setIsManageNamesModalOpen(true)}
          />
        )}


        {view === 'stats' && (
          <StatsView medications={filteredMedications} logs={filteredLogs} />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-dark-surface border-t dark:border-gray-800 flex justify-around items-center px-4 pb-safe z-40 shadow-lg">
        <div className="h-16 w-full flex justify-around items-center">
          <button onClick={() => { setView('home'); setIsSidebarOpen(false); }} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-green-500' : 'text-gray-400'}`}><Home size={22} fill="currentColor" fillOpacity={view === 'home' ? 0.1 : 0} /><span className="text-[10px] font-bold">Home</span></button>
          <button onClick={() => setView('medications')} className={`flex flex-col items-center gap-1 ${view === 'medications' ? 'text-primary' : 'text-gray-400'}`}><Pill size={22} /><span className="text-[10px] font-bold">Farmaci</span></button>
          <button onClick={() => setView('notes')} className={`flex flex-col items-center gap-1 ${view === 'notes' ? 'text-primary' : 'text-gray-400'}`}><StickyNote size={22} /><span className="text-[10px] font-bold">Note</span></button>
          <div className="-mt-8">
            <button
              onClick={view === 'home' ? () => setView('settings') : (view === 'settings') ? () => setView('home') : (view === 'archive') ? () => setView('analysis_db') : handleAddButtonClick}
              className="bg-primary text-white p-3.5 rounded-full shadow-xl flex items-center justify-center transition-transform active:scale-95"
            >
              {view === 'home' ? (
                <Settings size={26} strokeWidth={3} />
              ) : (view === 'settings') ? (
                <Home size={26} className="text-green-400" strokeWidth={3} />
              ) : (view === 'archive') ? (
                <Database size={26} strokeWidth={3} />
              ) : (
                <Plus size={26} strokeWidth={3} />
              )}
            </button>
          </div>
          <button onClick={() => setView('pressure')} className={`flex flex-col items-center gap-1 ${view === 'pressure' ? 'text-primary' : 'text-gray-400'}`}><Activity size={22} /><span className="text-[10px] font-bold">Press.</span></button>
          <button onClick={() => setView('weights')} className={`flex flex-col items-center gap-1 ${view === 'weights' ? 'text-primary' : 'text-gray-400'}`}><Scale size={22} /><span className="text-[10px] font-bold">Peso</span></button>
          <button onClick={() => setView('glucose')} className={`flex flex-col items-center gap-1 ${view === 'glucose' ? 'text-primary' : 'text-gray-400'}`}><Droplets size={22} /><span className="text-[10px] font-bold">Glicemia</span></button>
        </div>
      </nav>

      <AddMedicationModal
        isOpen={isMedModalOpen}
        onClose={() => { setIsMedModalOpen(false); setEditingMed(null); }}
        onAdded={async (m) => {
          await db.upsertMedication(m);
          await loadAllData();
        }}
        initialData={editingMed}
        activePatientId={activePatientId}
      />
      <AddNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => { setIsNoteModalOpen(false); setEditingNote(null); }}
        onAdded={async (n) => {
          await db.upsertNote(n);
          await loadAllData();
        }}
        initialData={editingNote}
        activePatientId={activePatientId}
      />
      <AddWeightModal
        isOpen={isWeightModalOpen}
        onClose={() => { setIsWeightModalOpen(false); setEditingWeight(null); }}
        onAdded={async (w) => {
          await db.upsertWeight(w);
          await loadAllData();
        }}
        initialData={editingWeight}
        activePatientId={activePatientId}
      />
      <AddGlucoseModal
        isOpen={isGlucoseModalOpen}
        onClose={() => { setIsGlucoseModalOpen(false); setEditingGlucose(null); }}
        onAdded={async (g) => {
          await db.upsertGlucose(g);
          await loadAllData();
        }}
        initialData={editingGlucose}
        activePatientId={activePatientId}
      />
      <AddBloodPressureModal
        isOpen={isBPModalOpen}
        onClose={() => { setIsBPModalOpen(false); setEditingBP(null); }}
        onAdded={async (b) => {
          await db.upsertBloodPressure(b);
          await loadAllData();
        }}
        initialData={editingBP}
        activePatientId={activePatientId}
      />
      <AddPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => { setIsPatientModalOpen(false); setEditingPatient(null); }}
        onAdded={handleAddPatient}
        initialData={editingPatient}
      />
      <AddAnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        onAdded={handleAddAnalysis}
        activePatientId={activePatientId}
        allAnalysisItems={data.analysisItems}
        allSessions={data.analysisSessions}
        proposedAnalysisNames={proposedAnalysisNames}
      />
      <ViewAnalysisModal
        isOpen={isViewAnalysisModalOpen}
        onClose={() => setIsViewAnalysisModalOpen(false)}
        session={selectedSession}
        items={data.analysisItems.filter(i => i.sessionId === selectedSession?.id)}
        onUpdateItem={handleUpdateAnalysisItem}
        onDeleteItem={handleDeleteAnalysisItem}
        onAddItem={handleAddAnalysisItem}
        onUpdateSession={handleUpdateAnalysisSession}
        allAnalysisItems={data.analysisItems}
        allSessions={data.analysisSessions}
        proposedAnalysisNames={proposedAnalysisNames}
      />
      <ManageAnalysisNamesModal
        isOpen={isManageNamesModalOpen}
        onClose={() => setIsManageNamesModalOpen(false)}
        analysisNames={proposedAnalysisNames}
        analysisItems={filteredAnalysisItems}
        onRename={handleRenameAnalysisName}
        onDelete={handleDeleteAnalysisName}
      />
      <ViewNoteModal isOpen={isViewNoteModalOpen} onClose={() => { setIsViewNoteModalOpen(false); setViewingNote(null); }} note={viewingNote} />
      <SelectMedsModal
        isOpen={isSelectMedsModalOpen}
        onClose={() => setIsSelectMedsModalOpen(false)}
        medications={filteredMedications}
        activePatient={activePatient}
        onConfirm={(selected) => {
          setSelectedMedsForRequest(selected);
          setIsSelectMedsModalOpen(false);
          setIsRequestMedsModalOpen(true);
        }}
      />
      <RequestMedsModal
        isOpen={isRequestMedsModalOpen}
        onClose={() => setIsRequestMedsModalOpen(false)}
        medications={filteredMedications}
        selectedMeds={selectedMedsForRequest}
        activePatient={activePatient}
        onUpdatePatient={handleAddPatient}
      />
      <ExportPDFModal
        isOpen={isExportPDFModalOpen}
        onClose={() => setIsExportPDFModalOpen(false)}
        onExport={handleExportPDF}
        patientName={activePatient?.name || 'Paziente'}
      />
      <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={handleExportCSV} />
      <BPLegendModal isOpen={isBPLegendOpen} onClose={() => setIsBPLegendOpen(false)} />
      <GlucoseLegendModal isOpen={isGlucoseLegendOpen} onClose={() => setIsGlucoseLegendOpen(false)} />
      <DisclaimerModal
        isOpen={isDisclaimerModalOpen}
        mode={disclaimerMode}
        onClose={() => setIsDisclaimerModalOpen(false)}
        onAccept={handleAcceptDisclaimer}
        onDecline={handleDeclineDisclaimer}
      />
      <StatusToast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title={
          deleteType === 'analysis_session' ? 'Elimina Sessione' :
          deleteType === 'analysis_item' ? 'Elimina Analisi' :
          deleteType === 'analysis_name_all' ? 'Eliminazione Totale' :
          deleteType === 'patient' ? 'Elimina Profilo' :
          'Elimina Voce'
        }
        message={
          deleteType === 'analysis_session' ? 'Vuoi davvero eliminare questa intera sessione e tutti gli esami contenuti?' :
          deleteType === 'analysis_item' ? 'Vuoi eliminare questa singola voce di analisi?' :
          deleteType === 'analysis_name_all' ? 'ATTENZIONE: Eliminando questo nome, elimini tutti i dati ad esso associati (rinominandolo invece non perderai alcun dato). Sei sicuro di voler eliminare tutte le occorrenze di questo esame?' :
          deleteType === 'patient' ? 'Tutti i dati associati a questo profilo verranno persi. Continuare?' :
          'Confermi l\'azione di eliminazione?'
        }
        onConfirm={confirmDelete}
        onCancel={() => { setConfirmDeleteId(null); setDeleteAnalysisName(null); }}
      />
    </div>
  );
};

export default App;