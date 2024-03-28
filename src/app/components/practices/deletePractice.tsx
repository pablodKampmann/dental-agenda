import { db } from "../../firebase";
import { ref, set, get, remove } from "firebase/database";

export async function deletePractice(clinicId: any, id: any, chapter: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, '/clinics/' + clinicId + '/priceTariffs/' + chapter + '/' + id + '/');
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                await remove(dbRef);
            }
        }
    } catch (error) {
        return ('error')
    }
}

