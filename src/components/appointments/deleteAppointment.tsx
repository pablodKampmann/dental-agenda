import { db } from "./../../app/firebase";
import { ref, get, remove } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function deleteAppointment(id: number, date: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `/clinics/${clinicId}/appointments/${date}/${id}/`);
            const snapshot = await get(dbRef);

            if (snapshot.exists()) {
                const appointment = snapshot.val();
                const patientId = appointment.patientId; // ← sacamos el patientId antes de borrar

                // 1. Borrar el turno
                await remove(dbRef);

                // 2. Buscar y borrar la referencia de fecha en el nodo del paciente
                const patientApptsRef = ref(db, `/clinics/${clinicId}/patients/${patientId}/appointments/`);
                const patientApptsSnapshot = await get(patientApptsRef);

                if (patientApptsSnapshot.exists()) {
                    const entries = patientApptsSnapshot.val(); // { "-Xyz123": "20250421", ... }

                    // Buscar la key cuyo valor coincide con la fecha del turno borrado
                    const keyToDelete = Object.keys(entries).find(key => entries[key] === date);

                    if (keyToDelete) {
                        const staleRef = ref(db, `/clinics/${clinicId}/patients/${patientId}/appointments/${keyToDelete}`);
                        await remove(staleRef);
                    }
                }
            }
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}