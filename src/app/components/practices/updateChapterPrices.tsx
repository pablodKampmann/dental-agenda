import { db } from "../../firebase";
import { set, ref, get } from "firebase/database";

export async function updateChapterPrices(updatedChapterData: any, chapter: any) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, "/priceTariffs/" + chapter + "/");
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const snapshotVal = snapshot.val();
                for (const key in snapshotVal) {
                    const chapterData = snapshotVal[key];
                    const updatedData = updatedChapterData.find((data: any) => data.id === chapterData.id);
                    if (updatedData) {
                        await set(ref(db, `/priceTariffs/${chapter}/${key}/price`), updatedData.price);
                    }
                }
            }
        }
    } catch (error) {
        return ('error')
    }
}
