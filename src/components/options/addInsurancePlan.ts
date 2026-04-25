import { db } from "./../../app/firebase";
import { ref, push } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function addInsurancePlan(insuranceId: string, planName: string): Promise<{ id: string; name: string } | null> {
    try {
        if (!navigator.onLine) throw new Error();
        const clinicId = await getUser(true);
        const newRef = await push(ref(db, `/clinics/${clinicId}/insurances/${insuranceId}/plans/`), { name: planName.trim() });
        if (!newRef.key) throw new Error();
        return { id: newRef.key, name: planName.trim() };
    } catch (error) {
        console.error(error);
        return null;
    }
}
