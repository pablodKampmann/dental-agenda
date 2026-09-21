import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";

export interface Area {
  id: string;
  name: string;
}

export async function getAreas(clinicId: string): Promise<Area[] | null> {
  try {
    if (!navigator.onLine) throw new Error();
    const snapshot = await get(ref(db, `/clinics/${clinicId}/areas/`));
    if (!snapshot.exists()) return [];
    const data = snapshot.val();
    return Object.keys(data)
      .map((id) => ({ id, name: data[id]?.name as string }))
      .filter((a) => typeof a.name === "string" && a.name !== "")
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error(error);
    return null;
  }
}
