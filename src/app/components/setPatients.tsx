import { db } from "../firebase";
import { ref, set, get } from "firebase/database";

export async function SetPatients(name: any, lastName: any, gender: any, date: any, dni: any, newNum: any, address: any, obra: any, plan: any, affiliate: any) {
    let isIdFree = false;
    let patientId = 1;
    let dbRef = ref(db, '/patients/');
    let snapshot = await get(dbRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        patientId = (Object.keys(data).length) + 1;
    }
    while (isIdFree === false) {
        dbRef = ref(db, '/patients/' + patientId);
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
                num: newNum,
                address: address,
                obra: obra,
                plan: plan,
                affiliateNum: affiliate
            });
        }
    }
}

