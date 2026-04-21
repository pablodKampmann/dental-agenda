import { db } from "./../../app/firebase";
import { ref, get, remove } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function deletePractice(id: any, chapter: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/${id}/`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                await remove(dbRef);
            }
        }
    } catch (error) {
        console.error(error);
        return (error instanceof Error ? error.message : 'unknown-error');
    }
}

