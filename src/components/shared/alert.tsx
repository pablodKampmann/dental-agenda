import { MdPersonRemoveAlt1 } from 'react-icons/md';
import { FaRunning } from 'react-icons/fa';
import { deletePatient } from "../patients/db/deletePatient";
import { ClipLoader } from "react-spinners";
import React, { useState } from 'react';
import { deleteAppointment } from "../appointments/deleteAppointment";
import { FaUser } from "react-icons/fa";
import { IoTimeSharp, IoLogoUsd } from "react-icons/io5";
import { AiFillPushpin } from "react-icons/ai";
import { deletePractice } from "../practices/deletePractice";
import { logOut } from "../auth/logOut";
interface ModalSettProps {
    onCloseAlert?: () => void;
    onSuccess?: () => void;
    action?: string | null;
    firstProp?: any | null;
    secondProp?: any | null;
    thirdProp?: any | null;
    fourthProp?: any | null;
    fifthProp?: any | null
}

export function Alert({ onCloseAlert, onSuccess, action, firstProp, secondProp, thirdProp, fourthProp, fifthProp }: ModalSettProps) {
    const [loading, setLoading] = useState(false);

    function handleCloseAlert() {
        if (onCloseAlert) {
            onCloseAlert();
        }
    }

    async function handleLogOut() {
        setLoading(true);
        const result = await logOut();
        if (result === null) {
            setLoading(false);
        } else {
            if (onSuccess) {
                onSuccess();
            }
        }
    }

    async function handleDeletePatient() {
        setLoading(true);
        const result = await deletePatient(thirdProp);
        if (result === null) {
            setLoading(false);
        } else {
            if (onSuccess) {
                onSuccess();
            }
        }
    }

    async function handleDeleteAppointment() {
        setLoading(true);
        const dateUpdate = secondProp.date.replace(/\//g, '');
        const result = await deleteAppointment(secondProp.id, dateUpdate)
        if (result === null) {
            setLoading(false);
        } else {
            if (onSuccess) {
                onSuccess();
            }
        }
    }

    async function handleDeletePractice() {
        setLoading(true);
        const result = await deletePractice(fourthProp, fifthProp);
        if (result === null) {
            setLoading(false);
        } else {
            if (onSuccess) {
                onSuccess();
            }
        }
    }

    function timeCalc(time: string) {
        const [hoursStr, minutesStr] = time.split(':');
        const hours = parseInt(hoursStr, 10);
        const newHours = hours + 1;
        const newTime = `${newHours.toString().padStart(2, '0')}:${minutesStr}`;
        return newTime;
    }

    if (action === 'Cerrar Sesion') {
        return (
            <div className="fixed inset-0 mt-8 flex items-center justify-center">
                <div className="flex flex-col p-6 rounded-lg shadow-xl bg-white border-4 border-gray-600">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-gray-700 rounded-full">
                            <FaRunning size={40} className="" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-gray-800 select-none">Ojo!</h2>
                        <p className="select-none mt-2 text-md text-gray-600 leading-relaxed">{firstProp}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseAlert} className="select-none flex-1 px-4 py-2 mr-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
                            Cancelar
                        </button>
                        <button onClick={handleLogOut} className="select-none flex-1 px-4 py-2 ml-1 bg-red-400 hover:bg-red-700 text-white text-md font-medium rounded-md transition duration-200">
                            {loading ? (
                                <div className='flex justify-center items-center py-0.5'>
                                    <ClipLoader className='' color="white" size={20} />
                                </div>
                            ) : (
                                action
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    } else if (action === 'Eliminar Paciente') {
        return (
            <div className="fixed inset-0 mt-8 flex items-center justify-center">
                <div className="flex flex-col p-6 rounded-lg shadow-xl bg-white border-4 border-gray-600">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-gray-700 rounded-full">
                            <MdPersonRemoveAlt1 size={40} className="" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-gray-800 select-none">Ojo!</h2>
                        <p className="select-none mt-2 text-md text-gray-600 leading-relaxed">{firstProp}</p>
                        <p className="select-none font-bold mb-2 text-md text-gray-600 leading-relaxed">{secondProp}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseAlert} className="select-none flex-1 px-4 py-2 mr-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
                            Cancelar
                        </button>
                        <button onClick={handleDeletePatient} className="select-none flex-1 px-4 py-2 ml-1 bg-red-400 hover:bg-red-700 text-white text-md font-medium rounded-md transition duration-200">
                            {loading ? (
                                <div className='flex justify-center items-center py-0.5'>
                                    <ClipLoader className='' color="white" size={20} />
                                </div>
                            ) : (
                                action
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    } else if (action === 'Eliminar Turno') {
        return (
            <div className="fixed inset-0 mt-8 flex items-center justify-center">
                <div className="flex flex-col p-6 rounded-lg shadow-xl bg-white border-4 border-gray-600">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-gray-700 rounded-full">
                            <MdPersonRemoveAlt1 size={40} className="" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-gray-800 select-none">Ojo!</h2>
                        <p className="select-none mt-2 text-md text-gray-600 leading-relaxed">{firstProp}</p>
                        <p className="select-none font-bold mb-2 mt-1 text-md text-gray-600 leading-relaxed flex justify-center items-center"><FaUser size={16} className="mr-1" /> {secondProp.patientData.name} {secondProp.patientData.lastName}</p>
                        <p className="select-none font-bold mb-2 text-md text-gray-600 leading-relaxed flex justify-center items-center"><AiFillPushpin size={20} className="mr-1" />{secondProp.reason}</p>
                        <p className="select-none font-bold mb-2 text-md text-gray-600 leading-relaxed flex justify-center items-center"><IoTimeSharp size={20} className="mr-1" />{secondProp.dayComplete}, {secondProp.time}-{timeCalc(secondProp.time)}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseAlert} className="select-none flex-1 px-4 py-2 mr-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
                            Cancelar
                        </button>
                        <button onClick={handleDeleteAppointment} className="select-none flex-1 px-4 py-2 ml-1 bg-red-400 hover:bg-red-700 text-white text-md font-medium rounded-md transition duration-200">
                            {loading ? (
                                <div className='flex justify-center items-center py-0.5'>
                                    <ClipLoader className='' color="white" size={20} />
                                </div>
                            ) : (
                                action
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    } else if (action === 'Eliminar Práctica') {
        return (
            <div className="fixed inset-0 mt-8 flex items-center justify-center">
                <div className="flex flex-col p-6 rounded-lg shadow-xl bg-white border-4  border-gray-600">
                    <div className="flex flex-col items-center text-center ">
                        <div className="p-3 bg-gray-700 rounded-full">
                            <MdPersonRemoveAlt1 size={40} className="" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-gray-800 select-none">Ojo!</h2>
                        <p className="select-none mt-2 text-md text-gray-600 leading-relaxed">{firstProp}</p>
                        <div className='flex mt-1 justify-center items-center'>
                            <AiFillPushpin size={24} className=" text-gray-600 mr-2" />
                            <p className="select-none font-bold text-md text-gray-600 long-message leading-relaxed flex justify-center items-center"> {secondProp}</p>
                        </div>
                        <p className="select-none font-bold mt-1 text-md text-gray-600 long-message leading-relaxed flex justify-center items-center"><IoLogoUsd size={22} /> {thirdProp}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseAlert} className="select-none flex-1 px-4 py-2 mr-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
                            Cancelar
                        </button>
                        <button onClick={handleDeletePractice} className="select-none flex-1 px-4 py-2 ml-1 bg-red-400 hover:bg-red-700 text-white text-md font-medium rounded-md transition duration-200">
                            {loading ? (
                                <div className='flex justify-center items-center py-0.5'>
                                    <ClipLoader className='' color="white" size={20} />
                                </div>
                            ) : (
                                action
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

