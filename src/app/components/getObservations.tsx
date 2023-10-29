import { db } from "../firebase";
import { ref, get } from "firebase/database";

export async function getObservations(id: Number) {
    const dbRef = ref(db, '/patients/' + id + '/observations/');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const observations = snapshot.val();
        return observations;
    }
}

