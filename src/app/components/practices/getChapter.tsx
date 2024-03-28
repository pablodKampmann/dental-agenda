import { db } from "../../firebase";
import { get, ref } from "firebase/database";

export async function getChapter(name: string) {
    const dbRef = ref(db, '/priceTariffs/' + name)    
    const snapshot = await get(dbRef);
    const data: any[] = [];
    let chapterNum: string = '';
    if (snapshot.exists()) {
        Object.keys(snapshot.val()).forEach((key) => {
            data.push({
                id: snapshot.val()[key].id,
                name: snapshot.val()[key].name,
                price: snapshot.val()[key].price
            });
        });
        chapterNum = snapshot.val().chapterNum;
    }
    return { data, chapterNum };
}
