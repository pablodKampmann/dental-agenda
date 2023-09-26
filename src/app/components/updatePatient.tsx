import { db } from "../firebase";
import { update, ref, get } from "firebase/database";

export async function updatePatient(changes: string, table: string, id: string | null) {
    const dbRef = ref(db, `patients/${id}`);
    await update(dbRef, {
        [table]: changes
    })
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const patient = snapshot.val();
        return patient;
    }
}
