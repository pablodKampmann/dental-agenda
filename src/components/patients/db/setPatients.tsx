import { db } from "./../../../app/firebase";
import { ref, set, get } from "firebase/database";
import { getUser } from "../../auth/getUser";

export async function SetPatients(name: any, lastName: any, gender: any, date: any, dni: any, num: any, address: any, email: any, insurance: any, plan: any, affiliate: any) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const clinicId = await getUser(true)
        let isIdFree = false;
        let patientId = 1;
        let dbRef = ref(db, `/clinics/${clinicId}/patients/`);
        let snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            patientId = (Object.keys(data).length) + 1;
        }
        while (isIdFree === false) {
            dbRef = ref(db, `/clinics/${clinicId}/patients/${patientId}`);
            snapshot = await get(dbRef);
            if (snapshot.exists()) {
                patientId++;
            } else {
                isIdFree = true;
                await set(dbRef, {
                    id: patientId,
                    name: name,
                    lastName: lastName,
                    gender: gender,
                    birthDate: date,
                    dni: dni,
                    num: num,
                    address: address,
                    email: email,
                    insurance: insurance,
                    plan: plan,
                    affiliateNum: affiliate
                });
            }
        }
    } catch (error) {
        console.error(error);
        return (error instanceof Error ? error.message : 'unknown-error');
    }
}

