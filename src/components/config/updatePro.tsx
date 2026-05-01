import { db } from "./../../app/firebase";
import { ref, update } from "firebase/database";

export async function updatePro(clinicId: string, key: string, nameComplete: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, `/clinics/${clinicId}/pros/${key}`);
        await update(dbRef, { nameComplete });
    } catch (error) {
        console.error(error);
        return null;
    }
}