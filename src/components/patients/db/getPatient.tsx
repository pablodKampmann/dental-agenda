import { db } from "./../../../app/firebase";
import { get, ref } from "firebase/database";

export async function getPatient(patientId: string | number | null, clinicId: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, `/clinics/${clinicId}/patients/${patientId}`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const patient = snapshot.val();
                return patient;
            } else {
                return null;
            }
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

