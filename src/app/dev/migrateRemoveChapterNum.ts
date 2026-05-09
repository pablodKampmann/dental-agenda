import { db } from "@/lib/firebase";
import { ref, get, remove } from "firebase/database";
import { getUser } from "@/services/auth/getUser";

async function run() {
    const clinicId = await getUser(true) as string;
    const tariffSnap = await get(ref(db, `/clinics/${clinicId}/priceTariffs`));
    if (!tariffSnap.exists()) throw new Error("priceTariffs not found");

    for (const chapter of Object.keys(tariffSnap.val())) {
        const chapterNumRef = ref(db, `/clinics/${clinicId}/priceTariffs/${chapter}/chapterNum`);
        const snap = await get(chapterNumRef);
        if (snap.exists()) {
            await remove(chapterNumRef);
            console.log(`✓ chapterNum removed from "${chapter}"`);
        }
    }

    // Delete test practice
    await remove(ref(db, `/clinics/${clinicId}/priceTariffs/CONSULTAS/02`));
    console.log(`✓ Test practice CONSULTAS/02 deleted`);
}

run().catch(console.error);