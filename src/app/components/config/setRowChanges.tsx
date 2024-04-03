import { db } from "../../firebase";
import { ref, update, get } from "firebase/database";

export async function setRowChanges(table: string, changes: any, id: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const dbRef = ref(db, `/admins/${id}/`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            await update(dbRef, {
                [table]: changes
            })
        }
    } catch (error) {
        return ('error')
    }
}

