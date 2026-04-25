import { getInsuranceOptions } from "../components/options/getInsuranceOpt";
import { getInsurancePlans } from "../components/options/getInsurancePlans";
import { addInsurance } from "../components/options/addInsurance";
import { addInsurancePlan } from "../components/options/addInsurancePlan";
import { SetPatients } from "../components/patients/db/setPatients";

// ---------------------------------------------------------------------------
// SEED DATA — editá esta lista para agregar o modificar pacientes de prueba
// ---------------------------------------------------------------------------

interface SeedPatient {
    name: string;
    lastName: string;
    gender: "male" | "female";
    birthDate: string;  // DD/MM/YYYY
    dni: string;
    num: string;        // formato internacional, ej: +54 9 11 1234 5678
    address: string;
    email: string;
    insuranceName: string;  // debe existir en Firebase
    planName: string;       // debe existir bajo esa obra social ("" si es Particular)
    affiliateNum: string;
}

export const SEED_PATIENTS: SeedPatient[] = [
    // --- desde la lista original ---
    {
        name: "Valentina", lastName: "Rodríguez", gender: "female",
        birthDate: "08/11/1998", dni: "40123456",
        num: "+54 9 11 4567 8901", address: "Callao 890", email: "vale.rodriguez@gmail.com",
        insuranceName: "Particular", planName: "", affiliateNum: "",
    },
    {
        name: "Sebastián", lastName: "López", gender: "male",
        birthDate: "30/01/1978", dni: "24876543",
        num: "+54 9 11 5678 9012", address: "Santa Fe 321", email: "seba.lopez@gmail.com",
        insuranceName: "OSDE", planName: "210", affiliateNum: "00345678",
    },
    {
        name: "Camila", lastName: "Martínez", gender: "female",
        birthDate: "14/06/2001", dni: "43210987",
        num: "+54 9 11 6789 0123", address: "Rivadavia 654", email: "cami.martinez@gmail.com",
        insuranceName: "IOMA", planName: "Básico", affiliateNum: "00456789",
    },
    {
        name: "Diego", lastName: "Sánchez", gender: "male",
        birthDate: "03/09/1992", dni: "35678901",
        num: "+54 9 11 7890 1234", address: "Belgrano 987", email: "diego.sanchez@gmail.com",
        insuranceName: "Galeno", planName: "Plus", affiliateNum: "00567890",
    },
    {
        name: "Florencia", lastName: "Romero", gender: "female",
        birthDate: "19/04/1988", dni: "30245678",
        num: "+54 9 11 8901 2345", address: "Córdoba 147", email: "flor.romero@gmail.com",
        insuranceName: "Swiss Medical", planName: "SMG30", affiliateNum: "00678901",
    },
    {
        name: "Nicolás", lastName: "Torres", gender: "male",
        birthDate: "25/12/1995", dni: "37890123",
        num: "+54 9 11 9012 3456", address: "Pueyrredón 258", email: "nico.torres@gmail.com",
        insuranceName: "Particular", planName: "", affiliateNum: "",
    },
    {
        name: "Agustina", lastName: "Pérez", gender: "female",
        birthDate: "07/08/1982", dni: "27456789",
        num: "+54 9 11 1234 5678", address: "Av. 9 de Julio 369", email: "agus.perez@gmail.com",
        insuranceName: "IOMA", planName: "Básico", affiliateNum: "00789012",
    },
    {
        name: "Tomás", lastName: "Díaz", gender: "male",
        birthDate: "11/02/2000", dni: "42345678",
        num: "+54 9 11 2345 6780", address: "Tucumán 741", email: "tomas.diaz@gmail.com",
        insuranceName: "Galeno", planName: "Plus", affiliateNum: "00890123",
    },

    // --- 10 nuevos ---
    {
        name: "Ramiro", lastName: "Acosta", gender: "male",
        birthDate: "17/03/1991", dni: "34123890",
        num: "+54 9 11 3344 5566", address: "Maipú 420", email: "ramiro.acosta@gmail.com",
        insuranceName: "OSDE", planName: "410", affiliateNum: "00901234",
    },
    {
        name: "Julieta", lastName: "Vega", gender: "female",
        birthDate: "29/09/1996", dni: "38765432",
        num: "+54 9 11 4455 6677", address: "Suipacha 312", email: "julieta.vega@gmail.com",
        insuranceName: "Swiss Medical", planName: "SMG30", affiliateNum: "01012345",
    },
    {
        name: "Ignacio", lastName: "Herrera", gender: "male",
        birthDate: "05/05/1984", dni: "28901234",
        num: "+54 9 11 5566 7788", address: "Esmeralda 87", email: "ignacio.herrera@gmail.com",
        insuranceName: "IOMA", planName: "Básico", affiliateNum: "01123456",
    },
    {
        name: "Sofía", lastName: "Ruiz", gender: "female",
        birthDate: "22/11/2002", dni: "44567890",
        num: "+54 9 11 6677 8899", address: "Lavalle 1100", email: "sofia.ruiz@gmail.com",
        insuranceName: "Galeno", planName: "Plus", affiliateNum: "01234567",
    },
    {
        name: "Matías", lastName: "Castro", gender: "male",
        birthDate: "08/07/1987", dni: "31234567",
        num: "+54 9 11 7788 9900", address: "Viamonte 654", email: "matias.castro@gmail.com",
        insuranceName: "OSDE", planName: "210", affiliateNum: "01345678",
    },
    {
        name: "Antonella", lastName: "Morales", gender: "female",
        birthDate: "14/01/1999", dni: "41098765",
        num: "+54 9 11 8899 0011", address: "Paraguay 789", email: "antonella.morales@gmail.com",
        insuranceName: "Particular", planName: "", affiliateNum: "",
    },
    {
        name: "Bruno", lastName: "Suárez", gender: "male",
        birthDate: "30/06/1993", dni: "36543210",
        num: "+54 9 11 9900 1122", address: "Perón 456", email: "bruno.suarez@gmail.com",
        insuranceName: "Swiss Medical", planName: "SMG30", affiliateNum: "01456789",
    },
    {
        name: "Micaela", lastName: "Gómez", gender: "female",
        birthDate: "19/08/1980", dni: "25678901",
        num: "+54 9 11 1122 3344", address: "Reconquista 210", email: "micaela.gomez@gmail.com",
        insuranceName: "IOMA", planName: "Básico", affiliateNum: "01567890",
    },
    {
        name: "Facundo", lastName: "Blanco", gender: "male",
        birthDate: "03/04/1975", dni: "21345678",
        num: "+54 9 11 2233 4455", address: "Sarmiento 333", email: "facundo.blanco@gmail.com",
        insuranceName: "Galeno", planName: "Plus", affiliateNum: "01678901",
    },
    {
        name: "Rocío", lastName: "Navarro", gender: "female",
        birthDate: "11/12/2003", dni: "45678901",
        num: "+54 9 11 3344 5566", address: "Rivadavia 1500", email: "rocio.navarro@gmail.com",
        insuranceName: "OSDE", planName: "410", affiliateNum: "01789012",
    },
];

