import { db } from "./../../../app/firebase";
import { update, ref, get } from "firebase/database";

export async function updatePatient(
    changes: string | Record<string, string>,
    table: string | null,
    id: string | null,
    clinicId: string
) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, `clinics/${clinicId}/patients/${id}`);
            const payload = (typeof changes === 'string' && table !== null)
                ? { [table]: changes }
                : changes as Record<string, string>;
            await update(dbRef, payload)
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const patient = snapshot.val();
                return patient;
            }
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

