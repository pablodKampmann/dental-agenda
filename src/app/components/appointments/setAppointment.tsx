import { db } from "../../firebase";
import { ref, set, get, push } from "firebase/database";
import { dateData } from "../../page";

export async function setAppointment(patientId: number, dateData: dateData, reason: string, observations?: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        let appointmentId = 1;
        const formattedDate = dateData.date.replace(/\//g, '');
        let dbRef = ref(db, '/appointments/' + formattedDate);
        const snapshot = await get(dbRef);
        if (snapshot.val()) {
            const data = snapshot.val();
            appointmentId = (Object.keys(data).length) + 1;
        }
        dbRef = ref(db, '/appointments/' + `/${formattedDate}/` + `/${appointmentId}/`);
        await set(dbRef, {
            id: appointmentId,
            patientId: patientId,
            date: dateData.date,
            dayComplete: dateData.dayComplete,
            year: dateData.year,
            time: dateData.time,
            reason: reason,
            observations: observations
        });
        dbRef = ref(db, '/patients/' + `/${patientId}/` + 'appointments/');
        await push(dbRef, formattedDate)
    } catch (error) {
        return ('error')
    }
}

