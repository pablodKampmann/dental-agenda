'use client'

import Image from 'next/image'
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Loading } from "../components/style/loading";
import { useRouter } from 'next/navigation'
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUser } from "../components/auth/getUser";
import { MdModeEditOutline, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { TbPencilCog } from 'react-icons/tb';
import { setOptions } from "./../components/setOptions[TEMP]";

export default function Page() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [selectedField, setSelectedField] = useState<string>('profile');
    const [showUserName, setShowUserName] = useState(false);

    //CHECK IF THE USER IS LOGGED IN && GET USER
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                handleGetUser();
            } else if (!user) {
                router.push("/notSign");
            }
        });

        async function handleGetUser() {
            const user = await getUser();
            setUser(user);
            setIsLoad(false);
        }

        return () => unsubscribe();
    }, [router]);

    return (
        <div className='ml-56 h-screen overflow-y-hidden flex-1 ' >
            {isLoad ? (
                <Loading />
            ) : (
                <div className=' h-screen'>
                    <div className=' bg-white w-full h-fit rounded-lg relative mt-16 text-black'>
                        <h1 className='bg-gradient-to-r from-teal-800 via-teal-700 to-teal-300 select-none text-2xl tracking-wide py-5 pl-56 text-white font-medium rounded-t-md'>{user.displayName} (El verdadero Admin)</h1>
                       {/*  <h1 onClick={() => setOptions(user.clinicId)} className='bg-black cursor-pointer p-4'>NOIDWNIWDQNIOWNDQ</h1>
                       */} <div className='pl-52 bg-emerald-400 bg-opacity-20 text-black transition select-none'>
                            <button onClick={() => setSelectedField('profile')} className={`${selectedField === 'profile' ? ' bg-white  duration-300' : ' hover:text-black hover:text-opacity-50'} mx-4  py-1 px-4 uppercase`}>Perfil</button>
                            <button onClick={() => setSelectedField('pros')} className={`${selectedField === 'pros' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Profesionales</button>
                            <button onClick={() => setSelectedField('config')} className={`${selectedField === 'config' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Configuración del Consultorio</button>
                            <button onClick={() => setSelectedField('stats')} className={`${selectedField === 'stats' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Estadísticas</button>
                        </div>
                        <div className='absolute top-8 left-8 mb-8 group'>
                            <Image src={`/${user.userName}.jpg`} width={160} height={160} className='  rounded-full border-4  border-white shadow-2xl select-none transition duration-300 group-hover:cursor-pointer group-hover:blur-[2px]' alt="UserPhoto"></Image>
                            <div className='absolute top-12 left-[50px] justify-center flex group-hover:opacity-100 opacity-0'><MdModeEditOutline className="cursor-pointer text-white" size={50} /></div>
                        </div>
                        <div className='ml-56 mt-4'>
                            {selectedField === 'profile' && (
                                <div className='text-sm'>
                                    <h1 className=' text-base font-bold tracking-wide'>Básico:</h1>
                                    <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Nombre visible: <span className='ml-1 font-semibold flex justify-center items-center'>{user.displayName} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Email: <span className='ml-1 font-semibold flex justify-center items-center'>{user.email} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <hr className="border-black border border-dashed  w-96 " />
                                    <h1 className=' mt-2 text-base font-bold tracking-wide'>Credenciales de acceso:</h1>
                                    {showUserName ? (
                                        <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Usuario de acceso: <span className='ml-1 font-semibold flex justify-center items-center'>{user.userName} <MdVisibility onClick={() => setShowUserName(false)} className="ml-1 cursor-pointer hover:scale-110" size={20} /> <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    ) : (
                                        <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Usuario de acceso: <span className='ml-1 font-semibold flex justify-center items-center'>{'●'.repeat(user.userName.length)} <MdVisibilityOff onClick={() => setShowUserName(true)} className="ml-1 cursor-pointer hover:scale-110" size={20} /> <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    )}
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Contraseña de acceso: <span className='ml-1 font-semibold flex justify-center items-center'>●●●●●●●●●●●●● <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <hr className="border-black border border-dashed  w-96 " />
                                    <h1 className=' mt-2 text-base font-bold tracking-wide'>Preferencias de interfaz:</h1>
                                    <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Idioma: <span className='ml-1 font-semibold flex justify-center items-center'>spanish<TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>

                                </div>
                            )}
                            {selectedField === 'pros' && (
                                <div className='text-sm'>
                                    <h1 className=' text-base font-bold tracking-wide'>Lista de profesionales:</h1>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Nombre Completo: <span className='ml-1 font-semibold flex justify-center items-center'>Karina Álvarez <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                </div>
                            )}
                            {selectedField === 'config' && (
                                <div className='text-sm'>
                                    <h1 className=' text-base font-bold tracking-wide'>Básico:</h1>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Nombre: <span className='ml-1 font-semibold flex justify-center items-center'>{user.clinicName} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>País: <span className='ml-1 font-semibold flex justify-center items-center'>Argentina <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Dirección: <span className='ml-1 font-semibold flex justify-center items-center'>11 de Septiembre 4075 <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Horarios de atención: <span className='ml-1 font-semibold flex justify-center items-center'> 6:00 - 18:00 <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <hr className="border-black border border-dashed  w-96 " />
                                    <h1 className=' mt-2 text-base font-bold tracking-wide'>Contacto:</h1>
                                    <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Tél de contacto: <span className='ml-1 font-semibold flex justify-center items-center'>+54 3413466408  <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Tél de contacto auxiliar: <span className='ml-1 font-semibold flex justify-center items-center'> +54 15484848468 <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Correo electronico: <span className='ml-1 font-semibold flex justify-center items-center'> consultorio@gmail.com <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                </div>
                            )}
                        </div>

                    </div >
                </div >
            )
            }
        </div >
    )
}
