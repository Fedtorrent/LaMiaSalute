import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { AppData, Patient, Medication, IntakeLog, Note, WeightLog, BloodPressureLog, GlucoseLog, AnalysisSession, AnalysisItem } from '../types';

const DB_NAME = 'la_mia_salute_db';
const MIGRATION_KEY = 'app_db_migrated';

class DatabaseService {
  private sqlite!: SQLiteConnection;
  private db!: SQLiteDBConnection;

  async initDatabase() {
    try {
      // Inizializza sqlite solo qui per evitare problemi di caricamento anticipato del plugin
      if (!this.sqlite) {
        if (!CapacitorSQLite) {
          throw new Error("Il plugin CapacitorSQLite non è disponibile.");
        }
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
      }

      // Verifica connessioni esistenti e pulizia
      const isConn = await this.sqlite.isConnection(DB_NAME, false);
      if (isConn.result) {
        this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
      } else {
        this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
      }

      // Apri solo se non è già aperto
      const isOpen = await this.db.isDBOpen();
      if (!isOpen.result) {
        await this.db.open();
      }

      await this.createTables();

      // Controlla se è necessaria la migrazione
      const isMigrated = localStorage.getItem(MIGRATION_KEY);
      if (!isMigrated) {
        await this.migrateFromLocalStorage();
      }
    } catch (err: any) {
      console.error('Database initialization failed', err);
      throw new Error(`Errore DB: ${err.message || 'Inizializzazione fallita'}`);
    }
  }

