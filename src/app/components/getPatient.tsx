import { db } from "../firebase";
import { get, ref } from "firebase/database";

export async function getPatient(patientId: string | null) {
    const dbRef = ref(db, `patients/${patientId}`);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const patient = snapshot.val();
        return patient;
    } else {
        return null;
    }

}
