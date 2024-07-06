import { db } from "./../../../app/firebase";
import { get, ref } from "firebase/database";
import { getUser } from "../../auth/getUser";

export async function getPatient(patientId: string | number | null) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const clinicId = await getUser(true)
            const dbRef = ref(db, `/clinics/${clinicId}/patients/${patientId}`);
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const patient = snapshot.val();
                return patient;
            } else {
                return null;
            }
        }
    } catch (error) {
        console.log('error');
    }
}
