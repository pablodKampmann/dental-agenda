import { db } from "./../../../app/firebase";
import { update, ref, get } from "firebase/database";
import { getUser } from "../../auth/getUser";

export async function updatePatient(changes: string, table: string, id: string | null) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `clinics/${clinicId}/patients/${id}`);
            await update(dbRef, {
                [table]: changes
            })
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

