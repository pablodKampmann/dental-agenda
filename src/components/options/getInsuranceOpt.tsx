import { db } from "./../../app/firebase";
import { get, ref } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function getInsuranceOptions() {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `/clinics/${clinicId}/insurances/`)
            const snapshot = await get(dbRef);
            const array: any[] = [];
            if (snapshot.val()) {
                Object.keys(snapshot.val()).forEach((key) => {
                    array.push(snapshot.val()[key].name);
                });
            }
            return array;
        }
    } catch (error) {
        console.error(error);
        return (error instanceof Error ? error.message : 'unknown-error');
    }
}

