'use client'

import Image from 'next/image'
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Loading } from "../components/style/loading";
import { useRouter } from 'next/navigation'
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUser } from "../components/auth/getUser";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { TbPencilCog } from 'react-icons/tb';
import { getClinicData } from "../components/config/getClinicData";
import { ScaleLoader, MoonLoader } from "react-spinners";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { setRowChanges } from "../components/config/setRowChanges";
import { changeImage } from "./../components/config/changeImage";
import { RxUpdate } from "react-icons/rx";
import { updateUserEmail } from "../components/config/updateUserEmail";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { RiErrorWarningLine } from "react-icons/ri";

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
    const [loadingImage, setLoadingImage] = useState(true);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [reloadImage, setReloadImage] = useState(Date.now());
    const [openInputCredential, setOpenInputCredential] = useState(false);
    const [userCredential, setUserCredential] = useState<string>('');
    const [showAlert, setShowAlert] = useState<string>('');

    //CHECK IF THE USER IS LOGGED IN && GET USER
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserUid(user.uid);
                handleGetUser();
            } else if (!user) {
                router.push("/notSign");
            }
        });

        async function handleGetUser() {
            const user = await getUser(false);
            setUser(user);
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
            if (result !== 'error') {
                setPros(result);
                setLoadingGet(false);
            }
        }
    }

    //FUNCTIONS EDIT ROW

    function reset() {
        setEditRow('');
        setLoadingGet(false);
        setChanges(null);
        if (openInputCredential) {
            setOpenInputCredential(false);
        }
    }

    async function handleEditRow(e: any, table: string, changes: any) {
        e.stopPropagation();
        reset();

        if (changes !== null) {
            setLoadingGet(true);
            let result;
            switch (table) {
                case 'displayName':
                    result = await setRowChanges(table, changes, userUid)
                    if (result !== 'error') {
                        const user = await getUser(false);
                        setUser(user);
                    }
                    break;
                case 'language':
                    result = await setRowChanges(table, changes, userUid)
                    if (result !== 'error') {
                        const user = await getUser(false);
                        setUser(user);
                    }
                    break;
                default:
                    break;
            }
        }

        reset();
    }

    function handleCancelEditRow(e: any) {
        e.stopPropagation();
        reset();
    }

    function handleKeyPress(e: any, table: string, changes: any) {
        if (e.key === 'Escape') {
            reset();
        } else if (e.key === 'Enter' && changes !== null) {
            if (table === 'email') {
                if (openInputCredential === true) {
                    handleChangeEmail(e, table, changes);
                } else {
                    setOpenInputCredential(true);
                }
            } else {
                handleEditRow(e, table, changes);
            }
        }
    }



    //FUNCTIONS CHANGE EMAIL

    async function handleChangeEmail(e: any, table: string, changes: any) {
        e.stopPropagation();
        reset();

        if (changes !== null) {
            setLoadingGet(true);
            const result = await updateUserEmail(table, changes, userUid, userCredential) as { message: string };
            if (result) {
                if (result.message === 'Firebase: Error (auth/wrong-password).') {
                    setShowAlert('wrong-password');
                } else if (result.message === 'Firebase: Error (auth/invalid-email).') {
                    setShowAlert('invalid-email');
                }
            } else {
                const user = await getUser(false);
                setUser(user);
            }
        }

        reset();
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setShowAlert('');
        }, 4000);

        return () => clearTimeout(timeoutId);
    }, [showAlert]);



    useEffect(() => {
        if (openInputCredential) {
            setOpenInputCredential(false);
        }
    }, [editRow]);

    //IMAGE FUNCTIONS

    async function handleChangePicture(e: any) {
        if (e.target.files[0]) {
            setLoadingImage(true);
            const file = e.target.files[0];
            const result = await changeImage(userUid, file);
            if (result !== 'error') {
                setReloadImage(Date.now());
            }
        }
    }

    return (
        <div className='ml-56 h-screen overflow-y-hidden flex-1 ' >
            {isLoad ? (
                <Loading />
            ) : (
                <div className=' h-screen'>
                    <div className=' bg-white w-full h-fit rounded-lg relative mt-16 text-black'>
                        {loadingGet ? (
                            <h1 className='bg-gradient-to-r from-teal-900 via-teal-700 to-teal-300 flex  items-center select-none py-6 text-3xl tracking-wide  pl-56 text-white font-bold rounded-t-md '><span className='bg-teal-300 shadow-lg bg-opacity-35 rounded-xl px-3 py-1'>{user.displayName}</span> <ScaleLoader margin={3} className='ml-4' color="white" width={2} height={26} speedMultiplier={1.4} /></h1>
                        ) : (
                            <h1 onClick={() => setShowAlert('wrong-password')} className='bg-gradient-to-r font-bold from-teal-900 via-teal-700 to-teal-300 flex  items-center select-none py-6 text-3xl tracking-wide  pl-56 text-white  rounded-t-md '> <span className='bg-teal-300 shadow-lg bg-opacity-35 rounded-xl px-3 py-1'>{user.displayName}</span></h1>
                        )}
                        <div className='pl-52 bg-emerald-400 bg-opacity-20 text-black transition select-none'>
                            <button onClick={() => setSelectedField('profile')} className={`${selectedField === 'profile' ? ' bg-white  duration-300' : ' hover:text-black hover:text-opacity-50'} mx-4  py-1 px-4 uppercase`}>Perfil</button>
                            <button onClick={handleGetPros} className={`${selectedField === 'pros' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Profesionales</button>
                            <button onClick={handleGetClinicConfig} className={`${selectedField === 'clinicConfig' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Configuración del Consultorio</button>
                            <button onClick={() => setSelectedField('stats')} className={`${selectedField === 'stats' ? 'bg-white   duration-300' : 'hover:text-black hover:text-opacity-50'} mx-4 py-1 px-4 uppercase`}>Estadísticas</button>
                        </div>
                        <div className='rounded-full absolute top-8 left-8 mb-8 group' onClick={() => imageInputRef.current?.click()}>
                            <input accept="image/*" onChange={(e) => handleChangePicture(e)} ref={imageInputRef} type="file" style={{ display: 'none' }} />
                            <Image quality={100} onLoadingComplete={() => setLoadingImage(false)} priority={true} src={`${user.photoURL}?${reloadImage}`} width={160} height={160} className={`${loadingImage ? 'blur-[2px]' : 'group-hover:cursor-pointer group-hover:blur-[2px]'} rounded-full bg-white object-cover	 border-4 w-[160px] h-[160px] border-white shadow-2xl select-none transition duration-300`} alt="UserPhoto" />
                            {loadingImage ? (
                                <div className='absolute top-0 justify-center flex opacity-100'><MoonLoader speedMultiplier={1.4} color='#042f2e' size={126} /></div>
                            ) : (
                                <div className='absolute top-[47px] left-[48px] justify-center flex group-hover:opacity-100 opacity-0'><RxUpdate className="cursor-pointer text-white text-opacity-40" size={64} /></div>
                            )}
                        </div>
                        <div className='ml-56 mt-4'>
                            {selectedField === 'profile' && (
                                <div className='text-base'>
                                    <h1 className=' text-base font-bold tracking-wide'>Básico:</h1>
                                    {/* 1 */}
                                    <div onClick={() => setEditRow('displayName')} className={`${editRow === 'displayName' ? 'border-emerald-500' : 'hover:border-black border-transparent'} mb-2 mt-1 py-1.5 px-1 cursor-pointer transition duration-75 border-2  group  rounded-lg border-dashed w-fit flex`}>Nombre visible:
                                        {editRow === 'displayName' ? (
                                            <div className='flex justify-center items-center'>
                                                <input onKeyDown={(e: any) => handleKeyPress(e, 'displayName', changes)} onChange={(e) => setChanges(e.target.value)} autoFocus defaultValue={user.displayName} className='focus:outline-none bg-gray-400 bg-opacity-30 mx-2 rounded-lg px-1 font-semibold' />
                                                <FaCircleXmark onClick={(e: any) => handleCancelEditRow(e)} className="mr-1  text-red-700 hover:scale-110 transition duration-150 hover:text-red-900" size={24} />
                                                <FaCircleCheck onClick={(e: any) => handleEditRow(e, 'displayName', changes)} className="ml-1 text-emerald-500 hover:scale-110 transition duration-150 hover:text-emerald-600" size={24} />
                                            </div>
                                        ) : (
                                            <span className='ml-1 font-semibold flex justify-center items-center'>{user.displayName} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span>
                                        )}
                                    </div>
                                    {/* 2 */}
                                    <div className={`${openInputCredential ? ' bg-teal-800 px-3 py-2 mb-4' : ''} w-fit relative rounded-lg`}>
                                        <div onClick={() => setEditRow('email')} className={`${editRow === 'email' && openInputCredential === false ? 'border-emerald-500' : 'border-transparent cursor-pointer'} ${openInputCredential ? 'bg-emerald-400' : 'hover:border-black'} ${showAlert === 'wrong-password' || showAlert === 'invalid-email' ? 'border-red-500 border-2 border-dashed bg-red-500 bg-opacity-50 p-4' : 'border-2 border-dashed   group '} mb-2  mt-1 py-1.5 px-1  transition duration-75     rounded-lg  w-fit flex`}>Email:
                                            {editRow === 'email' ? (
                                                <div className='flex justify-center items-center'>
                                                    <input onKeyDown={(e: any) => handleKeyPress(e, 'email', changes)} onChange={(e) => setChanges(e.target.value)} autoFocus defaultValue={user.email} className='focus:outline-none bg-gray-400 bg-opacity-30 mx-2 rounded-lg px-1 font-semibold' />
                                                    {openInputCredential ? (
                                                        <div>
                                                            <IoMdCheckmarkCircleOutline className='text-emerald-900' size={24} />
                                                        </div>
                                                    ) : (
                                                        <div className='flex justify-center items-center'>
                                                            <FaCircleXmark onClick={(e: any) => { handleCancelEditRow(e); setOpenInputCredential(false) }} className="mr-1  text-teal-950 hover:scale-110 transition duration-150 hover:text-red-700" size={24} />
                                                            <FaCircleCheck onClick={(e: any) => { if (changes !== null) { setOpenInputCredential(true) } else { handleCancelEditRow(e); setOpenInputCredential(false) } }} className="ml-1 text-teal-950 hover:scale-110 transition duration-150 hover:text-teal-600" size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className='ml-1 font-semibold flex justify-center items-center'>{user.email}<TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span>
                                            )}
                                        </div>
                                        {showAlert === 'wrong-password' && (
                                            <div className='bg-red-600 whitespace-nowrap animate-move-from-left select-none bg-opacity-80 py-1 border    border-black rounded-full shadow-lg px-2 absolute text-base font-semibold flex justify-center items-center w-auto left-[340px] top-0'>
                                                <RiErrorWarningLine className='mr-1' size={22} /> Contraseña Incorrecta.
                                            </div>
                                        )}
                                        {showAlert === 'invalid-email' && (
                                            <div className='bg-red-800 whitespace-nowrap animate-move-from-left select-none bg-opacity-80 py-1 border    border-black rounded-full shadow-lg px-2 absolute text-base font-semibold flex justify-center items-center w-auto left-[340px] top-0'>
                                                <RiErrorWarningLine className='mr-1' size={22} /> Email invalido.
                                            </div>
                                        )}
                                        {openInputCredential && (
                                            <div className='py-1.5 px-1 transition duration-75 text-sm font-bold bg-transparent rounded-lg text-white  w-fit flex'>Confirma los cambios con tu contraseña:
                                                <input onKeyDown={(e: any) => handleKeyPress(e, 'email', changes)} onChange={(e) => setUserCredential(e.target.value)} autoFocus className='focus:outline-none bg-emerald-400 bg-opacity-70 mx-2 rounded-lg px-2 font-semibold' type="password" />
                                                <FaCircleXmark onClick={(e: any) => { handleCancelEditRow(e); setOpenInputCredential(false) }} className="mr-1 cursor-pointer   hover:scale-110 transition duration-150 hover:text-red-700" size={26} />
                                                <FaCircleCheck onClick={(e: any) => handleChangeEmail(e, 'email', changes)} className="ml-1 cursor-pointer hover:scale-110 transition duration-150 hover:text-teal-600" size={26} />
                                            </div>
                                        )}
                                    </div>
                                    <hr className="border-black border border-dashed  w-96 mt-2 " />
                                    {/* 3 */}
                                    <h1 className=' mt-2 text-base font-bold tracking-wide'>Credenciales de acceso:</h1>
                                    {showUserName ? (
                                        <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Usuario de acceso: <span className='ml-1 font-semibold flex justify-center items-center'>{user.userName} <MdVisibility onClick={() => setShowUserName(false)} className="ml-1 cursor-pointer hover:scale-110" size={20} /> <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    ) : (
                                        <div className='mb-2 mt-1 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Usuario de acceso: <span className='ml-1 font-semibold flex justify-center items-center'>{'●'.repeat(user.userName.length)} <MdVisibilityOff onClick={() => setShowUserName(true)} className="ml-1 cursor-pointer hover:scale-110" size={20} /> <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    )}
                                    {/* 3 */}
                                    <div className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>Contraseña de acceso: <span className='ml-1 font-semibold flex justify-center items-center'>●●●●●●●●●●●●● <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span></div>
                                    <hr className="border-black border border-dashed  w-96 " />
                                    {/* 5 */}
                                    <h1 className=' mt-2 text-base font-bold tracking-wide'>Preferencias de interfaz:</h1>
                                    <div onClick={() => setEditRow('language')} className={`${editRow === 'language' ? 'border-teal-600' : 'hover:border-black border-transparent'} mb-2 mt-1 py-1.5 px-1 cursor-pointer transition duration-75 border-2  group  rounded-lg border-dashed w-fit flex`}>Idioma:
                                        {editRow === 'language' ? (
                                            <div className='flex justify-center items-center'>
                                                <select defaultValue={user.language} onKeyDown={(e: any) => handleKeyPress(e, 'language', changes)} onChange={(e) => setChanges(e.target.value)} className='focus:outline-none w-fit bg-teal-600 hover:bg-opacity-50 transition duration-150 bg-opacity-20 mx-2 pr-8 rounded-lg px-1 font-semibold'>
                                                    <option value={"spanish"}>spanish</option>
                                                    <option value={"english"}>english</option>
                                                </select>
                                                <FaCircleXmark onClick={(e: any) => handleCancelEditRow(e)} className="mr-1  text-teal-950 hover:scale-110 transition duration-150 hover:text-red-700" size={24} />
                                                <FaCircleCheck onClick={(e: any) => handleEditRow(e, 'language', changes)} className="ml-1 text-teal-950 hover:scale-110 transition duration-150 hover:text-teal-600" size={24} />
                                            </div>
                                        ) : (
                                            <span className='ml-1 font-semibold flex justify-center items-center'>{user.language} <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} /></span>
                                        )}
                                    </div>

                                </div>
                            )}
                            {selectedField === 'pros' && loadingGet === false && pros && (
                                <div className='text-sm'>
                                    <h1 className=' text-base font-bold tracking-wide'>Lista de profesionales:</h1>
                                    {pros.map((professional, index) => (
                                        <div key={index} className='my-2 py-1 px-1 cursor-pointer transition duration-150 border-2 border-transparent group hover:border-black rounded-lg border-dashed w-fit flex'>
                                            Nombre Completo:
                                            <span className='ml-1 font-semibold flex justify-center items-center'>
                                                {professional}
                                                <TbPencilCog className="ml-4 transition duration-150 group-hover:text-black text-transparent" size={20} />
                                            </span>
                                        </div>
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
