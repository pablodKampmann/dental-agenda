import { db } from "@/lib/firebase";
import { ref, remove } from "firebase/database";

export async function deletePayment(clinicId: string, id: string) {
  try {
    if (!navigator.onLine) throw new Error();
    await remove(ref(db, `/clinics/${clinicId}/payments/${id}/`));
  } catch (error) {
    console.error(error);
    return null;
  }
}
