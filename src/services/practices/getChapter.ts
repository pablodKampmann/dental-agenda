import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";

export async function getChapter(name: string, clinicId: string) {
    try {
        if (!navigator.onLine) throw new Error();

            const dbRef = ref(db, `/clinics/${clinicId}/priceTariffs/${name}/`)
            const snapshot = await get(dbRef);
            const data: any[] = [];
            let chapterNum: string = '';
            if (snapshot.exists()) {
                Object.keys(snapshot.val()).forEach((key) => {
                    const entry = snapshot.val()[key];
                    if (entry && typeof entry === 'object' && entry.name !== undefined) {
                        data.push({
                            id: key,
                            name: entry.name,
                            price: entry.price
                        });
                    }
                });
                chapterNum = snapshot.val().chapterNum;
            }
            return { data, chapterNum };
    } catch (error) {
        console.error(error);
        return { data: [], chapterNum: '' };
    }
}
