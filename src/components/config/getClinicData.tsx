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
                const data = snapshot.val();
                if (!data) return [];
                const array: any[] = [];
                Object.keys(data).forEach((key) => {
                    array.push(data[key].nameComplete);
                });
                return array;
            }
        }
    } catch (error) {
        return 'error';
    }
}
