
import { ClipLoader } from "react-spinners";
import { useRouter } from 'next/navigation'
import { LuSearchX } from "react-icons/lu";
import { TbUserSearch, TbReload } from 'react-icons/tb';
import { AvatarFallback } from "../../shared/AvatarFallback";

interface props {
    searchContent: string;
    listOfPatients: null | any[];
    setLoadRow: (value: number | null) => void;
    loadRow: number | null;
    isListOfPatientsComplete: boolean;
    loadMorePatientsButtom: boolean;
    setLoadMorePatientsButtom: (values: boolean) => void;
    handleGetPatients: (quantity: number) => void;
}

export function Table({ searchContent, listOfPatients, setLoadRow, loadRow, isListOfPatientsComplete, loadMorePatientsButtom, setLoadMorePatientsButtom, handleGetPatients }: props) {
    const router = useRouter()

    function loadMorePatients() {
        if (isListOfPatientsComplete !== true && listOfPatients !== null) {
            setLoadMorePatientsButtom(true);
            handleGetPatients(listOfPatients.length * 2);
        }
    }

    function handleGoPatient(patientId: any) {
        router.push(`/patients/${patientId}`);
    }

    return (
        <div className="h-full overflow-hidden w-full">
            <div className="rounded-xl w-full border-2 border-gray-600 overflow-y-auto overflow-x-hidden h-full bg-gray-50">
                <table className="w-full select-none">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-teal-600 h-10 border-b-2 border-gray-600 text-left text-xs font-semibold uppercase tracking-widest text-white">
                            <th className="w-12 pl-3 hidden md:table-cell"></th>
                            <th className="md:pl-4 pl-2">Nombre</th>
                            <th className="md:pl-5 pl-2">DNI</th>
                            <th className="md:pl-5 pl-2">Teléfono</th>
                            <th className="md:pl-5 pl-2 hidden md:table-cell">Correo</th>
                            <th className="md:pl-5 pl-2 hidden md:table-cell">Obra Social</th>
                        </tr>
                    </thead>
                    {listOfPatients ? (
                        <tbody>
                            {listOfPatients.map((patient, index) => (
                                <tr
                                    onClick={() => { handleGoPatient(patient.id); setLoadRow(index); }}
                                    key={index}
                                    className={`
                                        ${index !== listOfPatients.length - 1 ? 'border-b border-gray-600' : ''}
                                        ${loadRow === index ? 'bg-teal-600 text-white' : 'text-black hover:bg-gray-900 hover:bg-opacity-10'}
                                        md:text-sm text-xs md:h-14 h-12 whitespace-nowrap cursor-pointer transition duration-150
                                    `}
                                >
                                    <td className="pl-3 hidden md:table-cell">
                                        <AvatarFallback
                                            displayName={`${patient.name} ${patient.lastName}`}
                                            size={32}
                                            className="rounded-full"
                                        />
                                    </td>
                                    <td className="md:pl-4 pl-2">
                                        <p className="font-medium">{patient.name} {patient.lastName}</p>
                                    </td>
                                    <td className="md:pl-5 pl-2">
                                        <p>{patient.dni}</p>
                                    </td>
                                    <td className="md:pl-5 pl-2">
                                        <p>{patient.num || '-'}</p>
                                    </td>
                                    <td className="md:pl-5 pl-2 hidden md:table-cell">
                                        <p>{patient.email || '-'}</p>
                                    </td>
                                    <td className="md:pl-5 pl-2 hidden md:table-cell">
                                        {patient.insurance ? (
                                            <span className="bg-teal-600 bg-opacity-15 text-teal-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-teal-600 border-opacity-40">
                                                {patient.insurance}
                                            </span>
                                        ) : (
                                            <p className="text-gray-400">-</p>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {/* Contador de pacientes */}
                            <tr className="text-center text-xs h-6 font-semibold border-t-2 border-gray-600 bg-gray-50">
                                <td className="table-cell md:hidden text-black" colSpan={3}>
                                    {listOfPatients.length} pacientes
                                </td>
                                <td className="hidden md:table-cell text-black" colSpan={6}>
                                    {listOfPatients.length} {listOfPatients.length === 1 ? 'paciente cargado' : 'pacientes cargados'}
                                </td>
                            </tr>

                            {/* Footer: cargar más o estado de búsqueda */}
                            {searchContent === '' ? (
                                <tr
                                    onClick={loadMorePatients}
                                    className={`${isListOfPatientsComplete !== true ? 'bg-teal-600 hover:bg-opacity-85 cursor-pointer' : 'bg-teal-600'} border-t-2 border-gray-600 transition duration-150`}
                                >
                                    <td colSpan={6}>
                                        {loadMorePatientsButtom ? (
                                            <div className="flex py-2 justify-center items-center">
                                                <ClipLoader speedMultiplier={1.7} color='white' size={28} />
                                            </div>
                                        ) : (
                                            <div className="text-base py-2 font-semibold flex justify-center items-center gap-1.5 text-white w-full">
                                                {isListOfPatientsComplete !== true ? (
                                                    <>Cargar más pacientes <TbReload size={20} /></>
                                                ) : (
                                                    <p>Lista completa</p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                <tr className="bg-gray-50 border-t-2 border-gray-600">
                                    <td colSpan={6}>
                                        <div className="text-base py-2 font-semibold flex justify-center items-center gap-1.5 text-black w-full">
                                            {listOfPatients.length > 0 ? (
                                                <>Búsqueda completada <TbUserSearch size={20} /></>
                                            ) : (
                                                <>Sin resultados <LuSearchX size={20} /></>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    ) : null}
                </table>
            </div>
        </div>
    );
}
