'use client'

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { ModalCreatePatient } from './../components/modalCreatePatient'
import { SuccessPatientAlert } from "./../components/successPatientAlert";
import { ref, onValue } from "firebase/database";
import { db } from "./../firebase";
import { GetPatients } from "./../components/getPatients";

export default function Page() {
    const [page, setPage] = useState(1);
    const [disableBack, setDisableBack] = useState(false);
    const [disableNext, setDisableNext] = useState(false);
    const [selectedField, setSelectedField] = useState('name');
    const [openModalCreatePatient, setOpenModalCreatePatient] = useState(false);
    const [executeSuccessPatientAlert, setExecuteSuccessPatientAlert] = useState(false);
    const [listPatients, setListPatients] = useState<null | any[]>(null);

    useEffect(() => {
        if (page === 1) {
            setDisableBack(true);
        } else {
            setDisableBack(false);
        }
    }, [page]);

    const HandleSelectChange = (event: any) => {
        setSelectedField(event.target.value);
    };

    const showSuccessAlert = () => {
        setExecuteSuccessPatientAlert(true);
        setTimeout(() => {
            setExecuteSuccessPatientAlert(false);
        }, 5000);
    }

    function HandleClickRow(patient: any) {
        console.log(patient.name);
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

    function HandleBackPage() {
        if (page !== 1) {
            setPage(page - 1)
        }
    }

    function HandleNextPage() {
        setPage(page + 1)
    }

    useEffect(() => {
        async function Get() {
            const patients = await GetPatients(page);
            setListPatients(patients);
        }

        const patientsRef = ref(db, "patients");
        const unsubscribe = onValue(patientsRef, async () => {
            Get();
        });

        return () => unsubscribe();
    }, [page]);

    return (
        <div className="p-4 sm:ml-64">
            <div>
                {openModalCreatePatient && (
                    <div>
                        <ModalCreatePatient onCloseModal={CloseModalCreatePatient} onSuccess={showSuccessAlert} />
                    </div>
                )}
                {executeSuccessPatientAlert && (
                    <div>
                        <SuccessPatientAlert />
                    </div>
                )}
            </div>
            <div className="p-4 rounded-md mt-14">
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="flex rounded-full relative">
                        <Image
                            src="/lupaWhite.png"
                            height={22}
                            width={22}
                            alt="Lupa"
                            className="absolute left-3 top-2"
                        />
                        <input
                            type="text"
                            placeholder="Busca un paciente                    Por:"
                            className="pl-10 w-full md:w-100 h-10 rounded-l-lg border-2 border-blue-800 font-semibold bg-gray-500 focus:outline-none focus:border-blue-500 text-white text-lg"
                        />
                        <select
                            id="pricingType"
                            name="pricingType"
                            className="w-40 h-10 border-2 border-blue-800 bg-gray-500 focus:outline-none focus:border-blue-500 text-white text-lg rounded-r-lg px-2 md:px-3 py-0 md:py-1 tracking-wider"
                            onChange={HandleSelectChange}
                        >
                            <option value="name">Nombre</option>
                            <option value="dni">Dni</option>
                        </select>
                    </div>
                    <button onClick={OpenModalCreatePatient} type="button" className="ml-auto h-10 bg-blue-900 hover:bg-blue-800 text-white text-lg font-semibold py-2 px-4 md:px-12 border-b-4 border-blue-700 hover:border-blue-500 rounded-lg flex items-center">
                        <span className="text-2xl md:text-3xl mr-2 md:mr-4">+</span> Agregar Paciente
                    </button>
                </div>
            </div>
            <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-1">
                <div className="overflow-y-hidden rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-blue-900 text-left text-xs font-semibold uppercase tracking-widest text-white">
                                    <th className="px-5 py-3">Nombre</th>
                                    <th className="px-5 py-3">Dni</th>
                                    <th className="px-5 py-3">Contacto</th>
                                    <th className="px-5 py-3">Obra Social</th>
                                    <th className="px-5 py-3">N. Afiliado</th>
                                    <th className="px-5 py-3">Acciones</th>
                                </tr>
                            </thead>
                            {listPatients ? (
                                <tbody className="text-white">
                                    {listPatients.map((patient, index) => (
                                        <tr key={index} onClick={() =>  HandleClickRow(patient)} className="border-b border-gray-200 bg-gray-500 text-sm hover:bg-gray-800 hover:text-white">
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {patient.gender === 'male' ? (
                                                        <div className="h-10 w-10 flex items-center justify-center">
                                                            <Image width={34} height={34} src="/maleIcon.png" alt="" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-10 flex items-center justify-center">
                                                            <Image width={36} height={36} src="/femaleIcon.png" alt="" />
                                                        </div>
                                                    )}
                                                    <div className="ml-3">
                                                        <p>{patient.name} {patient.lastName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <p>{patient.dni}</p>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <p>{patient.num}</p>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <p>{patient.obra}</p>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <p>{patient.affiliateNum}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            HandleModify();
                                                        }}
                                                        className="rounded-full bg-blue-200 px-3 py-2 text-xs font-bold text-blue-900 hover:bg-blue-900 hover:text-white transition duration-300"
                                                    >
                                                        Modificar Datos
                                                    </button>
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            HandleClinicalFile();
                                                        }}
                                                        className="rounded-full bg-red-300 px-3 py-2 text-xs font-bold text-red-950 hover:bg-red-900 hover:text-white transition duration-300"
                                                    >
                                                        Ficha Clinica
                                                    </button>
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            HandleHistory();
                                                        }}
                                                        className="rounded-full bg-green-200 px-3 py-2 text-xs font-bold text-green-900 hover:bg-green-900 hover:text-white transition duration-300"
                                                    >
                                                        Historia Clinica
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            ) : null}
                        </table>
                    </div>
                    <div className="flex flex-col items-center border-t bg-gray-500 px-5 py-5 sm:flex-row sm:justify-between">
                        <span className="text-xs text-white sm:text-sm"> Mostrando X de X </span>
                        <div className="mt-2 inline-flex sm:mt-0">
                            {disableBack ? (
                                <button disabled onClick={HandleBackPage} className="mr-2 h-12 w-24 rounded-full bg-gray-400 text-white text-md font-semibold transition duration-150">Anterior</button>
                            ) : (
                                <button onClick={HandleBackPage} className="mr-2 h-12 w-24 rounded-full bg-blue-800 hover:bg-blue-600 text-white text-md font-semibold transition duration-150">Anterior</button>
                            )}
                            <button onClick={HandleNextPage} className="h-12 w-24 rounded-full bg-blue-800 hover:bg-blue-600 text-white text-md font-semibold transition duration-150">Siguiente</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
