import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import { getUser } from "../auth/getUser";

export interface PatientLite {
    id: string;
    name: string;
    lastName: string;
    birthDate?: string; // "DD/MM/YYYY"
    timestamp?: number;
}

export async function getAllPatients(): Promise<PatientLite[] | null> {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `/clinics/${clinicId}/patients/`);
            const snapshot = await get(dbRef);

            if (!snapshot.exists()) return [];

            const data = snapshot.val();
            return Object.entries(data).map(([id, p]: [string, any]) => ({
                id,
                name: p?.name ?? "",
                lastName: p?.lastName ?? "",
                birthDate: p?.birthDate,
                timestamp: p?.timestamp,
            }));
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}
