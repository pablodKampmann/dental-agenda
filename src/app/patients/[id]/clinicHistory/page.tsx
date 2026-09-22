'use client'

import { getPatient } from "@/services/patients/getPatient";
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'
import dayjs from 'dayjs';
import { PatientRecord } from "@/components/patients/ui/patientRecord";
import { PatientRecordSkeleton } from "@/components/patients/ui/patientRecordSkeleton";
import { OdontogramaGrid } from "@/components/patients/ui/odontogram/OdontogramaGrid";
import { Legend } from "@/components/patients/ui/odontogram/Legend";
import { HallazgoPicker, type PickerContexto } from "@/components/patients/ui/odontogram/HallazgoPicker";
import { HistorialTimeline, type EntradaHistorial } from "@/components/patients/ui/odontogram/HistorialTimeline";
import { HistorialEventos } from "@/components/patients/ui/odontogram/HistorialEventos";
// `validarTramo` es la excepción documentada (docs/odontograma-backend.md, B2-4): la
// pantalla importa el validador del tramo en vez de reimplementar el criterio. Es una
// función pura — no arma un path ni toca el SDK; la autoridad sigue siendo el service.
import { validarTramo } from "@/services/odontograma/setVinculo";
import { caraSemantica, etiquetaCara } from "@/lib/odontograma/caras";
import { hallazgoDe } from "@/lib/odontograma/catalogo";
import type { ClavePieza, Pieza } from "@/lib/odontograma/piezas";
import type { Capa, CodigoHallazgo, CodigoHallazgoCara, CodigoHallazgoDiente, CodigoHallazgoMulti } from "@/lib/odontograma/tipos";
import { AMBAS_CAPAS, type VisibilidadCapas, type VistaArcada } from "@/lib/odontograma/selectores";
import { useAuth } from "@/context/AuthContext";
import { useOdontograma } from "@/hooks/useOdontograma";
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

