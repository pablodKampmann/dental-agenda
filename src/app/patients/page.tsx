'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react';
import { ModalCreatePatient } from '../components/style/modalCreatePatient'
import { GetPatients } from "../components/patients/getPatients";
import { SearchPatient } from "../components/patients/searchPatient";
import { TbUserSearch, TbReload } from 'react-icons/tb';
import { auth } from "./../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loading } from "../components/style/loading";
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
    const [loadMorePatientsButtom, setLoadMorePatientsButtom] = useState(false);

    //CHECK IF THE USER IS LOGGED IN
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && listPatients) {
                setIsLoad(false);
            } else if (!user) {
                router.push("/notSign");
            }
        });

        return () => unsubscribe();
    }, [router, listPatients]);

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
        <div className='h-screen overflow-hidden flex-1'>
            {isLoad ? (
                <Loading />
            ) : (
                <div className="p-4  ml-56 mt-2 overflow-y-hidden">
                    <div>
                        {openModalCreatePatient && (
                            <div className="fixed inset-0 backdrop-blur-sm ml-56 z-10">
                                <ModalCreatePatient onCloseModal={() => setOpenModalCreatePatient(false)} onSuccess={() => { setShowSuccess(true); getPatients(10) }} />
                            </div>
                        )}
                    </div>
                    <div className="mr-2 ml-2 rounded-md mt-16">
                        <div className="flex flex-row items-center select-none">
                            <div className="flex rounded-full relative">
                                <TbUserSearch
                                    className="absolute mt-2 ml-2 text-teal-600"
                                    size={24}
                                />
                                <input
                                    autoComplete="off"
                                    type="text"
                                    placeholder="Busca un paciente           Por:"
                                    className="shadow-lg pl-10 w-60 md:w-100 h-10 rounded-lg border-2 border-gray-600 font-semibold bg-gray-300 bg-opacity-30 focus:border-3 focus:outline-none text-black text-sm"
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
                                <button onClick={() => setSelectedField('name')} className={`${selectedField === 'name' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-gray-300 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg ml-4 border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-l-lg transition duration-300 px-3 select-none w-24`}>NOMBRE</button>
                                <button onClick={() => setSelectedField('dni')} className={`${selectedField === 'dni' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-gray-300 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-r-lg transition duration-300 px-3 select-none w-16`}>DNI</button>
                                {loadRow !== null ? (
                                    <div className='ml-4 flex justify-center items-center'>
                                        <ClipLoader size={28} />
                                    </div>
                                ) : (
                                    <div className={`${searchContent !== '' ? 'opacity-100' : 'opacity-0'} duration-1000 transition-opacity ml-4 flex justify-center items-center`}>
                                        <BounceLoader speedMultiplier={1.8} color='rgb(15 118 110)' size={30} />
                                    </div>
                                )}
                            </div>
                            <div className='flex justify-end items-center ml-auto'>
                                <button onClick={() => setOpenModalCreatePatient(true)} type="button" className="shadow-lg h-10 text-black bg-gray-300 bg-opacity-30 hover:bg-teal-600 hover:border-gray-600 hover:text-white text-xl font-semibold  px-4 border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-lg flex items-center justify-center transition duration-200">
                                    <BsPersonFillAdd className=" mr-2" size={24} />
                                    Agregar Paciente
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex mt-6 h-screen pb-44  overflow-y-hidden w-full ">
                        <div className="mx-2 rounded-lg w-full border-2 border-gray-600 overflow-y-auto bg-gray-300 bg-opacity-30 overflow-x-hidden shadow-lg">
                            <table className="w-full select-none ">
                                <thead className='relative'>
                                    {showSuccess && (
                                        <div className="absolute right-0 py-1.5 px-4 border-2 border-gray-600 rounded-l-md bg-emerald-400 transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center text-black'>
                                                <BsClipboardCheck size={29} />
                                                <p className='ml-2 font-semibold text-md select-none'>Paciente agregado exitosamente</p>
                                            </div>
                                        </div>
                                    )}
                                    <tr className="bg-teal-600  select-none border-b-2 border-gray-600 text-left text-sm font-semibold uppercase tracking-widest text-white">
                                        <th className="px-5 py-3 ">Nombre</th>
                                        <th className="px-5 py-3">Dni</th>
                                        <th className="px-5 py-3">Teléfono</th>
                                        <th className="px-5 py-3">Correo</th>
                                        <th className="px-5 py-3">Obra Social</th>
                                    </tr>
                                </thead>
                                {listPatients ? (
                                    <tbody className="text-white  ">
                                        {listPatients.map((patient, index) => (
                                            <tr onClick={() => { handleGoPatient(patient.id); setLoadRow(index) }} key={index} className={`${index !== listPatients.length - 1 ? 'border-b border-gray-600' : ''} ${loadRow === index ? 'bg-teal-600' : 'hover:bg-gray-900 hover:bg-opacity-30 bg-opacity-30'} text-sm cursor-pointer ml-auto transition duration-75`}>
                                                <td className="px-5 py-5 whitespace-nowrap text-black">
                                                    <p>{patient.name} {patient.lastName}</p>
                                                </td>
                                                <td className="px-5 whitespace-nowrap text-black">
                                                    <p>{patient.dni}</p>
                                                </td>
                                                <td className="px-5 whitespace-nowrap text-black">
                                                    {patient.num ? (
                                                        <p>{patient.num}</p>
                                                    ) : (
                                                        <p>-</p>
                                                    )}
                                                </td>
                                                <td className="px-5 whitespace-nowrap text-black ">
                                                    {patient.email ? (
                                                        <p>{patient.email}</p>
                                                    ) : (
                                                        <p>-</p>
                                                    )}
                                                </td>
                                                <td className="px-5 whitespace-nowrap text-black ">
                                                    <p>{patient.insurance}</p>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className='text-center text-xs font-semibold border-t border-gray-600 bg-transparent group text-black'>
                                            <td colSpan={5}>
                                                Número de pacientes: {listPatients.length}
                                            </td>
                                        </tr>
                                        {searchContent === '' ? (
                                            <tr onClick={loadMorePatients} className={`${isListPatientsComplete !== true ? 'bg-teal-600 hover:bg-opacity-85 transition duration-300 cursor-pointer group' : 'bg-gray-400 bg-opacity-30 '} border-t border-gray-600 `}>
                                                <td colSpan={5} className=''>
                                                    {loadMorePatientsButtom ? (
                                                        <div className='flex justify-center items-center'>
                                                            <ClipLoader size={28} className="my-2" color='white' />
                                                        </div>
                                                    ) : (
                                                        <div className="text-xl py-2 font-medium flex justify-center items-center text-black group-hover:text-white transition duration-300 w-full">
                                                            {isListPatientsComplete !== true ? (
                                                                <p className='flex'>Mostrar más pacientes<TbReload size={26} className="mt-0.5 ml-1" /></p>
                                                            ) : (
                                                                <p className='flex'>Carga de pacientes completa</p>
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
