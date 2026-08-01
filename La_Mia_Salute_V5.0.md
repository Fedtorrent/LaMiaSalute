# La Mia Salute - V5.0
## Documentazione Funzionalità

### 1. Gestione Profili (Multi-Paziente)
*   **Profili Multipli**: Possibilità di gestire dati di più persone (es. familiari).
*   **Paziente Primario**: Il primo profilo ("Mio Profilo" rinominabile) è bloccato in prima posizione nella sidebar e non è eliminabile per garantire la stabilità dell'app.
*   **Personalizzazione**: Ogni paziente ha un nome, un colore identificativo, link alla propria cartella clinica cloud e i riferimenti del proprio medico (nome ed email).

### 2. Dashboard Dinamica (Home)
La nuova Home (V5.0) funge da centro di controllo intelligente, mostrando solo ciò che è rilevante:
*   **Badge Sempre Attivi**: 
    *   **Farmaci Oggi**: Stato delle assunzioni giornaliere (Assunti, Saltati, Rimanenti).
    *   **Farmaci Mese**: Riepilogo dell'aderenza alla terapia del mese in corso con barra percentuale.
*   **Badge Intelligenti (Context-Aware)**: I badge di **Pressione**, **Peso**, **Glicemia** e **Note** appaiono automaticamente solo se contengono almeno una misurazione registrata.
*   **Layout Ottimizzato**: Design compatto su riga singola con data in evidenza per massimizzare lo spazio verticale.
*   **Navigazione**: Icona "Home" verde integrata nella barra inferiore per un accesso rapido da qualsiasi sezione.

### 3. Monitoraggio Salute
*   **Glicemia (Novità V5.0)**:
    *   Registrazione dei valori mg/dL con note opzionali (es. "a digiuno").
    *   **Classificazione Cromatica**: Feedback visivo immediato basato sulle soglie diabetologiche (Ottimale, Normale, Prediabete, Diabete, Ipoglicemia).
    *   **Legenda Rapida**: Modale informativo con tabella dei valori soglia accessibile direttamente dalla barra del titolo.
*   **Pressione Arteriosa**: Registrazione di Massima, Minima e Pulsazioni (BPM). Classificazione automatica dei livelli secondo standard ESH/ESC.
*   **Peso Corporeo**: Monitoraggio del peso in kg.
*   **Grafici di Trend Evoluti**: 
    *   Visualizzazione a **linee continue** con sfumatura (Area Chart) per Peso e Glicemia (V5.0).
    *   Grafici a doppia linea per Pressione (Sistolica/Diastolica).
    *   Periodi selezionabili: ultime 10/20/30 misurazioni o 7/30/365 giorni.

### 4. Gestione Farmaci (Catalogo)
*   **Piani Terapeutici Dettagliati**: Impostazione di dosaggio, unità di misura, scorta totale e soglia minima.
*   **Pianificazione Flessibile**: Gestione giornaliera, settimanale o mensile con orari e quantità variabili.
*   **Farmaci Temporanei**: Disattivazione automatica al termine della durata impostata (es. cicli di antibiotici).
*   **Bugiardino Digitale**: Link diretto al foglietto illustrativo ufficiale salvato automaticamente.
*   **Interfaccia Intelligente**: I nomi lunghi scorrono in loop (ScrollingName) solo quando lo spazio è insufficiente.

### 5. Archivio Referti e Analisi
*   **Archivio Cloud**: Integrazione con cartelle esterne (Google Drive, Dropbox, iCloud) tramite link sicuro per ogni paziente.
*   **Database Analisi**: 
    *   Registrazione esami di laboratorio organizzati per sessione.
    *   Range di riferimento (min/max) con evidenziazione in rosso dei valori fuori soglia.
    *   **Storico Analisi**: Tabelle riepilogative temporali per ogni singolo parametro cercato.

### 6. Esportazione e Comunicazione
*   **Report PDF Professionali**: Generazione di documenti A4 per Farmaci, Pressione, Peso e **Glicemia** (V5.0), pronti per la stampa o l'invio.
*   **Esportazione CSV**: File Excel unificato con tutti i log storici filtrati per paziente.
*   **Richiesta Ricette**: Composizione automatica di email per il medico con l'elenco dei farmaci da rinnovare.

### 7. Sistema e Sicurezza
*   **Database Locale**: Dati salvati esclusivamente sul dispositivo tramite SQLite.
*   **Notifiche Locali**: Promemoria intelligenti per le assunzioni.
*   **Backup/Ripristino**: Esportazione manuale dell'intero database in formato JSON per la massima portabilità.
*   **Modalità Scura**: Supporto nativo al tema Dark per un miglior comfort visivo.

---
*L'app "La Mia Salute" è un ecosistema completo per la gestione della salute personale, ottimizzato per l'uso quotidiano e la comunicazione medico-paziente.*
