import { db } from "../firebase";
import { ref, push, set, update } from "firebase/database";

export async function setOptions() {
    const dbRef = ref(db, '/admins/');
    await push(dbRef, {
        displayName: 'Admin',
        email: "admin@gmail.com",
        userName: "admin"
    });
    /*await update(dbRef, {
        practiceName: "ENDODONCIA"
    });*/
}

