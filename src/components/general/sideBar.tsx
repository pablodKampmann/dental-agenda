'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react';
import { FaUsers, FaTooth, FaDollarSign } from 'react-icons/fa';
import { BsFillCalendar2WeekFill } from 'react-icons/bs';
import { IoLogOutSharp, IoSettingsOutline } from 'react-icons/io5';
import { IoMdArrowDropdown, IoMdArrowDropup, IoLogoWhatsapp } from 'react-icons/io';
import { MdNotificationsNone } from 'react-icons/md';
import { RiUserSettingsFill } from 'react-icons/ri';
import { checkRoutine } from "./../../hooks/checkRoutine";
import { db } from "./../../app/firebase";
import { ref, onValue } from "firebase/database";
//import toast, { Toaster } from 'react-hot-toast';
//import { DialogAlert } from "./dialogAlert";

export function SideBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [openAlert, setOpenAlert] = useState(false);
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const [reloadImage, setReloadImage] = useState(Date.now());
    const data = checkRoutine(false);
    //const notify = () => toast.success('Successfully toasted!');

    {/* UPDATE LINK PHOTOURL */ }
    useEffect(() => {
        const reloadImage = async () => {
            setReloadImage(Date.now());
        };

        if (data) {
            const photoUserRef = ref(db, '/admins/' + data.userUid + '/isPhotoUpdate/');
            const unsubscribe = onValue(photoUserRef, async () => {
                await reloadImage();
            });

            return () => unsubscribe();
        }
    }, [data]);

    return (
        <div>
           {/*  <Toaster
                toastOptions={{
                    success: {
                        className: 'border-2 border-green-500 p-4 rounded-md',
                    },
                }}
            />*/}

            <div className="fixed top-0 left-0 z-50 w-full border-b-4 bg-teal-950 border-teal-700">
                <div className="flex px-3 py-3 items-center justify-between">
                    <div className="flex items-center ml-1 select-none mt-1 mb-1 font-bold ">
                        <FaTooth size={30} />
                        <span className="ml-3 text-2xl">Admin</span>
                        <span className="bg-teal-600 px-1 rounded-lg ml-1 text-lg">PANEL</span>
                    </div>
                    {/*<DialogAlert />*/}
                    {data ? (
                        <div className="flex items-center">
                            <MdNotificationsNone size={36} className="mr-3 bg-white rounded-full bg-opacity-15 hover:bg-opacity-20 transition duration-150 cursor-pointer p-1" />
                            <div onClick={() => setOpenUserMenu(!openUserMenu)} className={`${openUserMenu ? 'rounded-t-2xl  ' : ' rounded-full '} flex justify-center relative  items-center mr-2 cursor-pointer border-white border-transparent border-2 bg-white bg-opacity-5 hover:bg-opacity-15 transition duration-150 py-1 w-fit `}>
                                <p className='ml-3 text-base font-medium select-none'>{data.displayName}</p>
                                {openUserMenu ? (
                                    <>
                                        <IoMdArrowDropup size={24} className="ml-4 mr-1" />
                                        <div className="absolute top-8    w-full shadow-lg bg-teal-950 text-white transition duration-150 rounded-b-lg   animate-user-menu">
                                            <div onClick={() => router.push('/config')} className="px-3 bg-white     bg-opacity-5 py-1 select-none flex items-center"><RiUserSettingsFill className="mr-1 " /> Configuración </div>
                                            <div onClick={() => setOpenAlert(true)} className="px-3 py-1  bg-white bg-opacity-5  rounded-b-lg select-none flex items-center"><IoLogOutSharp className="mr-1" />Cerrar Sesión</div>
                                        </div>
                                    </>
                                ) : (
                                    <IoMdArrowDropdown size={24} className="ml-4 mr-1" />
                                )}
                            </div>
                            <Link className='focus:outline-none' href={'/config'}>
                                <Image src={`${data.photoURL}?${reloadImage}`} quality={100} priority={true} width={40} height={40} className='rounded-full cursor-pointer object-cover	border-2 border-transparent transition duration-150 hover:border-white h-[40px] w-[40px] shadow-2xl select-none' alt="UserPhoto" placeholder='blur' blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8XwMAAoABfYJLKisAAAAASUVORK5CYII='></Image>
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