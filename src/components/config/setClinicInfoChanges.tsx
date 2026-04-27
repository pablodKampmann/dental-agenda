import { db } from "../../app/firebase";
import { ref, update, get } from "firebase/database";

export async function setClinicInfoChanges(clinicId: string, field: string, value: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, `/clinics/${clinicId}/info/`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            await update(dbRef, {
                [field]: value
            });
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}