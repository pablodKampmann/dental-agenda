import { getAppointments } from "../appointments/getAppointments";
import { getAllPatients } from "../patients/getAllPatients";

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_NAMES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export interface SidebarCarouselData {
    today: {
        count: number;
        upcoming: { name: string; time: string }[];
    };
    birthdaysThisWeek: { name: string; date: string }[];
    newPatients: {
        count: number;
        names: string[];
    };
    week: {
        total: number;
        rangeLabel: string;
        days: { label: string; count: number; isToday: boolean }[];
    };
}

function toDateKey(d: Date): string {
    return d
        .toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })
        .replace(/\//g, "");
}

function buildWeekDates(): Date[] {
    const now = new Date();
    const day = now.getDay(); // 0 = domingo ... 6 = sábado
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

function buildUpcomingDates(days: number): Date[] {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        return d;
    });
}

function countAppointments(raw: any): number {
    if (!raw || raw === "vacio") return 0;
    return Object.keys(raw).length;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function buildWeekRangeLabel(monday: Date, sunday: Date): string {
    const sameMonth = monday.getMonth() === sunday.getMonth() && monday.getFullYear() === sunday.getFullYear();
    if (sameMonth) {
        return `${monday.getDate()} al ${sunday.getDate()} de ${MONTH_NAMES[monday.getMonth()]}`;
    }
    return `${monday.getDate()} de ${MONTH_NAMES[monday.getMonth()]} al ${sunday.getDate()} de ${MONTH_NAMES[sunday.getMonth()]}`;
}

export async function getSidebarCarouselData(): Promise<SidebarCarouselData | null> {
    try {
        if (!navigator.onLine) throw new Error();

        const now = new Date();
        const weekDates = buildWeekDates();
        const weekKeys = weekDates.map(toDateKey);
        const todayKey = toDateKey(now);
        const todayIndexInWeek = weekKeys.indexOf(todayKey);
        const upcomingDates = buildUpcomingDates(7);

        const [weekRawList, patients] = await Promise.all([
            Promise.all(weekKeys.map((k) => getAppointments(k))),
            getAllPatients(),
        ]);

        const todayRaw = todayIndexInWeek >= 0 ? weekRawList[todayIndexInWeek] : null;

        // Turnos de hoy: total del día + los que todavía no pasaron, ordenados
        let todayCount = 0;
        let upcoming: { name: string; time: string }[] = [];
        if (todayRaw && todayRaw !== "vacio") {
            const list = Object.values(todayRaw) as any[];
            todayCount = list.length;
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            upcoming = list
                .filter((a) => a?.time)
                .map((a) => {
                    const [h, m] = String(a.time).split(":").map(Number);
                    return { a, minutes: (h || 0) * 60 + (m || 0) };
                })
                .filter((x) => x.minutes >= nowMinutes)
                .sort((x, y) => x.minutes - y.minutes)
                .map(({ a }) => {
                    const p = a.patientData;
                    return {
                        name: p ? `${p.name ?? ""} ${p.lastName ?? ""}`.trim() : "Paciente",
                        time: a.time ?? "",
                    };
                });
        }

        // Carga de la semana, desglosada por día
        const days = weekDates.map((d, i) => ({
            label: WEEKDAY_LABELS[i],
            count: countAppointments(weekRawList[i]),
            isToday: isSameCalendarDay(d, now),
        }));
        const weekTotal = days.reduce((sum, d) => sum + d.count, 0);
        const rangeLabel = buildWeekRangeLabel(weekDates[0], weekDates[6]);

        // Cumpleaños en los próximos 7 días + pacientes nuevos del mes
        let birthdaysThisWeek: { name: string; date: string }[] = [];
        let newPatients: { count: number; names: string[] } = { count: 0, names: [] };

        if (patients) {
            const dayOffset = new Map<string, number>();
            upcomingDates.forEach((d, i) => dayOffset.set(`${d.getMonth()}-${d.getDate()}`, i));

            birthdaysThisWeek = patients
                .filter((p) => p.birthDate)
                .map((p) => {
                    const parts = p.birthDate!.split("/");
                    if (parts.length !== 3) return null;
                    const day = Number(parts[0]);
                    const month = Number(parts[1]) - 1;
                    if (Number.isNaN(day) || Number.isNaN(month)) return null;
                    const key = `${month}-${day}`;
                    const offset = dayOffset.get(key);
                    if (offset === undefined) return null;
                    return {
                        name: `${p.name} ${p.lastName}`.trim(),
                        date: `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}`,
                        offset,
                    };
                })
                .filter((x): x is { name: string; date: string; offset: number } => x !== null)
                .sort((a, b) => a.offset - b.offset)
                .map(({ name, date }) => ({ name, date }));

            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const newThisMonth = patients
                .filter((p) => {
                    if (!p.timestamp) return false;
                    const d = new Date(p.timestamp);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                })
                .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

            newPatients = {
                count: newThisMonth.length,
                names: newThisMonth.map((p) => `${p.name} ${p.lastName}`.trim()),
            };
        }

        return {
            today: { count: todayCount, upcoming },
            birthdaysThisWeek,
            newPatients,
            week: { total: weekTotal, rangeLabel, days },
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}
