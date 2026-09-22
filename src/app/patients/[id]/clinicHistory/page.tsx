'use client'

import { getPatient } from "@/services/patients/getPatient";
import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation'
import dayjs from 'dayjs';
import { PatientRecord } from "@/components/patients/ui/patientRecord";
import { PatientRecordSkeleton } from "@/components/patients/ui/patientRecordSkeleton";
import { OdontogramaGrid } from "@/components/patients/ui/odontogram/OdontogramaGrid";
import { Legend } from "@/components/patients/ui/odontogram/Legend";
import { HallazgoPicker, type PickerContexto } from "@/components/patients/ui/odontogram/HallazgoPicker";
import { HistorialTimeline } from "@/components/patients/ui/odontogram/HistorialTimeline";
// `validarTramo` es la excepción documentada (docs/odontograma-backend.md, B2-4): la
// pantalla importa el validador del tramo en vez de reimplementar el criterio. Es una
// función pura — no arma un path ni toca el SDK; la autoridad sigue siendo el service.
import { validarTramo } from "@/services/odontograma/setVinculo";
import { getEventos } from "@/services/odontograma/getEventos";
import { conMotivo, mensajeDeFallo } from "@/services/odontograma/fallos";
import {
    addNotaHistorial,
    getNotasHistorial,
    updateNotaHistorial,
    deleteNotaHistorial,
    type NotaHistorial,
} from "@/services/patients/clinicHistoryNotes";
import { eventoAEntrada, type EntradaHistorial } from "@/lib/odontograma/historial";
import { caraSemantica } from "@/lib/odontograma/caras";
import { hallazgoDe } from "@/lib/odontograma/catalogo";
import type { ClavePieza, Pieza } from "@/lib/odontograma/piezas";
import type {
    Capa,
    CodigoHallazgo,
    CodigoHallazgoCara,
    CodigoHallazgoDiente,
    CodigoHallazgoMulti,
    EventoOdontograma,
} from "@/lib/odontograma/tipos";
import { AMBAS_CAPAS, type VisibilidadCapas, type VistaArcada } from "@/lib/odontograma/selectores";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useOdontograma } from "@/hooks/useOdontograma";
import { ConfirmAlert } from "@/components/shared/dialogAlerts/confirmAlert";
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

/** Una nota libre de la HC, en la misma forma que el timeline espera. */
function notaAEntrada(n: NotaHistorial): EntradaHistorial {
    return { id: n.id, fecha: dayjs(n.ts).format('DD/MM/YYYY'), hora: dayjs(n.ts).format('HH:mm'), texto: n.texto };
}

