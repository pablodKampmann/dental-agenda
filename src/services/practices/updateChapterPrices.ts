import { db } from "@/lib/firebase";
import { set, ref, get } from "firebase/database";

export async function updateChapterPrices(updatedChapterData: any, chapter: any, clinicId: string) {
    try {
        if (!navigator.onLine) throw new Error();
            const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const snapshotVal = snapshot.val();
                for (const key in snapshotVal) {
                    const updatedData = updatedChapterData.find((data: any) => data.id === key);
                    if (updatedData) {
                        await set(ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/${key}/price`), updatedData.price);
                    }
                }
            }
            return true;
    
    } catch (error) {
        console.error(error);
        return null;
    }
}