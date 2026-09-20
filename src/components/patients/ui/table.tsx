
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react';
import { LuSearchX } from "react-icons/lu";
import { TbReload } from 'react-icons/tb';
import { BsPersonFillAdd } from "react-icons/bs";
import { AvatarFallback } from "../../shared/AvatarFallback";

interface props {
    isFiltering: boolean;
    listOfPatients: null | any[];
    setLoadRow: (value: number | null) => void;
    loadRow: number | null;
    isListOfPatientsComplete: boolean;
    loadMorePatients: () => void;
    visibleColumns: Record<string, boolean>;
}

const TH = "px-4 py-2.5 bg-gray-100 border-b border-gray-200 font-bold";
const TD = "px-4";

export function Table({ isFiltering, listOfPatients, setLoadRow, loadRow, isListOfPatientsComplete, loadMorePatients, visibleColumns }: props) {
    const router = useRouter()
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);
    const [isNearBottom, setIsNearBottom] = useState(true);

    // "Cargar más" solo aparece cerca del final del scroll — mismo criterio de threshold
    // (80px) que el picker de paciente de agenda. Se recalcula también cuando cambia la
    // lista (una tanda nueva puede dejar de estar cerca del fondo).
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const check = () => setIsNearBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 80);
        check();
        el.addEventListener('scroll', check);
        return () => el.removeEventListener('scroll', check);
    }, [listOfPatients]);

    // El header vive en su propia tabla, fuera del div con scroll, para que la scrollbar
    // nativa no lo pise (ver nota en el JSX). Pero si ese div SÍ tiene scrollbar, le come
    // ancho a la tabla del body y no al header — desalinea las columnas. Medimos el ancho
    // real (offsetWidth - clientWidth, 0 si no hay scrollbar) y se lo reservamos al header.
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const measure = () => setScrollbarWidth(el.offsetWidth - el.clientWidth);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [listOfPatients]);
    const isEmpty = listOfPatients !== null && listOfPatients.length === 0;
    const showDni = visibleColumns.dni !== false;
    const showPhone = visibleColumns.phone !== false;
    const showEmail = visibleColumns.email !== false;
    const showInsurance = visibleColumns.insurance !== false;
    const showGender = visibleColumns.gender === true;
    const showBirthDate = visibleColumns.birthDate === true;
    const showAddress = visibleColumns.address === true;
    const showPlan = visibleColumns.plan === true;
    const showAffiliateNum = visibleColumns.affiliateNum === true;

    const GENDER_LABEL: Record<string, string> = { male: "Masculino", female: "Femenino" };

    function handleGoPatient(patientId: any) {
        router.push(`/patients/${patientId}`);
    }

    // Mismo colgroup (mismos anchos, mismas columnas ocultas) en la tabla de header y la de body,
    // con table-layout fixed, para que separar el header en su propia tabla (y así no compartir
    // el div con scroll) no desalinee columnas — con layout "auto" cada tabla mide su propio
    // contenido y los anchos no coinciden entre las dos.
    const COLS = [
        { show: true, width: '6%', mobileOnly: true },   // avatar
        { show: true, width: '20%' },                    // nombre
        { show: showDni, width: '12%' },
        { show: showPhone, width: '14%' },
        { show: showEmail, width: '18%', mobileOnly: true },
        { show: showInsurance, width: '13%', mobileOnly: true },
        { show: showGender, width: '10%', mobileOnly: true },
        { show: showBirthDate, width: '13%', mobileOnly: true },
        { show: showAddress, width: '15%', mobileOnly: true },
        { show: showPlan, width: '10%', mobileOnly: true },
        { show: showAffiliateNum, width: '12%', mobileOnly: true },
    ];

    function ColGroup() {
        return (
            <colgroup>
                {COLS.filter((c) => c.show).map((c, i) => (
                    <col key={i} className={c.mobileOnly ? 'hidden md:table-column' : undefined} style={{ width: c.width }} />
                ))}
            </colgroup>
        );
    }

    return (
        <>
            <div className="bg-gray-100" style={{ paddingRight: scrollbarWidth }}>
            <table className="w-full table-fixed select-none">
                <ColGroup />
                <thead>
                    <tr className="text-left text-[11px] uppercase tracking-widest text-gray-400">
                        <th className={`${TH} hidden md:table-cell`}></th>
                        <th className={TH}>Nombre</th>
                        {showDni && <th className={TH}>DNI</th>}
                        {showPhone && <th className={TH}>Teléfono</th>}
                        {showEmail && <th className={`${TH} hidden md:table-cell`}>Correo</th>}
                        {showInsurance && <th className={`${TH} hidden md:table-cell`}>Obra Social</th>}
                        {showGender && <th className={`${TH} hidden md:table-cell`}>Género</th>}
                        {showBirthDate && <th className={`${TH} hidden md:table-cell`}>Fecha de nacimiento</th>}
                        {showAddress && <th className={`${TH} hidden md:table-cell`}>Domicilio</th>}
                        {showPlan && <th className={`${TH} hidden md:table-cell`}>Plan</th>}
                        {showAffiliateNum && <th className={`${TH} hidden md:table-cell`}>N° Afiliado</th>}
                    </tr>
                </thead>
            </table>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <table className="w-full table-fixed select-none">
                    <ColGroup />
                    {listOfPatients && (
                        <tbody>
                            {listOfPatients.map((patient, index) => (
                                <tr
                                    onClick={() => { handleGoPatient(patient.id); setLoadRow(index); }}
                                    key={index}
                                    className={`
                                        ${index !== listOfPatients.length - 1 ? 'border-b border-gray-100' : ''}
                                        ${loadRow === index ? 'bg-teal-50' : 'hover:bg-gray-50'}
                                        md:text-sm text-xs md:h-14 h-12 whitespace-nowrap cursor-pointer transition duration-150
                                    `}
                                >
                                    <td className={`${TD} hidden md:table-cell`}>
                                        <AvatarFallback
                                            displayName={`${patient.name} ${patient.lastName}`}
                                            size={32}
                                            className="rounded-full"
                                        />
                                    </td>
                                    <td className={TD}>
                                        <p className="font-semibold text-black">{patient.name} {patient.lastName}</p>
                                    </td>
                                    {showDni && (
                                        <td className={TD}>
                                            <p className="text-gray-600">{patient.dni}</p>
                                        </td>
                                    )}
                                    {showPhone && (
                                        <td className={TD}>
                                            <p className="text-gray-600">{patient.num || '-'}</p>
                                        </td>
                                    )}
                                    {showEmail && (
                                        <td className={`${TD} hidden md:table-cell`}>
                                            <p className="text-gray-600">{patient.email || '-'}</p>
                                        </td>
                                    )}
                                    {showInsurance && (
                                        <td className={`${TD} hidden md:table-cell`}>
                                            {patient.insurance ? (
                                                <span className="text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5">
                                                    {patient.insurance}
                                                </span>
                                            ) : (
                                                <p className="text-gray-400">-</p>
                                            )}
                                        </td>
                                    )}
                                    {showGender && (
                                        <td className={`${TD} hidden md:table-cell`}>
                                            <p className="text-gray-600">{patient.gender ? GENDER_LABEL[patient.gender] ?? patient.gender : '-'}</p>
                                        </td>
                                    )}
                                    {showBirthDate && (
                                        <td className={`${TD} hidden md:table-cell`}>
                                            <p className="text-gray-600">{patient.birthDate || '-'}</p>
                                        </td>
                                    )}
                                    {showAddress && (
                                        <td className={`${TD} hidden md:table-cell`}>
                                            <p className="text-gray-600">{patient.address || '-'}</p>
                                        </td>
                                    )}
                                    {showPlan && (
                                        <td className={`${TD} hidden md:table-cell`}>
                                            <p className="text-gray-600">{patient.plan || '-'}</p>
                                        </td>
                                    )}
                                    {showAffiliateNum && (
                                        <td className={`${TD} hidden md:table-cell`}>
                                            <p className="text-gray-600">{patient.affiliateNum || '-'}</p>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    )}
                </table>

                {isEmpty && (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 select-none">
                        {!isFiltering ? (
                            <>
                                <BsPersonFillAdd size={28} className="text-gray-300" />
                                <p className="text-sm font-semibold text-gray-500">Todavía no hay pacientes</p>
                                <p className="text-xs text-gray-400">Agregá el primero desde el botón de arriba.</p>
                            </>
                        ) : (
                            <>
                                <LuSearchX size={28} className="text-gray-300" />
                                <p className="text-sm font-semibold text-gray-500">Sin resultados</p>
                                <p className="text-xs text-gray-400">Probá con otro nombre o DNI.</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: cargar más o estado de búsqueda */}
            {listOfPatients && (
                <div className="shrink-0 px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3 select-none">
                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                        {isFiltering
                            ? `${listOfPatients.length} ${listOfPatients.length === 1 ? 'coincidencia' : 'coincidencias'}`
                            : isListOfPatientsComplete
                                ? 'Lista completa'
                                : `${listOfPatients.length} de la lista`}
                    </span>

                    {!isFiltering && isListOfPatientsComplete !== true && isNearBottom && (
                        <button
                            type="button"
                            onClick={loadMorePatients}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-700 border-2 border-teal-200 rounded-lg hover:bg-teal-50 transition duration-150 animate-fade-in"
                        >
                            <TbReload size={14} /> Cargar más
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
