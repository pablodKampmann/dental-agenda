import { db } from "../firebase";
import { ref, push, set, update } from "firebase/database";

export async function setOptions() {
    const dbRef = ref(db, '/priceTariffs/' + '/chapterIII/' + '/7/');
    await set(dbRef, {
        id: 7,
        name: "Desobturación.",
        price: "32289"
    });
    /*await update(dbRef, {
        practiceName: "ENDODONCIA"
    });*/
}

