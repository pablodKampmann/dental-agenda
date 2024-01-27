import { db } from "../firebase";
import { ref, set, get } from "firebase/database";
import { dateData } from "./../page";

export async function setAppointment(patientId: number, dateData: dateData) {
    let isIdFree = false;
    let appointmentId = 1;
    let dbRef = ref(db, '/appointments/');
    let snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        appointmentId = (Object.keys(data).length) + 1;
    }
    while (isIdFree === false) {
        dbRef = ref(db, '/appointments/' + appointmentId);
        snapshot = await get(dbRef);
        if (snapshot.exists()) {
            appointmentId++;
        } else {
            isIdFree = true;
            await set(dbRef, {
                id: appointmentId,
                patientId: patientId,
                date: dateData.date,
                dayComplete: dateData.dayComplete,
                year: dateData.year,
                time: dateData.time
            });
        }
    }
}

