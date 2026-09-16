import { db } from "@/lib/firebase";
import { ref, set, get, remove, push } from "firebase/database";
import type { dateData } from "@/components/appointments/appointmentUtils";
import { getUser } from "./../auth/getUser";
import { invalidateSidebarCarousel } from "../navigation/sidebarCarouselEvents";

export async function updateAppointment(
    appointmentId: number,
    originalDate: string,
    patientId: number,
    dateData: dateData,
    reason?: any,
    observations?: string,
) {
    try {
        if (!navigator.onLine) {
            throw new Error();
        }
        const clinicId = await getUser(true);
        const originalFormattedDate = originalDate.replace(/\//g, '');
        const newFormattedDate = dateData.date.replace(/\//g, '');
        const dateChanged = originalFormattedDate !== newFormattedDate;

        // Si cambió de día, el id viejo no sirve en el nuevo bucket — se borra el nodo
        // original y se asigna uno nuevo con el mismo criterio de auto-incremento que
        // setAppointment. Si el día es el mismo, se sobreescribe in-place con el mismo id.
        let targetId = appointmentId;
        if (dateChanged) {
            await remove(ref(db, `/clinics/${clinicId}/appointments/${originalFormattedDate}/${appointmentId}/`));

            const newDaySnapshot = await get(ref(db, `/clinics/${clinicId}/appointments/${newFormattedDate}/`));
            targetId = newDaySnapshot.val()
                ? Math.max(...Object.keys(newDaySnapshot.val()).map(Number)) + 1
                : 1;
        }

        await set(ref(db, `/clinics/${clinicId}/appointments/${newFormattedDate}/${targetId}/`), {
            id: targetId,
            patientId: patientId,
            date: dateData.date,
            dayComplete: dateData.dayComplete,
            year: dateData.year,
            time: dateData.time,
            ...(dateData.time2 ? { time2: dateData.time2 } : {}),
            ...(dateData.time3 ? { time3: dateData.time3 } : {}),
            ...(dateData.time4 ? { time4: dateData.time4 } : {}),
            ...(dateData.time5 ? { time5: dateData.time5 } : {}),
            ...(dateData.time6 ? { time6: dateData.time6 } : {}),
            ...(reason ? { reason: reason } : {}),
            observations: observations,
        });

        if (dateChanged) {
            // /patients/{id}/appointments/ es un índice de fechas (una entrada por día con
            // turno, no por id de turno) — mismo criterio que deleteAppointment.ts: sacar la
            // entrada que apunta al día viejo y empujar una nueva con el día nuevo.
            const patientApptsRef = ref(db, `/clinics/${clinicId}/patients/${patientId}/appointments/`);
            const patientApptsSnapshot = await get(patientApptsRef);
            if (patientApptsSnapshot.exists()) {
                const entries = patientApptsSnapshot.val();
                const keyToDelete = Object.keys(entries).find((key) => entries[key] === originalFormattedDate);
                if (keyToDelete) {
                    await remove(ref(db, `/clinics/${clinicId}/patients/${patientId}/appointments/${keyToDelete}`));
                }
            }
            await push(patientApptsRef, newFormattedDate);
        }

        invalidateSidebarCarousel();
    } catch (error) {
        console.error(error);
        return null;
    }
}
