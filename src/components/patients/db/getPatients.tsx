import { db } from "./../../../app/firebase";
import { get, ref, query, orderByChild, limitToLast } from "firebase/database";

export async function getPatients(quantity: number, clinicId: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            let patients: any[] = [];
            let isFull = false;
            const startIdx = 0;
            const endIdx = quantity;
            const dbRef = ref(db, `/clinics/${clinicId}/patients/`);
            const queryRef = query(dbRef, orderByChild('timestamp'), limitToLast(endIdx));
            const snapshot = await get(queryRef);
            if (snapshot.exists()) {
                const patientsData = Object.values(snapshot.val());
                patientsData.reverse();
                patients = patientsData.slice(startIdx, endIdx);
                if (patients.length < quantity) {
                    isFull = true;
                }
            }
            return {
                patients: patients,
                isFull: isFull
            };
        }
    } catch (error) {
        console.log('error');
    }
}