export default function ClinicHistory() {
    const pathname = usePathname()
    const id = pathname.split('/').slice(-2, -1)[0] || null;
    const [isLoad, setIsLoad] = useState(true);
    const [patient, setPatient] = useState<any>(null);
    useDocumentTitle(patient?.name ? `${patient.name} ${patient.lastName} — Historia Clínica` : "Historia Clínica");

    /** El `clinicId` y el `uid` salen del contexto, que ya los resolvió para toda la app (F4-1). */
    const { user } = useAuth();
    const clinicId = user?.clinicId ?? null;
    const uid = user?.userUid ?? null;
    const { showToast } = useToast();

    const [visibilidad, setVisibilidad] = useState<VisibilidadCapas>(AMBAS_CAPAS);
    const [entradas, setEntradas] = useState<EntradaHistorial[]>([]);
    const [vistaOverride, setVistaOverride] = useState<VistaArcada | null>(null);

    const [enModoTramo, setEnModoTramo] = useState(false);
    const [piezasEnTramo, setPiezasEnTramo] = useState<Map<string, Pieza>>(new Map());

    const [pickerContexto, setPickerContexto] = useState<PickerContexto | null>(null);
    /** El contexto del que se vino al entrar por "Hallazgos de pieza completa", para poder volver. */
    const [pickerAnterior, setPickerAnterior] = useState<PickerContexto | null>(null);
    /** Vínculo (id real, ya persistido) esperando confirmación de baja — un solo diálogo para todos. */
    const [vinculoAConfirmar, setVinculoAConfirmar] = useState<string | null>(null);

    /**
     * El hook emite el evento que acaba de pintar y, si la escritura no quedó, avisa que
     * hay que descartarlo. Traducirlo a una entrada del timeline es de acá: `eventoAEntrada`
     * es el único lugar que decide el texto clínico, y devuelve `null` para los eventos que
     * no tienen que verse (la mitad `requerida` de un plan cerrado).
     */
    const agregarEntradaOptimista = useCallback((tempId: string, evento: EventoOdontograma) => {
        const entrada = eventoAEntrada(tempId, evento);
        if (entrada) setEntradas((prev) => [entrada, ...prev]);
    }, []);

    const quitarEntradaOptimista = useCallback((tempId: string) => {
        setEntradas((prev) => prev.filter((e) => e.id !== tempId));
    }, []);

    const {
        dientes,
        vinculos,
        estado: estadoOdontograma,
        errorDeLectura,
        recargar,
        guardando,
        vinculosPendientes,
        guardarHallazgoCara,
        guardarHallazgoDiente,
        ejecutarHallazgoCara,
        ejecutarHallazgoDiente,
        quitarHallazgoCara,
        quitarHallazgoDiente,
        guardarVinculo,
        pedirQuitarVinculo,
        quitarVinculo,
    } = useOdontograma({
        pacienteId: patient?.id ?? null,
        clinicId,
        uid,
        onEventoOptimista: agregarEntradaOptimista,
        onEventoDescartado: quitarEntradaOptimista,
    });

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
        Promise.all([
            conMotivo((onFallo) => getEventos(pacienteId, clinicId, 200, onFallo)),
            conMotivo((onFallo) => getNotasHistorial(clinicId, pacienteId, onFallo)),
        ]).then(([porEventos, porNotas]) => {
            if (porEventos.resultado === null || porNotas.resultado === null) {
                // El motivo del primero que falló: decir "revisá la conexión" a quien no
                // tiene permiso sobre la ficha lo manda a buscar el problema donde no está.
                const motivo = porEventos.resultado === null ? porEventos.motivo : porNotas.motivo;
                showToast('error', mensajeDeFallo(motivo, 'cargar_registro'));
                return;
            }
            const conTs = [
                ...porEventos.resultado.flatMap((e) => {
                    const entrada = eventoAEntrada(e.id, e);
                    return entrada ? [{ ts: e.ts, entrada }] : [];
                }),
                ...porNotas.resultado.map((n) => ({ ts: n.ts, entrada: notaAEntrada(n) })),
            ];
            conTs.sort((a, b) => b.ts - a.ts);
            setEntradas(conTs.map((c) => c.entrada));
        });
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

    function hallazgoActualDe(contexto: PickerContexto): Partial<Record<Capa, CodigoHallazgo>> {
        if (contexto.alcance === 'MULTI') return {};
        const estado = dientes[contexto.pieza.clave];
        if (!estado) return {};
        if (contexto.alcance === 'DIENTE') return estado.diente ?? {};
        const cara = caraSemantica(contexto.posicion, contexto.pieza.cuadrante);
        return estado.caras?.[cara] ?? {};
    }

    function cerrarPicker() {
        setPickerContexto(null);
        setPickerAnterior(null);
    }

    /**
     * El panel no se cierra antes de saber el resultado: el hook prende `guardando`
     * mientras la escritura vuela y acá se espera el ack para cerrar. Todo el diálogo con
     * Firebase —el optimista, el revertido guardado y el toast— vive en el hook.
     */
    async function handleGuardarHallazgo(codigo: CodigoHallazgo, capa: Capa, nota: string) {
        if (!pickerContexto) return;
        const notaLimpia = nota.trim() || undefined;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            const de = dientes[pieza.clave]?.caras?.[cara]?.[capa] ?? null;
            await guardarHallazgoCara(pieza.clave, cara, capa, codigo as CodigoHallazgoCara, de, notaLimpia);
        } else if (pickerContexto.alcance === 'DIENTE') {
            const { pieza } = pickerContexto;
            const de = dientes[pieza.clave]?.diente?.[capa] ?? null;
            await guardarHallazgoDiente(pieza.clave, capa, codigo as CodigoHallazgoDiente, de, notaLimpia);
        } else {
            const piezas = pickerContexto.piezas.map((p) => p.clave);
            setPiezasEnTramo(new Map());
            setEnModoTramo(false);
            await guardarVinculo(codigo as CodigoHallazgoMulti, capa, piezas, notaLimpia);
        }
        cerrarPicker();
    }

    /**
     * Cierra un plan cargado en `requerida`: lo borra ahí y escribe el resultado (que
     * puede diferir de lo planeado) en `existente`. Si no hay nada en `requerida` no hay
     * plan que cerrar y el picker no debería haber ofrecido la acción.
     */
    async function handleEjecutarHallazgo(codigo: CodigoHallazgo, nota: string) {
        if (!pickerContexto || pickerContexto.alcance === 'MULTI') return;
        const notaLimpia = nota.trim() || undefined;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            const hallazgoRequerido = dientes[pieza.clave]?.caras?.[cara]?.requerida;
            if (!hallazgoRequerido) return;
            const existenteAnterior = dientes[pieza.clave]?.caras?.[cara]?.existente ?? null;
            await ejecutarHallazgoCara(
                pieza.clave,
                cara,
                hallazgoRequerido,
                codigo as CodigoHallazgoCara,
                existenteAnterior,
                notaLimpia
            );
        } else {
            const { pieza } = pickerContexto;
            const hallazgoRequerido = dientes[pieza.clave]?.diente?.requerida;
            if (!hallazgoRequerido) return;
            const existenteAnterior = dientes[pieza.clave]?.diente?.existente ?? null;
            await ejecutarHallazgoDiente(
                pieza.clave,
                hallazgoRequerido,
                codigo as CodigoHallazgoDiente,
                existenteAnterior,
                notaLimpia
            );
        }
        cerrarPicker();
    }

    async function handleQuitarHallazgo(capa: Capa) {
        if (!pickerContexto || pickerContexto.alcance === 'MULTI') return;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            const de = dientes[pieza.clave]?.caras?.[cara]?.[capa];
            if (!de) return;
            await quitarHallazgoCara(pieza.clave, cara, capa, de);
        } else {
            const { pieza } = pickerContexto;
            const de = dientes[pieza.clave]?.diente?.[capa];
            if (!de) return;
            await quitarHallazgoDiente(pieza.clave, capa, de);
        }
        cerrarPicker();
    }

    /**
     * Un alta todavía en vuelo se deshace sin preguntar —es cancelar la acción recién
     * hecha, no borrar un registro persistido— y el hook lo resuelve solo. Un vínculo ya
     * en Firebase pide confirmación: el diálogo es de la pantalla, la baja del hook.
     */
    function handleQuitarVinculo(vinculoId: string) {
        if (pedirQuitarVinculo(vinculoId) === 'requiere_confirmacion') setVinculoAConfirmar(vinculoId);
    }

    async function handleAgregarNota(texto: string) {
        if (!clinicId || !patient?.id || !uid) return;

        const { resultado, motivo } = await conMotivo((onFallo) =>
            addNotaHistorial({ clinicId, pacienteId: patient.id, texto, uid, onFallo })
        );
        if (resultado === null) {
            showToast('error', mensajeDeFallo(motivo, 'guardar'));
            return;
        }
        if (!resultado.ok) {
            showToast('error', resultado.error);
            return;
        }
        setEntradas((prev) => [
            { id: resultado.notaId, fecha: dayjs().format('DD/MM/YYYY'), hora: dayjs().format('HH:mm'), texto },
            ...prev,
        ]);
        showToast('success', 'Nota agregada a la Historia Clínica.');
    }

    async function handleEditarNota(id: string, texto: string) {
        if (!clinicId || !patient?.id) return;
        const anterior = entradas.find((e) => e.id === id)?.texto;

        setEntradas((prev) => prev.map((e) => (e.id === id ? { ...e, texto } : e)));
        const { resultado, motivo } = await conMotivo((onFallo) =>
            updateNotaHistorial({ clinicId, pacienteId: patient.id, notaId: id, texto, onFallo })
        );
        if (resultado === null || !resultado.ok) {
            setEntradas((prev) => prev.map((e) => (e.id === id ? { ...e, texto: anterior ?? e.texto } : e)));
            showToast('error', resultado === null ? mensajeDeFallo(motivo, 'guardar') : resultado.error);
        } else {
            showToast('success', 'Nota actualizada.');
        }
    }

    async function handleEliminarNota(id: string) {
        if (!clinicId || !patient?.id) return;
        const anterior = entradas.find((e) => e.id === id) ?? null;
        const indice = entradas.findIndex((e) => e.id === id);

        setEntradas((prev) => prev.filter((e) => e.id !== id));
        const { resultado, motivo } = await conMotivo((onFallo) =>
            deleteNotaHistorial({ clinicId, pacienteId: patient.id, notaId: id, onFallo })
        );
        if (resultado === null || !resultado.ok) {
            if (anterior) setEntradas((prev) => [...prev.slice(0, indice), anterior, ...prev.slice(indice)]);
            showToast('error', resultado === null ? mensajeDeFallo(motivo, 'borrar') : resultado.error);
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
                    <div className="animate-fade-in">
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
                                        disabled={estadoOdontograma !== 'listo'}
                                        onClick={() => { if (enModoTramo) cancelarModoTramo(); else setEnModoTramo(true); }}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border shadow-sm transition ${
                                            enModoTramo
                                                ? 'bg-teal-700 border-teal-700 text-white'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-teal-600 hover:text-teal-700'
                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                    >
                                        <FaLayerGroup size={12} /> Prótesis (varias piezas)
                                    </button>
                                </div>
                            </div>

                            <Legend visibilidad={visibilidad} onToggle={toggleVisibilidad} />

                            <div className="min-h-[420px] flex items-center justify-center p-8">
                                {estadoOdontograma === 'cargando' && (
                                    <p className="text-sm text-gray-400 italic">Cargando el odontograma…</p>
                                )}
                                {/*
                                  * Un fallo de lectura no se dibuja como un arco vacío: una boca sin
                                  * hallazgos y una boca que no se pudo leer se ven exactamente igual, y
                                  * confundirlas es leer mal la ficha de un paciente. Se muestra el motivo
                                  * —que distingue "sin permiso" de "sin conexión"— y se puede reintentar.
                                  */}
                                {estadoOdontograma === 'error' && (
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <p className="text-sm text-red-500 max-w-sm">{errorDeLectura}</p>
                                        <button
                                            onClick={recargar}
                                            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-gray-300 text-gray-700 shadow-sm hover:border-teal-600 hover:text-teal-700 transition"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                )}
                                {estadoOdontograma === 'listo' && (
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
                                        vinculosPendientes={vinculosPendientes}
                                    />
                                )}
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
                            guardando={guardando}
                            onClose={() => { if (guardando) return; cerrarPicker() }}
                            onVerPiezaCompleta={(pieza, anchor) => {
                                setPickerAnterior(pickerContexto)
                                setPickerContexto({ alcance: 'DIENTE', pieza, anchor })
                            }}
                            onVolver={pickerAnterior ? () => { setPickerContexto(pickerAnterior); setPickerAnterior(null) } : undefined}
                        />

                        {/* `ConfirmAlert` trae su propio loading — alcanza con pasarle la promesa. */}
                        <ConfirmAlert
                            open={!!vinculoAConfirmar}
                            setOpen={(open) => !open && setVinculoAConfirmar(null)}
                            title="¿Quitar este vínculo?"
                            description={
                                vinculoAConfirmar && vinculos[vinculoAConfirmar]
                                    ? `Se va a quitar "${hallazgoDe(vinculos[vinculoAConfirmar].tipo).nombre}". Esta acción no se puede deshacer.`
                                    : 'Esta acción no se puede deshacer.'
                            }
                            onConfirm={() => (vinculoAConfirmar ? quitarVinculo(vinculoAConfirmar) : undefined)}
                        />
                    </div>
                )}
                </div>
            </div>
        );
    }
}
