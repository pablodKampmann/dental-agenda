import { db } from "./../../app/firebase";
import { ref, get } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function getInsurancePlans(insuranceId: string): Promise<{ id: string; name: string }[] | null> {
    try {
        if (!navigator.onLine) throw new Error();
        const clinicId = await getUser(true);
        const snapshot = await get(ref(db, `/clinics/${clinicId}/insurances/${insuranceId}/plans/`));
        if (!snapshot.val()) return [];
        return Object.entries(snapshot.val()).map(([key, val]: [string, any]) => ({
            id: key,
            name: val.name,
        }));
    } catch (error) {
        console.error(error);
        return null;
    }
}
