import { db } from "../firebase";
import { get, ref } from "firebase/database";

export async function getAppointments(date: string | null) {    
    const dbRef = ref(db, `appointments/${date}`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const appointments = snapshot.val();
        return appointments;
    } else {
        return 'vacio';
    }
}
