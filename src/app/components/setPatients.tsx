import { db } from "../firebase";
import { ref, set, get } from "firebase/database";

export async function SetPatients(name: any, lastName: any, gender: any, date: any, dni: any, newNum: any, address: any, obra: any, plan: any, affiliate: any) {
    let patientId = 1;
    let dbRef = ref(db, '/patients/');
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        patientId = (Object.keys(data).length) + 1;
    }
    dbRef = ref(db, '/patients/' + patientId);
    await set(dbRef, {
        id: patientId,
        name: name,
        lastName: lastName,
        gender: gender,
        birthDate: date,
        dni: dni,
        num: newNum,
        address: address,
        obra: obra,
        plan: plan,
        affiliateNum: affiliate
    });
}