// ---------------------------------------------------------------------------
// FUNCIÓN DE SEED — resuelve IDs desde Firebase y crea los pacientes
// ---------------------------------------------------------------------------

export async function runSeedPatients(): Promise<{ ok: number; failed: string[] }> {
    const insurances = await getInsuranceOptions();
    if (!insurances) throw new Error("No se pudieron cargar las obras sociales.");

    // Cache de planes por insuranceId para no hacer fetches repetidos
    const plansCache: Record<string, { id: string; name: string }[]> = {};

    async function getPlans(insuranceId: string) {
        if (!plansCache[insuranceId]) {
            const plans = await getInsurancePlans(insuranceId);
            plansCache[insuranceId] = plans ?? [];
        }
        return plansCache[insuranceId];
    }

    let ok = 0;
    const failed: string[] = [];

    for (const p of SEED_PATIENTS) {
        // Buscar obra social — crearla si no existe
        let insurance = insurances.find(i => i.name === p.insuranceName);
        if (!insurance) {
            const created = await addInsurance(p.insuranceName);
            if (!created) {
                failed.push(`${p.name} ${p.lastName} — no se pudo crear la obra social "${p.insuranceName}"`);
                continue;
            }
            insurances.push(created);
            insurance = created;
        }

        let planId = "";
        let planName = "";

        if (p.planName && p.insuranceName !== "Particular") {
            const plans = await getPlans(insurance.id);
            let plan = plans.find(pl => pl.name === p.planName);
            // Crear plan si no existe
            if (!plan) {
                const created = await addInsurancePlan(insurance.id, p.planName);
                if (!created) {
                    failed.push(`${p.name} ${p.lastName} — no se pudo crear el plan "${p.planName}"`);
                    continue;
                }
                plansCache[insurance.id] = [...plans, created];
                plan = created;
            }
            planId = plan.id;
            planName = plan.name;
        }

        const result = await SetPatients(
            p.name, p.lastName, p.gender, p.birthDate, p.dni,
            p.num, p.address, p.email,
            insurance.name, insurance.id,
            planName, planId,
            p.affiliateNum
        );

        if (result === "error") {
            failed.push(`${p.name} ${p.lastName} — error al guardar`);
        } else {
            ok++;
        }
    }

    return { ok, failed };
}
