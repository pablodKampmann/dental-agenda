import { db } from "./../../app/firebase";
import { set, ref, get } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function updatePracticePrice(name: string, id: number, price: number) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const clinicId = await getUser(true);
        const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${name}/${id}/price/`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            set(dbRef, price)
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

