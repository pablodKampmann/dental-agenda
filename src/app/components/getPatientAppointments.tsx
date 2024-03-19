import { db } from "../firebase";
import { get, ref } from "firebase/database";

export async function getPatientAppointments(patientId: string | number | null) {
    let dbRef = ref(db, '/patients/' + patientId + '/appointments/');
    let snapshot = await get(dbRef);
    let appointments: any[] = [];
    if (snapshot.exists()) {
        const result = snapshot.val();
    
        for (const key in result) {
            if (result.hasOwnProperty(key)) {
                const fecha = result[key];
                dbRef = ref(db, '/appointments/' + fecha)
                snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    for (const key in snapshot.val()) {
                        if (snapshot.val().hasOwnProperty(key)) {
                            const appointment = snapshot.val()[key];
                            if (appointment.patientId === patientId) {
                                const exists = appointments.some(existingAppointment => existingAppointment.id === appointment.id && existingAppointment.time === appointment.time && existingAppointment.date === appointment.date);
                                if (!exists) {
                                    appointments.push(appointment)
                                }
                            }
                        }
                    }
                }
            }
        }

        appointments.reverse();
        return appointments;
    } else {
        return null;
    }
}
