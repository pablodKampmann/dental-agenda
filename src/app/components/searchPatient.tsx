import { db } from "../firebase";
import { ref, get, query, orderByChild, startAt, endAt } from "firebase/database";

export async function SearchPatient(selectedField: any, searchContent: any) {
    const dbRef = ref(db, 'patients');
    const queryRef = query(dbRef, orderByChild(selectedField), startAt(searchContent), endAt(searchContent + '\uf8ff'));
    const snapshot = await get(queryRef);    
    if (snapshot.exists()) {
        const patientsFilter = Object.values(snapshot.val());
        return(patientsFilter);
    } else {
        return (null)
    }
}
