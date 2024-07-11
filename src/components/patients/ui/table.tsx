
import { ClipLoader } from "react-spinners";
import { useRouter } from 'next/navigation'
import { LuSearchX } from "react-icons/lu";
import { TbUserSearch, TbReload } from 'react-icons/tb';

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

    //ROUTING
    function handleGoPatient(patientId: any) {
        router.push(`/patients/${patientId}`);
    }

    return (
        <div className="flex md:mt-4 mt-14 h-screen md:pb-40 pb-48  overflow-y-hidden w-full ">
            <div className="rounded-xl w-full border-2 border-gray-600 overflow-y-auto overflow-x-hidden ">
                <table className="w-full h-full select-none ">
                    <thead>
                        <tr className="bg-teal-600  h-10 border-b-2 border-gray-600 text-left md:text-sm text-xs font-semibold uppercase tracking-widest text-white">
                            <th className='md:pl-5 pl-2'>Nombre</th>
                            <th className='md:pl-5 pl-2 '>Dni</th>
                            <th className='md:pl-5 pl-2'>Teléfono</th>
                            <th className='md:pl-5 pl-2 hidden md:table-cell'>Correo</th>
                            <th className='md:pl-5 pl-2 hidden md:table-cell'>Obra Social</th>
                        </tr>
                    </thead>
                    {listOfPatients ? (
                        <tbody>
                            {listOfPatients.map((patient, index) => (
                                <tr onClick={() => { handleGoPatient(patient.id); setLoadRow(index) }} key={index} className={`${index !== listOfPatients.length - 1 ? 'border-b border-gray-600' : ''} ${loadRow === index ? 'bg-teal-600' : 'hover:bg-gray-900 hover:bg-opacity-30 bg-opacity-30'} md:text-sm text-xs md:h-14 h-12 whitespace-nowrap text-nowrap text-black cursor-pointer  transition duration-150`}>
                                    <td className="md:pl-5 pl-2">
                                        <p>{patient.name} {patient.lastName}</p>
                                    </td>
                                    <td className="md:pl-5 pl-2 ">
                                        <p>{patient.dni}</p>
                                    </td>
                                    <td className="md:pl-5 pl-2">
                                        {patient.num ? (
                                            <p>{patient.num}</p>
                                        ) : (
                                            <p>-</p>
                                        )}
                                    </td>
                                    <td className="md:pl-5 pl-2 hidden md:table-cell">
                                        {patient.email ? (
                                            <p>{patient.email}</p>
                                        ) : (
                                            <p>-</p>
                                        )}
                                    </td>
                                    <td className="md:pl-5 pl-2 hidden md:table-cell">
                                        <p>{patient.insurance}</p>
                                    </td>
                                </tr>
                            ))}
                            <tr className='text-center w-full text-xs h-6 font-semibold border-t-2 border-gray-600 bg-transparent group text-black'>
                                <td className="table-cell md:hidden" colSpan={3}>
                                    Número de pacientes: {listOfPatients.length}
                                </td>
                                <td className="hidden md:table-cell" colSpan={5}>
                                    Número de pacientes: {listOfPatients.length}
                                </td>
                            </tr>
                            {searchContent === '' ? (
                                <tr onClick={loadMorePatients} className={`${isListOfPatientsComplete !== true ? 'bg-teal-600 hover:bg-opacity-85 transition duration-150 cursor-pointer group' : 'bg-teal-600 '} border-t-2 border-gray-600 `}>
                                    <td colSpan={5} >
                                        {loadMorePatientsButtom ? (
                                            <div className='flex py-2 justify-center items-center'>
                                                <ClipLoader speedMultiplier={1.7} color='white' size={30} />
                                            </div>
                                        ) : (
                                            <div className="text-xl py-2 font-medium flex justify-center items-center text-white w-full">
                                                {isListOfPatientsComplete !== true ? (
                                                    <p className='flex justify-center items-center'>Cargar más pacientes<TbReload size={26} className="ml-1" /></p>
                                                ) : (
                                                    <p>Carga de pacientes completa</p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                <tr className='bg-gray-400 bg-opacity-30 border-t-2 border-gray-600'>
                                    <td colSpan={5}>
                                        <div className="text-xl py-2 font-medium flex justify-center items-center text-black w-full">
                                            {listOfPatients.length > 0 ? (
                                                <p className='flex'>Búsqueda completada<TbUserSearch size={26} className="mt-0.5 ml-1" /></p>
                                            ) : (
                                                <p className='flex'>No hay resultados<LuSearchX size={26} className="mt-0.5 ml-1" /></p>
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