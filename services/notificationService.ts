import { LocalNotifications } from '@capacitor/local-notifications';
import { Medication, IntakeLog, Patient } from '../types';

function isMedicationDueOnDate(med: Medication, dateIso: string): boolean {
    const start = med.startDate;
    if (!start || dateIso < start) return false;

    let isMatchingFrequency = false;
    let occurrenceIndex = 0;

    if (med.frequency === 'weekly') {
        const [y, m, d] = dateIso.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        if (med.dayOfWeek !== date.getDay()) return false;
        isMatchingFrequency = true;

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
        occurrenceIndex = (y - sy) * 12 + (m - sm);
        if (sd > med.dayOfMonth) occurrenceIndex--;
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
}

export const NotificationService = {
    async requestPermissions() {
        const perm = await LocalNotifications.requestPermissions();
        return perm.display === 'granted';
    },

    async cancelAll() {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel(pending);
        }
    },

    async scheduleMedicationNotifications(medications: Medication[], logs: IntakeLog[], patients: Patient[]) {
        await LocalNotifications.createChannel({
            id: 'medication_reminders',
            name: 'Promemoria Farmaci',
            description: 'Canale prioritario per l\'assunzione dei farmaci',
            importance: 5, // IMPORTANCE_HIGH
            visibility: 1, // VISIBILITY_PUBLIC
            vibration: true,
            sound: 'pillshake'
        });

        await this.cancelAll();

        const notifications: any[] = [];
        const now = new Date();
        const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        medications.forEach(med => {
            if (!med.isActive || !med.notificationsEnabled) return;

            const patient = patients.find(p => p.id === med.patientId) || patients[0];
            const patientName = patient ? patient.name : 'Paziente';

            let everyValue: 'day' | 'week' | 'month' = 'day';
            if (med.frequency === 'weekly') everyValue = 'week';
            if (med.frequency === 'monthly') everyValue = 'month';

            const isTemporary = !!(med.durationDays && med.durationDays > 0);

            med.schedule.forEach((slot, index) => {
                const [hours, minutes] = slot.time.split(':').map(Number);

                const scheduleDate = new Date();
                scheduleDate.setHours(hours, minutes, 0, 0);

                // Check if already taken or skipped today
                const isAlreadyLoggedToday = logs.some(l =>
                    String(l.medicationId) === String(med.id) &&
                    l.date === todayIso &&
                    l.time === slot.time &&
                    (l.status === 'taken' || l.status === 'skipped')
                );

                if (isAlreadyLoggedToday || scheduleDate.getTime() <= Date.now()) {
                    if (med.frequency === 'daily') {
                        scheduleDate.setDate(scheduleDate.getDate() + 1);
                    } else if (med.frequency === 'weekly') {
                        scheduleDate.setDate(scheduleDate.getDate() + 7);
                    } else if (med.frequency === 'monthly') {
                        scheduleDate.setMonth(scheduleDate.getMonth() + 1);
                    }
                }

                const scheduleDateIso = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`;

                // Verification: do NOT schedule notification if temporary medication has completed its duration or is not due on scheduleDate!
                if (!isMedicationDueOnDate(med, scheduleDateIso)) {
                    return;
                }

                // Generate deterministic ID consistent with App.tsx
                const idStr = `${med.id}-${slot.time}-${index}`;
                let hash = 0;
                for (let i = 0; i < idStr.length; i++) {
                    hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
                    hash |= 0;
                }
                const notificationId = Math.abs(hash);

                notifications.push({
                    title: `La Mia Salute`,
                    body: `Ciao ${patientName}, è ora di assumere ${slot.quantity} ${med.unit} di ${med.name} (${slot.time})`,
                    id: notificationId,
                    schedule: {
                        at: scheduleDate,
                        allowWhileIdle: true,
                        ...(isTemporary ? {} : { every: everyValue })
                    },
                    smallIcon: 'ic_stat_pill',
                    largeIcon: 'res://ic_launcher',
                    channelId: 'medication_reminders',
                    extra: {
                        medId: med.id,
                        time: slot.time,
                        date: scheduleDateIso
                    }
                });
            });
        });

        if (notifications.length > 0) {
            await LocalNotifications.schedule({
                notifications
            });
            console.log(`Programmate ${notifications.length} notifiche.`);
        }
    }
};
