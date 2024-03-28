import { db } from "../../firebase";
import { set, ref, get } from "firebase/database";

export async function updatePracticePrice(name: string, id: number, price: number) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, '/priceTariffs/' + name + '/' + id + '/' + 'price');
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            set(dbRef, price)
        }
    } catch (error) {
        return 'error'
    }
}
