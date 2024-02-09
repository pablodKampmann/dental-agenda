import { db } from "../firebase";
import { get, ref } from "firebase/database";
import { getPatient } from "./getPatient";

export async function getAppointments(date: string | null) {
    const dbRef = ref(db, `appointments/${date}`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const appointments = snapshot.val();
        const appointmentKeys = Object.keys(appointments);

        for (const key of appointmentKeys) {
            const appointment = appointments[key];
            const patientId = appointment.patientId;
            const patientData = await getPatient(patientId);
            if (patientData) {
                appointment.patientData = patientData;
            } else {
                delete appointments[key];
            }
        }

        return appointments;
    } else {
        return 'vacio';
    }
}
