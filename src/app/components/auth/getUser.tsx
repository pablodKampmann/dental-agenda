import { getAuth, onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { db } from "../../firebase";

export async function getUser(onlyId: boolean) {
    const auth = getAuth();
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                let dbRef = ref(db, 'admins/' + user.uid);
                let snapshot = await get(dbRef);
                if (snapshot) {
                    if (onlyId) {
                        resolve(snapshot.val().clinicId);
                    } else {
                        resolve(snapshot.val());
                    }
                }
            } else {
                reject(new Error("User not logged in"));
            }
        });
    });
}
