import { db } from "../../firebase";
import { ref, remove, get } from "firebase/database";
import { getUser } from "./../auth/getUser";
export async function deletePatient(id: string | null) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `/clinics/${clinicId}/patients/${id}`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                await remove(dbRef);
            }
        }
    } catch (error) {
        return ('error')
    }
}

