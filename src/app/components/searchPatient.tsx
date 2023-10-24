import { db } from "../firebase";
import { ref, get, query, orderByChild, startAt, endAt } from "firebase/database";

export async function SearchPatient(selectedField: string, searchContent: any) {
    const dbRef = ref(db, 'patients');
    const patientsFilter: any[] = [];
    function check(data: any) {
        for (const value of data) {
            const existingValue = patientsFilter.find(patient => patient.id === value.id);
            if (!existingValue) {
                patientsFilter.push(value);
            }
        }
        console.log(patientsFilter);
    }
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
        if (snapshotByName.exists()) {
            check(Object.values(snapshotByName.val()))
        }
        if (snapshotByNameHarc.exists()) {
            check(Object.values(snapshotByNameHarc.val()))
        }
        if (snapshotByLastName.exists()) {
            check(Object.values(snapshotByLastName.val()))
        }
        if (snapshotByLastNameHarc.exists()) {
            check(Object.values(snapshotByLastNameHarc.val()))
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
