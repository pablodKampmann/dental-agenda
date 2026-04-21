import { db } from "./../../app/firebase";
import { get, ref } from "firebase/database";

export async function getClinicData(clinicId: string, table: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, `/clinics/${clinicId}/${table}/`)
            const snapshot = await get(dbRef);
            if (snapshot.exists() && table !== 'pros') {
                return snapshot.val();
            } else {
                const array: any[] = [];
                Object.keys(snapshot.val()).forEach((key) => {
                    array.push(snapshot.val()[key].nameComplete);
                });
                return array;
            }
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

