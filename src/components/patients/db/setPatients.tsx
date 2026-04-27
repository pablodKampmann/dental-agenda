import { db } from "./../../../app/firebase";
import { ref, set, get } from "firebase/database";
import { getUser } from "../../auth/getUser";

export async function SetPatients(
    name: any, lastName: any, gender: any, date: any, dni: any, num: any,
    address: any, email: any,
    insurance: any, insuranceId: any,
    plan: any, planId: any,
    affiliate: any
): Promise<void | string> {
    try {
        if (!navigator.onLine) throw new Error();
        const clinicId = await getUser(true);
        let patientId = 1;
        const dbRef = ref(db, `/clinics/${clinicId}/patients/`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            const keys = Object.keys(data);
            const maxId = keys.length > 0 ? Math.max(...keys.map(Number)) : 0;
            patientId = maxId + 1;
        }
        await set(ref(db, `/clinics/${clinicId}/patients/${patientId}`), {
            id: patientId,
            name,
            lastName,
            gender,
            birthDate: date,
            dni,
            num,
            address,
            email,
            insurance,
            insuranceId,
            plan,
            planId,
            affiliateNum: affiliate,
        });
    } catch (error) {
        console.error(error);
        return "error";
    }
}
