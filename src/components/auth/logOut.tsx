import { getAuth, signOut } from "firebase/auth";

export async function logOut() {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const auth = getAuth();
            await signOut(auth);
        }
    } catch (error) {
        return ('error')
    }
}

