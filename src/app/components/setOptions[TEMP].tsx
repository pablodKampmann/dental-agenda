import { db } from "../firebase";
import { ref, push, set, update, get } from "firebase/database";

export async function setOptions(clinicId: any) {
    const dbRef = ref(db, '/clinics/' + clinicId + '/priceTariffs/' + 'CIRUGÍA/');

  /*  await set(dbRef, {
        chapterNum: 'X',
    })*/
}

