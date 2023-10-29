import { db } from "../firebase";
import { ref, update, get } from "firebase/database";

export async function setObservations(id: Number, observationsContent: string) {
    const dbRef = ref(db, '/patients/' + id);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        await update(dbRef, {
            observations: observationsContent,
        });
    }
}