  private async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        doctorEmail TEXT,
        doctorName TEXT,
        emailPatientName TEXT,
        recordsFolderLink TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        name TEXT NOT NULL,
        dosage TEXT,
        unit TEXT,
        totalQuantity REAL,
        remainingQuantity REAL,
        minQuantity REAL,
        schedule TEXT,
        color TEXT,
        icon TEXT,
        isActive INTEGER,
        startDate TEXT,
        durationDays INTEGER,
        notificationsEnabled INTEGER,
        notes TEXT,
        frequency TEXT,
        dayOfWeek INTEGER,
        dayOfMonth INTEGER,
        leafletUrl TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        medicationId TEXT,
        date TEXT,
        time TEXT,
        status TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        title TEXT,
        content TEXT,
        date TEXT,
        time TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS weights (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        weight REAL,
        date TEXT,
        time TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS blood_pressure (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        systolic INTEGER,
        diastolic INTEGER,
        pulse INTEGER,
        date TEXT,
        time TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS glucose (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        glucose REAL,
        note TEXT,
        date TEXT,
        time TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS analysis_sessions (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        date TEXT,
        laboratory TEXT,
        type TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS analysis_items (
        id TEXT PRIMARY KEY,
        sessionId TEXT,
        patientId TEXT,
        name TEXT,
        value TEXT,
        unit TEXT,
        minValue TEXT,
        maxValue TEXT
      )`
    ];

    // Pulizia vecchie tabelle
    try {
      await this.db.execute(`DROP TABLE IF EXISTS medical_records`);
    } catch (e) {
      // Ignora errori
    }

    for (const query of queries) {
      await this.db.execute(query);
    }

    // Migrazione: aggiunta colonna recordsFolderLink se mancante
    try {
      await this.db.execute(`ALTER TABLE patients ADD COLUMN recordsFolderLink TEXT`);
    } catch (e) {
      // La colonna esiste già, ignoriamo l'errore
    }

    try {
      await this.db.execute(`ALTER TABLE analysis_items ADD COLUMN minValue TEXT`);
      await this.db.execute(`ALTER TABLE analysis_items ADD COLUMN maxValue TEXT`);
    } catch (e) {
      // Colonne già presenti
    }

    try {
      await this.db.execute(`ALTER TABLE analysis_sessions ADD COLUMN type TEXT`);
    } catch (e) {
      // Colonna già presente
    }
  }

  // --- MIGRATION ---
  private async migrateFromLocalStorage() {
    console.log('Starting migration from localStorage...');
    const rawData = localStorage.getItem('medisafe_cached_data');
    if (!rawData) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    try {
      const data: AppData = JSON.parse(rawData);

      // Inserimento pazienti
      for (const p of data.patients || []) {
        await this.upsertPatient(p);
      }
      // Inserimento farmaci
      for (const m of data.medications || []) {
        await this.upsertMedication(m);
      }
      // Inserimento log
      for (const l of data.logs || []) {
        await this.addLog(l);
      }
      // Inserimento note
      for (const n of data.notes || []) {
        await this.upsertNote(n);
      }
      // Inserimento pesi
      for (const w of data.weights || []) {
        await this.upsertWeight(w);
      }
      // Inserimento pressione
      for (const b of data.bloodPressureLogs || []) {
        await this.upsertBloodPressure(b);
      }
      // Inserimento glicemia
      for (const g of (data as any).glucoseLogs || []) {
        await this.upsertGlucose(g);
      }

      localStorage.setItem(MIGRATION_KEY, 'true');
      console.log('Migration completed successfully');
    } catch (err) {
      console.error('Migration failed', err);
    }
  }

  // --- QUERIES ---
  async getAllData(): Promise<AppData> {
    const patients = (await this.db.query('SELECT * FROM patients')).values as Patient[];
    const medications = (await this.db.query('SELECT * FROM medications')).values?.map((m: any) => ({
      ...m,
      isActive: m.isActive === 1,
      notificationsEnabled: m.notificationsEnabled === 1,
      schedule: JSON.parse(m.schedule || '[]')
    })) as Medication[];
    const logs = (await this.db.query('SELECT * FROM logs')).values as IntakeLog[];
    const notes = (await this.db.query('SELECT * FROM notes')).values as Note[];
    const weights = (await this.db.query('SELECT * FROM weights')).values as WeightLog[];
    const glucoseLogs = (await this.db.query('SELECT * FROM glucose')).values as GlucoseLog[];
    const bloodPressureLogs = (await this.db.query('SELECT * FROM blood_pressure')).values as BloodPressureLog[];

    return {
      patients: patients || [],
      medications: medications || [],
      logs: logs || [],
      notes: notes || [],
      weights: weights || [],
      glucoseLogs: glucoseLogs || [],
      bloodPressureLogs: bloodPressureLogs || [],
      analysisSessions: (await this.db.query('SELECT * FROM analysis_sessions')).values || [],
      analysisItems: (await this.db.query('SELECT * FROM analysis_items')).values || []
    };
  }

  // --- CRUD PATIENTS ---
  async upsertPatient(p: Patient) {
    const sql = `INSERT OR REPLACE INTO patients (id, name, color, doctorEmail, doctorName, emailPatientName, recordsFolderLink) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await this.db.run(sql, [p.id, p.name, p.color, p.doctorEmail || null, p.doctorName || null, p.emailPatientName || null, p.recordsFolderLink || null]);
  }

  async deletePatient(id: string) {
    await this.db.run('DELETE FROM patients WHERE id = ?', [id]);
  }

  // --- CRUD MEDICATIONS ---
  async upsertMedication(m: Medication) {
    const sql = `INSERT OR REPLACE INTO medications 
      (id, patientId, name, dosage, unit, totalQuantity, remainingQuantity, minQuantity, schedule, color, icon, isActive, startDate, durationDays, notificationsEnabled, notes, frequency, dayOfWeek, dayOfMonth, leafletUrl) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await this.db.run(sql, [
      m.id, m.patientId, m.name, m.dosage, m.unit, m.totalQuantity, m.remainingQuantity, m.minQuantity || 0,
      JSON.stringify(m.schedule), m.color, m.icon, m.isActive ? 1 : 0, m.startDate, m.durationDays || null,
      m.notificationsEnabled ? 1 : 0, m.notes || null, m.frequency, m.dayOfWeek ?? null, m.dayOfMonth ?? null,
      m.leafletUrl || null
    ]);
  }

  async deleteMedication(id: string) {
    await this.db.run('DELETE FROM medications WHERE id = ?', [id]);
  }

  // --- CRUD LOGS ---
  async addLog(l: IntakeLog) {
    const sql = `INSERT OR REPLACE INTO logs (id, patientId, medicationId, date, time, status) VALUES (?, ?, ?, ?, ?, ?)`;
    await this.db.run(sql, [l.id, l.patientId, l.medicationId, l.date, l.time, l.status]);

    // Se la dose è stata presa, scaliamo l'inventario
    if (l.status === 'taken') {
      await this.updateInventory(l.medicationId, l.time, -1);
    }
  }

  // Metodo per importazione massiva senza ricalcolo scorte (usato in migrazione)
  async importRawLog(l: IntakeLog) {
    const sql = `INSERT OR REPLACE INTO logs (id, patientId, medicationId, date, time, status) VALUES (?, ?, ?, ?, ?, ?)`;
    await this.db.run(sql, [l.id, l.patientId, l.medicationId, l.date, l.time, l.status]);
  }

  async deleteLog(id: string) {
    // Prima di cancellare, dobbiamo sapere se era 'taken' per ripristinare l'inventario
    const res = await this.db.query('SELECT medicationId, time, status FROM logs WHERE id = ?', [id]);
    if (res.values && res.values.length > 0) {
      const log = res.values[0];
      if (log.status === 'taken') {
        await this.updateInventory(log.medicationId, log.time, 1);
      }
    }
    await this.db.run('DELETE FROM logs WHERE id = ?', [id]);
  }

  private async updateInventory(medId: string, time: string, direction: number) {
    const res = await this.db.query('SELECT remainingQuantity, schedule FROM medications WHERE id = ?', [medId]);
    if (res.values && res.values.length > 0) {
      const med = res.values[0];
      const schedule = JSON.parse(med.schedule || '[]');
      let quantityToSub = 1;

      // Cerchiamo la quantità specifica per quell'orario
      const schedItem = schedule.find((s: any) => s.time === time);
      if (schedItem) quantityToSub = schedItem.quantity;

      const newQty = Math.max(0, med.remainingQuantity + (quantityToSub * direction));
      await this.db.run('UPDATE medications SET remainingQuantity = ? WHERE id = ?', [newQty, medId]);
    }
  }

  // --- CRUD NOTES ---
  async upsertNote(n: Note) {
    const sql = `INSERT OR REPLACE INTO notes (id, patientId, title, content, date, time) VALUES (?, ?, ?, ?, ?, ?)`;
    await this.db.run(sql, [n.id, n.patientId, n.title, n.content, n.date, n.time]);
  }

  async deleteNote(id: string) {
    await this.db.run('DELETE FROM notes WHERE id = ?', [id]);
  }

  // --- CRUD WEIGHTS ---
  async upsertWeight(w: WeightLog) {
    const sql = `INSERT OR REPLACE INTO weights (id, patientId, weight, date, time) VALUES (?, ?, ?, ?, ?)`;
    await this.db.run(sql, [w.id, w.patientId, w.weight, w.date, w.time]);
  }

  async deleteWeight(id: string) {
    await this.db.run('DELETE FROM weights WHERE id = ?', [id]);
  }

  // --- CRUD GLUCOSE ---
  async upsertGlucose(g: GlucoseLog) {
    const sql = `INSERT OR REPLACE INTO glucose (id, patientId, glucose, note, date, time) VALUES (?, ?, ?, ?, ?, ?)`;
    await this.db.run(sql, [g.id, g.patientId, g.glucose, g.note || null, g.date, g.time]);
  }

  async deleteGlucose(id: string) {
    await this.db.run('DELETE FROM glucose WHERE id = ?', [id]);
  }

  // --- CRUD BLOOD PRESSURE ---
  async upsertBloodPressure(b: BloodPressureLog) {
    const sql = `INSERT OR REPLACE INTO blood_pressure (id, patientId, systolic, diastolic, pulse, date, time) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await this.db.run(sql, [b.id, b.patientId, b.systolic, b.diastolic, b.pulse, b.date, b.time]);
  }

  async deleteBloodPressure(id: string) {
    await this.db.run('DELETE FROM blood_pressure WHERE id = ?', [id]);
  }

  // --- CRUD ANALYSIS ---
  async addAnalysisSession(session: AnalysisSession, items: AnalysisItem[]) {
    await this.db.run(
      `INSERT OR REPLACE INTO analysis_sessions (id, patientId, date, laboratory, type) VALUES (?, ?, ?, ?, ?)`,
      [session.id, session.patientId, session.date, session.laboratory, session.type || null]
    );

    for (const item of items) {
      await this.db.run(
        `INSERT OR REPLACE INTO analysis_items (id, sessionId, patientId, name, value, unit, minValue, maxValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.sessionId, item.patientId, item.name, item.value, item.unit, item.minValue || null, item.maxValue || null]
      );
    }
  }

  async updateAnalysisItem(item: AnalysisItem) {
    await this.db.run(
      `UPDATE analysis_items SET name = ?, value = ?, unit = ?, minValue = ?, maxValue = ? WHERE id = ?`,
      [item.name, item.value, item.unit, item.minValue || null, item.maxValue || null, item.id]
    );
  }

  async deleteAnalysisItem(id: string) {
    await this.db.run('DELETE FROM analysis_items WHERE id = ?', [id]);
  }

  async addAnalysisItem(item: AnalysisItem) {
    await this.db.run(
      `INSERT OR REPLACE INTO analysis_items (id, sessionId, patientId, name, value, unit, minValue, maxValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.sessionId, item.patientId, item.name, item.value, item.unit, item.minValue || null, item.maxValue || null]
    );
  }

  async renameAnalysisName(oldName: string, newName: string, patientId: string) {
    await this.db.run(
      `UPDATE analysis_items SET name = ? WHERE name = ? AND patientId = ?`,
      [newName, oldName, patientId]
    );
  }

  async deleteAnalysisName(name: string, patientId: string) {
    await this.db.run(
      `DELETE FROM analysis_items WHERE name = ? AND patientId = ?`,
      [name, patientId]
    );
  }

  async deleteAnalysisSession(id: string) {
    await this.db.run('DELETE FROM analysis_sessions WHERE id = ?', [id]);
    await this.db.run('DELETE FROM analysis_items WHERE sessionId = ?', [id]);
  }

  async updateAnalysisSession(id: string, date: string, laboratory: string, type: string) {
    await this.db.run(
      `UPDATE analysis_sessions SET date = ?, laboratory = ?, type = ? WHERE id = ?`,
      [date, laboratory, type, id]
    );
  }

  async duplicateAnalysisSession(originalSessionId: string, patientId: string, allItems: any[]) {
    const newSessionId = 'session-' + Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Recupera la sessione originale per prendere il laboratorio
    const res = await this.db.query('SELECT * FROM analysis_sessions WHERE id = ?', [originalSessionId]);
    const original = res.values?.[0];
    if (!original) return null;

    // Crea nuova sessione con data odierna
    await this.db.run(
      `INSERT INTO analysis_sessions (id, patientId, date, laboratory, type) VALUES (?, ?, ?, ?, ?)`,
      [newSessionId, patientId, today, original.laboratory, original.type || null]
    );

    // Copia tutti gli esami con nuovi ID
    const sessionItems = allItems.filter(i => i.sessionId === originalSessionId);
    for (let idx = 0; idx < sessionItems.length; idx++) {
      const item = sessionItems[idx];
      await this.db.run(
        `INSERT INTO analysis_items (id, sessionId, patientId, name, value, unit, minValue, maxValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`item-${Date.now()}-${idx}`, newSessionId, patientId, item.name, item.value, item.unit, item.minValue || null, item.maxValue || null]
      );
    }

    return newSessionId;
  }

  // --- BACKUP ---
  async exportBackup(): Promise<string> {
    const data = await this.getAllData();
    return JSON.stringify(data, null, 2);
  }

  async importBackup(jsonStr: string) {
    const data: AppData = JSON.parse(jsonStr);

    // Svuota tutto
    await this.db.execute('DELETE FROM patients');
    await this.db.execute('DELETE FROM medications');
    await this.db.execute('DELETE FROM logs');
    await this.db.execute('DELETE FROM notes');
    await this.db.execute('DELETE FROM weights');
    await this.db.execute('DELETE FROM glucose');
    await this.db.execute('DELETE FROM blood_pressure');

    // Re-inserisci (riutilizziamo i metodi esistenti)
    for (const p of data.patients) await this.upsertPatient(p);
    for (const m of data.medications) await this.upsertMedication(m);
    for (const l of data.logs) await this.importRawLog(l);
    for (const n of data.notes) await this.upsertNote(n);
    for (const w of data.weights) await this.upsertWeight(w);
    if (data.glucoseLogs) {
      for (const g of data.glucoseLogs) await this.upsertGlucose(g);
    }
    for (const b of data.bloodPressureLogs) await this.upsertBloodPressure(b);
    if (data.analysisSessions) {
      for (const s of data.analysisSessions) {
        await this.db.run(
          `INSERT OR REPLACE INTO analysis_sessions (id, patientId, date, laboratory, type) VALUES (?, ?, ?, ?, ?)`,
          [s.id, s.patientId, s.date, s.laboratory, s.type || null]
        );
      }
    }
    if (data.analysisItems) {
      for (const i of data.analysisItems) {
        await this.db.run(
          `INSERT OR REPLACE INTO analysis_items (id, sessionId, patientId, name, value, unit, minValue, maxValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [i.id, i.sessionId, i.patientId, i.name, i.value, i.unit, i.minValue || null, i.maxValue || null]
        );
      }
    }
  }
}

export const db = new DatabaseService();
