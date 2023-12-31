'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react';
import Link from 'next/link'
import { FaUsers, FaTooth, FaDollarSign } from 'react-icons/fa';
import { BsFillCalendar2WeekFill } from 'react-icons/bs';
import { IoLogOutSharp } from 'react-icons/io5';
import { IoMdArrowDropdown, IoMdArrowDropup, IoLogoWhatsapp } from 'react-icons/io';
import { MdNotificationsActive, MdNotificationsNone } from 'react-icons/md';
import { RiUserSettingsFill } from 'react-icons/ri';
import { getUser } from "./../components/getUser";
import { Alert } from "./alert";
import { PropagateLoader, PulseLoader } from "react-spinners";

export function SideBar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [openAlert, setOpenAlert] = useState(false);
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const [loadOption, setLoadOption] = useState('');

    useEffect(() => {
        async function get() {
            try {
                const user = await getUser();
                setUser(user);
            } catch (error) {
                console.log(error);
            }
        }

        get();
    }, []);

    useEffect(() => {

        if (pathname === loadOption) {
            setLoadOption('');
        }
    }, [loadOption, pathname]);

    function handleSignOut() {
        setOpenAlert(true);
    }

    function closeModal() {
        setOpenAlert(false);
    }

    return (
        <div>
            <div>
                {openAlert && (
                    <div className='fixed inset-0 backdrop-blur-sm ml-56 z-10'>
                        <Alert id={null} firstMessage={'¿Estás seguro/a de que deseas cerrar la sesion activa?'} secondMessage={null} action={'Cerrar Sesion'} onCloseModal={closeModal} />
                    </div>)}
            </div>
            <nav className="fixed top-0 z-50 w-full border-b-4 bg-teal-950 border-teal-700">
                <div className="px-3 py-3 lg:px-5 lg:pl-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex ml-1 mt-1 mb-1">
                                <FaTooth size={30} />
                                <span className="self-center font-bold ml-3 text-2xl select-none">Admin</span>
                                <span className="bg-teal-600 px-1 rounded-lg self-center font-bold ml-1 text-lg select-none">PANEL</span>
                            </div>
                        </div>
                        {user ? (
                            <div className="flex items-center ">
                                <MdNotificationsNone size={32} className="mr-3" />
                                <div onClick={() => setOpenUserMenu(!openUserMenu)} className={`${openUserMenu ? 'rounded-t-2xl bg-teal-500 text-teal-900' : 'border-b-2 rounded-full '} flex justify-center relative items-center mr-2 cursor-pointer hover:bg-teal-500 transition duration-150 py-1 hover:text-teal-900 shadow-xl border-t-2 border-teal-700`}>
                                    <p className='ml-3 text-base font-medium select-none'>{user.displayName}</p>
                                    {openUserMenu ? (
                                        <IoMdArrowDropup size={24} className="ml-1 mr-1" />
                                    ) : (
                                        <IoMdArrowDropdown size={24} className="ml-1 mr-1" />
                                    )}
                                    {openUserMenu && (
                                        <div className="absolute mt-24 w-full shadow-lg bg-teal-100 transition duration-150 rounded-b-lg border-t-2 border-teal-700 animate-user-menu">
                                            <div className="px-3 py-1 border text-teal-900 border-teal-700 hover:bg-teal-300 select-none flex items-center"><RiUserSettingsFill className="mr-1 text-teal-900" /> Perfil </div>
                                            <div onClick={handleSignOut} className="px-3 py-1 border text-teal-900 border-teal-700 hover:bg-teal-300 rounded-b-lg select-none flex items-center"><IoLogOutSharp className="mr-1 text-teal-900" />Cerrar Sesión</div>
                                        </div>
                                    )}
                                </div>
                                <Image src={`/${user.userName}.jpg`} width={40} height={40} className='rounded-full shadow-2xl select-none' alt="UserPhoto"></Image>
                            </div>
                        ) : (
                            <div className='flex items-center mb-3 mr-24'>
                                <PropagateLoader color="white" speedMultiplier={2} />
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            <aside id="logo-sidebar" className="fixed top-0 left-0 z-40 w-56 h-screen pt-20 transition-transform -translate-x-full border-r-4 border-teal-700 sm:translate-x-0 bg-teal-900	" aria-label="Sidebar">
                <div className="h-full px-3 pb-4 overflow-y-auto bg-gradient-to-b from-teal-900 from-90% to-teal-800">
                    <ul className="space-y-2 font-medium">
                        <Link href="/" prefetch={true} onClick={() => setLoadOption('/')}>
                            <li>
                                <button type="button" className={`${pathname === '/' ? 'bg-teal-400 bg-opacity-40 text-white' : ''} flex text-left items-center p-2 rounded-lg hover:bg-teal-600 w-full transition duration-100`}>
                                    <BsFillCalendar2WeekFill size={26} />
                                    {loadOption === '/' ? (
                                        <PulseLoader color="white" size={10} className='ml-12' />
                                    ) : (
                                        <p className="flex-1 ml-3 select-none">Calendario</p>
                                    )}
                                </button>
                            </li>
                        </Link>
                        <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                        <Link href="/patients" prefetch={true} onClick={() => setLoadOption('/patients')}>
                            <li>
                                <button type="button" className={`${pathname.includes('/patients') ? 'bg-teal-400 bg-opacity-40 text-white' : ''} flex text-left items-center p-2 rounded-lg hover:bg-teal-600 w-full transition duration-100 mt-2`}>
                                    <FaUsers size={28} />
                                    {loadOption === '/patients' ? (
                                        <PulseLoader color="white" size={10} className='ml-12' />
                                    ) : (
                                        <p className="flex-1 ml-3 select-none">Pacientes</p>
                                    )}
                                </button>
                            </li>
                        </Link>
                        <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                        <Link href="/chat" prefetch={true} onClick={() => setLoadOption('/chat')}>
                            <li>
                                <button type="button" className={`${pathname === '/chat' ? 'bg-teal-400 bg-opacity-40 text-white' : ''} flex text-left items-center p-2 rounded-lg hover:bg-teal-600 w-full transition duration-100 mt-2`}>
                                    <IoLogoWhatsapp size={28} />
                                    {loadOption === '/chat' ? (
                                        <PulseLoader color="white" size={10} className='ml-12' />
                                    ) : (
                                        <p className="flex-1 ml-3 select-none">Mensajeria</p>
                                    )}
                                </button>
                            </li>
                        </Link>
                        <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                        <Link href="/billing" prefetch={true} onClick={() => setLoadOption('/billing')}>
                            <li>
                                <button type="button" className={`${pathname === '/billing' ? 'bg-teal-400 bg-opacity-40 text-white' : ''} flex text-left items-center p-2 rounded-lg hover:bg-teal-600 w-full transition duration-100 mt-2`}>
                                    <FaDollarSign size={26} />
                                    {loadOption === '/billing' ? (
                                        <PulseLoader color="white" size={10} className='ml-12' />
                                    ) : (
                                        <p className="flex-1 ml-3 select-none">Facturación</p>
                                    )}
                                </button>
                            </li>
                        </Link>
                        <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                    </ul>
                    <div className='absolute bottom-0'>
                        <hr className="border-teal-700 border-2 rounded-full w-full ml-2 mb-2" />
                        <button type="button" onClick={handleSignOut} className='flex py-0.5 justify-center items-center hover:scale-110 hover:border-teal-600 duration-100 ml-4 ease-in-out border-2 rounded-xl px-2 mb-3 hover:bg-teal-700'>
                            <IoLogOutSharp size={40} className="" />
                            <p className='text-medium font-medium'>Cerrar Sesión</p>
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}