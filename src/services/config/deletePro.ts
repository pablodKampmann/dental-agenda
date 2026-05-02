import { db } from "@/lib/firebase";
import { ref, remove } from "firebase/database";

export async function deletePro(clinicId: string, key: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, `/clinics/${clinicId}/pros/${key}`);
        await remove(dbRef);
    } catch (error) {
        console.error(error);
        return null;
    }
}
