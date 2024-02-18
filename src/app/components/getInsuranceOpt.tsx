import { db } from "../firebase";
import { get, ref } from "firebase/database";

export async function getInsuranceOptions() {
    const dbRef = ref(db, 'insurances')
    const snapshot = await get(dbRef);
    const array: any[] = [];
    if (snapshot.val()) {
        Object.keys(snapshot.val()).forEach((key) => {
            array.push(snapshot.val()[key].name);
        });
    }
    return array;
}

