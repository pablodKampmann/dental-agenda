import { db } from "@/lib/firebase";
import { ref, push } from "firebase/database";

export async function setPractice(price: number, practiceName: string, chapter: string, clinicId: string) {
    try {
        if (!navigator.onLine) throw new Error();
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
