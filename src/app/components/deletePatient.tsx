import { db } from "../firebase";
import { ref, remove, get } from "firebase/database";

export async function deletePatient(id: string | null) {
    let dbRef = ref(db, '/patients/' + id);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        await remove(dbRef);
    }
}

