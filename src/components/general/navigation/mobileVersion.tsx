import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react';
import { FaUsers, FaTooth, FaDollarSign } from 'react-icons/fa';
import { IoLogOutSharp, IoSettingsOutline } from 'react-icons/io5';
import { IoMdArrowDropdown, IoMdArrowDropup, IoLogoWhatsapp } from 'react-icons/io';
import { MdNotificationsNone } from 'react-icons/md';
import { RiUserSettingsFill } from 'react-icons/ri';
import { useCheckRoutine } from "../../../hooks/useCheckRoutine";
import { useReloadPhotoURL } from "../../../hooks/useReloadPhotoURL";
import { useOutsideClick } from './../../../hooks/useOutsideClick'; // Ruta correcta a tu hook personalizado
import { BsCalendar2WeekFill } from "react-icons/bs";
import { BsArrowBarRight, BsArrowBarLeft } from "react-icons/bs";

interface props {
    openLogOutAlert: boolean;
    setOpenLogOutAlert: (value: boolean) => void;
}

export function MobileVersion({ openLogOutAlert, setOpenLogOutAlert }: props) {
    const pathname = usePathname();
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const [openSideBar, setOpenSideBar] = useState(false);
    const data = useCheckRoutine(false);
    const reloadImage = useReloadPhotoURL(data?.userUid);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useOutsideClick(sidebarRef, () => {
        setOpenSideBar(false);
    });

    function handleLink() {
        setOpenSideBar(false);
    }

    return (
        <div>

            <div className="fixed top-0 h-18 left-0 z-40 w-full border-b-4 bg-teal-950 border-teal-700">
                <div className="flex px-1.5 py-3 items-center justify-between">

                    <div>
                        <BsArrowBarRight onClick={() => setOpenSideBar(!openSideBar)} size={40} className=" bg-white rounded-full bg-opacity-10 hover:bg-opacity-15 hover:border-opacity-70 border-2 border-transparent hover:border-white transition duration-150 cursor-pointer p-1" />
                    </div>
                    {data ? (
                        <div className="flex items-center justify-end w-full">
                            <MdNotificationsNone size={36} className="mr-3 bg-white rounded-full bg-opacity-10 hover:bg-opacity-15 hover:border-opacity-70 border-2 border-transparent hover:border-white transition duration-150 cursor-pointer p-1" />
                            <div onClick={() => setOpenUserMenu(!openUserMenu)} className={`${openUserMenu ? 'rounded-t-xl border-white border-opacity-70 ' : 'hover:border-white hover:border-opacity-70  rounded-full hover:bg-opacity-15'} flex px-2 cursor-pointer w-44 justify-center relative  items-center mr-2  border-transparent border-2 bg-white bg-opacity-10  transition duration-150 py-1  `}>
                                <p className='w-full flex justify-start text-sm font-medium select-none text-nowrap'>{data.displayName}</p>
                                {openUserMenu ? (
                                    <>
                                        <IoMdArrowDropup size={24} />
                                        <div className="absolute top-8 w-44   shadow-lg border-t  border-b-2 border-opacity-70 bg-teal-950  text-white border-white border-x-2  transition duration-150 rounded-b-xl   animate-user-menu">
                                            <Link href='/config' className="px-3 bg-white hover:bg-opacity-20    bg-opacity-10 py-1 select-none flex items-center"><RiUserSettingsFill className="mr-1 " /> Configuración </Link>
                                            <div className='w-full h-[1px] bg-white bg-opacity-70'></div>
                                            <div onClick={() => setOpenLogOutAlert(true)} className="px-3 py-1  bg-white bg-opacity-10  hover:bg-opacity-20 rounded-b-xl select-none flex items-center"><IoLogOutSharp className="mr-1" />Cerrar Sesión</div>
                                        </div>
                                    </>
                                ) : (
                                    <IoMdArrowDropdown size={24} />
                                )}
                            </div>
                            <Link className='focus:outline-none' href={'/config'}>
                                <Image src={`${data.photoURL}?${reloadImage}`} quality={100} priority={true} width={200} height={200} className='rounded-full  cursor-pointer object-cover hover:border-opacity-70 border-2 border-white  border-opacity-5 transition duration-150 h-[40px] w-[40px] shadow-2xl select-none' alt="UserPhoto" placeholder='blur' blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8XwMAAoABfYJLKisAAAAASUVORK5CYII='></Image>
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

            {openSideBar && <div className="fixed top-0 left-0 w-full h-full bg-black opacity-60 z-50"></div>}

            <div ref={sidebarRef} className={`fixed  top-0 left-0 z-50 h-full  transition-all duration-150  border-r-4 border-teal-700 ${openSideBar ? ' translate-x-fit w-[60%]' : '-translate-x-full'}   bg-teal-900	`} aria-label="Sidebar">
                <div className="h-full   font-medium overflow-y-auto tracking-tight">
                    <div className='w-full border-b-4 pl-1 pr-1.5 py-3  bg-teal-950  border-teal-700 mb-4 flex justify-between'>
                        <div className="flex items-center  ml-1 select-none mt-1 mb-1 font-bold ">
                            <FaTooth size={24} />
                            <span className="ml-0.5 text-lg">Admin</span>
                            <span className="bg-teal-600 px-1.5  rounded-xl ml-0.5 text-sm">PANEL</span>
                        </div>
                        <BsArrowBarLeft onClick={() => setOpenSideBar(!openSideBar)} size={40} className=" bg-white rounded-full bg-opacity-10 hover:bg-opacity-15 hover:border-opacity-70 border-2 border-transparent hover:border-white transition duration-150 cursor-pointer p-1" />
                    </div>
                    <div className='px-3 space-y-2'>
                        <Link href="/" prefetch={true} onClick={handleLink} className={`${pathname === '/' ? 'bg-teal-950  ' : 'bg-white bg-opacity-5 hover:bg-opacity-10 '} flex border-2   border-transparent hover:border-white hover:border-opacity-70 text-left items-center p-2 rounded-xl  w-full transition duration-150`}>
                            <BsCalendar2WeekFill size={22} />
                            <p className="flex-1 ml-3 select-none">Agenda</p>
                        </Link>
                        <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                        <Link href="/patients" prefetch={true} onClick={handleLink} className={`${pathname.includes('/patients') ? 'bg-teal-950  ' : 'bg-white bg-opacity-5 hover:bg-opacity-10 '} flex border-2 border-transparent hover:border-white  hover:border-opacity-70 text-left items-center p-2 rounded-xl  w-full transition duration-150`}>
                            <FaUsers size={26} />
                            <p className="flex-1 ml-3 select-none">Pacientes</p>
                        </Link>
                        <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                        <Link  href="/messenger" prefetch={true} onClick={handleLink} className={`${pathname === '/messenger' ? 'bg-teal-950  ' : 'bg-white bg-opacity-5 hover:bg-opacity-10 '} flex border-2 border-transparent hover:border-white hover:border-opacity-70 text-left items-center p-2 rounded-xl  w-full transition duration-150`}>
                            <IoLogoWhatsapp size={26} />
                            <p className="flex-1 ml-3 select-none">Mensajeria</p>
                        </Link>
                        <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                        <Link href="/billing" prefetch={true} onClick={handleLink} className={`${pathname === '/billing' ? 'bg-teal-950  ' : 'bg-white bg-opacity-5 hover:bg-opacity-10 '} flex border-2 border-transparent hover:border-white hover:border-opacity-70 text-left items-center p-2 rounded-xl  w-full transition duration-150`}>
                            <FaDollarSign size={26} />
                            <p className="flex-1 ml-3 select-none">Facturación</p>
                        </Link>
                        <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                    </div>
                </div>
                <div className='absolute bottom-0 w-full'>
                    <hr className="border-teal-700  border-2 mx-3 rounded-full mb-2" />
                    <div className='flex mb-3 mx-3.5 space-x-2'>
                        <button onClick={() => setOpenLogOutAlert(!openLogOutAlert)} className='bg-white px-1 py-1 bg-opacity-5 hover:bg-opacity-10 flex border-2 text-nowrap border-transparent hover:border-white border-opacity-20 text-left items-center text-sm rounded-xl  w-full transition duration-150'>
                            <IoLogOutSharp size={28} className="" />
                            <p>Cerrar Sesión</p>
                        </button>
                        <Link href="/config" prefetch={true} onClick={handleLink} className={`${pathname === '/config' ? 'bg-teal-950  ' : 'bg-white  bg-opacity-5 hover:bg-opacity-10 '} flex px-1 py-1 border-2 border-transparent hover:border-white border-opacity-20  items-center justify-center rounded-xl  w-full transition duration-150`}>
                            <IoSettingsOutline size={28} />
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}