import { db } from "../lib/firebase";
import { get, ref, update } from "firebase/database";
import { getUser } from "../services/auth/getUser";

export interface ClearPatientsResult {
    patients: number;
    appointments: number;
    odontogramas: number;
}

// Borra TODOS los pacientes de la clínica del admin logueado, junto con los turnos que los
// referencian y el estado actual de sus odontogramas. Irreversible — Realtime Database no
// tiene papelera. Uso exclusivo de /dev, para resetear datos de prueba.
//
// El log de eventos del odontograma (odontogramas/{id}/eventos/{evt}) NO se toca: las
// reglas de Firebase (database.rules.json) lo definen append-only (".write" exige
// "!data.exists()", solo permite crear, nunca sobreescribir/borrar un evento ya existente)
// — es a propósito, es el historial inmutable del módulo. Intentar borrarlo tira
// PERMISSION_DENIED y, al ser parte de un update() multi-path atómico, hace fallar también
// el borrado de pacientes y turnos que sí tenían permiso. Por eso acá solo se limpia
// "actual" (el estado editable), que sí tiene .write permitido.
export async function runClearAllPatients(): Promise<ClearPatientsResult> {
    const clinicId = await getUser(true);
    if (!clinicId) throw new Error("No se pudo obtener el clinicId.");

    const patientsSnap = await get(ref(db, `/clinics/${clinicId}/patients/`));
    const patientIds = patientsSnap.exists() ? Object.keys(patientsSnap.val()) : [];

    if (patientIds.length === 0) {
        return { patients: 0, appointments: 0, odontogramas: 0 };
    }

    const patientIdSet = new Set(patientIds);
    const updates: Record<string, null> = {};

    // Turnos: recorrer todas las fechas y sacar solo los que referencian un paciente borrado.
    const appointmentsSnap = await get(ref(db, `/clinics/${clinicId}/appointments/`));
    let appointmentsCount = 0;
    if (appointmentsSnap.exists()) {
        const byDate = appointmentsSnap.val() as Record<string, Record<string, any>>;
        for (const [date, dayAppointments] of Object.entries(byDate)) {
            for (const [appointmentId, appointment] of Object.entries(dayAppointments)) {
                if (appointment?.patientId != null && patientIdSet.has(String(appointment.patientId))) {
                    updates[`/clinics/${clinicId}/appointments/${date}/${appointmentId}`] = null;
                    appointmentsCount++;
                }
            }
        }
    }

    // Odontogramas de esos pacientes: solo "actual" (eventos es append-only, ver nota arriba).
    const odontogramasSnap = await get(ref(db, `/clinics/${clinicId}/odontogramas/`));
    let odontogramasCount = 0;
    if (odontogramasSnap.exists()) {
        const existing = odontogramasSnap.val() as Record<string, any>;
        for (const [id, odontograma] of Object.entries(existing)) {
            if (patientIdSet.has(id) && odontograma?.actual) {
                updates[`/clinics/${clinicId}/odontogramas/${id}/actual`] = null;
                odontogramasCount++;
            }
        }
    }

    // Pacientes: el nodo completo, no uno por uno.
    updates[`/clinics/${clinicId}/patients/`] = null;

    await update(ref(db), updates);

    return { patients: patientIds.length, appointments: appointmentsCount, odontogramas: odontogramasCount };
}
