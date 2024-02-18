import { MdPersonRemoveAlt1 } from 'react-icons/md';
import { FaRunning } from 'react-icons/fa';
import { deletePatient } from "./deletePatient";
import { useRouter } from 'next/navigation'
import { logOut } from "./../components/logOut";
import { ClipLoader } from "react-spinners";
import React, { useState } from 'react';
import { Appointment } from "./../page";
import { deleteAppointment } from "./deleteAppointment";
import { FaUser } from "react-icons/fa";
import { IoTimeSharp } from "react-icons/io5";
import { AiFillPushpin } from "react-icons/ai";

interface ModalSettProps {
    onCloseModal: () => void;
    onSuccess?: () => void;
    firstMessage: string | null;
    secondMessage: string | null;
    action: string | null;
    id: string | null;
    appointment: Appointment | any | null;
}

export function Alert({ id, firstMessage, secondMessage, action, onCloseModal, appointment, onSuccess }: ModalSettProps) {

    const router = useRouter()
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        const result = await deletePatient(id);
        if (result !== 'error') {
            router.push('/patients')
        }
    }

    async function handleDeleteAppointment() {
        setLoading(true);
        if (appointment) {
            const dateUpdate = appointment.date.replace(/\//g, '');
            const result = await deleteAppointment(appointment.id, dateUpdate)
            if (result !== 'error') {
                if (onSuccess) {
                    onSuccess();
                }
            }
            onCloseModal();
        }
    }

    async function handleLogOut() {
        setLoading(true);
        await logOut();
        onCloseModal();
    }

    function handleCloseModal() {
        onCloseModal();
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
                        <p className="select-none mt-2 text-md text-gray-600 leading-relaxed">{firstMessage}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseModal} className="select-none flex-1 px-4 py-2 mr-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
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
    } else if (action === 'Eliminar') {
        return (
            <div className="fixed inset-0 mt-8 flex items-center justify-center">
                <div className="flex flex-col p-6 rounded-lg shadow-xl bg-white border-4 border-gray-600">
                    <div className="flex flex-col items-center text-center">
                        <div className="p-3 bg-gray-700 rounded-full">
                            <MdPersonRemoveAlt1 size={40} className="" />
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-gray-800 select-none">Ojo!</h2>
                        <p className="select-none mt-2 text-md text-gray-600 leading-relaxed">{firstMessage}</p>
                        <p className="select-none font-bold mb-2 text-md text-gray-600 leading-relaxed">{secondMessage}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseModal} className="select-none flex-1 px-4 py-2 mr-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
                            Cancelar
                        </button>
                        <button onClick={handleDelete} className="select-none flex-1 px-4 py-2 ml-1 bg-red-400 hover:bg-red-700 text-white text-md font-medium rounded-md transition duration-200">
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
                        <p className="select-none mt-2 text-md text-gray-600 leading-relaxed">{firstMessage}</p>
                        <p className="select-none font-bold mb-2 mt-1 text-md text-gray-600 leading-relaxed flex justify-center items-center"><FaUser size={16} className="mr-1" /> {appointment.patientData.name} {appointment.patientData.lastName}</p>
                        <p className="select-none font-bold mb-2 text-md text-gray-600 leading-relaxed flex justify-center items-center"><AiFillPushpin size={20} className="mr-1" />{appointment.reason}</p>
                        <p className="select-none font-bold mb-2 text-md text-gray-600 leading-relaxed flex justify-center items-center"><IoTimeSharp size={20} className="mr-1" />{appointment.dayComplete}, {appointment.time}-{timeCalc(appointment.time)}</p>
                    </div>
                    <div className="flex items-center mt-3">
                        <button onClick={handleCloseModal} className="select-none flex-1 px-4 py-2 mr-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium rounded-md transition duration-200">
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
    }
}
