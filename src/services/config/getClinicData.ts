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
                return Object.entries(data).map(([key, value]: [string, any]) => ({
                    key,
                    nameComplete: value.nameComplete
                }));
            }
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}
