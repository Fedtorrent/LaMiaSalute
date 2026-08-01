import { Medication, Patient, BloodPressureLog, WeightLog, GlucoseLog } from '../types';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// Funzione helper per l'intestazione comune
const addHeader = (doc: any, title: string, patient: Patient, timestamp: string, color: [number, number, number], subtitle?: string) => {
  doc.setFontSize(24);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(`${title}: ${patient.name}`, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);

  let currentY = 28;
  if (patient.doctorName) {
    doc.setFont(undefined, 'bold');
    doc.text(`Medico Curante: ${patient.doctorName}`, 14, currentY);
    currentY += 5;
  }
  if (patient.doctorEmail) {
    doc.setFont(undefined, 'normal');
    doc.text(`Email Medico: ${patient.doctorEmail}`, 14, currentY);
    currentY += 5;
  }

  doc.setFont(undefined, 'normal');
  doc.text(`Generato il: ${timestamp}`, 14, currentY);

  if (subtitle) {
    currentY += 5;
    doc.setFont(undefined, 'italic');
    doc.text(subtitle, 14, currentY);
  }

  doc.text(`Applicazione: La Mia Salute`, doc.internal.pageSize.getWidth() - 14, currentY, { align: 'right' });

  return currentY + 8;
};

// Funzione helper per il piè di pagina comune
const addFooter = (doc: any) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Pagina ${i} di ${pageCount} - Documento ad uso personale`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
};

export const generateMedicationReport = async (patient: Patient, medications: Medication[]) => {
  try {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const timestamp = new Date().toLocaleDateString('it-IT');
    const startY = addHeader(doc, "Piano Terapeutico", patient, timestamp, [16, 185, 129], "Farmaci Attivi alla data odierna");

    const tableColumn = ["Farmaco", "Dosaggio", "Frequenza", "Orari e Q.tà", "Scorta", "Attivo", "Temp.", "Note"];
    const tableRows = medications.map(med => {
      const scheduleStr = (med.schedule || [])
        .slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''))
        .map(s => `${s.time || ''} (${s.quantity || ''})`).join(', ');

      const freqMap: Record<string, string> = { 'daily': 'Giornaliera', 'weekly': 'Settimanale', 'monthly': 'Mensile' };

      return [
        med.name || 'N/A',
        `${med.dosage || ''} ${med.unit || ''}`,
        freqMap[med.frequency] || med.frequency,
        scheduleStr || 'Non impostato',
        `${med.remainingQuantity} pz`,
        med.isActive ? 'Si' : 'No',
        med.durationDays ? 'Si' : 'No',
        med.notes || ''
      ];
    });

    autoTable(doc, {
      startY,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'center' },
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 50 },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 'auto' }
      },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    addFooter(doc);
    return doc;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

export const generatePressureReport = async (patient: Patient, logs: BloodPressureLog[]) => {
  try {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const timestamp = new Date().toLocaleDateString('it-IT');
    const startY = addHeader(doc, "Andamento Pressione", patient, timestamp, [239, 68, 68], `Ultimi ${logs.length} Dati`);

    const tableColumn = ["Data", "Ora", "Sistolica (max)", "Diastolica (min)", "Battiti (bpm)", "Stato"];
    const tableRows = logs.map(l => {
      let status = "Normale";
      if (l.systolic >= 140 || l.diastolic >= 90) status = "Alta";
      else if (l.systolic < 90 || l.diastolic < 60) status = "Bassa";

      return [
        l.date.split('-').reverse().join('/'),
        l.time,
        `${l.systolic} mmHg`,
        `${l.diastolic} mmHg`,
        `${l.pulse} bpm`,
        status
      ];
    });

    autoTable(doc, {
      startY,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' }
      }
    });

    addFooter(doc);
    return doc;
  } catch (error) {
    console.error('Pressure PDF Error:', error);
    throw error;
  }
};

export const generateWeightReport = async (patient: Patient, logs: WeightLog[]) => {
  try {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const timestamp = new Date().toLocaleDateString('it-IT');
    const startY = addHeader(doc, "Andamento Peso", patient, timestamp, [59, 130, 246], `Ultimi ${logs.length} Dati`);

    const tableColumn = ["Data", "Ora", "Peso Corporeo"];
    const tableRows = logs.map(l => [
      l.date.split('-').reverse().join('/'),
      l.time,
      `${l.weight} kg`
    ]);

    autoTable(doc, {
      startY,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center', fontStyle: 'bold' }
      }
    });

    addFooter(doc);
    return doc;
  } catch (error) {
    console.error('Weight PDF Error:', error);
    throw error;
  }
};

export const generateGlucoseReport = async (patient: Patient, logs: GlucoseLog[]) => {
  try {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const timestamp = new Date().toLocaleDateString('it-IT');
    const startY = addHeader(doc, "Monitoraggio Glicemia", patient, timestamp, [244, 63, 94], `Ultimi ${logs.length} Dati`);

    const tableColumn = ["Data", "Ora", "Glicemia (mg/dL)", "Note"];
    const tableRows = logs.map(l => [
      l.date.split('-').reverse().join('/'),
      l.time,
      `${l.glucose} mg/dL`,
      l.note || ''
    ]);

    autoTable(doc, {
      startY,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center', fontStyle: 'bold' }
      }
    });

    addFooter(doc);
    return doc;
  } catch (error) {
    console.error('Glucose PDF Error:', error);
    throw error;
  }
};

export const saveReportToCache = async (doc: any, patientName: string, type: string): Promise<string> => {
  try {
    const isoDate = new Date().toISOString().split('T')[0];
    const fileName = `${isoDate}_Report_${type}_${patientName.replace(/\s+/g, '_')}.pdf`;
    
    const pdfOutput = doc.output('datauristring');
    const base64Data = pdfOutput.split(',')[1];

    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache
    });

    const uriResult = await Filesystem.getUri({
      directory: Directory.Cache,
      path: fileName
    });

    return uriResult.uri;
  } catch (error) {
    console.error('Save to Cache Error:', error);
    throw error;
  }
};

export const shareReport = async (doc: any, patientName: string, type: string) => {
  try {
    const uri = await saveReportToCache(doc, patientName, type);

    await Share.share({
      title: `Report ${type}`,
      files: [uri],
      dialogTitle: `Esporta Report ${type}`
    });

    return true;
  } catch (error) {
    console.error('Share Error:', error);
    throw error;
  }
};

export const shareMultipleReports = async (uris: string[], patientName: string) => {
  try {
    if (uris.length === 0) return;

    await Share.share({
      title: `Report Salute - ${patientName}`,
      files: uris,
      dialogTitle: 'Salva o Condividi i Report'
    });

    return true;
  } catch (error) {
    console.error('Multiple Share Error:', error);
    throw error;
  }
};
