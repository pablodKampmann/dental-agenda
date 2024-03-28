import { db } from "../../firebase";
import { ref, set, get } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function setPractice(id: number, price: number, practiceName: string, chapter: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const clinicId = await getUser(true);
        const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/${id}/`);
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

