'use client'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react';
import Link from 'next/link'
import { FaUsers, FaTooth, FaDollarSign } from 'react-icons/fa';
import { BsFillCalendar2WeekFill } from 'react-icons/bs';
import { IoLogOutSharp, IoSettingsOutline } from 'react-icons/io5';
import { IoMdArrowDropdown, IoMdArrowDropup, IoLogoWhatsapp } from 'react-icons/io';
import { MdNotificationsNone } from 'react-icons/md';
import { RiUserSettingsFill } from 'react-icons/ri';
import { getUser } from "../auth/getUser";
import { Alert } from "./alert";
import { db, auth } from "./../../app/firebase";
import { get, ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

export function SideBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [userUid, setUserUid] = useState<string>('');
    const [openAlert, setOpenAlert] = useState(false);
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const [reloadImage, setReloadImage] = useState(Date.now());

    useEffect(() => {
        let isMounted = true;

        async function handleGetUser() {
            try {
                const user = await getUser(false);
                if (isMounted) {
                    setUser(user);
                }
            } catch (error) {
                console.error("Failed to get user:", error);
            }
        }

        handleGetUser();

        return () => {
            isMounted = false;
        };
    }, []);


    /* ESTO DEBERIA ESCUCHAR CAMBIOS 
    useEffect(() => {
        async function reloadImage() {
            setReloadImage(Date.now());
        }

        const photoUserRef = ref(db, '/admins/' + userUid + '/isPhotoUpdate/');
        const unsubscribe = onValue(photoUserRef, async () => {
            await reloadImage();
        })

        return () => unsubscribe();
    }, [user]); */

    return (
        <div>
            <div>
                {openAlert && (
                    <div className='fixed inset-0 backdrop-blur-sm ml-56 z-10'>
                         <Alert onCloseAlert={() => setOpenAlert(false)} onSuccess={() => setOpenAlert(false)} action={'Cerrar Sesion'} firstProp={'¿Estás seguro/a de que deseas cerrar la sesion activa?'} />
                    </div>
                )}
            </div>

            <div className="fixed top-0 left-0 z-50 w-full border-b-4 bg-teal-950 border-teal-700">
                <div className="flex px-3 py-3 items-center justify-between">
                    <div className="flex items-center ml-1 select-none mt-1 mb-1 font-bold ">
                        <FaTooth size={30} />
                        <span className="ml-3 text-2xl">Admin</span>
                        <span className="bg-teal-600 px-1 rounded-lg ml-1 text-lg">PANEL</span>
                    </div>
                    {user ? (
                        <div className="flex items-center">
                            <MdNotificationsNone size={36} className="mr-3 bg-white rounded-full bg-opacity-15 hover:bg-opacity-20 transition duration-150 cursor-pointer p-1" />
                            <div onClick={() => setOpenUserMenu(!openUserMenu)} className={`${openUserMenu ? 'rounded-t-2xl bg-teal-500 text-teal-900' : 'border-b-2 rounded-full '} flex justify-center relative items-center mr-2 cursor-pointer hover:bg-teal-500 transition duration-150 py-1 hover:text-teal-900  border-t-2 border-teal-700`}>
                                <p className='ml-3 text-base font-medium select-none'>{user.displayName}</p>
                                {openUserMenu ? (
                                    <>
                                        <IoMdArrowDropup size={24} className="ml-1 mr-1" />
                                        <div className="absolute mt-24 w-full shadow-lg bg-teal-100 transition duration-150 rounded-b-lg border-t-2 border-teal-700 animate-user-menu">
                                            <div onClick={() => router.push('/config')} className="px-3 py-1 border text-teal-900 border-teal-700 hover:bg-teal-300 select-none flex items-center"><RiUserSettingsFill className="mr-1 text-teal-900" /> Configuración </div>
                                            <div onClick={() => setOpenAlert(true)} className="px-3 py-1 border text-teal-900 border-teal-700 hover:bg-teal-300 rounded-b-lg select-none flex items-center"><IoLogOutSharp className="mr-1 text-teal-900" />Cerrar Sesión</div>
                                        </div>
                                    </>
                                ) : (
                                    <IoMdArrowDropdown size={24} className="ml-1 mr-1" />
                                )}
                            </div>
                            <Link className='focus:outline-none' href={'/config'}>
                                <Image src={`${user.photoURL}?${reloadImage}`} quality={100} priority={true} width={40} height={40} className='rounded-full cursor-pointer object-cover	 h-[40px] w-[40px] shadow-2xl select-none' alt="UserPhoto" placeholder='blur' blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8XwMAAoABfYJLKisAAAAASUVORK5CYII='></Image>
                            </Link>
                        </div>
                    ) : (
                        <div className='flex items-center '>
                            <div className='flex-col w-52 mr-4'>
                                <hr className=' border-2 border-teal-600 rounded-full' />
                                <hr className='border-2 mt-4 border-teal-600 rounded-full' />
                            </div>
                            <div className='p-3.5 border-4 border-teal-600 rounded-full'></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed top-0 left-0 z-40 w-56 h-screen pt-20 transition-transform -translate-x-full border-r-4 border-teal-700 sm:translate-x-0 bg-teal-900	" aria-label="Sidebar">
                <div className="h-full pb-4 space-y-2 mx-3 font-medium overflow-y-auto bg-gradient-to-b from-teal-900 from-80% to-teal-800">
                    <Link href="/" prefetch={true} className={`${pathname === '/' ? 'bg-teal-400 bg-opacity-40 text-white' : ''} flex text-left items-center p-2 rounded-lg hover:bg-teal-600 w-full transition duration-150`}>
                        <BsFillCalendar2WeekFill size={26} />
                        <p className="flex-1 ml-3 select-none">Agenda</p>
                    </Link>
                    <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                    <Link href="/patients" prefetch={true} className={`${pathname.includes('/patients') ? 'bg-teal-400 bg-opacity-40 text-white' : ''} flex text-left items-center p-2 rounded-lg hover:bg-teal-600 w-full transition duration-150`}>
                        <FaUsers size={26} />
                        <p className="flex-1 ml-3 select-none">Pacientes</p>
                    </Link>
                    <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                    <Link href="/messenger" prefetch={true} className={`${pathname === '/messenger' ? 'bg-teal-400 bg-opacity-40 text-white' : ''} flex text-left items-center p-2 rounded-lg hover:bg-teal-600 w-full transition duration-150`}>
                        <IoLogoWhatsapp size={26} />
                        <p className="flex-1 ml-3 select-none">Mensajeria</p>
                    </Link>
                    <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                    <Link href="/billing" prefetch={true} className={`${pathname === '/billing' ? 'bg-teal-400 bg-opacity-40 text-white' : ''} flex text-left items-center p-2 rounded-lg hover:bg-teal-600 w-full transition duration-150`}>
                        <FaDollarSign size={26} />
                        <p className="flex-1 ml-3 select-none">Facturación</p>
                    </Link>
                    <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                </div>
                <div className='absolute bottom-0 w-full'>
                    <hr className="border-teal-700 border-2 mx-3 rounded-full mb-2" />
                    <div className='flex mb-3 mx-3.5 '>
                        <button onClick={() => setOpenAlert(!openAlert)} className='flex text-sm font-medium px-1 select-none mr-1 justify-center items-center hover:scale-105 hover:border-teal-600 duration-150 border-2 rounded-xl hover:bg-teal-700'>
                            <IoLogOutSharp size={28} className="" />
                            <p>Cerrar Sesión</p>
                        </button>
                        <Link href="/config" prefetch={true} className={`${pathname === '/config' ? 'bg-teal-400 bg-opacity-40 border-teal-700 ' : ''} flex ml-2 p-1 select-none justify-center  items-center hover:scale-105 hover:border-teal-600 duration-100  border-2 rounded-xl hover:bg-teal-700`}>
                            <IoSettingsOutline size={34} />
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}