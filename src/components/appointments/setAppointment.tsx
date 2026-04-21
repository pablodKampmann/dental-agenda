import { db } from "../../app/firebase";
import { ref, set, get, push } from "firebase/database";
import { dateData } from "./../../app/page";
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
            ...(dateData.time2 ? { time2: dateData.time2 } : {}),
            ...(dateData.time3 ? { time3: dateData.time3 } : {}),
            ...(dateData.time4 ? { time4: dateData.time4 } : {}),
            ...(dateData.time5 ? { time5: dateData.time5 } : {}),
            ...(dateData.time6 ? { time6: dateData.time6 } : {}),
            observations: observations
        });
        dbRef = ref(db, `/clinics/${clinicId}/patients/${patientId}/appointments/`);
        await push(dbRef, formattedDate)
    } catch (error) {
        console.error(error);
        return null;
    }
}


