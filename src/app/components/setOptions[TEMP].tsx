import { db } from "../firebase";
import { ref, push } from "firebase/database";

export async function setOptions() {
    console.log("hola");
    
    const dbRef = ref(db, '/insurances/');
    await push(dbRef, {
        name: "AMEBPBA",
    });
}

