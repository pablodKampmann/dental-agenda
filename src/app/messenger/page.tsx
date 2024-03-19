'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react';
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loading } from "./../components/loading";
import { BsChatSquareText } from "react-icons/bs";
import { AiOutlineNotification } from "react-icons/ai";
import { FaWhatsapp, FaMale, FaFemale } from "react-icons/fa";
import { GetPatients } from "./../components/getPatients";
import { SearchPatient } from "./../components/searchPatient";
import { BounceLoader, ClipLoader } from "react-spinners";
import { LuSearchX } from "react-icons/lu";
import { getPatient } from "./../components/getPatient";
import { getPatientAppointments } from "./../components/getPatientAppointments";
import { MdMailOutline } from "react-icons/md";
import { PiDownload } from "react-icons/pi";
import { LiaMoneyCheckAltSolid } from "react-icons/lia";
import { TbMessageShare } from "react-icons/tb";

export default function Messenger() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const [isLoadPatient, setIsLoadPatient] = useState(false);
    const [isLoadAppointments, setIsLoadAppointments] = useState(false);
    const [action, setAction] = useState<string>('');
    const [patientSelected, setPatientSelected] = useState<any>(null);
    const [patientAppointments, setPatientAppointments] = useState<null | any[]>(null);
    const [appointmentSelected, setAppointmentSelected] = useState<any>(null);
    const [selectedField, setSelectedField] = useState('name');
    const [listPatients, setListPatients] = useState<null | any[]>(null);
    const [searchContent, setSearchContent] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsLoad(false);
            } else if (!user) {
                router.push("/notSign");
            }
        });

        return () => unsubscribe();
    }, [router]);

    //GET PATIENTS LOGIC
    async function getPatients(quantity: number) {
        const data = await GetPatients(quantity);
        setListPatients(data.patients);
    }

    //SEARCH PATIENTS LOGIC
    useEffect(() => {
        setSearchContent('');
    }, [selectedField]);

    useEffect(() => {
        let isCancelled = false;

        if (searchContent.length < 1) {
            getPatients(14);
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

    async function handleSetPatient(patientId: number) {
        setIsLoadAppointments(true);
        reset();
        const patientResult = await getPatient(patientId);
        if (patientResult) {
            setIsLoadPatient(false);
            setPatientSelected(patientResult)
            const patientAppointments = await getPatientAppointments(patientResult.id);
            if (patientAppointments) {
                setIsLoadAppointments(false);
                setPatientAppointments(patientAppointments)
            } else {
                setIsLoadAppointments(false);
            }
        }
    }

    function reset() {
        setPatientAppointments(null);
        setAppointmentSelected(null);
    }

    function getAge(date: any) {
        var today = new Date();
        var parts = date.split("/");
        var birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }


    function createPdf() {
        //createAppointmentPDF(appointmentSelected, patientSelected);
    }

    function sendWhatsApp() {
        /*
        const message = `Estimado/a ${patientSelected.name} ${patientSelected.lastName},

        Este es un recordatorio de tu próximo turno en Consultorio Odontológico Dra. Karina Alvarez:

        - Fecha y hora del turno: ${appointmentSelected.dayComplete} ${appointmentSelected.year}, a las ${appointmentSelected.time}
        - Razón de la cita: ${appointmentSelected.reason}

        Por favor, no olvides traer tu documento de identidad y los detalles de tu obra social.

        Dirección:
        Consultorio Odontológico Dra. Karina Alvarez
        Argentina, Mar del Plata, 11 de Septiembre 4075
        (+54) 2234 37-8249

        ¡Esperamos verte pronto!

        Atentamente,
        Consultorio Odontológico Dra. Karina Alvarez`;

        const encodedMessage = encodeURIComponent(message);
        const cleanedPhoneNumber = patientSelected.num.replace(/\s/g, '');
        const whatsappLink = `https://wa.me/${cleanedPhoneNumber}?text=${encodedMessage}`;

        window.open(whatsappLink);*/
    }

    return (
        <div className='ml-56 overflow-hidden  h-screen flex-1 '>
            {isLoad ? (
                <Loading />
            ) : (
                <div className='p-6 mt-16  overflow-y-hidden'>
                    <div className="flex select-none">
                        <div onClick={() => setAction('contactPatient')} className={`${action !== '' && action !== 'contactPatient' ? 'bg-gray-600 bg-opacity-30' : ''} ${action === 'contactPatient' ? 'bg-teal-600 border-gray-600' : 'bg-gray-300 bg-opacity-30 border-gray-400'} py-4 shadow-lg group relative h-1/4 cursor-pointer  hover:bg-teal-600 hover:bg-opacity-80 transition duration-300 border-2 w-1/2 rounded-lg  `}>
                            <div className={`${action === 'contactPatient' ? 'text-white scale-105' : 'text-gray-500'} flex justify-center items-center group-hover:text-white  text-xl font-bold group-hover:scale-105 duration-300 tracking-tight uppercase`}>
                                Contactar Paciente
                                <BsChatSquareText className="ml-4" size={44} />
                            </div>
                            <FaWhatsapp size={20} className={`${action === 'contactPatient' ? 'text-green-400 scale-125 right-2 bottom-2' : 'text-transparent right-1 bottom-1'} absolute group-hover:scale-125 group-hover:right-2 group-hover:bottom-2 duration-300   group-hover:text-green-400 `} />
                        </div>
                        <div onClick={() => setAction('notifyTurn')} className={`${action !== '' && action !== 'notifyTurn' ? 'bg-gray-600 bg-opacity-30' : ''} ${action === 'notifyTurn' ? 'bg-teal-600 border-gray-600' : 'bg-gray-300 bg-opacity-30 border-gray-400'} py-4 shadow-lg group relative h-1/4 cursor-pointer  hover:bg-teal-600 hover:bg-opacity-80 transition duration-300 border-2 ml-4 mr-4 w-1/2 rounded-lg  `}>
                            <div className={`${action === 'notifyTurn' ? 'text-white scale-105' : 'text-gray-500'} flex justify-center items-center group-hover:text-white  text-xl font-bold group-hover:scale-105 duration-300 tracking-tight uppercase`}>
                                Recordar Turno
                                <AiOutlineNotification className="ml-4" size={44} />
                            </div>
                            <FaWhatsapp size={20} className={`${action === 'notifyTurn' ? 'text-green-400 scale-125 right-2 bottom-2' : 'text-transparent right-1 bottom-1'} absolute group-hover:scale-125 group-hover:right-2 group-hover:bottom-2 duration-300   group-hover:text-green-400 `} />
                        </div>
                        <div onClick={() => setAction('sendBill')} className={`${action !== '' && action !== 'sendBill' ? 'bg-gray-600 bg-opacity-30' : ''} ${action === 'sendBill' ? 'bg-teal-600 border-gray-600' : 'bg-gray-300 bg-opacity-30 border-gray-400'} py-4 shadow-lg group relative h-1/4 cursor-pointer  hover:bg-teal-600 hover:bg-opacity-80 transition duration-300 border-2  w-1/2 rounded-lg  `}>
                            <div className={`${action === 'sendBill' ? 'text-white scale-105' : 'text-gray-500'} flex justify-center items-center group-hover:text-white  text-xl font-bold group-hover:scale-105 duration-300 tracking-tight uppercase`}>
                                Enviar Factura
                                <LiaMoneyCheckAltSolid className="ml-4" size={44} />
                            </div>
                            <FaWhatsapp size={20} className={`${action === 'sendBill' ? 'text-green-400 scale-125 right-2 bottom-2' : 'text-transparent right-1 bottom-1'} absolute group-hover:scale-125 group-hover:right-2 group-hover:bottom-2 duration-300   group-hover:text-green-400 `} />
                        </div>
                    </div>
                    {action === '' && (
                        <div className='text-teal-600 flex justify-center items-center h-screen pb-72 select-none'>
                            <div className='relative border-2 p-4 w-36 h-36 shadow-lg bg-gray-300 bg-opacity-30 border-gray-400 rounded-full flex justify-center items-center'>
                                <TbMessageShare size={90} />
                                <h1 className='text-gray-500 absolute w-[350px] uppercase text-center font-semibold bg-gray-300 bg-opacity-30 shadow-lg border-2 border-gray-400 rounded-lg p-1 top-40'>Seleccione una opción para comunicarse con un paciente</h1>
                            </div>
                        </div>
                    )}
                    <div className='h-screen pb-56 flex mt-8  select-none' >
                        <div className={`${action ? 'opacity-100' : 'opacity-0'} transition-opacity duration-[800ms] bg-gray-300 bg-opacity-30 w-1/3 px-4 overflow-x-hidden rounded-lg border-2 border-gray-600 shadow-lg   overflow-y-hidden`} >
                            <div className='bg-teal-600 rounded-br-lg rounded-bl-lg px-4 shadow-lg py-1 text-lg font-semibold border-b-2 border-r-2 border-l-2 border-gray-600'>
                                1. Selecciona un paciente
                            </div>
                            <div className="flex mt-4 rounded-full relative">
                                <input
                                    autoComplete="off"
                                    type="text"
                                    placeholder="Busca un paciente                     Por:"
                                    className="shadow-lg pl-2 w-40 md:w-100 h-10 rounded-lg border-2 border-gray-600 font-semibold bg-white focus:border-3 focus:outline-none text-black text-xs"
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
                                <button onClick={() => setSelectedField('name')} className={`${selectedField === 'name' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-white hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg ml-4 border-2 focus:outline-none border-gray-600 text-xs font-semibold rounded-l-lg transition duration-300  select-none w-16`}>NOMBRE</button>
                                <button onClick={() => setSelectedField('dni')} className={`${selectedField === 'dni' ? 'bg-teal-600 border-gray-200 text-white' : 'bg-white hover:bg-teal-900 hover:text-white text-black '} py-1 shadow-lg border-2 focus:outline-none border-gray-600 text-xs font-semibold rounded-r-lg transition duration-300  select-none w-10`}>DNI</button>
                                {isLoadPatient ? (
                                    <div className='ml-4 flex justify-center items-center'>
                                        <ClipLoader size={28} />
                                    </div>
                                ) : (
                                    <div className={`${searchContent !== '' && !patientSelected ? 'opacity-100' : 'opacity-0'} duration-1000 transition-opacity ml-4 flex justify-center items-center`}>
                                        <BounceLoader speedMultiplier={1.8} color='rgb(15 118 110)' size={30} />
                                    </div>
                                )}
                            </div>
                            <div className="flex mt-4 h-screen pb-[360px] overflow-y-hidden w-full ">
                                <div className="rounded-lg w-full border-2 border-gray-600 overflow-y-auto bg-white overflow-x-hidden ">
                                    <table className="w-full select-none ">
                                        <thead className='relative'>
                                            <tr className="bg-gray-600 bg-opacity-20  select-none border-b-2 border-gray-600 text-left text-xs text-gray-900">
                                                <th className="py-1 pl-1 ">Nombre</th>
                                                <th className=" ">Disponibilidad</th>
                                                <th className=""></th>
                                            </tr>
                                        </thead>
                                        {listPatients && (
                                            <tbody className="text-white  ">
                                                {listPatients.map((patient, index) => (
                                                    <tr onClick={() => { handleSetPatient(patient.id); setIsLoadPatient(true) }} key={index} className={`${index !== listPatients.length - 1 ? 'border-b border-gray-600' : ''} ${patientSelected && patient.id === patientSelected.id ? 'bg-teal-600 ' : 'hover:bg-gray-900 hover:bg-opacity-10'}  bg-opacity-30 text-xs cursor-pointer ml-auto transition duration-75`}>
                                                        <td className="pl-1 py-3 whitespace-nowrap text-black">
                                                            <p>{patient.name} {patient.lastName}</p>
                                                        </td>
                                                        <td className=" whitespace-nowrap text-black">
                                                            {patient.num ? (
                                                                <p>WhatsApp</p>
                                                            ) : (
                                                                <p>-</p>
                                                            )}
                                                        </td>
                                                        <td className=" whitespace-nowrap text-black ">
                                                            {patient.email ? (
                                                                <p>Email</p>
                                                            ) : (
                                                                <p>-</p>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {searchContent !== '' && listPatients.length > 0 && (
                                                    <tr className='text-center text-xs font-semibold border-t border-b border-gray-600 bg-transparent group text-black'>
                                                        <td colSpan={5}>
                                                            Número de pacientes: {listPatients.length}
                                                        </td>
                                                    </tr>
                                                )}
                                                {searchContent !== '' && listPatients.length < 1 && (
                                                    <tr className='bg-gray-400 bg-opacity-30 border-t border-b border-gray-600'>
                                                        <td colSpan={5} className=''>
                                                            <div className="text-xl py-2 font-medium flex justify-center items-center text-black w-full">
                                                                <p className='flex'>No hay resultados<LuSearchX size={26} className="mt-0.5 ml-1" /></p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className={`${patientSelected ? 'opacity-100' : 'opacity-0'} ml-8 transition-opacity duration-[800ms] bg-gray-300 bg-opacity-30 w-1/3 px-4 overflow-x-hidden rounded-lg border-2 border-gray-600 shadow-lg   overflow-y-hidden`} >
                            <div className='bg-teal-600 rounded-br-lg rounded-bl-lg px-4 shadow-lg py-1 text-lg font-semibold border-b-2 border-r-2 border-l-2 border-gray-600'>
                                2. Selecciona el turno del paciente
                            </div>
                            {patientSelected && (
                                <div>
                                    <p className='text-black mt-2 font-medium underline'>Datos del Paciente:</p>
                                    <div className='border-2 relative bg-white shadow-lg px-2 text-xs font-medium py-1 border-gray-600 rounded-lg mt-2 text-black'>
                                        {patientSelected.name} {patientSelected.lastName}, {getAge(patientSelected.birthDate)} Años {patientSelected.gender === 'male' ? (
                                            <FaMale className="text-black absolute top-1 right-0" size={22} />
                                        ) : (
                                            <FaFemale className="text-black absolute top-1 right-0" size={22} />
                                        )} <br />
                                        DNI: {patientSelected.dni} <br />
                                        {patientSelected.address ? (
                                            <p>Domicilio: {patientSelected.address}</p>
                                        ) : (
                                            <p>Domicilio -</p>
                                        )}
                                    </div>
                                    <div className='border-2 bg-white shadow-lg px-2 text-xs font-medium py-1 border-gray-600 rounded-lg mt-2 text-black'>
                                        {patientSelected.num ? (
                                            <p>Núm: {patientSelected.num}</p>
                                        ) : (
                                            <p>Núm -</p>
                                        )}
                                        {patientSelected.email ? (
                                            <p>Email: {patientSelected.email}</p>
                                        ) : (
                                            <p>Email -</p>
                                        )}
                                    </div>
                                    <div className='border-2 bg-white shadow-lg px-2 text-xs font-medium py-1 border-gray-600 rounded-lg mt-2 text-black'>
                                        Obra Social: {patientSelected.insurance}
                                        {patientSelected.plan ? (
                                            <p>Plan: {patientSelected.plan}</p>
                                        ) : (
                                            <p>Plan -</p>
                                        )}
                                        {patientSelected.affiliateNum ? (
                                            <p>Núm. Afiliado: {patientSelected.affiliateNum}</p>
                                        ) : (
                                            <p>Núm. Afiliado -</p>
                                        )}
                                    </div>
                                    <p className='text-black mt-2 font-medium underline'>Turnos del Paciente:</p>
                                    <div className='flex h-screen pb-[540px]  overflow-y-hidden w-full'>
                                        <div className='border-2 w-full overflow-y-auto relative bg-white text-sm border-gray-600 rounded-lg mt-2 text-black'>
                                            <table className="w-full select-none ">
                                                {!isLoadAppointments && patientAppointments ? (
                                                    <tbody className="text-white">
                                                        {patientAppointments.map((appointment, index) => (
                                                            <tr onClick={() => setAppointmentSelected(appointment)} key={index} className={`${appointmentSelected && appointment.id === appointmentSelected.id && appointment.time === appointmentSelected.time && appointment.date === appointmentSelected.date ? 'bg-teal-600' : 'hover:bg-gray-900 hover:bg-opacity-10'}  bg-opacity-30 text-xs cursor-pointer ml-auto transition duration-75`}>
                                                                <td className="px-2 py-3 whitespace-nowrap text-black">
                                                                    <p className='flex font-semibold justify-between'>
                                                                        <span>{appointment.dayComplete} {appointment.year}</span>
                                                                        <span>{appointment.time}</span>
                                                                    </p>
                                                                    <p className='text-xs'>{appointment.reason}</p>
                                                                </td>

                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                ) : (
                                                    <div>
                                                        {appointmentSelected === null && !isLoadAppointments ? (
                                                            <p className='absolute text-black text-center w-52 right-20 top-16'>No se han registrado turnos para este paciente.</p>
                                                        ) : (
                                                            <ClipLoader className='absolute top-16 mt-1.5 right-40' size={44} color='black' />
                                                        )}
                                                    </div>
                                                )}
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={`${appointmentSelected ? 'opacity-100' : 'opacity-0'} ml-8 transition-opacity duration-[800ms] bg-gray-300 bg-opacity-30 w-1/3 px-4 overflow-x-hidden rounded-lg border-2 border-gray-600 shadow-lg   overflow-y-hidden`} >
                            <div className='bg-teal-600 rounded-br-lg rounded-bl-lg px-4 shadow-lg py-1 text-lg font-semibold border-b-2 border-r-2 border-l-2 border-gray-600'>
                                3. Enviar archivo
                            </div>
                            {appointmentSelected && (
                                <div className=' text-black'>
                                    <p className=' mt-2 font-medium underline'>Comentarios (opcional):</p>
                                    <div className='border-2 relative bg-white  shadow-lg p-1 text-sm font-semibold border-gray-600 rounded-lg mt-2 '>
                                        <textarea className='resize-none w-full h-24 px-2 py-1 outline-none'></textarea>
                                    </div>
                                    <p className='mt-2 font-medium underline'>Compartir vía:</p>
                                    <div className='flex'>
                                        <div onClick={sendWhatsApp} className='cursor-pointer bg-green-500 hover:bg-opacity-50 border border-gray-300 transition duration-150 group shadow-lg rounded-full w-14 mt-3 h-14 flex justify-center items-center'>
                                            <FaWhatsapp size={34} className=" text-white group-hover:scale-125 transition duration-150 mb-0.5 ml-0.5" />
                                        </div>
                                        <div className='cursor-pointer ml-4 hover:bg-opacity-70 border bg-red-800 border-gray-300 transition duration-150 group shadow-lg rounded-full w-14 mt-3 h-14 flex justify-center items-center'>
                                            <MdMailOutline size={34} className=" text-white group-hover:scale-125 transition duration-150 " />
                                        </div>
                                    </div>
                                    <p onClick={createPdf} className='mt-2 font-medium underline'>Descargar PDF:</p>
                                    <div className=' cursor-pointer hover:bg-white border border-gray-300 transition duration-150 group shadow-lg rounded-full w-14 mt-3 h-14 flex justify-center items-center'>
                                        <PiDownload size={34} className=" group-hover:scale-125 transition duration-150 " />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
