import { db } from "../firebase";
import { ref, push } from "firebase/database";

export async function SetPatients(name: any, lastName: any, gender: any, date: any, dni: any, newNum: any, address: any, obra: any, plan: any, affiliate: any) {
    const dbRef = ref(db, '/patients/');    
    await push(dbRef, {
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

