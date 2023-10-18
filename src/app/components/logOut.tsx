import { getAuth, signOut } from "firebase/auth";

export async function logOut() {
    const auth = getAuth();
    await signOut(auth);
}
