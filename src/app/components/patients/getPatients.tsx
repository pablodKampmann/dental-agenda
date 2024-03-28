import { db } from "../../firebase";
import { get, ref, query, orderByChild, limitToLast } from "firebase/database";

export async function GetPatients(quantity: number) {
    let patients: any[] = [];
    let full = false;
    const startIdx = 0;
    const endIdx = quantity;
    const dbRef = ref(db, 'patients');
    const queryRef = query(dbRef, orderByChild('timestamp'), limitToLast(endIdx));
    const snapshot = await get(queryRef);
    if (snapshot.exists()) {
        const patientsData = Object.values(snapshot.val());
        patientsData.reverse();
        patients = patientsData.slice(startIdx, endIdx);
        if (patients.length < quantity) {
            full = true;
        }
    }
    return {
        patients: patients,
        full: full
    };
}
