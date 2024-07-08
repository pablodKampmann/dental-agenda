import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react';
import { FaUsers, FaTooth, FaDollarSign } from 'react-icons/fa';
import { IoLogOutSharp, IoSettingsOutline } from 'react-icons/io5';
import { IoMdArrowDropdown, IoMdArrowDropup, IoLogoWhatsapp } from 'react-icons/io';
import { MdNotificationsNone } from 'react-icons/md';
import { RiUserSettingsFill } from 'react-icons/ri';
import { useCheckRoutine } from "../../../hooks/useCheckRoutine";
import { useReloadPhotoURL } from "../../../hooks/useReloadPhotoURL";
//import toast, { Toaster } from 'react-hot-toast';
import { LogOutAlert } from '../../dialogAlerts/logOutAlert';
import { BsCalendar2WeekFill } from "react-icons/bs";
//import { PiCloudCheckFill } from "react-icons/pi";

export function DesktopVersion() {
    const pathname = usePathname();
    const [openLogOutAlert, setOpenLogOutAlert] = useState(false);
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const data = useCheckRoutine(false);
    const reloadImage = useReloadPhotoURL(data?.userUid);
    //const notify = () => toast.success('Successfully toasted!');

    return (
        <div>
            {/*  <Toaster
                toastOptions={{
                    success: {
                        className: 'border-2 border-green-500 p-4 rounded-md',
                    },
                }}
            />*/}
            {openLogOutAlert && (
                <LogOutAlert open={openLogOutAlert} setOpen={setOpenLogOutAlert} />
            )}
            <div className="fixed top-0 left-0 z-50 w-full border-b-4 bg-teal-950 border-teal-700">
                <div className="flex px-3 py-3 items-center justify-between">
                    <div className="flex items-center ml-1 select-none mt-1 mb-1 font-bold ">
                        <FaTooth size={30} />
                        <span className="ml-3 text-2xl">Admin</span>
                        <span className="bg-teal-600 px-1.5 rounded-xl ml-1 text-lg">PANEL</span>
                    </div>
                    {data ? (
                        <div className="flex items-center">
                            <MdNotificationsNone size={36} className="mr-3 bg-white rounded-full bg-opacity-10 hover:bg-opacity-15 hover:border-opacity-70 border-2 border-transparent hover:border-white transition duration-150 cursor-pointer p-1" />
                            <div onClick={() => setOpenUserMenu(!openUserMenu)} className={`${openUserMenu ? 'rounded-t-xl border-white border-opacity-70 ' : 'hover:border-white hover:border-opacity-70  rounded-full hover:bg-opacity-15'} flex px-3 cursor-pointer w-56 justify-center relative  items-center mr-2  border-transparent border-2 bg-white bg-opacity-10  transition duration-150 py-1  `}>
                                <p className='w-full flex justify-start text-base font-medium select-none text-nowrap'>{data.displayName}</p>
                                {openUserMenu ? (
                                    <>
                                        <IoMdArrowDropup size={24} />
                                        <div className="absolute top-8 w-56   shadow-lg border-t  border-b-2 border-opacity-70 bg-teal-950  text-white border-white border-x-2  transition duration-150 rounded-b-xl   animate-user-menu">
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
                                <Image src={`${data.photoURL}?${reloadImage}`} quality={100} priority={true} width={1920} height={1080} className='rounded-full  cursor-pointer object-cover hover:border-opacity-70 border-2 border-white  border-opacity-5 transition duration-150 h-[40px] w-[40px] shadow-2xl select-none' alt="UserPhoto" placeholder='blur' blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8XwMAAoABfYJLKisAAAAASUVORK5CYII='></Image>
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
                <div className="h-full pb-4 space-y-2 mx-3 font-medium overflow-y-auto tracking-tight">
                    <Link href="/" prefetch={true} className={`${pathname === '/' ? 'bg-teal-950  ' : 'bg-white bg-opacity-5 hover:bg-opacity-10 '} flex border-2   border-transparent hover:border-white hover:border-opacity-70 text-left items-center p-2 rounded-xl  w-full transition duration-150`}>
                        <BsCalendar2WeekFill size={22} />
                        <p className="flex-1 ml-3 select-none">Agenda</p>
                    </Link>
                    <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                    <Link href="/patients" prefetch={true} className={`${pathname.includes('/patients') ? 'bg-teal-950  ' : 'bg-white bg-opacity-5 hover:bg-opacity-10 '} flex border-2 border-transparent hover:border-white  hover:border-opacity-70 text-left items-center p-2 rounded-xl  w-full transition duration-150`}>
                        <FaUsers size={26} />
                        <p className="flex-1 ml-3 select-none">Pacientes</p>
                    </Link>
                    <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                    <Link href="/messenger" prefetch={true} className={`${pathname === '/messenger' ? 'bg-teal-950  ' : 'bg-white bg-opacity-5 hover:bg-opacity-10 '} flex border-2 border-transparent hover:border-white hover:border-opacity-70 text-left items-center p-2 rounded-xl  w-full transition duration-150`}>
                        <IoLogoWhatsapp size={26} />
                        <p className="flex-1 ml-3 select-none">Mensajeria</p>
                    </Link>
                    <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                    <Link href="/billing" prefetch={true} className={`${pathname === '/billing' ? 'bg-teal-950  ' : 'bg-white bg-opacity-5 hover:bg-opacity-10 '} flex border-2 border-transparent hover:border-white hover:border-opacity-70 text-left items-center p-2 rounded-xl  w-full transition duration-150`}>
                        <FaDollarSign size={26} />
                        <p className="flex-1 ml-3 select-none">Facturación</p>
                    </Link>
                    <hr className="border-teal-700 border rounded-full ml-2 mr-2" />
                </div>
                <div className='absolute bottom-0 w-full'>
                    <hr className="border-teal-700  border-2 mx-3 rounded-full mb-2" />
                    <div className='flex mb-3 mx-3.5 space-x-2'>
                        <button onClick={() => setOpenLogOutAlert(!openLogOutAlert)} className='bg-white px-1 py-1 bg-opacity-5 hover:bg-opacity-10 flex border-2 text-nowrap border-transparent hover:border-white border-opacity-20 text-left items-center text-sm rounded-xl  w-full transition duration-150'>
                            <IoLogOutSharp size={28} className="" />
                            <p>Cerrar Sesión</p>
                        </button>
                        <Link href="/config" prefetch={true} className={`${pathname === '/config' ? 'bg-teal-950  ' : 'bg-white  bg-opacity-5 hover:bg-opacity-10 '} flex px-1 py-1 border-2 border-transparent hover:border-white border-opacity-20  items-center justify-center rounded-xl  w-full transition duration-150`}>
                            <IoSettingsOutline size={28} />
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
}