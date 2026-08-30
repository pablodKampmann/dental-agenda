import { db } from "@/lib/firebase";
import { ref, update } from "firebase/database";

export async function setClinicInfoChanges(clinicId: string, field: string, value: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, `/clinics/${clinicId}/info/`);
        await update(dbRef, {
            [field]: value
        });
    } catch (error) {
        console.error(error);
        return null;
    }
}