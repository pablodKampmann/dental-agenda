import { getInsuranceOptions } from "../services/options/getInsuranceOpt";
import { getInsurancePlans } from "../services/options/getInsurancePlans";
import { addInsurance } from "../services/options/addInsurance";
import { addInsurancePlan } from "../services/options/addInsurancePlan";
import { SetPatients } from "../services/patients/setPatients";

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
// 100 PACIENTES ADICIONALES
// ---------------------------------------------------------------------------

export const SEED_PATIENTS_EXTRA: SeedPatient[] = [
    { name: "Martín",      lastName: "González",    gender: "male",   birthDate: "12/03/1985", dni: "28456789", num: "+54 9 11 4567 8901", address: "Av. Corrientes 1234",     email: "martin.gonzalez@gmail.com",    insuranceName: "OSDE",          planName: "210",    affiliateNum: "02000001" },
    { name: "Laura",       lastName: "Fernández",   gender: "female", birthDate: "07/09/1990", dni: "32145678", num: "+54 9 11 5678 9012", address: "Av. Santa Fe 567",        email: "laura.fernandez@gmail.com",    insuranceName: "Galeno",        planName: "Plus",   affiliateNum: "02000002" },
    { name: "Pablo",       lastName: "García",      gender: "male",   birthDate: "22/11/1978", dni: "24789012", num: "+54 9 11 6789 0123", address: "Mitre 890",               email: "pablo.garcia@hotmail.com",     insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000003" },
    { name: "Carolina",    lastName: "Álvarez",     gender: "female", birthDate: "15/06/1995", dni: "37654321", num: "+54 9 11 7890 1234", address: "San Martín 321",          email: "caro.alvarez@gmail.com",       insuranceName: "Swiss Medical", planName: "SMG30",  affiliateNum: "02000004" },
    { name: "Lucas",       lastName: "Molina",      gender: "male",   birthDate: "30/01/1988", dni: "29876543", num: "+54 9 11 8901 2345", address: "Belgrano 456",            email: "lucas.molina@gmail.com",       insuranceName: "Medifé",        planName: "Plan 1", affiliateNum: "02000005" },
    { name: "Verónica",    lastName: "Jiménez",     gender: "female", birthDate: "03/04/1983", dni: "26543210", num: "+54 9 11 9012 3456", address: "Rivadavia 789",           email: "vero.jimenez@gmail.com",       insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Alejandro",   lastName: "Medina",      gender: "male",   birthDate: "18/07/1992", dni: "34678901", num: "+54 9 11 0123 4567", address: "9 de Julio 123",          email: "ale.medina@gmail.com",         insuranceName: "OSDE",          planName: "310",    affiliateNum: "02000007" },
    { name: "Natalia",     lastName: "Vargas",      gender: "female", birthDate: "25/12/1987", dni: "28901234", num: "+54 9 11 1234 5678", address: "Libertad 654",            email: "nati.vargas@hotmail.com",      insuranceName: "Galeno",        planName: "Plus",   affiliateNum: "02000008" },
    { name: "Fernando",    lastName: "Ramos",       gender: "male",   birthDate: "09/02/1980", dni: "25234567", num: "+54 9 11 2345 6789", address: "Sarmiento 987",           email: "fer.ramos@gmail.com",          insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000009" },
    { name: "Claudia",     lastName: "Santos",      gender: "female", birthDate: "14/08/1975", dni: "21345678", num: "+54 9 11 3456 7890", address: "Tucumán 432",             email: "claudia.santos@gmail.com",     insuranceName: "Swiss Medical", planName: "SMG10",  affiliateNum: "02000010" },
    { name: "Gustavo",     lastName: "Silva",       gender: "male",   birthDate: "27/05/1993", dni: "35456789", num: "+54 9 11 4567 8902", address: "Lavalle 111",             email: "gus.silva@gmail.com",          insuranceName: "Medifé",        planName: "Plan 2", affiliateNum: "02000011" },
    { name: "Mariela",     lastName: "Aguirre",     gender: "female", birthDate: "06/10/1989", dni: "31567890", num: "+54 9 11 5678 9013", address: "Pueyrredón 222",          email: "mariela.aguirre@gmail.com",    insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Ricardo",     lastName: "Benítez",     gender: "male",   birthDate: "20/03/1971", dni: "17678901", num: "+54 9 11 6789 0124", address: "Callao 333",              email: "ricar.benitez@hotmail.com",    insuranceName: "OSDE",          planName: "410",    affiliateNum: "02000013" },
    { name: "Beatriz",     lastName: "Campos",      gender: "female", birthDate: "11/11/1968", dni: "14789012", num: "+54 9 11 7890 1235", address: "Ayacucho 444",            email: "bea.campos@gmail.com",         insuranceName: "Galeno",        planName: "Salud",  affiliateNum: "02000014" },
    { name: "Eduardo",     lastName: "Delgado",     gender: "male",   birthDate: "04/07/1984", dni: "27890123", num: "+54 9 11 8901 2346", address: "Thames 555",              email: "edu.delgado@gmail.com",        insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000015" },
    { name: "Cecilia",     lastName: "Esquivel",    gender: "female", birthDate: "29/09/1996", dni: "38901234", num: "+54 9 11 9012 3457", address: "Gurruchaga 666",          email: "ceci.esquivel@gmail.com",      insuranceName: "Swiss Medical", planName: "SMG30",  affiliateNum: "02000016" },
    { name: "Carlos",      lastName: "Figueroa",    gender: "male",   birthDate: "16/02/1977", dni: "23012345", num: "+54 9 11 0123 4568", address: "Nicaragua 777",           email: "carlos.figueroa@gmail.com",    insuranceName: "Medifé",        planName: "Plan 1", affiliateNum: "02000017" },
    { name: "Diana",       lastName: "Guerrero",    gender: "female", birthDate: "08/06/1991", dni: "33123456", num: "+54 9 11 1234 5679", address: "Honduras 888",            email: "diana.guerrero@hotmail.com",   insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Ariel",       lastName: "Ibáñez",      gender: "male",   birthDate: "23/08/1986", dni: "29234568", num: "+54 9 11 2345 6790", address: "El Salvador 999",         email: "ariel.ibanez@gmail.com",       insuranceName: "OSDE",          planName: "210",    affiliateNum: "02000019" },
    { name: "Elena",       lastName: "Juárez",      gender: "female", birthDate: "01/01/1982", dni: "26345679", num: "+54 9 11 3456 7891", address: "Soler 1010",              email: "elena.juarez@gmail.com",       insuranceName: "Galeno",        planName: "Plus",   affiliateNum: "02000020" },
    { name: "Ezequiel",    lastName: "Lucero",      gender: "male",   birthDate: "12/04/1994", dni: "36456790", num: "+54 9 11 4567 8903", address: "Cabrera 1111",            email: "eze.lucero@gmail.com",         insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000021" },
    { name: "Fernanda",    lastName: "Méndez",      gender: "female", birthDate: "07/11/1979", dni: "25567891", num: "+54 9 11 5678 9014", address: "Armenia 1212",            email: "fer.mendez@gmail.com",         insuranceName: "Swiss Medical", planName: "SMG50",  affiliateNum: "02000022" },
    { name: "Leandro",     lastName: "Ortega",      gender: "male",   birthDate: "19/07/1997", dni: "39678902", num: "+54 9 11 6789 0125", address: "Malabia 1313",            email: "lean.ortega@gmail.com",        insuranceName: "Medifé",        planName: "Plan 2", affiliateNum: "02000023" },
    { name: "Gabriela",    lastName: "Ponce",       gender: "female", birthDate: "26/02/1973", dni: "19789013", num: "+54 9 11 7890 1236", address: "Serrano 1414",            email: "gaby.ponce@hotmail.com",       insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Rodrigo",     lastName: "Quiroga",     gender: "male",   birthDate: "03/09/1990", dni: "31890124", num: "+54 9 11 8901 2347", address: "Humboldt 1515",           email: "rodri.quiroga@gmail.com",      insuranceName: "OSDE",          planName: "310",    affiliateNum: "02000025" },
    { name: "Irene",       lastName: "Reyes",       gender: "female", birthDate: "30/05/1985", dni: "28901235", num: "+54 9 11 9012 3458", address: "Bonpland 1616",           email: "irene.reyes@gmail.com",        insuranceName: "Galeno",        planName: "Salud",  affiliateNum: "02000026" },
    { name: "Maximiliano", lastName: "Salinas",     gender: "male",   birthDate: "14/10/1981", dni: "26012346", num: "+54 9 11 0123 4569", address: "Fitz Roy 1717",           email: "maxi.salinas@gmail.com",       insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000027" },
    { name: "Jessica",     lastName: "Tejada",      gender: "female", birthDate: "21/03/1998", dni: "40123457", num: "+54 9 11 1234 5680", address: "Uriarte 1818",            email: "jessi.tejada@gmail.com",       insuranceName: "Swiss Medical", planName: "SMG10",  affiliateNum: "02000028" },
    { name: "Cristian",    lastName: "Urquiza",     gender: "male",   birthDate: "08/12/1976", dni: "22234568", num: "+54 9 11 2345 6791", address: "Costa Rica 1919",         email: "cris.urquiza@hotmail.com",     insuranceName: "Medifé",        planName: "Plan 1", affiliateNum: "02000029" },
    { name: "Karina",      lastName: "Valdez",      gender: "female", birthDate: "17/06/1993", dni: "35345680", num: "+54 9 11 3456 7892", address: "Nicaragua 2020",          email: "kari.valdez@gmail.com",        insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Julián",      lastName: "Bravo",       gender: "male",   birthDate: "05/08/1989", dni: "30456790", num: "+54 9 11 4567 8904", address: "Av. Scalabrini Ortiz 100",email: "julian.bravo@gmail.com",       insuranceName: "OSDE",          planName: "410",    affiliateNum: "02000031" },
    { name: "Lorena",      lastName: "Cano",        gender: "female", birthDate: "22/01/1984", dni: "27567891", num: "+54 9 11 5678 9015", address: "Av. Coronel Díaz 200",    email: "lore.cano@gmail.com",          insuranceName: "Galeno",        planName: "Junior", affiliateNum: "02000032" },
    { name: "Adrián",      lastName: "Domínguez",   gender: "male",   birthDate: "10/04/1972", dni: "18678902", num: "+54 9 11 6789 0126", address: "Av. Cabildo 300",         email: "adri.dominguez@gmail.com",     insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000033" },
    { name: "Mariana",     lastName: "Espinosa",    gender: "female", birthDate: "28/09/1999", dni: "41789013", num: "+54 9 11 7890 1237", address: "Av. Monroe 400",          email: "mari.espinosa@gmail.com",      insuranceName: "Swiss Medical", planName: "SMG30",  affiliateNum: "02000034" },
    { name: "Marcelo",     lastName: "Franco",      gender: "male",   birthDate: "06/11/1982", dni: "26890124", num: "+54 9 11 8901 2348", address: "Av. Triunvirato 500",     email: "mar.franco@hotmail.com",       insuranceName: "Medifé",        planName: "Plan 2", affiliateNum: "02000035" },
    { name: "Nora",        lastName: "Giménez",     gender: "female", birthDate: "13/07/1967", dni: "13901235", num: "+54 9 11 9012 3459", address: "Av. Forest 600",          email: "nora.gimenez@gmail.com",       insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Darío",       lastName: "Heredia",     gender: "male",   birthDate: "25/02/1995", dni: "37012346", num: "+54 9 11 0123 4570", address: "Av. Warnes 700",          email: "dario.heredia@gmail.com",      insuranceName: "OSDE",          planName: "210",    affiliateNum: "02000037" },
    { name: "Patricia",    lastName: "Iglesias",    gender: "female", birthDate: "02/06/1978", dni: "24123457", num: "+54 9 11 1234 5681", address: "Av. Dorrego 800",         email: "patri.iglesias@gmail.com",     insuranceName: "Galeno",        planName: "Plus",   affiliateNum: "02000038" },
    { name: "Hernán",      lastName: "Jara",        gender: "male",   birthDate: "20/10/1991", dni: "33234568", num: "+54 9 11 2345 6792", address: "Av. Juan B. Justo 900",   email: "her.jara@gmail.com",           insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000039" },
    { name: "Silvana",     lastName: "Luna",        gender: "female", birthDate: "09/03/1986", dni: "29345679", num: "+54 9 11 3456 7893", address: "Thames 100",              email: "sil.luna@hotmail.com",         insuranceName: "Swiss Medical", planName: "SMG10",  affiliateNum: "02000040" },
    { name: "Joaquín",     lastName: "Mena",        gender: "male",   birthDate: "16/08/1974", dni: "20456790", num: "+54 9 11 4567 8905", address: "Gurruchaga 200",          email: "joaco.mena@gmail.com",         insuranceName: "Medifé",        planName: "Plan 1", affiliateNum: "02000041" },
    { name: "Tamara",      lastName: "Núñez",       gender: "female", birthDate: "04/12/1997", dni: "39567891", num: "+54 9 11 5678 9016", address: "Armenia 300",             email: "tami.nunez@gmail.com",         insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Franco",      lastName: "Ojeda",       gender: "male",   birthDate: "29/04/1988", dni: "30678902", num: "+54 9 11 6789 0127", address: "Malabia 400",             email: "franco.ojeda@gmail.com",       insuranceName: "OSDE",          planName: "310",    affiliateNum: "02000043" },
    { name: "Vanesa",      lastName: "Pineda",      gender: "female", birthDate: "07/07/1983", dni: "27789013", num: "+54 9 11 7890 1238", address: "Serrano 500",             email: "vane.pineda@gmail.com",        insuranceName: "Galeno",        planName: "Salud",  affiliateNum: "02000044" },
    { name: "Emiliano",    lastName: "Quintero",    gender: "male",   birthDate: "24/01/1992", dni: "34890124", num: "+54 9 11 8901 2349", address: "Humboldt 600",            email: "emi.quintero@gmail.com",       insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000045" },
    { name: "Ximena",      lastName: "Rivas",       gender: "female", birthDate: "11/05/1980", dni: "25901235", num: "+54 9 11 9012 3460", address: "Bonpland 700",            email: "xime.rivas@gmail.com",         insuranceName: "Swiss Medical", planName: "SMG50",  affiliateNum: "02000046" },
    { name: "Gastón",      lastName: "Serrano",     gender: "male",   birthDate: "18/09/1975", dni: "21012346", num: "+54 9 11 0123 4571", address: "Fitz Roy 800",            email: "gasto.serrano@hotmail.com",    insuranceName: "Medifé",        planName: "Plan 2", affiliateNum: "02000047" },
    { name: "Yamila",      lastName: "Toledo",      gender: "female", birthDate: "06/02/1994", dni: "36123457", num: "+54 9 11 1234 5682", address: "Uriarte 900",             email: "yami.toledo@gmail.com",        insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Iván",        lastName: "Uribe",       gender: "male",   birthDate: "13/06/1987", dni: "29234569", num: "+54 9 11 2345 6793", address: "Costa Rica 100",          email: "ivan.uribe@gmail.com",         insuranceName: "OSDE",          planName: "410",    affiliateNum: "02000049" },
    { name: "Zoe",         lastName: "Vergara",     gender: "female", birthDate: "30/10/2000", dni: "42345679", num: "+54 9 11 3456 7894", address: "Nicaragua 200",           email: "zoe.vergara@gmail.com",        insuranceName: "Galeno",        planName: "Junior", affiliateNum: "02000050" },
    { name: "Leonardo",    lastName: "Zapata",      gender: "male",   birthDate: "08/03/1979", dni: "24456790", num: "+54 9 11 4567 8906", address: "Lavalle 300",             email: "leo.zapata@gmail.com",         insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000051" },
    { name: "Aldana",      lastName: "Acuña",       gender: "female", birthDate: "22/07/1996", dni: "38567891", num: "+54 9 11 5678 9017", address: "Pueyrredón 400",          email: "aldana.acuna@gmail.com",       insuranceName: "Swiss Medical", planName: "SMG30",  affiliateNum: "02000052" },
    { name: "Mauricio",    lastName: "Blanco",      gender: "male",   birthDate: "04/11/1969", dni: "15678902", num: "+54 9 11 6789 0128", address: "Callao 500",              email: "mauri.blanco@hotmail.com",     insuranceName: "Medifé",        planName: "Plan 1", affiliateNum: "02000053" },
    { name: "Brenda",      lastName: "Cardozo",     gender: "female", birthDate: "19/04/1991", dni: "33789013", num: "+54 9 11 7890 1239", address: "Ayacucho 600",            email: "bren.cardozo@gmail.com",       insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Patricio",    lastName: "De la Cruz",  gender: "male",   birthDate: "27/08/1985", dni: "28890124", num: "+54 9 11 8901 2350", address: "Thames 700",              email: "patri.delacruz@gmail.com",     insuranceName: "OSDE",          planName: "210",    affiliateNum: "02000055" },
    { name: "Celeste",     lastName: "Elizondo",    gender: "female", birthDate: "14/12/1977", dni: "23901235", num: "+54 9 11 9012 3461", address: "Gurruchaga 800",          email: "cele.elizondo@gmail.com",      insuranceName: "Galeno",        planName: "Plus",   affiliateNum: "02000056" },
    { name: "Roberto",     lastName: "Fleitas",     gender: "male",   birthDate: "01/05/1993", dni: "35012346", num: "+54 9 11 0123 4572", address: "Honduras 900",            email: "rob.fleitas@gmail.com",        insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000057" },
    { name: "Débora",      lastName: "Godoy",       gender: "female", birthDate: "10/01/1988", dni: "30123457", num: "+54 9 11 1234 5683", address: "El Salvador 1000",        email: "debo.godoy@gmail.com",         insuranceName: "Swiss Medical", planName: "SMG10",  affiliateNum: "02000058" },
    { name: "Sergio",      lastName: "Hidalgo",     gender: "male",   birthDate: "23/06/1982", dni: "27234568", num: "+54 9 11 2345 6794", address: "Soler 1100",              email: "ser.hidalgo@hotmail.com",      insuranceName: "Medifé",        planName: "Plan 2", affiliateNum: "02000059" },
    { name: "Eugenia",     lastName: "Insua",       gender: "female", birthDate: "08/10/1999", dni: "41345679", num: "+54 9 11 3456 7895", address: "Cabrera 1200",            email: "euge.insua@gmail.com",         insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Gonzalo",     lastName: "Jofré",       gender: "male",   birthDate: "15/03/1976", dni: "22456790", num: "+54 9 11 4567 8907", address: "Armenia 1300",            email: "gonza.jofre@gmail.com",        insuranceName: "OSDE",          planName: "310",    affiliateNum: "02000061" },
    { name: "Gladys",      lastName: "Klein",       gender: "female", birthDate: "02/08/1965", dni: "11567891", num: "+54 9 11 5678 9018", address: "Malabia 1400",            email: "gladys.klein@gmail.com",       insuranceName: "Galeno",        planName: "Salud",  affiliateNum: "02000062" },
    { name: "Nicolás",     lastName: "Leguizamón",  gender: "male",   birthDate: "29/11/1990", dni: "31678902", num: "+54 9 11 6789 0129", address: "Serrano 1500",            email: "nico.leguizamon@gmail.com",    insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000063" },
    { name: "Hilda",       lastName: "Montenegro",  gender: "female", birthDate: "17/04/1972", dni: "18789013", num: "+54 9 11 7890 1240", address: "Humboldt 1600",           email: "hildam@hotmail.com",           insuranceName: "Swiss Medical", planName: "SMG30",  affiliateNum: "02000064" },
    { name: "Andrés",      lastName: "Noriega",     gender: "male",   birthDate: "05/09/1998", dni: "40890124", num: "+54 9 11 8901 2351", address: "Bonpland 1700",           email: "andres.noriega@gmail.com",     insuranceName: "Medifé",        planName: "Plan 1", affiliateNum: "02000065" },
    { name: "Jimena",      lastName: "Olivera",     gender: "female", birthDate: "20/01/1984", dni: "27901235", num: "+54 9 11 9012 3462", address: "Fitz Roy 1800",           email: "jime.olivera@gmail.com",       insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Claudio",     lastName: "Palavecino",  gender: "male",   birthDate: "09/07/1980", dni: "25012346", num: "+54 9 11 0123 4573", address: "Uriarte 1900",            email: "clau.palavecino@gmail.com",    insuranceName: "OSDE",          planName: "410",    affiliateNum: "02000067" },
    { name: "Karla",       lastName: "Quirós",      gender: "female", birthDate: "27/02/1995", dni: "37123457", num: "+54 9 11 1234 5684", address: "Costa Rica 200",          email: "karla.quiros@gmail.com",       insuranceName: "Galeno",        planName: "Junior", affiliateNum: "02000068" },
    { name: "Fabián",      lastName: "Ríos",        gender: "male",   birthDate: "14/06/1987", dni: "30234568", num: "+54 9 11 2345 6795", address: "Nicaragua 400",           email: "fabi.rios@hotmail.com",        insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000069" },
    { name: "Liliana",     lastName: "Stornini",    gender: "female", birthDate: "03/10/1970", dni: "16345679", num: "+54 9 11 3456 7896", address: "Lavalle 500",             email: "lili.stornini@gmail.com",      insuranceName: "Swiss Medical", planName: "SMG50",  affiliateNum: "02000070" },
    { name: "Walter",      lastName: "Troncoso",    gender: "male",   birthDate: "21/03/1983", dni: "27456790", num: "+54 9 11 4567 8908", address: "Pueyrredón 600",          email: "wal.troncoso@gmail.com",       insuranceName: "Medifé",        planName: "Plan 2", affiliateNum: "02000071" },
    { name: "Olga",        lastName: "Ubaldi",      gender: "female", birthDate: "06/08/1960", dni: "06567891", num: "+54 9 11 5678 9019", address: "Callao 700",              email: "olga.ubaldi@gmail.com",        insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Marcos",      lastName: "Velázquez",   gender: "male",   birthDate: "18/12/1992", dni: "34678902", num: "+54 9 11 6789 0130", address: "Ayacucho 800",            email: "mar.velazquez@gmail.com",      insuranceName: "OSDE",          planName: "210",    affiliateNum: "02000073" },
    { name: "Paola",       lastName: "Waisman",     gender: "female", birthDate: "11/05/1989", dni: "31789013", num: "+54 9 11 7890 1241", address: "Thames 900",              email: "pao.waisman@gmail.com",        insuranceName: "Galeno",        planName: "Plus",   affiliateNum: "02000074" },
    { name: "Horacio",     lastName: "Xiques",      gender: "male",   birthDate: "28/09/1977", dni: "23890124", num: "+54 9 11 8901 2352", address: "Gurruchaga 1000",         email: "hora.xiques@hotmail.com",      insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000075" },
    { name: "Rosana",      lastName: "Yaber",       gender: "female", birthDate: "15/02/1994", dni: "36901235", num: "+54 9 11 9012 3463", address: "Honduras 1100",           email: "rosa.yaber@gmail.com",         insuranceName: "Swiss Medical", planName: "SMG10",  affiliateNum: "02000076" },
    { name: "Reinaldo",    lastName: "Zabala",      gender: "male",   birthDate: "04/06/1971", dni: "17012346", num: "+54 9 11 0123 4574", address: "El Salvador 1200",        email: "rei.zabala@gmail.com",         insuranceName: "Medifé",        planName: "Plan 1", affiliateNum: "02000077" },
    { name: "Lucía",       lastName: "Ahumada",     gender: "female", birthDate: "22/10/2001", dni: "43123457", num: "+54 9 11 1234 5685", address: "Soler 1300",              email: "lu.ahumada@gmail.com",         insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Esteban",     lastName: "Buffa",       gender: "male",   birthDate: "09/03/1986", dni: "29234570", num: "+54 9 11 2345 6796", address: "Cabrera 1400",            email: "este.buffa@gmail.com",         insuranceName: "OSDE",          planName: "310",    affiliateNum: "02000079" },
    { name: "Soledad",     lastName: "Cornejo",     gender: "female", birthDate: "17/07/1997", dni: "39345680", num: "+54 9 11 3456 7897", address: "Armenia 1500",            email: "sole.cornejo@gmail.com",       insuranceName: "Galeno",        planName: "Salud",  affiliateNum: "02000080" },
    { name: "Cristóbal",   lastName: "Duarte",      gender: "male",   birthDate: "02/12/1979", dni: "25456781", num: "+54 9 11 4567 8909", address: "Malabia 1600",            email: "cris.duarte@hotmail.com",      insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000081" },
    { name: "Romina",      lastName: "Escobedo",    gender: "female", birthDate: "30/04/1991", dni: "33567892", num: "+54 9 11 5678 9020", address: "Serrano 1700",            email: "romi.escobedo@gmail.com",      insuranceName: "Swiss Medical", planName: "SMG30",  affiliateNum: "02000082" },
    { name: "Germán",      lastName: "Falcone",     gender: "male",   birthDate: "19/08/1985", dni: "28678903", num: "+54 9 11 6789 0131", address: "Humboldt 1800",           email: "ger.falcone@gmail.com",        insuranceName: "Medifé",        planName: "Plan 2", affiliateNum: "02000083" },
    { name: "Daniela",     lastName: "Garmendia",   gender: "female", birthDate: "07/01/1982", dni: "26789014", num: "+54 9 11 7890 1242", address: "Bonpland 1900",           email: "dani.garmendia@gmail.com",     insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Maximiliano", lastName: "Huerta",      gender: "male",   birthDate: "24/05/1974", dni: "20890125", num: "+54 9 11 8901 2353", address: "Fitz Roy 2000",           email: "maxi.huerta@gmail.com",        insuranceName: "OSDE",          planName: "410",    affiliateNum: "02000085" },
    { name: "Valeria",     lastName: "Iriarte",     gender: "female", birthDate: "12/09/1998", dni: "40901236", num: "+54 9 11 9012 3464", address: "Uriarte 100",             email: "vale.iriarte@gmail.com",       insuranceName: "Galeno",        planName: "Junior", affiliateNum: "02000086" },
    { name: "Santiago",    lastName: "Jelinek",     gender: "male",   birthDate: "06/02/1990", dni: "31012347", num: "+54 9 11 0123 4575", address: "Costa Rica 300",          email: "santi.jelinek@gmail.com",      insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000087" },
    { name: "Agustina",    lastName: "Kessler",     gender: "female", birthDate: "20/06/1996", dni: "38123458", num: "+54 9 11 1234 5686", address: "Nicaragua 500",           email: "agus.kessler@gmail.com",       insuranceName: "Swiss Medical", planName: "SMG50",  affiliateNum: "02000088" },
    { name: "Rodrigo",     lastName: "Lascano",     gender: "male",   birthDate: "08/11/1981", dni: "26234569", num: "+54 9 11 2345 6797", address: "Lavalle 600",             email: "rodri.lascano@hotmail.com",    insuranceName: "Medifé",        planName: "Plan 1", affiliateNum: "02000089" },
    { name: "Analía",      lastName: "Mansilla",    gender: "female", birthDate: "25/03/1993", dni: "35345680", num: "+54 9 11 3456 7898", address: "Pueyrredón 700",          email: "ana.mansilla@gmail.com",       insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Hernán",      lastName: "Nievas",      gender: "male",   birthDate: "13/07/1978", dni: "24456791", num: "+54 9 11 4567 8910", address: "Callao 800",              email: "her.nievas@gmail.com",         insuranceName: "OSDE",          planName: "210",    affiliateNum: "02000091" },
    { name: "Florencia",   lastName: "Ocampo",      gender: "female", birthDate: "01/11/2000", dni: "42567892", num: "+54 9 11 5678 9021", address: "Ayacucho 900",            email: "flor.ocampo@gmail.com",        insuranceName: "Galeno",        planName: "Plus",   affiliateNum: "02000092" },
    { name: "Leandro",     lastName: "Pereyra",     gender: "male",   birthDate: "18/04/1989", dni: "31678903", num: "+54 9 11 6789 0132", address: "Thames 1000",             email: "lean.pereyra@gmail.com",       insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000093" },
    { name: "Sabrina",     lastName: "Quevedo",     gender: "female", birthDate: "05/08/1984", dni: "28789014", num: "+54 9 11 7890 1243", address: "Gurruchaga 1100",         email: "sabri.quevedo@gmail.com",      insuranceName: "Swiss Medical", planName: "SMG10",  affiliateNum: "02000094" },
    { name: "Facundo",     lastName: "Reynoso",     gender: "male",   birthDate: "22/12/1995", dni: "37890125", num: "+54 9 11 8901 2354", address: "Honduras 1200",           email: "facu.reynoso@gmail.com",       insuranceName: "Medifé",        planName: "Plan 2", affiliateNum: "02000095" },
    { name: "Marianela",   lastName: "Soria",       gender: "female", birthDate: "10/06/1987", dni: "30901236", num: "+54 9 11 9012 3465", address: "El Salvador 1300",        email: "marie.soria@gmail.com",        insuranceName: "Particular",    planName: "",       affiliateNum: "" },
    { name: "Gustavo",     lastName: "Tapia",       gender: "male",   birthDate: "03/02/1973", dni: "19012347", num: "+54 9 11 0123 4576", address: "Soler 1400",              email: "gus.tapia@gmail.com",          insuranceName: "OSDE",          planName: "310",    affiliateNum: "02000097" },
    { name: "Belén",       lastName: "Urrutia",     gender: "female", birthDate: "28/07/1999", dni: "41123458", num: "+54 9 11 1234 5687", address: "Cabrera 1500",            email: "belen.urrutia@gmail.com",      insuranceName: "Galeno",        planName: "Salud",  affiliateNum: "02000098" },
    { name: "Ariel",       lastName: "Vidal",       gender: "male",   birthDate: "16/11/1983", dni: "27234569", num: "+54 9 11 2345 6798", address: "Armenia 1600",            email: "ariel.vidal@hotmail.com",      insuranceName: "IOMA",          planName: "Básico", affiliateNum: "02000099" },
    { name: "Camila",      lastName: "Wilkinson",   gender: "female", birthDate: "09/04/2002", dni: "44345680", num: "+54 9 11 3456 7899", address: "Malabia 1700",            email: "cami.wilkinson@gmail.com",     insuranceName: "Swiss Medical", planName: "SMG30",  affiliateNum: "02000100" },
];

// ---------------------------------------------------------------------------
// FUNCIÓN DE SEED — resuelve IDs desde Firebase y crea los pacientes
// ---------------------------------------------------------------------------

export async function runSeedPatients(patients = SEED_PATIENTS): Promise<{ ok: number; failed: string[] }> {
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

    for (const p of patients) {
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
