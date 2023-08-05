import { db } from "../firebase";
import { get, ref, query, orderByChild, limitToLast } from "firebase/database";

export async function GetPatients(page: number) {
    let patients: any[] = [];
    const patientsPerPage = 6;
    const startIdx = (page - 1) * patientsPerPage;
    const endIdx = startIdx + patientsPerPage;
    const dbRef = ref(db, 'patients');
    const queryRef = query(dbRef, orderByChild('timestamp'), limitToLast(endIdx));
    const snapshot = await get(queryRef);
    if (snapshot.exists()) {
        const patientsData = Object.values(snapshot.val());
        patientsData.reverse();        
        patients = patientsData.slice(startIdx, endIdx);
    }    
    return patients;
}
