import { db } from "../../firebase";
import { ref, update, get } from "firebase/database";
import { updateEmail, getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";


export async function updateUserEmail(table: string, changes: any, id: string, userCredential: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const auth = getAuth();
        const user = auth.currentUser;
        if (user && user.email) {
            const credential = EmailAuthProvider.credential(user.email, userCredential)
            await reauthenticateWithCredential(user, credential)
            await updateEmail(user, changes);
            const dbRef = ref(db, `/admins/${id}/`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                await update(dbRef, {
                    [table]: changes
                })
            }
        } else {
            throw new Error();
        }
    } catch (error) {
        return 'error'
    }
}

