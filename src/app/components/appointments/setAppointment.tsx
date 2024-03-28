import { db } from "../../firebase";
import { ref, set, get, push } from "firebase/database";
import { dateData } from "../../page";
import { getUser } from "./../auth/getUser";

export async function setAppointment(patientId: number, dateData: dateData, observations?: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const clinicId = await getUser(true);
        let appointmentId = 1;
        const formattedDate = dateData.date.replace(/\//g, '');
        let dbRef = ref(db, `/clinics/${clinicId}/appointments/${formattedDate}/`);
        console.log(dbRef);
        const snapshot = await get(dbRef);
        if (snapshot.val()) {
            const data = snapshot.val();
            appointmentId = (Object.keys(data).length) + 1;
        }
        dbRef = ref(db, `/clinics/${clinicId}/appointments/${formattedDate}/${appointmentId}/`);
        
        await set(dbRef, {
            id: appointmentId,
            patientId: patientId,
            date: dateData.date,
            dayComplete: dateData.dayComplete,
            year: dateData.year,
            time: dateData.time,
            observations: observations
        });
        dbRef = ref(db, `/clinics/${clinicId}/patients/${patientId}/appointments/`);
        await push(dbRef, formattedDate)
    } catch (error) {
        return ('error')
    }
}

