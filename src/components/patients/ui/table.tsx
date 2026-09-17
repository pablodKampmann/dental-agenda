
import { useRouter } from 'next/navigation'
import { LuSearchX } from "react-icons/lu";
import { TbReload } from 'react-icons/tb';
import { BsPersonFillAdd } from "react-icons/bs";
import { AvatarFallback } from "../../shared/AvatarFallback";

interface props {
    searchContent: string;
    listOfPatients: null | any[];
    setLoadRow: (value: number | null) => void;
    loadRow: number | null;
    isListOfPatientsComplete: boolean;
    loadMorePatients: () => void;
}

const TH = "px-4 py-2.5 bg-gray-50 border-b border-gray-200 font-bold";
const TD = "px-4";

export function Table({ searchContent, listOfPatients, setLoadRow, loadRow, isListOfPatientsComplete, loadMorePatients }: props) {
    const router = useRouter()
    const isEmpty = listOfPatients !== null && listOfPatients.length === 0;

    function handleGoPatient(patientId: any) {
        router.push(`/patients/${patientId}`);
    }

    return (
        <>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <table className="w-full select-none">
                    <thead className="sticky top-0 z-10">
                        <tr className="text-left text-[11px] uppercase tracking-widest text-gray-400">
                            <th className={`${TH} w-14 hidden md:table-cell`}></th>
                            <th className={TH}>Nombre</th>
                            <th className={TH}>DNI</th>
                            <th className={TH}>Teléfono</th>
                            <th className={`${TH} hidden md:table-cell`}>Correo</th>
                            <th className={`${TH} hidden md:table-cell`}>Obra Social</th>
                        </tr>
                    </thead>
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
                                    <td className={TD}>
                                        <p className="text-gray-600">{patient.dni}</p>
                                    </td>
                                    <td className={TD}>
                                        <p className="text-gray-600">{patient.num || '-'}</p>
                                    </td>
                                    <td className={`${TD} hidden md:table-cell`}>
                                        <p className="text-gray-600">{patient.email || '-'}</p>
                                    </td>
                                    <td className={`${TD} hidden md:table-cell`}>
                                        {patient.insurance ? (
                                            <span className="text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5">
                                                {patient.insurance}
                                            </span>
                                        ) : (
                                            <p className="text-gray-400">-</p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    )}
                </table>

                {isEmpty && (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 select-none">
                        {searchContent === '' ? (
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
                        {searchContent !== ''
                            ? `${listOfPatients.length} ${listOfPatients.length === 1 ? 'coincidencia' : 'coincidencias'}`
                            : isListOfPatientsComplete
                                ? 'Lista completa'
                                : `${listOfPatients.length} de la lista`}
                    </span>

                    {searchContent === '' && isListOfPatientsComplete !== true && (
                        <button
                            type="button"
                            onClick={loadMorePatients}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-teal-700 border-2 border-teal-200 rounded-lg hover:bg-teal-50 transition duration-150"
                        >
                            <TbReload size={14} /> Cargar más
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
