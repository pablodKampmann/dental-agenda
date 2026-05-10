import { db } from "@/lib/firebase";
import { ref, get, remove } from "firebase/database";

export async function deletePractice(id: string, chapter: string, clinicId: string) {
    try {
        if (!navigator.onLine) throw new Error();
            const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/${id}/`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                await remove(dbRef);
            }
    } catch (error) {
        console.error(error);
        return null;
    }
}
