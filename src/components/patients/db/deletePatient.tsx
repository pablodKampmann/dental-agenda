import { db } from "./../../../app/firebase";
import { ref, remove, get } from "firebase/database";
import { getUser } from "../../auth/getUser";

export async function deletePatient(id: string | null) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const clinicId = await getUser(true);

        // Obtener las fechas de los appointments del paciente
        const appointmentsRef = ref(db, `/clinics/${clinicId}/patients/${id}/appointments/`);
        const appointmentsSnapshot = await get(appointmentsRef);

        if (appointmentsSnapshot.exists()) {
            const dates = Object.values(appointmentsSnapshot.val()) as string[];
            await Promise.all(dates.map(async (date) => {
                const dayRef = ref(db, `/clinics/${clinicId}/appointments/${date}`);
                const daySnapshot = await get(dayRef);
                if (daySnapshot.exists()) {
                    const appointments = daySnapshot.val();
                    await Promise.all(Object.entries(appointments).map(async ([key, appointment]: [string, any]) => {
                        if (String(appointment.patientId) === String(id)) {
                            await remove(ref(db, `/clinics/${clinicId}/appointments/${date}/${key}`));
                        }
                    }));
                }
            }));
        }

        // Borrar el paciente
        const patientRef = ref(db, `/clinics/${clinicId}/patients/${id}`);
        const snapshot = await get(patientRef);
        if (snapshot.exists()) {
            await remove(patientRef);
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}