import { db } from "../firebase";
import { get, ref } from "firebase/database";

export async function getChapter(name: string) {
    const dbRef = ref(db, '/priceTariffs/' + name)
    const snapshot = await get(dbRef);
    const data: any[] = [];
    let practice: string = '';
    if (snapshot.val()) {
        Object.keys(snapshot.val()).forEach((key) => {
            data.push({
                id: snapshot.val()[key].id,
                name: snapshot.val()[key].name,
                price: snapshot.val()[key].price
            });
        });
        practice = snapshot.val().practiceName;
    }
    return { data, practice };
}
