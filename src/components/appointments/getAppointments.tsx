import { db } from "./../../app/firebase";
import { get, ref } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function getAppointments(date: string | null) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true); // ← una sola llamada de auth

            const dbRef = ref(db, `clinics/${clinicId}/appointments/${date}`);
            const snapshot = await get(dbRef);

            if (snapshot.exists()) {
                const appointments = snapshot.val();
                const appointmentKeys = Object.keys(appointments);

                await Promise.all(appointmentKeys.map(async (key) => {
                    const appointment = appointments[key];
                    const patientId = appointment.patientId;

                    // Read directo con el clinicId que ya tenemos — sin getPatient, sin getUser extra
                    const patientRef = ref(db, `/clinics/${clinicId}/patients/${patientId}`);
                    const patientSnapshot = await get(patientRef);

                    if (patientSnapshot.exists()) {
                        appointment.patientData = patientSnapshot.val();
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