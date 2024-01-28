import { db } from "../firebase";
import { ref, push } from "firebase/database";

export async function setReasons() {
    const dbRef = ref(db, '/reasons/');
    await push(dbRef, {
        name: "Cirugía de Encías",
    });
}

