import { db } from "./../../app/firebase";
import { ref, remove } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function deleteInsurancePlan(insuranceId: string, planId: string): Promise<boolean> {
    try {
        if (!navigator.onLine) throw new Error();
        const clinicId = await getUser(true);
        await remove(ref(db, `/clinics/${clinicId}/insurances/${insuranceId}/plans/${planId}`));
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}
