import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

export async function updateUserPassword(newPassword: string, currentPassword: string): Promise<'ok' | 'wrong-password' | 'error'> {
    try {
        if (!navigator.onLine) throw new Error();

        const auth = getAuth();
        const user = auth.currentUser;

        if (user && user.email) {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            return 'ok';
        } else {
            throw new Error();
        }
    } catch (error: any) {
        if (error.code === 'auth/wrong-password') return 'wrong-password';
        return 'error';
    }
}