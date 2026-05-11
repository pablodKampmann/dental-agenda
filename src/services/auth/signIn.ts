import { db, auth } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";

export async function signIn(user: string, password: string) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
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
                        const code = (error as any).code;
                        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                            return 'wrong-password';
                        }
                        throw error;
                    }
                } else {
                    return ('wrong-userName')
                }
            }
        }
    } catch (error) {
        return 'network-error';
    }
}