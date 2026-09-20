import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";

export async function getAllPatientsFull(clinicId: string): Promise<any[] | null> {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, `/clinics/${clinicId}/patients/`);
            const snapshot = await get(dbRef);
            if (!snapshot.exists()) return [];

            const patients = Object.values(snapshot.val()) as any[];
            patients.sort((a, b) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0));
            return patients;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}
