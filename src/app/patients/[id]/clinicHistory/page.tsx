'use client'

import { getPatient } from "@/services/patients/getPatient";
import { getUser } from "@/services/auth/getUser";
import React, { useState, useEffect, useRef } from 'react';
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import dayjs from 'dayjs';
import { PatientRecord } from "@/components/patients/ui/patientRecord";
import { PatientRecordSkeleton } from "@/components/patients/ui/patientRecordSkeleton";
import { OdontogramaGrid } from "@/components/patients/ui/odontogram/OdontogramaGrid";
import { Legend } from "@/components/patients/ui/odontogram/Legend";
import { HallazgoPicker, type PickerContexto } from "@/components/patients/ui/odontogram/HallazgoPicker";
import { HistorialTimeline } from "@/components/patients/ui/odontogram/HistorialTimeline";
import { getOdontograma } from "@/services/odontograma/getOdontograma";
import { setHallazgoCara, setHallazgoDiente, ejecutarHallazgoCaraRequerida, ejecutarHallazgoDienteRequerido } from "@/services/odontograma/setHallazgo";
import { removeHallazgo } from "@/services/odontograma/removeHallazgo";
import { setVinculo, validarTramo } from "@/services/odontograma/setVinculo";
import { removeVinculo } from "@/services/odontograma/removeVinculo";
import { getEventos } from "@/services/odontograma/getEventos";
import { eventoAEntrada, type EntradaHistorial } from "@/lib/odontograma/historial";
import { addNotaHistorial, getNotasHistorial, updateNotaHistorial, deleteNotaHistorial, type NotaHistorial } from "@/services/patients/clinicHistoryNotes";
import { caraSemantica } from "@/lib/odontograma/caras";
import type { ClavePieza, Pieza } from "@/lib/odontograma/piezas";
import type { Capa, Cara, CodigoHallazgo, CodigoHallazgoCara, CodigoHallazgoDiente, CodigoHallazgoMulti, DientesPorClave, FacePosition, PiezasSet, Vinculo } from "@/lib/odontograma/tipos";
import { AMBAS_CAPAS, type VisibilidadCapas, type VistaArcada } from "@/lib/odontograma/selectores";
import { useToast } from "@/context/ToastContext";
import { FaLayerGroup } from "react-icons/fa6";
import { TbBabyCarriage, TbDental } from "react-icons/tb";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Dentición mixta aprox. entre los 6 y los 12 años, hasta que erupciona la permanente completa. */
function vistaSugeridaPorEdad(birthDate: string | undefined): VistaArcada {
    if (!birthDate) return 'PERMANENTE';
    const [d, m, y] = birthDate.split('/');
    const nacimiento = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mDiff = hoy.getMonth() - nacimiento.getMonth();
    if (mDiff < 0 || (mDiff === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad >= 6 && edad < 13 ? 'MIXTA' : 'PERMANENTE';
}

/**
 * `null` es fallo técnico (offline, error de Firebase) — nunca se reporta como "sin
 * conexión" porque el service no distingue la causa (ver signIn.ts:37, el bug que no
 * hay que repetir acá). `{ ok: false }` es un rechazo de negocio con mensaje mostrable.
 */
function mensajeFallo(resultado: { ok: false; error: string } | null, verbo: string): string {
    return resultado === null ? `No se pudo ${verbo}, intentá de nuevo.` : resultado.error;
}

/** Una nota libre de la HC, en la misma forma que el timeline espera. */
function notaAEntrada(n: NotaHistorial): EntradaHistorial {
    return { id: n.id, fecha: dayjs(n.ts).format('DD/MM/YYYY'), hora: dayjs(n.ts).format('HH:mm'), texto: n.texto };
}

export default function ClinicHistory() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const pathname = usePathname()
    const id = pathname.split('/').slice(-2, -1)[0] || null;
    const [patient, setPatient] = useState<any>(null);
    const [clinicId, setClinicId] = useState<string | null>(null);
    useDocumentTitle(patient?.name ? `${patient.name} ${patient.lastName} — Historia Clínica` : "Historia Clínica");

    const [dientes, setDientes] = useState<DientesPorClave>({});
    const [vinculos, setVinculos] = useState<Record<string, Vinculo>>({});
    const [visibilidad, setVisibilidad] = useState<VisibilidadCapas>(AMBAS_CAPAS);
    const [entradas, setEntradas] = useState<EntradaHistorial[]>([]);
    const [vistaOverride, setVistaOverride] = useState<VistaArcada | null>(null);

    const [enModoTramo, setEnModoTramo] = useState(false);
    const [piezasEnTramo, setPiezasEnTramo] = useState<Map<string, Pieza>>(new Map());

    const [pickerContexto, setPickerContexto] = useState<PickerContexto | null>(null);
    /** El contexto del que se vino al entrar por "Hallazgos de pieza completa", para poder volver. */
    const [pickerAnterior, setPickerAnterior] = useState<PickerContexto | null>(null);

    const { showToast } = useToast();
    /** tempIds `local-...` que el usuario borró mientras su alta seguía en vuelo — ver handleQuitarVinculo. */
    const bajasVinculoPendientesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/notSign");
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        async function fetchClinicId() {
            const cid = await getUser(true);
            setClinicId(cid as string);
        }
        fetchClinicId();
    }, []);

    useEffect(() => {
        if (!clinicId) return;
        async function get() {
            try {
                const data = await getPatient(id, clinicId as string);
                setPatient(data);
                setIsLoad(false);
            } catch (error) {
                console.error(error);
            }
        }

        get();
    }, [id, clinicId]);

    useEffect(() => {
        if (!patient?.id || !clinicId) return;
        getOdontograma(patient.id, clinicId).then((data) => {
            if (data) {
                setDientes(data.dientes);
                setVinculos(data.vinculos);
            }
        });
    }, [patient?.id, clinicId]);

    /**
     * La Historia Clínica sale de dos fuentes reales: `eventos/` (el log del
     * odontograma, append-only) y `clinicHistory/notas/` (texto libre, editable). Se
     * traen en paralelo y se mergean por `ts` — cada una ya llega ordenada por su cuenta
     * (`getEventos` más reciente primero, `getNotasHistorial` por key ascendente), así
     * que ordenar de nuevo acá es más simple que intentar arrastrar el orden de origen.
     */
    useEffect(() => {
        if (!patient?.id || !clinicId) return;
        const pacienteId = patient.id;
        Promise.all([getEventos(pacienteId, clinicId, 200), getNotasHistorial(clinicId, pacienteId)]).then(
            ([eventos, notas]) => {
                if (eventos === null || notas === null) {
                    showToast('error', 'No se pudo cargar la Historia Clínica, recargá la página.');
                    return;
                }
                const conTs = [
                    ...eventos.flatMap((e) => {
                        const entrada = eventoAEntrada(e.id, e);
                        return entrada ? [{ ts: e.ts, entrada }] : [];
                    }),
                    ...notas.map((n) => ({ ts: n.ts, entrada: notaAEntrada(n) })),
                ];
                conTs.sort((a, b) => b.ts - a.ts);
                setEntradas(conTs.map((c) => c.entrada));
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patient?.id, clinicId]);

    function toggleVisibilidad(capa: Capa) {
        setVisibilidad((prev) => ({ ...prev, [capa]: !prev[capa] }));
    }

    function toggleEnTramo(pieza: Pieza) {
        setPiezasEnTramo((prev) => {
            const next = new Map(prev);
            if (next.has(pieza.clave)) next.delete(pieza.clave);
            else next.set(pieza.clave, pieza);
            return next;
        });
    }

    function cancelarModoTramo() {
        setEnModoTramo(false);
        setPiezasEnTramo(new Map());
    }

    /** Escape cancela el modo de selección de tramo — no se activa por accidente ni queda sin salida. */
    useEffect(() => {
        if (!enModoTramo) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') cancelarModoTramo();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [enModoTramo]);

    /**
     * Escribe (o borra, con `valor: null`) una hoja `caras/{cara}/{capa}` en el estado
     * local. Reusada tanto para aplicar el update optimista como para revertirlo —
     * revertir es solo volver a llamar con el valor que había antes (`de`).
     */
    function aplicarCaraLocal(clave: ClavePieza, cara: Cara, capa: Capa, valor: CodigoHallazgoCara | null) {
        setDientes((prev) => {
            const estado = prev[clave] ?? {};
            const carasPrevias = { ...estado.caras?.[cara] };
            if (valor === null) delete carasPrevias[capa];
            else carasPrevias[capa] = valor;
            return { ...prev, [clave]: { ...estado, caras: { ...estado.caras, [cara]: carasPrevias } } };
        });
    }

    /** Misma idea que `aplicarCaraLocal`, para la hoja `diente/{capa}`. */
    function aplicarDienteLocal(clave: ClavePieza, capa: Capa, valor: CodigoHallazgoDiente | null) {
        setDientes((prev) => {
            const estado = prev[clave] ?? {};
            const dientePrevio = { ...estado.diente };
            if (valor === null) delete dientePrevio[capa];
            else dientePrevio[capa] = valor;
            return { ...prev, [clave]: { ...estado, diente: dientePrevio } };
        });
    }

    function hallazgoActualDe(contexto: PickerContexto): Partial<Record<Capa, CodigoHallazgo>> {
        if (contexto.alcance === 'MULTI') return {};
        const estado = dientes[contexto.pieza.clave];
        if (!estado) return {};
        if (contexto.alcance === 'DIENTE') return estado.diente ?? {};
        const cara = caraSemantica(contexto.posicion, contexto.pieza.cuadrante);
        return estado.caras?.[cara] ?? {};
    }

    /**
     * Revierte la inserción optimista de una entrada del timeline cuando la escritura
     * a Firebase falla — mismo criterio que revertir `dientes`/`vinculos`: se mostró al
     * toque, se saca si no se pudo confirmar.
     */
    function quitarEntradaOptimista(tempId: string) {
        setEntradas((prev) => prev.filter((e) => e.id !== tempId));
    }

    async function handleGuardarHallazgo(codigo: CodigoHallazgo, capa: Capa, nota: string) {
        if (!pickerContexto || !clinicId || !patient?.id) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const pacienteId = patient.id;
        const notaLimpia = nota.trim() || undefined;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            const codigoCara = codigo as CodigoHallazgoCara;
            const de = dientes[pieza.clave]?.caras?.[cara]?.[capa] ?? null;
            const tempId = `local-${Date.now()}`;

            aplicarCaraLocal(pieza.clave, cara, capa, codigoCara);
            const entrada = eventoAEntrada(tempId, { ts: Date.now(), uid, alcance: 'CARA', capa, diente: pieza.clave, cara, piezas: null, de, a: codigoCara, ...(notaLimpia ? { nota: notaLimpia } : {}) });
            if (entrada) setEntradas((prev) => [entrada, ...prev]);
            setPickerContexto(null);
            setPickerAnterior(null);

            const resultado = await setHallazgoCara({ clinicId, pacienteId, pieza: pieza.clave, cara, capa, codigo: codigoCara, de, uid, nota: notaLimpia });
            if (resultado === null || !resultado.ok) {
                aplicarCaraLocal(pieza.clave, cara, capa, de);
                quitarEntradaOptimista(tempId);
                showToast('error', mensajeFallo(resultado, 'guardar'));
            } else {
                showToast('success', entrada?.hallazgo?.nombreHallazgo ?? 'Hallazgo guardado.');
            }
        } else if (pickerContexto.alcance === 'DIENTE') {
            const { pieza } = pickerContexto;
            const codigoDiente = codigo as CodigoHallazgoDiente;
            const de = dientes[pieza.clave]?.diente?.[capa] ?? null;
            const tempId = `local-${Date.now()}`;

            aplicarDienteLocal(pieza.clave, capa, codigoDiente);
            const entrada = eventoAEntrada(tempId, { ts: Date.now(), uid, alcance: 'DIENTE', capa, diente: pieza.clave, cara: null, piezas: null, de, a: codigoDiente, ...(notaLimpia ? { nota: notaLimpia } : {}) });
            if (entrada) setEntradas((prev) => [entrada, ...prev]);
            setPickerContexto(null);
            setPickerAnterior(null);

            const resultado = await setHallazgoDiente({ clinicId, pacienteId, pieza: pieza.clave, capa, codigo: codigoDiente, de, uid, nota: notaLimpia });
            if (resultado === null || !resultado.ok) {
                aplicarDienteLocal(pieza.clave, capa, de);
                quitarEntradaOptimista(tempId);
                showToast('error', mensajeFallo(resultado, 'guardar'));
            } else {
                showToast('success', entrada?.hallazgo?.nombreHallazgo ?? 'Hallazgo guardado.');
            }
        } else {
            const piezas = pickerContexto.piezas;
            const piezasSet: PiezasSet = {};
            piezas.forEach((p) => { piezasSet[p.clave] = true; });
            const tipo = codigo as CodigoHallazgoMulti;
            const tempId = `local-${Date.now()}`;

            setVinculos((prev) => ({ ...prev, [tempId]: { tipo, capa, piezas: piezasSet } }));
            const entrada = eventoAEntrada(tempId, { ts: Date.now(), uid, alcance: 'MULTI', capa, diente: null, cara: null, piezas: piezasSet, de: null, a: tipo, ...(notaLimpia ? { nota: notaLimpia } : {}) });
            if (entrada) setEntradas((prev) => [entrada, ...prev]);
            setPiezasEnTramo(new Map());
            setEnModoTramo(false);
            setPickerContexto(null);
            setPickerAnterior(null);

            const resultado = await setVinculo({ clinicId, pacienteId, tipo, capa, piezas: piezas.map((p) => p.clave), uid, nota: notaLimpia });
            if (resultado === null || !resultado.ok) {
                setVinculos((prev) => {
                    const { [tempId]: _quitado, ...resto } = prev;
                    return resto;
                });
                quitarEntradaOptimista(tempId);
                showToast('error', mensajeFallo(resultado, 'guardar'));
            } else {
                showToast('success', entrada?.hallazgo?.nombreHallazgo ?? 'Vínculo guardado.');
                const bajaPendiente = bajasVinculoPendientesRef.current.delete(tempId);
                setVinculos((prev) => {
                    // Si ya se borró en el intervalo (click rápido en el span antes del ack), no resucitarlo.
                    if (!(tempId in prev)) return prev;
                    const { [tempId]: vinculo, ...resto } = prev;
                    return { ...resto, [resultado.vinculoId]: vinculo };
                });
                if (bajaPendiente) {
                    // El borrado pedido mientras el alta seguía en vuelo no tuvo id real para limpiar en Firebase — ahora sí.
                    const resultadoBaja = await removeVinculo({ clinicId, pacienteId, vinculoId: resultado.vinculoId, tipo, capa, piezas: piezasSet, uid });
                    if (resultadoBaja === null || !resultadoBaja.ok) {
                        showToast('error', mensajeFallo(resultadoBaja, 'borrar'));
                    }
                }
            }
        }
    }

    /**
     * Cierra un plan cargado en `requerida`: lo borra ahí y escribe `codigo` (el
     * resultado, puede diferir de lo planeado) en `existente` — un solo `update()`
     * atómico del lado del service, acá se reflejan las dos hojas en local antes de
     * confirmar contra Firebase, mismo patrón optimista que `handleGuardarHallazgo`.
     * Solo se agrega **una** entrada al timeline (la mitad `existente`) — `eventoAEntrada`
     * descarta la mitad `requerida` a propósito, ver su comentario.
     */
    async function handleEjecutarHallazgo(codigo: CodigoHallazgo, nota: string) {
        if (!pickerContexto || pickerContexto.alcance === 'MULTI' || !clinicId || !patient?.id) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const pacienteId = patient.id;
        const notaLimpia = nota.trim() || undefined;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            const hallazgoRequerido = dientes[pieza.clave]?.caras?.[cara]?.requerida;
            if (!hallazgoRequerido) return;
            const codigoResultante = codigo as CodigoHallazgoCara;
            const existenteAnterior = dientes[pieza.clave]?.caras?.[cara]?.existente ?? null;
            const tempId = `local-${Date.now()}`;

            aplicarCaraLocal(pieza.clave, cara, 'requerida', null);
            aplicarCaraLocal(pieza.clave, cara, 'existente', codigoResultante);
            const entrada = eventoAEntrada(tempId, { ts: Date.now(), uid, alcance: 'CARA', capa: 'existente', diente: pieza.clave, cara, piezas: null, de: existenteAnterior, a: codigoResultante, origen: 'plan_realizado', ...(notaLimpia ? { nota: notaLimpia } : {}) });
            if (entrada) setEntradas((prev) => [entrada, ...prev]);
            setPickerContexto(null);
            setPickerAnterior(null);

            const resultado = await ejecutarHallazgoCaraRequerida({ clinicId, pacienteId, pieza: pieza.clave, cara, hallazgoRequerido, hallazgoResultante: codigoResultante, existenteAnterior, uid, nota: notaLimpia });
            if (resultado === null || !resultado.ok) {
                aplicarCaraLocal(pieza.clave, cara, 'requerida', hallazgoRequerido);
                aplicarCaraLocal(pieza.clave, cara, 'existente', existenteAnterior);
                quitarEntradaOptimista(tempId);
                showToast('error', mensajeFallo(resultado, 'guardar'));
            } else {
                showToast('success', entrada?.hallazgo?.nombreHallazgo ?? 'Plan realizado.');
            }
        } else {
            const { pieza } = pickerContexto;
            const hallazgoRequerido = dientes[pieza.clave]?.diente?.requerida;
            if (!hallazgoRequerido) return;
            const codigoResultante = codigo as CodigoHallazgoDiente;
            const existenteAnterior = dientes[pieza.clave]?.diente?.existente ?? null;
            const tempId = `local-${Date.now()}`;

            aplicarDienteLocal(pieza.clave, 'requerida', null);
            aplicarDienteLocal(pieza.clave, 'existente', codigoResultante);
            const entrada = eventoAEntrada(tempId, { ts: Date.now(), uid, alcance: 'DIENTE', capa: 'existente', diente: pieza.clave, cara: null, piezas: null, de: existenteAnterior, a: codigoResultante, origen: 'plan_realizado', ...(notaLimpia ? { nota: notaLimpia } : {}) });
            if (entrada) setEntradas((prev) => [entrada, ...prev]);
            setPickerContexto(null);
            setPickerAnterior(null);

            const resultado = await ejecutarHallazgoDienteRequerido({ clinicId, pacienteId, pieza: pieza.clave, hallazgoRequerido, hallazgoResultante: codigoResultante, existenteAnterior, uid, nota: notaLimpia });
            if (resultado === null || !resultado.ok) {
                aplicarDienteLocal(pieza.clave, 'requerida', hallazgoRequerido);
                aplicarDienteLocal(pieza.clave, 'existente', existenteAnterior);
                quitarEntradaOptimista(tempId);
                showToast('error', mensajeFallo(resultado, 'guardar'));
            } else {
                showToast('success', entrada?.hallazgo?.nombreHallazgo ?? 'Plan realizado.');
            }
        }
    }

    async function handleQuitarHallazgo(capa: Capa) {
        if (!pickerContexto || pickerContexto.alcance === 'MULTI' || !clinicId || !patient?.id) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const pacienteId = patient.id;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            const de = dientes[pieza.clave]?.caras?.[cara]?.[capa];
            if (!de) return;
            const tempId = `local-${Date.now()}`;

            aplicarCaraLocal(pieza.clave, cara, capa, null);
            const entrada = eventoAEntrada(tempId, { ts: Date.now(), uid, alcance: 'CARA', capa, diente: pieza.clave, cara, piezas: null, de, a: null });
            if (entrada) setEntradas((prev) => [entrada, ...prev]);
            setPickerContexto(null);
            setPickerAnterior(null);

            const resultado = await removeHallazgo({ alcance: 'CARA', clinicId, pacienteId, pieza: pieza.clave, cara, capa, de, uid });
            if (resultado === null || !resultado.ok) {
                aplicarCaraLocal(pieza.clave, cara, capa, de);
                quitarEntradaOptimista(tempId);
                showToast('error', mensajeFallo(resultado, 'borrar'));
            } else {
                showToast('success', entrada?.hallazgo?.nombreHallazgo ?? 'Hallazgo quitado.');
            }
        } else {
            const { pieza } = pickerContexto;
            const de = dientes[pieza.clave]?.diente?.[capa];
            if (!de) return;
            const tempId = `local-${Date.now()}`;

            aplicarDienteLocal(pieza.clave, capa, null);
            const entrada = eventoAEntrada(tempId, { ts: Date.now(), uid, alcance: 'DIENTE', capa, diente: pieza.clave, cara: null, piezas: null, de, a: null });
            if (entrada) setEntradas((prev) => [entrada, ...prev]);
            setPickerContexto(null);
            setPickerAnterior(null);

            const resultado = await removeHallazgo({ alcance: 'DIENTE', clinicId, pacienteId, pieza: pieza.clave, capa, de, uid });
            if (resultado === null || !resultado.ok) {
                aplicarDienteLocal(pieza.clave, capa, de);
                quitarEntradaOptimista(tempId);
                showToast('error', mensajeFallo(resultado, 'borrar'));
            } else {
                showToast('success', entrada?.hallazgo?.nombreHallazgo ?? 'Hallazgo quitado.');
            }
        }
    }

    /**
     * Sin diálogo de confirmación — mismo criterio que "Quitar hallazgo". Si el vínculo
     * todavía tiene su id temporal (`local-...`, el alta original sigue en vuelo) no hay
     * nada persistido para borrar todavía acá — se anota en `bajasVinculoPendientesRef` y
     * el handler de éxito de `setVinculo` en `handleGuardarHallazgo` es quien, al resolver
     * el id real, lo borra de Firebase (si no, quedaría huérfano en `actual/vinculos/`).
     */
    function handleQuitarVinculo(vinculoId: string) {
        const vinculo = vinculos[vinculoId];
        if (!vinculo) return;
        const uid = auth.currentUser?.uid;

        setVinculos((prev) => {
            const { [vinculoId]: _quitado, ...resto } = prev;
            return resto;
        });
        const tempId = `local-${Date.now()}`;
        const entrada = uid
            ? eventoAEntrada(tempId, { ts: Date.now(), uid, alcance: 'MULTI', capa: vinculo.capa, diente: null, cara: null, piezas: vinculo.piezas, de: vinculo.tipo, a: null })
            : null;
        if (entrada) setEntradas((prev) => [entrada, ...prev]);

        if (vinculoId.startsWith('local-')) {
            bajasVinculoPendientesRef.current.add(vinculoId);
            return;
        }
        if (!clinicId || !patient?.id || !uid) return;
        const pacienteId = patient.id;

        removeVinculo({ clinicId, pacienteId, vinculoId, tipo: vinculo.tipo, capa: vinculo.capa, piezas: vinculo.piezas, uid }).then((resultado) => {
            if (resultado === null || !resultado.ok) {
                setVinculos((prev) => ({ ...prev, [vinculoId]: vinculo }));
                quitarEntradaOptimista(tempId);
                showToast('error', mensajeFallo(resultado, 'borrar'));
            } else {
                showToast('success', entrada?.hallazgo?.nombreHallazgo ?? 'Vínculo quitado.');
            }
        });
    }

    async function handleAgregarNota(texto: string) {
        if (!clinicId || !patient?.id) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const resultado = await addNotaHistorial({ clinicId, pacienteId: patient.id, texto, uid });
        if (resultado === null || !resultado.ok) {
            showToast('error', mensajeFallo(resultado, 'guardar'));
            return;
        }
        setEntradas((prev) => [{ id: resultado.notaId, fecha: dayjs().format('DD/MM/YYYY'), hora: dayjs().format('HH:mm'), texto }, ...prev]);
        showToast('success', 'Nota agregada a la Historia Clínica.');
    }

    async function handleEditarNota(id: string, texto: string) {
        if (!clinicId || !patient?.id) return;
        const anterior = entradas.find((e) => e.id === id)?.texto;

        setEntradas((prev) => prev.map((e) => (e.id === id ? { ...e, texto } : e)));
        const resultado = await updateNotaHistorial({ clinicId, pacienteId: patient.id, notaId: id, texto });
        if (resultado === null || !resultado.ok) {
            setEntradas((prev) => prev.map((e) => (e.id === id ? { ...e, texto: anterior ?? e.texto } : e)));
            showToast('error', mensajeFallo(resultado, 'guardar'));
        } else {
            showToast('success', 'Nota actualizada.');
        }
    }

    async function handleEliminarNota(id: string) {
        if (!clinicId || !patient?.id) return;
        const anterior = entradas.find((e) => e.id === id) ?? null;
        const indice = entradas.findIndex((e) => e.id === id);

        setEntradas((prev) => prev.filter((e) => e.id !== id));
        const resultado = await deleteNotaHistorial({ clinicId, pacienteId: patient.id, notaId: id });
        if (resultado === null || !resultado.ok) {
            if (anterior) setEntradas((prev) => [...prev.slice(0, indice), anterior, ...prev.slice(indice)]);
            showToast('error', mensajeFallo(resultado, 'borrar'));
        } else {
            showToast('success', 'Nota eliminada.');
        }
    }

    if (id !== null) {
        const vistaSugerida = vistaSugeridaPorEdad(patient?.birthDate);
        const vista = vistaOverride ?? vistaSugerida;

        /**
         * Valida en pantalla lo mismo que B2-4 valida en el servicio (al menos dos
         * piezas, contiguas, misma arcada) — la autoridad sigue siendo el service,
         * esto es solo para no dejar confirmar algo que va a rebotar.
         */
        const clavesEnTramo = Array.from(piezasEnTramo.keys()) as ClavePieza[];
        const validacionTramo = clavesEnTramo.length >= 2 ? validarTramo(clavesEnTramo) : null;

        return (
            <div className="h-[calc(100vh-56px)] overflow-y-auto">
                <div className='px-4 pb-4 pt-4 relative'>
                {isLoad ? (
                    <PatientRecordSkeleton />
                ) : (
                    <div className="animate-page-drop">
                        <PatientRecord patient={patient} />

                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden select-none">
                            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200 gap-2">
                                <h2 className="text-base font-bold tracking-wide text-black flex items-center gap-2">
                                    <TbDental className="text-teal-600" size={18} /> Odontograma
                                </h2>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setVistaOverride(vista === 'MIXTA' ? 'PERMANENTE' : 'MIXTA')}
                                        title={vistaOverride === null ? `Sugerido por edad: ${vistaSugerida === 'MIXTA' ? 'dentición mixta' : 'dentición permanente'}` : 'Vista elegida manualmente'}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-white border border-gray-200 shadow-sm text-gray-700 hover:border-teal-600 hover:text-teal-700 transition"
                                    >
                                        {vista === 'MIXTA' ? <TbBabyCarriage size={14} /> : <TbDental size={14} />}
                                        {vista === 'MIXTA' ? 'Dentición mixta' : 'Dentición permanente'}
                                    </button>
                                    <button
                                        onClick={() => { if (enModoTramo) cancelarModoTramo(); else setEnModoTramo(true); }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border shadow-sm transition ${
                                            enModoTramo
                                                ? 'bg-teal-700 border-teal-700 text-white'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-teal-600 hover:text-teal-700'
                                        }`}
                                    >
                                        <FaLayerGroup size={12} /> Prótesis (varias piezas)
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 p-3">
                                <div className="flex-1 min-w-0 min-h-[420px] flex items-center justify-center p-8">
                                    <OdontogramaGrid
                                        dientes={dientes}
                                        visibilidad={visibilidad}
                                        vista={vista}
                                        vinculos={vinculos}
                                        piezasEnTramo={new Set(piezasEnTramo.keys())}
                                        enModoTramo={enModoTramo}
                                        piezaActiva={pickerContexto && pickerContexto.alcance !== 'MULTI' ? pickerContexto.pieza.clave : undefined}
                                        onSelectCara={(pieza, posicion, anchor) => { setPickerAnterior(null); setPickerContexto({ alcance: 'CARA', pieza, posicion, anchor }) }}
                                        onSelectDiente={(pieza, anchor) => { setPickerAnterior(null); setPickerContexto({ alcance: 'DIENTE', pieza, anchor }) }}
                                        onToggleEnTramo={toggleEnTramo}
                                        onQuitarVinculo={handleQuitarVinculo}
                                    />
                                </div>
                                <div className="w-full md:w-[15%] shrink-0">
                                    <Legend visibilidad={visibilidad} onToggle={toggleVisibilidad} />
                                </div>
                            </div>

                            {enModoTramo && (
                                <div className="flex items-center justify-between bg-teal-50 border-t border-teal-100 px-4 py-2.5">
                                    <span className={`text-xs font-medium ${validacionTramo && !validacionTramo.ok ? 'text-amber-700' : 'text-teal-700'}`}>
                                        {piezasEnTramo.size === 0
                                            ? 'Seleccioná dos o más piezas contiguas'
                                            : validacionTramo && !validacionTramo.ok
                                            ? validacionTramo.error
                                            : `${piezasEnTramo.size} piezas seleccionadas`}
                                    </span>
                                    <button
                                        disabled={piezasEnTramo.size < 2 || (validacionTramo !== null && !validacionTramo.ok)}
                                        onClick={(e) => {
                                            setPickerAnterior(null)
                                            setPickerContexto({
                                                alcance: 'MULTI',
                                                piezas: Array.from(piezasEnTramo.values()),
                                                anchor: e.currentTarget.getBoundingClientRect(),
                                            })
                                        }}
                                        className="bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-teal-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Aplicar prótesis
                                    </button>
                                </div>
                            )}
                        </div>

                        <HistorialTimeline
                            entradas={entradas}
                            onAgregarNota={handleAgregarNota}
                            onEditarTexto={handleEditarNota}
                            onEliminar={handleEliminarNota}
                        />

                        <HallazgoPicker
                            contexto={pickerContexto}
                            hallazgoActual={pickerContexto ? hallazgoActualDe(pickerContexto) : {}}
                            onGuardar={handleGuardarHallazgo}
                            onQuitar={handleQuitarHallazgo}
                            onEjecutar={handleEjecutarHallazgo}
                            onClose={() => { setPickerContexto(null); setPickerAnterior(null) }}
                            onVerPiezaCompleta={(pieza, anchor) => {
                                setPickerAnterior(pickerContexto)
                                setPickerContexto({ alcance: 'DIENTE', pieza, anchor })
                            }}
                            onVolver={pickerAnterior ? () => { setPickerContexto(pickerAnterior); setPickerAnterior(null) } : undefined}
                        />
                    </div>
                )}
                </div>
            </div>
        );
    }
}
