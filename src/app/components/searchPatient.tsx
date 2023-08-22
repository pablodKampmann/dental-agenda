import { db } from "../firebase";
import { ref, get, query, orderByChild, startAt, endAt } from "firebase/database";

export async function SearchPatient(selectedField: any, searchContent: any) {
    const dbRef = ref(db, 'patients');
    const patientsFilter: string | any[] = [];
    if (selectedField === 'name') {
        const queryByNameRef = query(dbRef, orderByChild('name'), startAt(searchContent), endAt(searchContent + '\uf8ff'));
        const snapshotByName = await get(queryByNameRef);
        const queryByLastNameRef = query(dbRef, orderByChild('lastName'), startAt(searchContent), endAt(searchContent + '\uf8ff'));
        const snapshotByLastName = await get(queryByLastNameRef);
        if (snapshotByName.exists()) {
            patientsFilter.push(...Object.values(snapshotByName.val()));
        }
        if (snapshotByLastName.exists()) {
            patientsFilter.push(...Object.values(snapshotByLastName.val()));
        }
    } else if (selectedField === 'dni') {
        const queryByDni = query(dbRef, orderByChild('dni'), startAt(searchContent), endAt(searchContent + '\uf8ff'));
        const snapshot = await get(queryByDni);
        if (snapshot.exists()) {
            patientsFilter.push(...Object.values(snapshot.val()));
        }
    }
    return (patientsFilter);
}
