import { db, auth } from "./../firebase";
import { get, ref } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";

export async function signIn(user: string, password: string) {
    try {
        const dbRef = ref(db, 'admins/');
        const snapshot = await get(dbRef);
        if (snapshot.val()) {
            let email = "";
            Object.keys(snapshot.val()).forEach((key) => {
                if (user === snapshot.val()[key].userName) {
                    email = snapshot.val()[key].email;
                }
            });
            if (email !== "") {
                try {
                    const userData = await signInWithEmailAndPassword(auth, email, password)
                    if (userData) {
                        return ('all-good');
                    }
                } catch (error) {
                    if (error = 'FirebaseError: Firebase: Error (auth/wrong-password).') {
                        return ('wrong-password')
                    }
                }
            } else {
                return ('wrong-userName')
            }
        }
    } catch (error) {
        if (error == 'NetworkError') {
            return 'network-error';
        }
    }
}
