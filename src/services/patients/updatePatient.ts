import { db } from "@/lib/firebase";
import { update, ref, get } from "firebase/database";
import { invalidateSidebarCarousel } from "../navigation/sidebarCarouselEvents";

// Campos que el carrusel del sidebar muestra (cumpleaños, nombre en las
// listas de cumpleaños/pacientes nuevos) -- solo estos ameritan un refresh.
const CAROUSEL_RELEVANT_FIELDS = ["birthDate", "name", "lastName"];

export async function updatePatient(
    changes: string | Record<string, string>,
    table: string | null,
    id: string | null,
    clinicId: string
) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        } else {
            const dbRef = ref(db, `clinics/${clinicId}/patients/${id}`);
            const payload = (typeof changes === 'string' && table !== null)
                ? { [table]: changes }
                : changes as Record<string, string>;
            await update(dbRef, payload)
            if (Object.keys(payload).some((field) => CAROUSEL_RELEVANT_FIELDS.includes(field))) {
                invalidateSidebarCarousel();
            }
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                const patient = snapshot.val();
                return patient;
            }
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}
