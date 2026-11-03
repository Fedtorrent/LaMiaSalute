
export interface Patient {
  id: string;
  name: string;
  color: string;
  doctorEmail?: string;
  doctorName?: string;
  emailPatientName?: string;
  recordsFolderLink?: string; // Link alla cartella pubblica sul cloud (Google Drive, etc.)
}

export interface ScheduleItem {
  time: string; // HH:mm
  quantity: number;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string; // Valore numerico o testo
  unit: string;   // Unità di misura (mg, ml, etc)
  totalQuantity: number;
  remainingQuantity: number;
  minQuantity?: number; // Scorta minima per avviso
  schedule: ScheduleItem[]; 
  color: string;
  icon: string;
  isActive: boolean;
  startDate: string; // YYYY-MM-DD
  durationDays?: number; // Numero totale di assunzioni (giorni, settimane o mesi in base alla frequenza)
  notificationsEnabled: boolean;
  notificationsTime?: string[]; // Orari notifiche (opzionale, calcolato da schedule)
  notes?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 (Sun-Sat)
  dayOfMonth?: number; // 1-31
  leafletUrl?: string; // URL del bugiardino digitale
}

export interface IntakeLog {
  id: string;
  patientId: string;
  medicationId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'taken' | 'skipped' | 'pending';
}

export interface Note {
  id: string;
  patientId: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface WeightLog {
  id: string;
  patientId: string;
  weight: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface GlucoseLog {
  id: string;
  patientId: string;
  glucose: number;
  note?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface BloodPressureLog {
  id: string;
  patientId: string;
  systolic: number;  // Massima
  diastolic: number; // Minima
  pulse: number;     // Battiti
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface AnalysisSession {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  laboratory: string;
  type?: string; // Sangue, Urine, Altro...
}

export const EXAM_TYPES = ["Sangue", "Urine", "Altro"];

export interface AnalysisItem {
  id: string;
  sessionId: string;
  patientId: string;
  name: string;
  value: string;
  unit: string;
  minValue?: string;
  maxValue?: string;
}

export interface CustomAnalysisName {
  id: string;
  patientId: string;
  name: string;
  isDeleted: boolean;
}

export interface AppData {
  patients: Patient[];
  medications: Medication[];
  logs: IntakeLog[];
  notes: Note[];
  weights: WeightLog[];
  glucoseLogs: GlucoseLog[];
  bloodPressureLogs: BloodPressureLog[];
  analysisSessions: AnalysisSession[];
  analysisItems: AnalysisItem[];
  customAnalysisNames?: CustomAnalysisName[];
}

export interface ExportSelections {
  notes: boolean;
  pressure: boolean;
  weight: boolean;
  glucose: boolean;
  medications: boolean;
}

export const MED_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-lime-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-orange-600',
  'bg-teal-500', 'bg-yellow-500'
];

export const COLOR_LABELS: Record<string, string> = {
  'bg-blue-500': 'Blu',
  'bg-emerald-500': 'Verde Smeraldo',
  'bg-rose-500': 'Rosso',
  'bg-amber-500': 'Arancione',
  'bg-violet-500': 'Viola',
  'bg-cyan-500': 'Ciano',
  'bg-pink-500': 'Rosa',
  'bg-indigo-500': 'Indaco',
  'bg-lime-500': 'Verde Lime',
  'bg-fuchsia-500': 'Fucsia',
  'bg-sky-500': 'Celeste',
  'bg-orange-600': 'Arancio Scuro',
  'bg-teal-500': 'Teal',
  'bg-yellow-500': 'Giallo'
};

export const PATIENT_COLORS = [
  'bg-blue-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-cyan-500', 'bg-fuchsia-500'
];

export const COMMON_EXAMS: string[] = [];

export const MEASUREMENT_UNITS = [
  'pz', 'mg', 'g', 'mcg', 'ml', 'l', 'u', 'cpr', 'bustine', 'fiale', 'gtt', 'spray', 'puff', 'app'
];
