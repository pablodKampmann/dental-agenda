import { db } from "./../../app/firebase";
import { get, ref } from "firebase/database";
import { getPatient } from "../patients/db/getPatient";
import { getUser } from "./../auth/getUser";

export async function getAppointments(date: string | null) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `clinics/${clinicId}/appointments/${date}`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const appointments = snapshot.val();
                const appointmentKeys = Object.keys(appointments);

                await Promise.all(appointmentKeys.map(async (key) => {
                    const appointment = appointments[key];
                    const patientId = appointment.patientId;
                    const patientData = await getPatient(patientId);
                    if (patientData) {
                        appointment.patientData = patientData;
                    } else {
                        delete appointments[key];
                    }
                }));

                return appointments;
            } else {
                return 'vacio';
            }
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

