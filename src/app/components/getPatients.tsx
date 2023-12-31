import { db } from "../firebase";
import { get, ref, query, orderByChild, limitToLast } from "firebase/database";

export async function GetPatients(page: number, patientsPerPage: number) {
    let patients: any[] = [];
    let patientsSize = 0;
    const startIdx = (page - 1) * patientsPerPage;
    const endIdx = startIdx + patientsPerPage;
    const dbRef = ref(db, 'patients');
    const queryRef = query(dbRef, orderByChild('timestamp'), limitToLast(endIdx));
    const snapshot = await get(queryRef);
    const snapshotSize = await get(dbRef);
    if (snapshot.exists()) {
        patientsSize = snapshotSize.size;
        const patientsData = Object.values(snapshot.val());
        patientsData.reverse();
        patients = patientsData.slice(startIdx, endIdx);
    }
    return {
        patients: patients,
        patientsSize: patientsSize
    };
}
