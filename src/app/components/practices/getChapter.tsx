import { db } from "../../firebase";
import { get, ref } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function getChapter(name: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${name}/`)
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
    } catch (error) {
        return { data: [], chapterNum: '' }; 
    }
}
