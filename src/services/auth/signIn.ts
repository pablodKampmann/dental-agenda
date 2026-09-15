import { db, auth } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";

export type SignInResult =
    | "all-good"
    | "wrong-password"
    | "wrong-userName"
    | "network-error"
    | "permission-denied"
    | "unexpected-error";

/**
 * Cuánto se espera la lectura de `admins/` antes de darla por caída.
 *
 * No es una precaución de más: `get()` de Realtime Database **no rechaza cuando no
 * hay conexión**. `PersistentConnection.get()` encola el pedido en
 * `outstandingGets_` y solo lo manda `if (this.connected_)`; al reconectar lo
 * reenvía desde `onReady_`, y nada lo rechaza mientras tanto. Sin este timeout, un
 * cliente con wifi pero sin internet —donde `navigator.onLine` da `true`— deja la
 * promesa colgada para siempre: `signIn` nunca vuelve, el `finally` de la pantalla
 * nunca corre y el botón de login queda girando.
 *
 * Verificado en @firebase/database 1.0.8, `dist/index.esm2017.js`:
 * `get(query)` ~L3273, `onReady_` ~L3953.
 */
const TIMEOUT_LECTURA_MS = 10000;

/** Centinela: distingue "la lectura no contestó" de cualquier valor que pueda devolver. */
const SIN_RESPUESTA = Symbol("sin-respuesta");

async function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T | typeof SIN_RESPUESTA> {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promesa,
            new Promise<typeof SIN_RESPUESTA>((resolve) => {
                temporizador = setTimeout(() => resolve(SIN_RESPUESTA), ms);
            }),
        ]);
    } finally {
        // Sin esto, cada login exitoso deja un timer de 10s colgado: `Promise.race`
        // resuelve pero el `setTimeout` perdedor sigue vivo y mantiene ocupado el
        // event loop (en los tests, hasta el final de la corrida).
        if (temporizador !== undefined) clearTimeout(temporizador);
    }
}

/**
 * `repoGetValue` rechaza con `new Error(err)`, donde `err` es el payload crudo del
 * servidor — o sea que **tira el `.code`**. Para un rechazo por reglas eso deja un
 * `Error` cuyo `message` es "Permission denied" y nada más: en este camino no hay
 * código que mirar.
 *
 * Verificado en @firebase/database 1.0.8, `dist/index.esm2017.js`:
 * `repoGetValue` ~L11019 (el `new Error(err)`), `PersistentConnection.get` ~L3273
 * (el `deferred.reject(payload)`).
 *
 * Por eso esto matchea contra el texto. El chequeo de `.code` queda además por si el
 * error llega por `errorForServerCode` —que sí lo setea en mayúsculas— por otra ruta
 * o en otra versión del SDK. NO simplificar a `error.code === 'PERMISSION_DENIED'`
 * sin volver a leer el SDK primero: hoy ese código no existe acá.
 */
function esPermissionDenied(error: unknown): boolean {
    const e = error as { code?: unknown; message?: unknown } | null;
    if (typeof e?.code === "string" && e.code.toUpperCase() === "PERMISSION_DENIED") {
        return true;
    }
    return typeof e?.message === "string" && /permission[_ ]denied/i.test(e.message);
}

export async function signIn(user: string, password: string): Promise<SignInResult> {
    if (!navigator.onLine) {
        return "network-error";
    }

    try {
        const dbRef = ref(db, 'admins/');
        const snapshot = await conTimeout(get(dbRef), TIMEOUT_LECTURA_MS);

        if (snapshot === SIN_RESPUESTA) {
            console.error(`signIn: la lectura de admins/ no respondió en ${TIMEOUT_LECTURA_MS}ms`);
            return "network-error";
        }

        const admins = snapshot.val();

        if (!admins) {
            return "unexpected-error";
        }

        let email = "";
        Object.keys(admins).forEach((key) => {
            if (user === admins[key].userName) {
                email = admins[key].email;
            }
        });

        if (email === "") {
            return "wrong-userName";
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            return "all-good";
        } catch (error) {
            const code = (error as any).code;
            if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                return 'wrong-password';
            }
            if (code === 'auth/network-request-failed') {
                return 'network-error';
            }
            console.error('signIn: error inesperado de Firebase Auth', error);
            return "unexpected-error";
        }
    } catch (error) {
        if (esPermissionDenied(error)) {
            console.error('signIn: las reglas rechazaron la lectura de admins/', error);
            return "permission-denied";
        }
        console.error('signIn: error inesperado al leer admins/', error);
        return "unexpected-error";
    }
}
