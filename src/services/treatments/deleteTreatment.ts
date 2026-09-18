import { db } from "@/lib/firebase";
import { ref, remove } from "firebase/database";

export async function deleteTreatment(clinicId: string, id: string) {
  try {
    if (!navigator.onLine) throw new Error();
    await remove(ref(db, `/clinics/${clinicId}/treatments/${id}/`));
  } catch (error) {
    console.error(error);
    return null;
  }
}
