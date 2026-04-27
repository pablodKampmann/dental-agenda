import { db } from "./../../app/firebase";
import { ref, push } from "firebase/database";
import { getUser } from "./../auth/getUser";

export async function addInsurance(name: string): Promise<{ id: string; name: string } | null> {
    try {
        if (!navigator.onLine) throw new Error();
        const clinicId = await getUser(true);
        const newRef = await push(ref(db, `/clinics/${clinicId}/insurances/`), { name: name.trim() });
        if (!newRef.key) throw new Error();
        return { id: newRef.key, name: name.trim() };
    } catch (error) {
        console.error(error);
        return null;
    }
}
