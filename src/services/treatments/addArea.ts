import { db } from "@/lib/firebase";
import { push, ref } from "firebase/database";
import type { Area } from "./getAreas";

export async function addArea(clinicId: string, name: string): Promise<Area | null> {
  try {
    if (!navigator.onLine) throw new Error();
    const result = await push(ref(db, `/clinics/${clinicId}/areas/`), { name });
    return result.key ? { id: result.key, name } : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
