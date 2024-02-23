import { db } from "../firebase";
import { ref, set, get, remove } from "firebase/database";

export async function deletePractice(id: any, chapter: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, '/priceTariffs/' + chapter + '/' + id + '/');
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            await remove(dbRef);
        }
    } catch (error) {
        return ('error')
    }
}

