'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react';
import { ModalCreatePatient } from './../../components/patients/ui/modalCreatePatient'
import { GetPatients } from "./../../components/patients/db/getPatients";
import { SearchPatient } from "./../../components/patients/db/searchPatient";
import { TbUserSearch, TbReload } from 'react-icons/tb';
import { Loading } from "./../../components/general/loading";
import { BsClipboardCheck, BsPersonFillAdd } from "react-icons/bs";
import { LuSearchX } from "react-icons/lu";
import { BounceLoader, ClipLoader } from "react-spinners";

export default function Patients() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const [selectedField, setSelectedField] = useState('name');
    const [openModalCreatePatient, setOpenModalCreatePatient] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [listPatients, setListPatients] = useState<null | any[]>(null);
    const [searchContent, setSearchContent] = useState('');
    const [loadRow, setLoadRow] = useState<number | null>(null);
    const [isListPatientsComplete, setIsListPatientsComplete] = useState(false);
    const [loadMorePatientsButtom, setLoadMorePatientsButtom] = useState(true);

    useEffect(() => {
        if (listPatients) {
            setIsLoad(false);
        }
    }, [listPatients]);

    //GET PATIENTS LOGIC
    async function getPatients(quantity: number) {
        const data = await GetPatients(quantity);
        if (data) {
            setIsListPatientsComplete(data.full);
            setListPatients(data.patients);
        }
        setLoadMorePatientsButtom(false);
    }

    function loadMorePatients() {
        if (isListPatientsComplete !== true && listPatients !== null) {
            setLoadMorePatientsButtom(true);
            getPatients(listPatients.length * 2);
        }
    }

    //SEARCH PATIENTS LOGIC
    useEffect(() => {
        setSearchContent('');
    }, [selectedField]);

    useEffect(() => {
        let isCancelled = false;

        if (searchContent.length < 1) {
            getPatients(10);
        } else {
            const searchPatients = async () => {
                const patientsFilter = await SearchPatient(selectedField, searchContent);
                if (!isCancelled) {
                    setListPatients(patientsFilter);
                }
            };
            searchPatients();
        }

        return () => {
            isCancelled = true;
        };
    }, [searchContent, selectedField]);

    //USER EXPERIENCE 
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setShowSuccess(false);
        }, 6000);

        return () => clearTimeout(timeoutId);
    }, [showSuccess]);

    //ROUTING
    function handleGoPatient(patientId: any) {
        router.push(`/patients/${patientId}`);
    }


    return (
        <div className='h-screen p-4 w-full overflow-hidden'>
            {isLoad ? (
                <Loading />
            ) : (
                <div className='w-full h-screen'>

                    {/* FALTA REPASAR */}
                    {openModalCreatePatient && (
                        <div className="fixed inset-0 backdrop-blur-sm z-10">
                            <ModalCreatePatient onCloseModal={() => setOpenModalCreatePatient(false)} onSuccess={() => { setShowSuccess(true); getPatients(10) }} />
                        </div>
                    )}

                    <div className="flex h-10">
                        <div className="flex">
                            <div className='rounded-xl  flex justify-between h-full border-2 border-gray-600 '>
                                <TbUserSearch
                                    className="text-teal-600 bg-transparent mt-1 mx-1"
                                    size={24}
                                />
                                <input
                                    autoComplete="off"
                                    type="text"
                                    placeholder="Busca un paciente                      Por:"
                                    className="pl-1 w-60 h-full bg-transparent rounded-r-md  font-semibold focus:outline-none text-black text-sm"
                                    name='search'
                                    value={searchContent}
                                    onChange={(e) => {
                                        const inputValue = e.target.value;
                                        if (selectedField === 'dni') {
                                            const numericValue = inputValue.replace(/[^0-9]/g, '');
                                            setSearchContent(numericValue);
                                        } else {
                                            setSearchContent(inputValue);
                                        }
                                    }}
                                />
                            </div>
                            <div className='h-full text-sm font-semibold flex w-fit ml-2 px-3 select-none text-black '>
                                <button onClick={() => setSelectedField('name')} className={`${selectedField === 'name' ? 'bg-teal-600  text-white' : 'bg-white  hover:bg-teal-800 hover:text-white  '}  h-full  border-y-2 border-l-2 focus:outline-none border-gray-600 transition duration-150  rounded-l-lg w-24`}>NOMBRE</button>
                                <div className='h-full w-0.5 bg-gray-600'></div>
                                <button onClick={() => setSelectedField('dni')} className={`${selectedField === 'dni' ? 'bg-teal-600 text-white' : ' hover:bg-teal-800 bg-white hover:text-white  '} h-full border-y-2 border-r-2 focus:outline-none border-gray-600 transition duration-150  rounded-r-lg  w-16`}>DNI</button>
                            </div>
                            {loadRow !== null || searchContent !== '' && (
                                <div className='ml-2 flex justify-center items-center'>
                                    <ClipLoader speedMultiplier={1.7} color='rgb(15 118 110)' size={30} />
                                </div>
                            )}
                        </div>
                        <button onClick={() => setOpenModalCreatePatient(true)} type="button" className="shadow-lg h-full  ml-auto text-black hover:bg-teal-600 hover:border-gray-600 hover:text-white text-lg font-semibold  px-4 border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-xl flex items-center justify-center transition duration-150">
                            <BsPersonFillAdd className="mr-2" size={24} />
                            Agregar Paciente
                        </button>
                    </div>



                    <div className="flex mt-4 h-screen pb-40 overflow-y-hidden w-full ">
                        <div className=" rounded-xl w-full border-2 border-gray-600 overflow-y-auto overflow-x-hidden shadow-lg">
                            <table className="w-full h-full select-none ">
                                <thead>
                                    {/* 
                                    {showSuccess && (
                                        <div className="absolute right-0 py-1.5 px-4 border-2 border-gray-600 rounded-l-md bg-emerald-400 transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center text-black'>
                                                <BsClipboardCheck size={29} />
                                                <p className='ml-2 font-semibold text-md select-none'>Paciente agregado exitosamente</p>
                                            </div>
                                        </div>
                                    )}*/}
                                    <tr className="bg-teal-600 h-10 select-none border-b-2 border-gray-600  text-left text-sm font-semibold uppercase tracking-widest text-white">
                                        <th className='pl-5'>Nombre</th>
                                        <th className='pl-5'>Dni</th>
                                        <th className='pl-5'>Teléfono</th>
                                        <th className='pl-5'>Correo</th>
                                        <th className='pl-5'>Obra Social</th>
                                    </tr>
                                </thead>
                                {listPatients ? (
                                    <tbody>
                                        {listPatients.map((patient, index) => (
                                            <tr onClick={() => { handleGoPatient(patient.id); setLoadRow(index) }} key={index} className={`${index !== listPatients.length - 1 ? 'border-b border-gray-600' : ''} ${loadRow === index ? 'bg-teal-600' : 'hover:bg-gray-900 hover:bg-opacity-30 bg-opacity-30'} text-sm h-14 whitespace-nowrap text-nowrap text-black cursor-pointer ml-auto transition duration-150`}>
                                                <td className="pl-5">
                                                    <p>{patient.name} {patient.lastName}</p>
                                                </td>
                                                <td className="pl-5">
                                                    <p>{patient.dni}</p>
                                                </td>
                                                <td className="pl-5">
                                                    {patient.num ? (
                                                        <p>{patient.num}</p>
                                                    ) : (
                                                        <p>-</p>
                                                    )}
                                                </td>
                                                <td className="pl-5">
                                                    {patient.email ? (
                                                        <p>{patient.email}</p>
                                                    ) : (
                                                        <p>-</p>
                                                    )}
                                                </td>
                                                <td className="pl-5 ">
                                                    <p>{patient.insurance}</p>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className='text-center text-xs  h-6 font-semibold border-t border-gray-600 bg-transparent group text-black'>
                                            <td colSpan={5}>
                                                Número de pacientes: {listPatients.length}
                                            </td>
                                        </tr>
                                        {searchContent === '' ? (
                                            <tr onClick={loadMorePatients} className={`${isListPatientsComplete !== true ? 'bg-teal-600 hover:bg-opacity-85 transition duration-150 cursor-pointer group' : 'bg-teal-600 '} border-t-2 border-gray-600 `}>
                                                <td colSpan={5} className=''>
                                                    {loadMorePatientsButtom ? (
                                                        <div className='flex justify-center items-center'>
                                                            <ClipLoader speedMultiplier={1.7} color='rgb(15 118 110)' size={30} />
                                                        </div>
                                                    ) : (
                                                        <div className="text-xl py-2 font-medium flex justify-center items-center text-white w-full">
                                                            {isListPatientsComplete !== true ? (
                                                                <p className='flex justify-center items-center'>Mostrar más pacientes<TbReload size={26} className="ml-1" /></p>
                                                            ) : (
                                                                <p>Carga de pacientes completa</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr className='bg-gray-400 bg-opacity-30 border-t border-b border-gray-600'>
                                                <td colSpan={5} className=''>
                                                    <div className="text-xl py-2 font-medium flex justify-center items-center text-black w-full">
                                                        {listPatients.length > 0 ? (
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
                </div >
            )
            }
        </div >
    );
}
