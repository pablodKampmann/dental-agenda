import { db } from "../../firebase";
import { set, ref, get } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function updateChapterPrices(updatedChapterData: any, chapter: any) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true);
            const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const snapshotVal = snapshot.val();
                for (const key in snapshotVal) {
                    const chapterData = snapshotVal[key];
                    const updatedData = updatedChapterData.find((data: any) => data.id === chapterData.id);
                    if (updatedData) {
                        await set(ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/${key}/price`), updatedData.price);
                    }
                }
            }
        }
    } catch (error) {
        return ('error')
    }
}
