'use client'

import Image from 'next/image'
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Loading } from "../components/style/loading";
import { useRouter } from 'next/navigation'
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUser } from "../components/auth/getUser";
import { MdModeEditOutline, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { TbPencilCog } from 'react-icons/tb';
import { getClinicData } from "../components/config/getClinicData";
import { ScaleLoader, MoonLoader } from "react-spinners";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { setRowChanges } from "../components/config/setRowChanges";

export default function Page() {
    const router = useRouter()
    const [userUid, setUserUid] = useState<string>('');
    const [isLoad, setIsLoad] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [selectedField, setSelectedField] = useState<string>('profile');
    const [showUserName, setShowUserName] = useState(false);
    const [loadingGet, setLoadingGet] = useState(false);
    const [clinicInfo, setClinicInfo] = useState<any>(null);
    const [pros, setPros] = useState<null | any[]>(null);
    const [editRow, setEditRow] = useState<string>('');
    const [changes, setChanges] = useState<any>(null);
    const [loadingEditRow, setLoadingEditRow] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<any>(null);

    //CHECK IF THE USER IS LOGGED IN && GET USER
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log(user);

                setUserUid(user.uid);
                handleGetUser();
            } else if (!user) {
                router.push("/notSign");
            }
        });

        async function handleGetUser() {
            const user = await getUser(false);
            setUser(user);
            console.log(user);

            setIsLoad(false);
        }

        return () => unsubscribe();
    }, [router]);

    //FUNCTIONS GETS    

    async function handleGetClinicConfig() {
        setSelectedField('clinicConfig');
        if (!clinicInfo) {
            setLoadingGet(true);
            const result = await getClinicData(user.clinicId, 'info');
            if (result !== 'error') {
                setClinicInfo(result);
                setLoadingGet(false);
            }
        }
    }

    async function handleGetPros() {
        setSelectedField('pros');
        if (!pros) {
            setLoadingGet(true);
            const result = await getClinicData(user.clinicId, 'pros');
            console.log(result);
            if (result !== 'error') {
                setPros(result);
                setLoadingGet(false);
            }
        }
    }

    //FUNCTIONS EDIT ROW

    async function handleEditRow(e: any, table: string, changes: any) {
        e.stopPropagation();
        setEditRow('');
        if (changes !== null) {
            setLoadingEditRow(true);
            const result = await setRowChanges(table, changes, userUid)
            if (result !== 'error') {
                const user = await getUser(false);
                setUser(user);
                setLoadingEditRow(false);
                setChanges(null);
            }
        }
    }

    function handleCanceEditRow(e: any) {
        e.stopPropagation();
        setEditRow('')
    }

    function handleKeyPress(e: any, table: string, changes: any) {
        if (e.key === 'Enter') {
            handleEditRow(e, table, changes);
        } else if (e.key === 'Escape') {
            setEditRow('');
        }
    }

    function handleChangePicture(e: any) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result); // Guardamos la URL de la imagen en el estado
            };
            reader.readAsDataURL(file);
        }
    }

    useEffect(() => {
        //        console.log(selectedImage);

    }, [selectedImage]);

    return (
        <div className='ml-56 h-screen overflow-y-hidden flex-1 ' >
            {isLoad ? (
                <Loading />
            ) : (
                <div className=' h-screen'>
                    <div className=' bg-white w-full h-fit rounded-lg relative mt-16 text-black'>
                        {loadingGet ? (
                            <h1 className='bg-gradient-to-r from-teal-900 via-teal-700 to-teal-300 flex  items-center select-none py-5 text-2xl tracking-wide  pl-56 text-white font-medium rounded-t-md '>{user.displayName} <ScaleLoader margin={3} className='ml-4' color="white" width={2} height={26} speedMultiplier={1.4} /></h1>
                        ) : (
                            <h1 className='bg-gradient-to-r from-teal-900 via-teal-700 to-teal-300 flex  items-center select-none py-5 text-2xl tracking-wide  pl-56 text-white font-medium rounded-t-md '>{user.displayName}</h1>
                        )}
                        <div className='pl-52 bg-emerald-400 bg-opacity-20 text-black transition select-none'>
                            <button onClick={() => setSelectedField('profile')} className={`${selectedField === 'profile' ? ' bg-white  duration-300' : ' hover:text-black hover:text-opacity-50'} mx-4  py-1 px-4 uppercase`}>Perfil</button>
                            <button onClick={handleGetPros} className={`${selectedField === 'pros' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Profesionales</button>
                            <button onClick={handleGetClinicConfig} className={`${selectedField === 'clinicConfig' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Configuración del Consultorio</button>
                            <button onClick={() => setSelectedField('stats')} className={`${selectedField === 'stats' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Estadísticas</button>
                        </div>
                        <div className='rounded-full absolute top-8 left-8 mb-8 group' onClick={() => imageInputRef.current?.click()}>
                            <input accept="image/*" onChange={(e) => handleChangePicture(e)} ref={imageInputRef} type="file" style={{ display: 'none' }} />
                            <Image src={user.photoURL} width={160} height={160} className={`${loadingEditRow ? 'blur-[2px]' : 'group-hover:cursor-pointer group-hover:blur-[2px]'} rounded-full border-4 border-white shadow-2xl select-none transition duration-300`} alt="UserPhoto" />
                            {loadingEditRow ? (
                                <div className='absolute top-0 justify-center flex opacity-100'><MoonLoader speedMultiplier={1.4} color='white' size={126} /></div>
                            ) : (
                                <div className='absolute top-12 left-[50px] justify-center flex group-hover:opacity-100 opacity-0'><MdModeEditOutline className="cursor-pointer text-white" size={50} /></div>
                            )}
                        </div>
                        <div className='ml-56 mt-4'>
                            {selectedField === 'profile' && (
                                <div className='text-base'>
                                    <h1 className=' text-base font-bold tracking-wide'>Básico:</h1>

                                    <div onClick={() => setEditRow('displayName')} className={`${editRow === 'displayName' ? 'border-teal-600' : 'hover:border-black border-transparent'} mb-2 mt-1 py-1.5 px-1 cursor-pointer transition duration-150 border-2  group  rounded-lg border-dashed w-fit flex`}>Nombre visible:
                                        {editRow === 'displayName' ? (
                                            <div className='flex justify-center items-center'>
                                                <input onKeyDown={(e: any) => handleKeyPress(e, 'displayName', changes)} onChange={(e) => setChanges(e.target.value)} autoFocus defaultValue={user.displayName} className='focus:outline-none bg-teal-600 bg-opacity-20 mx-2 rounded-lg pl-1 font-semibold' />
                                                <FaCircleXmark onClick={(e: any) => handleCanceEditRow(e)} className="mr-1  text-teal-950 hover:scale-110 transition duration-150 hover:text-red-700" size={24} />
                                                <FaCircleCheck onClick={(e: any) => handleEditRow(e, 'displayName', changes)} className="ml-1 text-teal-950 hover:scale-110 transition duration-150 hover:text-teal-600" size={24} />
                                            </div>
                                        ) : (
                                            <span className='ml-1 font-semibold flex justify-center items-center'>{user.displayName} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span>
                                        )}
                                    </div>

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
                            {selectedField === 'pros' && loadingGet === false && pros && (
                                <div className='text-sm'>
                                    <h1 className=' text-base font-bold tracking-wide'>Lista de profesionales:</h1>
                                    {pros.map((professional) => (
                                        <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Nombre Completo: <span className='ml-1 font-semibold flex justify-center items-center'>{professional} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    ))}
                                </div>
                            )}
                            {selectedField === 'clinicConfig' && loadingGet === false && clinicInfo && (
                                <div className='text-sm'>
                                    <h1 className=' text-base font-bold tracking-wide'>Básico:</h1>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Nombre: <span className='ml-1 font-semibold flex justify-center items-center'>{clinicInfo.name} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>País: <span className='ml-1 font-semibold flex justify-center items-center'>{clinicInfo.country} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Dirección: <span className='ml-1 font-semibold flex justify-center items-center'>{clinicInfo.address} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Horarios de atención: <span className='ml-1 font-semibold flex justify-center items-center'>{clinicInfo.initialSchedule} - {clinicInfo.finalSchedule} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <hr className="border-black border border-dashed  w-96 " />
                                    <h1 className=' mt-2 text-base font-bold tracking-wide'>Contacto:</h1>
                                    <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Tél de contacto: <span className='ml-1 font-semibold flex justify-center items-center'>{clinicInfo.telContact}  <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Tél de contacto auxiliar: <span className='ml-1 font-semibold flex justify-center items-center'> {clinicInfo.secondTelContact} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Correo electronico: <span className='ml-1 font-semibold flex justify-center items-center'> {clinicInfo.email} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
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
