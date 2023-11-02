'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react';
import { ModalCreatePatient } from './../components/modalCreatePatient'
import { SuccessPatientAlert } from "./../components/successPatientAlert";
import { ref, onValue } from "firebase/database";
import { db } from "./../firebase";
import { GetPatients } from "./../components/getPatients";
import { SearchPatient } from "./../components/searchPatient";
import { SyncLoader } from "react-spinners";
import { MdPersonSearch } from 'react-icons/md';
import { TbUserSearch } from 'react-icons/tb';
import { auth } from "./../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";

export default function Patients() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const [page, setPage] = useState(1);
    const [maxPage, setMaxPage] = useState(Number);
    const [disableBack, setDisableBack] = useState(false);
    const [disableNext, setDisableNext] = useState(false);
    const [showMin, setShowMin] = useState(Number);
    const [showMax, setShowMax] = useState(Number);
    const [selectedField, setSelectedField] = useState('name');
    const [openModalCreatePatient, setOpenModalCreatePatient] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [leaveModal, setLeaveModal] = useState(false);
    const [totalPatients, setTotalPatients] = useState(0);
    const [listPatients, setListPatients] = useState<null | any[]>(null);
    const [searchContent, setSearchContent] = useState('');
    const [nextPageLoad, setNextPageLoad] = useState(false);
    const [backPageLoad, setBackPageLoad] = useState(false);
    const [loadRow, setLoadRow] = useState<number | null>(null);

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

    const showSuccessAlert = () => {
        setShowSuccess(true);
        setTimeout(() => {
            setLeaveModal(true);
            setTimeout(() => {
                setShowSuccess(false);
                setLeaveModal(false);
            }, 450)
        }, 5000);
    }

    function HandleModify() {
        console.log("modificar");
    }

    function HandleClinicalFile() {
        console.log("clinica");
    }

    function HandleHistory() {
        console.log("historial");
    }

    function OpenModalCreatePatient() {
        setOpenModalCreatePatient(true);
    }

    function CloseModalCreatePatient() {
        setOpenModalCreatePatient(false);
    }

    useEffect(() => {
        if (page === 1) {
            setDisableBack(true);
        } else {
            setDisableBack(false);
        }
        if (page === maxPage) {
            setDisableNext(true);
        } else {
            setDisableNext(false);
        }
    }, [page, maxPage]);

    function HandleBackPage() {
        setBackPageLoad(true);
        setPage(page - 1)
    }

    function HandleNextPage() {
        setNextPageLoad(true);
        setPage(page + 1);
    }

    useEffect(() => {
        setSearchContent('');
    }, [selectedField]);

    useEffect(() => {
        if (searchContent.length > 0) {
            Search();
        }
        if (searchContent === "") {
            Get();
        }

        async function Search() {
            const patientsFilter = await SearchPatient(selectedField, searchContent)
            setListPatients(patientsFilter)
        }

        async function Get() {
            const data = await GetPatients(page, 6);
            setListPatients(data.patients);
        }
    }, [searchContent, page, selectedField])

    useEffect(() => {
        async function Get() {
            const data = await GetPatients(page, 6);
            setListPatients(data.patients);
            setTotalPatients(data.patientsSize);
            UpdateData(data.patientsSize);
            setNextPageLoad(false);
            setBackPageLoad(false);
        }

        function UpdateData(patientsSize: any) {
            const totalPags = Math.ceil(patientsSize / 6);
            const a = (page - 1) * 6 + 1;
            const b = page * 6;
            setMaxPage(totalPags);
            setShowMin(a);
            if (b > totalPatients && page > 5) {
                setShowMax(totalPatients);
            } else {
                setShowMax(b);
            }
        }

        const patientsRef = ref(db, "patients");
        const unsubscribe = onValue(patientsRef, async () => {
            Get();
        })

        return () => unsubscribe();
    }, [page, totalPatients]);

    function handleGoPatient(patientId: any) {
        router.push(`/patients/${patientId}`);
    }

    return (
        <div>
            {isLoad ? (
                <div className='fixed inset-0 backdrop-blur-sm ml-56'>
                    <div className='fixed inset-0 flex items-center justify-center'>
                        <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                            <FaTooth size={100} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 ml-56 mt-2 relative">
                    <div>
                        {openModalCreatePatient && (
                            <div className="fixed inset-0 backdrop-blur-sm ml-56 z-10">
                                <ModalCreatePatient onCloseModal={CloseModalCreatePatient} onSuccess={showSuccessAlert} />
                            </div>
                        )}
                    </div>
                    <div className="mr-2 ml-2 rounded-md mt-16">
                        <div className="flex flex-row items-center">
                            <div className="flex rounded-full relative">
                                <TbUserSearch
                                    className="absolute mt-2 ml-2 text-teal-600"
                                    size={24}
                                />
                                <input
                                    type="text"
                                    placeholder="Busca un paciente                              Por:"
                                    className="shadow-lg pl-10 w-96 md:w-100 h-10 rounded-lg border-2 border-gray-600 font-semibold bg-gray-400 bg-opacity-30 focus:border-3 focus:outline-none focus:border-teal-600 text-black text-lg"
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
                                <button onClick={() => setSelectedField('dni')} className={`${selectedField === 'dni' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg ml-4 border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-l-lg transition duration-300 px-3 select-none w-24`}>DNI</button>
                                <button onClick={() => setSelectedField('name')} className={`${selectedField === 'name' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-gray-400 bg-opacity-30 hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg border-2 focus:outline-none border-gray-600 text-md font-semibold rounded-r-lg transition duration-300 px-3 select-none w-24`}>NOMBRE</button>
                            </div>
                            <div className='flex justify-end items-center ml-auto'>
                                {showSuccess && (
                                    <div className='flex fixed items-end justify-end ml-4 mr-80 transform -translate-y-7'>
                                        <div className={`${leaveModal ? 'animate-slide-up' : 'animate-slide-down'}`}>
                                            <SuccessPatientAlert />
                                        </div>
                                    </div>
                                )}
                                <button onClick={OpenModalCreatePatient} type="button" className="group shadow-xl h-10 text-black bg-gray-400 bg-opacity-30 hover:bg-teal-600 hover:border-teal-500 hover:text-white text-xl font-semibold py-2 px-12 border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-lg flex items-center justify-center transition duration-200">
                                    <span className="text-3xl text-black mr-4 group-hover:text-white transition duration-200">+</span> Agregar Paciente
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-y-hidden overflow-x-hidden rounded-lg border-2 border-gray-600 ml-2 mr-2 mt-4">
                        <div className="overflow-x-auto">
                            <table className="w-full ">
                                <thead>
                                    <tr className="bg-teal-600 select-none border-b-2 border-gray-600 text-left text-sm font-semibold uppercase tracking-widest text-white">
                                        <th className="px-5 py-3 ">Nombre</th>
                                        <th className="px-5 py-3">Dni</th>
                                        <th className="px-5 py-3">Contacto</th>
                                        <th className="px-5 py-3">Obra Social</th>
                                        <th className="px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                {listPatients ? (
                                    <tbody className="text-white">
                                        {listPatients.map((patient, index) => (
                                            <tr onClick={() => { handleGoPatient(patient.id); setLoadRow(index) }} key={index} className={`${loadRow === index ? 'bg-gradient-to-r from-teal-900 via-teal-700 to-teal-500 background-animate' : 'hover:bg-teal-600 bg-gray-400 bg-opacity-30'} border-b border-gray-600 text-sm cursor-pointer ml-auto transition duration-75`}>
                                                <td className="px-5 py-5">
                                                    <div className="flex items-center">
                                                        <div className="text-center text-white items-center justify-center flex mr-2 rounded-full h-6 w-6 bg-teal-500 text-md font-semibold">
                                                            <p>{patient.id}</p>
                                                        </div>
                                                        <div className="ml-3 text-black">
                                                            <p>
                                                                {patient.name} {patient.lastName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 whitespace-nowrap text-black">
                                                    <p>{patient.dni}</p>
                                                </td>
                                                <td className="px-5 whitespace-nowrap text-black">
                                                    <p>{patient.num}</p>
                                                </td>
                                                <td className="px-5  whitespace-nowrap text-black">
                                                    <p>{patient.obra}</p>
                                                </td>
                                                <td className="px-5 ">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleGoPatient(patient.id);
                                                            }}
                                                            className="rounded-full bg-white px-3 py-2 text-sm font-bold text-teal-900 hover:bg-teal-700 hover:text-white transition duration-200"
                                                        >
                                                            Modificar Datos
                                                        </button>
                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                HandleHistory();
                                                            }}
                                                            className="rounded-full bg-teal-100 px-3 py-2 text-sm font-bold text-teal-900 hover:bg-teal-700 hover:text-white transition duration-200"
                                                        >
                                                            Historia Clinica
                                                        </button>
                                                        <button
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                HandleClinicalFile();
                                                            }}
                                                            className="rounded-full bg-teal-200 px-3 py-2 text-sm font-bold text-teal-900 hover:bg-teal-700 hover:text-white transition duration-200"
                                                        >
                                                            Odontograma
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ) : null}
                            </table>
                        </div>
                        <div className="justify-between flex items-center bg-gray-400 bg-opacity-30 px-5 py-2">
                            {searchContent ? (
                                <span className="text-sm text-black mr-20 select-none">
                                    Filtrando Pacientes...
                                </span>
                            ) : (
                                <span className="text-sm text-black select-none">
                                    Mostrando {showMin}-{showMax} de {totalPatients}
                                </span>
                            )}
                            <div className='flex mt-2'>
                                {disableBack ? (
                                    <button disabled className="select-none shadow-lg translate-x-6 mr-2 h-12 w-24 rounded-full bg-gray-400 text-white text-md font-semibold ">Anterior</button>
                                ) : (
                                    <button onClick={HandleBackPage} disabled={backPageLoad} className="select-none shadow-lg translate-x-6 mr-2 h-12 w-24 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-md font-semibold transition duration-200">
                                        {backPageLoad ? (
                                            <SyncLoader size={8} color="white" />
                                        ) : (
                                            "Anterior"
                                        )}
                                    </button>
                                )}
                                {disableNext ? (
                                    <button disabled className="select-none shadow-lg translate-x-6 h-12 w-24 rounded-full bg-gray-400 text-white text-md font-semibold ">Siguiente</button>
                                ) : (
                                    <button onClick={HandleNextPage} disabled={nextPageLoad} className="select-none shadow-lg translate-x-6 h-12 w-24 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-md font-semibold transition duration-200">
                                        {nextPageLoad ? (
                                            <SyncLoader size={8} color="white" />
                                        ) : (
                                            "Siguiente"
                                        )}
                                    </button>
                                )}
                                <div className="select-none overflow-hidden h-14 w-14 translate-x-9 translate-y-7 rounded-full bg-teal-600 text-white text-2xl font-bold flex justify-center  ">
                                    {searchContent ? (
                                        <span className="">
                                            <MdPersonSearch className="text-white mr-2 mt-1" size={25} />
                                        </span>
                                    ) : (
                                        <span className="mr-2 mt-1 shadow-lg ">
                                            {page}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
