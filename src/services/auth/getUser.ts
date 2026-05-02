import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { db, auth } from "./../../app/firebase";

export async function getUser(getOnlyClinicId: boolean) {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                let dbRef = ref(db, 'admins/' + user.uid);
                let snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    let data = snapshot.val();
                    data.userUid = user.uid;
                    if (getOnlyClinicId) {
                        resolve(data.clinicId);
                    } else {
                        resolve(data);
                    }
                }
            } else {
                reject("User not logged in");
            }
        });
    });
}
