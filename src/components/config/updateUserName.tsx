import { db } from "./../../app/firebase";
import { ref, get, update } from "firebase/database";

export async function updateUserName(newUserName: string, uid: string): Promise<'ok' | 'already-in-use' | 'error'> {
    try {
        if (!navigator.onLine) throw new Error();

        const adminsRef = ref(db, 'admins/');
        const snapshot = await get(adminsRef);

        if (snapshot.exists()) {
            const admins = snapshot.val();
            const alreadyInUse = Object.keys(admins).some(
                (key) => key !== uid && admins[key].userName === newUserName
            );
            if (alreadyInUse) return 'already-in-use';
        }

        await update(ref(db, `/admins/${uid}/`), { userName: newUserName });
        return 'ok';
    } catch {
        return 'error';
    }
}