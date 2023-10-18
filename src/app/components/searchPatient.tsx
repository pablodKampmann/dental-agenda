import { db } from "../firebase";
import { ref, get, query, orderByChild, startAt, endAt } from "firebase/database";

export async function SearchPatient(selectedField: any, searchContent: any) {
    const dbRef = ref(db, 'patients');
    const patientsFilter: string | any[] = [];    
    if (selectedField === 'name') {
        const searchContentHarc = searchContent.charAt(0).toUpperCase() + searchContent.slice(1);
        const queryByName = query(dbRef, orderByChild('name'), startAt(searchContent), endAt(searchContent + '\uf8ff'));
        const queryByNameHarc = query(dbRef, orderByChild('name'), startAt(searchContentHarc), endAt(searchContentHarc + '\uf8ff'));
        const queryByLastName = query(dbRef, orderByChild('lastName'), startAt(searchContent), endAt(searchContent + '\uf8ff'));
        const queryByLastNameHarc = query(dbRef, orderByChild('lastName'), startAt(searchContentHarc), endAt(searchContentHarc + '\uf8ff'));
        const snapshotByName = await get(queryByName);
        const snapshotByNameHarc = await get(queryByNameHarc);
        const snapshotByLastName = await get(queryByLastName);
        const snapshotByLastNameHarc = await get(queryByLastNameHarc);
        const addToPatientsFilterIfNotExists = (data: any) => {
            for (const item of data) {
                if (!patientsFilter.some(existingItem => existingItem.key === item.key)) {
                    patientsFilter.push(item);
                }
            }
        };
        if (snapshotByName.exists()) {
            console.log(Object.values(snapshotByName.val()));
            
            addToPatientsFilterIfNotExists(Object.values(snapshotByName.val()));
        }
        if (snapshotByNameHarc.exists()) {
            console.log(Object.values(snapshotByNameHarc.val()));

            addToPatientsFilterIfNotExists(Object.values(snapshotByNameHarc.val()));
        }
        if (snapshotByLastName.exists()) {
            console.log(Object.values(snapshotByLastName.val()));

            addToPatientsFilterIfNotExists(Object.values(snapshotByLastName.val()));
        }
        if (snapshotByLastNameHarc.exists()) {
            console.log(Object.values(snapshotByLastNameHarc.val()));

            addToPatientsFilterIfNotExists(Object.values(snapshotByLastNameHarc.val()));
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
