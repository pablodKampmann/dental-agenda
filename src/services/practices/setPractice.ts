import { db } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function setPractice(price: number, practiceName: string, chapter: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const clinicId = await getUser(true);
        const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/`);
        await push(dbRef, {
            name: practiceName,
            price: price,
        });
    } catch (error) {
        console.error(error);
        return null;
    }
}
