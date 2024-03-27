import { db } from "../firebase";
import { ref, remove, get } from "firebase/database";

export async function deletePatient(clinicId: any, id: string | null) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, 'clinics' + clinicId + '/patients/' + id);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                await remove(dbRef);
            }
        }
    } catch (error) {
        return ('error')
    }
}