export default function ClinicHistory() {
    const [isLoad, setIsLoad] = useState(true);
    const pathname = usePathname()
    const id = pathname.split('/').slice(-2, -1)[0] || null;
    const [patient, setPatient] = useState<any>(null);
    /**
     * El clinicId y el uid salen del AuthContext, que ya los resolvió una vez para toda
     * la app: la pantalla no vuelve a preguntarle a Firebase (era un round-trip repetido)
     * y, sobre todo, no importa el SDK para leer el usuario logueado — criterio de F4-1.
     */
    const { user } = useAuth();
    const clinicId = user?.clinicId ?? null;
    useDocumentTitle(patient?.name ? `${patient.name} ${patient.lastName} — Historia Clínica` : "Historia Clínica");

    const [visibilidad, setVisibilidad] = useState<VisibilidadCapas>(AMBAS_CAPAS);
    const [entradas, setEntradas] = useState<EntradaHistorial[]>([]);
    const [vistaOverride, setVistaOverride] = useState<VistaArcada | null>(null);

    const [enModoTramo, setEnModoTramo] = useState(false);
    const [piezasEnTramo, setPiezasEnTramo] = useState<Map<string, Pieza>>(new Map());

    const [pickerContexto, setPickerContexto] = useState<PickerContexto | null>(null);
    /** El contexto del que se vino al entrar por "Hallazgos de pieza completa", para poder volver. */
    const [pickerAnterior, setPickerAnterior] = useState<PickerContexto | null>(null);

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
     * Toda la conversación con Firebase del odontograma pasa por acá: lectura, escrituras,
     * actualización optimista y revertido. La pantalla no llama services ni arma paths.
     */
    const {
        dientes,
        vinculos,
        estado: estadoOdontograma,
        errorDeLectura,
        recargar,
        guardarHallazgoCara,
        guardarHallazgoDiente,
        quitarHallazgoCara,
        quitarHallazgoDiente,
        guardarVinculo,
        quitarVinculo,
    } = useOdontograma({
        pacienteId: patient?.id ?? null,
        clinicId,
        uid: user?.userUid ?? null,
    });

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

    function registrarEntrada(detalle: string, nombreHallazgo: string, piezaCodigo: number, capa: Capa, nota: string) {
        setEntradas((prev) => [
            {
                id: `${Date.now()}`,
                fecha: dayjs().format('DD/MM/YYYY'),
                hora: dayjs().format('HH:mm'),
                texto: nota,
                hallazgo: { piezaCodigo, detalle, nombreHallazgo, capa },
            },
            ...prev,
        ]);
    }

    function cerrarPicker() {
        setPickerContexto(null);
        setPickerAnterior(null);
    }

    /**
     * El picker se cierra antes de esperar la escritura, no después: el hook ya dibujó el
     * hallazgo (actualización optimista) y quedarse con el popover abierto esperando el
     * round-trip es justo lo que se sentía roto con 52 piezas y un click por hallazgo. Si
     * la escritura falla, el hook lo deshace y avisa por qué.
     */
    async function handleGuardarHallazgo(codigo: CodigoHallazgo, capa: Capa, nota: string) {
        if (!pickerContexto) return;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            const de = dientes[pieza.clave]?.caras?.[cara]?.[capa] ?? null;

            cerrarPicker();
            registrarEntrada(etiquetaCara(cara, pieza.arcada, pieza.tipo), hallazgoDe(codigo).nombre, pieza.codigo, capa, nota);
            await guardarHallazgoCara(pieza.clave, cara, capa, codigo as CodigoHallazgoCara, de);
        } else if (pickerContexto.alcance === 'DIENTE') {
            const { pieza } = pickerContexto;
            const de = dientes[pieza.clave]?.diente?.[capa] ?? null;

            cerrarPicker();
            registrarEntrada('pieza completa', hallazgoDe(codigo).nombre, pieza.codigo, capa, nota);
            await guardarHallazgoDiente(pieza.clave, capa, codigo as CodigoHallazgoDiente, de);
        } else {
            const piezas = pickerContexto.piezas;
            const codigos = piezas.map((p) => p.codigo).join('-');

            cerrarPicker();
            setPiezasEnTramo(new Map());
            setEnModoTramo(false);
            registrarEntrada(`tramo ${codigos}`, hallazgoDe(codigo).nombre, piezas[0].codigo, capa, nota);
            await guardarVinculo(codigo as CodigoHallazgoMulti, capa, piezas.map((p) => p.clave));
        }
    }

    async function handleQuitarHallazgo(capa: Capa) {
        if (!pickerContexto || pickerContexto.alcance === 'MULTI') return;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            const de = dientes[pieza.clave]?.caras?.[cara]?.[capa];
            if (!de) return;

            cerrarPicker();
            await quitarHallazgoCara(pieza.clave, cara, capa, de);
        } else {
            const { pieza } = pickerContexto;
            const de = dientes[pieza.clave]?.diente?.[capa];
            if (!de) return;

            cerrarPicker();
            await quitarHallazgoDiente(pieza.clave, capa, de);
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

                            <div className="flex flex-col md:flex-row gap-4 p-3">
                                <div className="flex-1 min-w-0 min-h-[420px] flex flex-col items-center justify-center p-8">
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
                                    {estadoOdontograma === 'listo' && <OdontogramaGrid
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
                                        onQuitarVinculo={quitarVinculo}
                                    />}
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
                            onAgregarNota={(texto) => setEntradas((prev) => [
                                { id: `${Date.now()}`, fecha: dayjs().format('DD/MM/YYYY'), hora: dayjs().format('HH:mm'), texto },
                                ...prev,
                            ])}
                            onEditarTexto={(id, texto) => setEntradas((prev) => prev.map((e) => e.id === id ? { ...e, texto } : e))}
                            onEliminar={(id) => setEntradas((prev) => prev.filter((e) => e.id !== id))}
                        />

                        {clinicId && <HistorialEventos pacienteId={patient.id} clinicId={clinicId} />}

                        <HallazgoPicker
                            contexto={pickerContexto}
                            hallazgoActual={pickerContexto ? hallazgoActualDe(pickerContexto) : {}}
                            onGuardar={handleGuardarHallazgo}
                            onQuitar={handleQuitarHallazgo}
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
