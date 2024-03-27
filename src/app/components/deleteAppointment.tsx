import { db } from "../firebase";
import { ref, get, remove } from "firebase/database";

export async function deleteAppointment(clinicId: any, id: number, date: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, '/clinics/' + clinicId + '/appointments/' + date + '/' + id + '/');
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                await remove(dbRef);
            }
        }
    } catch (error) {
        return ('error')
    }
}

