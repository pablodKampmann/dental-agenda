import { db } from "../firebase";
import { ref, set, get } from "firebase/database";

export async function setPractice(id: number, price: number, practiceName: string, chapter: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, '/priceTariffs/' + chapter + '/' + id);
        const snapshot = await get(dbRef);
        if (!snapshot.exists()) {
            await set(dbRef, {
                id: id,
                name: practiceName,
                price: price,
            });
        } else if (snapshot.exists()) {
            return ('already-exists')
        }
    } catch (error) {
        return ('error')
    }
}

