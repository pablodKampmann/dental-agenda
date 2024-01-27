import { db } from "../firebase";
import { ref, set, get } from "firebase/database";
import { dateData } from "./../page";

export async function setAppointment(patientId: number, patientName: string, patientLastName: string, patientNum: string, patientDni: number, patientEmail: string, dateData: dateData) {
    try {
        const patientData = {
            id: patientId,
            name: patientName,
            lastName: patientLastName,
            num: patientNum,
            dni: patientDni,
            email: patientEmail,
        };
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
            patientData,
            date: dateData.date,
            dayComplete: dateData.dayComplete,
            year: dateData.year,
            time: dateData.time
        });
    } catch (error) {
        console.log(error);
    }
}

