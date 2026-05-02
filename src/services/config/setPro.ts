import { db } from "@/lib/firebase";
import { ref, push } from "firebase/database";

export async function setPro(clinicId: string, nameComplete: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, `/clinics/${clinicId}/pros/`);
        await push(dbRef, { nameComplete });
    } catch (error) {
        console.error(error);
        return null;
    }
}
