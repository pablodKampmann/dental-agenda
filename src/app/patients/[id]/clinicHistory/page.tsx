'use client'

import { getPatient } from "@/services/patients/getPatient";
import { getUser } from "@/services/auth/getUser";
import React, { useState, useEffect } from 'react';
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
import { HistorialTimeline, type EntradaHistorial } from "@/components/patients/ui/odontogram/HistorialTimeline";
import { getOdontograma } from "@/services/odontograma/getOdontograma";
import { caraSemantica, etiquetaCara } from "@/lib/odontograma/caras";
import { hallazgoDe } from "@/lib/odontograma/catalogo";
import type { Pieza } from "@/lib/odontograma/piezas";
import type { Capa, CodigoHallazgo, DientesPorClave, FacePosition } from "@/lib/odontograma/tipos";
import { AMBAS_CAPAS, type VisibilidadCapas, type VistaArcada } from "@/lib/odontograma/selectores";
import { FaLayerGroup } from "react-icons/fa6";
import { TbBabyCarriage, TbDental } from "react-icons/tb";

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
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const pathname = usePathname()
    const id = pathname.split('/').slice(-2, -1)[0] || null;
    const [patient, setPatient] = useState<any>(null);
    const [clinicId, setClinicId] = useState<string | null>(null);

    const [dientes, setDientes] = useState<DientesPorClave>({});
    const [visibilidad, setVisibilidad] = useState<VisibilidadCapas>(AMBAS_CAPAS);
    const [entradas, setEntradas] = useState<EntradaHistorial[]>([]);
    const [vistaOverride, setVistaOverride] = useState<VistaArcada | null>(null);

    const [enModoTramo, setEnModoTramo] = useState(false);
    const [piezasEnTramo, setPiezasEnTramo] = useState<Map<string, Pieza>>(new Map());

    const [pickerContexto, setPickerContexto] = useState<PickerContexto | null>(null);
    /** El contexto del que se vino al entrar por "Hallazgos de pieza completa", para poder volver. */
    const [pickerAnterior, setPickerAnterior] = useState<PickerContexto | null>(null);

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
            if (data) setDientes(data.dientes);
        });
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

    function handleGuardarHallazgo(codigo: CodigoHallazgo, capa: Capa, nota: string) {
        if (!pickerContexto) return;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            setDientes((prev) => {
                const estado = prev[pieza.clave] ?? {};
                return {
                    ...prev,
                    [pieza.clave]: {
                        ...estado,
                        caras: { ...estado.caras, [cara]: { ...estado.caras?.[cara], [capa]: codigo } },
                    },
                };
            });
            registrarEntrada(etiquetaCara(cara, pieza.arcada, pieza.tipo), hallazgoDe(codigo).nombre, pieza.codigo, capa, nota);
        } else if (pickerContexto.alcance === 'DIENTE') {
            const { pieza } = pickerContexto;
            setDientes((prev) => {
                const estado = prev[pieza.clave] ?? {};
                return {
                    ...prev,
                    [pieza.clave]: { ...estado, diente: { ...estado.diente, [capa]: codigo } },
                };
            });
            registrarEntrada('pieza completa', hallazgoDe(codigo).nombre, pieza.codigo, capa, nota);
        } else {
            const piezas = pickerContexto.piezas;
            const codigos = piezas.map((p) => p.codigo).join('-');
            registrarEntrada(`tramo ${codigos}`, hallazgoDe(codigo).nombre, piezas[0].codigo, capa, nota);
            setPiezasEnTramo(new Map());
            setEnModoTramo(false);
        }

        setPickerContexto(null);
        setPickerAnterior(null);
    }

    function handleQuitarHallazgo(capa: Capa) {
        if (!pickerContexto || pickerContexto.alcance === 'MULTI') return;

        if (pickerContexto.alcance === 'CARA') {
            const { pieza, posicion } = pickerContexto;
            const cara = caraSemantica(posicion, pieza.cuadrante);
            setDientes((prev) => {
                const estado = prev[pieza.clave];
                if (!estado?.caras?.[cara]) return prev;
                const { [capa]: _quitado, ...resto } = estado.caras[cara]!;
                return {
                    ...prev,
                    [pieza.clave]: { ...estado, caras: { ...estado.caras, [cara]: resto } },
                };
            });
        } else {
            const { pieza } = pickerContexto;
            setDientes((prev) => {
                const estado = prev[pieza.clave];
                if (!estado?.diente) return prev;
                const { [capa]: _quitado, ...resto } = estado.diente;
                return { ...prev, [pieza.clave]: { ...estado, diente: resto } };
            });
        }
        setPickerContexto(null);
        setPickerAnterior(null);
    }

    if (id !== null) {
        const vistaSugerida = vistaSugeridaPorEdad(patient?.birthDate);
        const vista = vistaOverride ?? vistaSugerida;

        return (
            <div className="h-[calc(100vh-68px)] overflow-y-auto">
                <div className='ml-4 px-4 pb-4 pt-6 mr-2 relative'>
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
                                        onClick={() => { setEnModoTramo((v) => !v); setPiezasEnTramo(new Map()); }}
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
                                        piezasEnTramo={new Set(piezasEnTramo.keys())}
                                        enModoTramo={enModoTramo}
                                        piezaActiva={pickerContexto && pickerContexto.alcance !== 'MULTI' ? pickerContexto.pieza.clave : undefined}
                                        onSelectCara={(pieza, posicion, anchor) => { setPickerAnterior(null); setPickerContexto({ alcance: 'CARA', pieza, posicion, anchor }) }}
                                        onSelectDiente={(pieza, anchor) => { setPickerAnterior(null); setPickerContexto({ alcance: 'DIENTE', pieza, anchor }) }}
                                        onToggleEnTramo={toggleEnTramo}
                                    />
                                </div>
                                <div className="w-full md:w-[15%] shrink-0">
                                    <Legend visibilidad={visibilidad} onToggle={toggleVisibilidad} />
                                </div>
                            </div>

                            {enModoTramo && (
                                <div className="flex items-center justify-between bg-teal-50 border-t border-teal-100 px-4 py-2.5">
                                    <span className="text-xs text-teal-700 font-medium">
                                        {piezasEnTramo.size === 0
                                            ? 'Seleccioná dos o más piezas contiguas'
                                            : `${piezasEnTramo.size} piezas seleccionadas`}
                                    </span>
                                    <button
                                        disabled={piezasEnTramo.size < 2}
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
