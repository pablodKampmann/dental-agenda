'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { RingLoader } from "react-spinners";
import { BiSolidLogInCircle } from 'react-icons/bi';
import { signIn } from "./../components/signIn";
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { RiAlertFill } from 'react-icons/ri';

export default function NotSing() {
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [load, setLoad] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setLoad(false)

        const timeoutId = setTimeout(() => {
            setError('');
            setResult('')
        }, 5000);

        return () => clearTimeout(timeoutId);
    }, [error]);

    async function handleSignIn(e: any) {
        e.preventDefault();
        setLoad(true);
        const result = await signIn(userName, password)
        if (result !== undefined) {
            setResult(result);
            if (result === 'all-good') {
                router.push('/')
            } else if (result === 'wrong-userName') {
                setError('El usuario proporcionado es incorrecto.');
            } else if (result === 'wrong-password') {
                setError('La clave proporcionada no coincide con el usuario.');
            } else if (result === 'network-error') {
                setError('Asegúrate de contar con una conexión a Internet.');
            }
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-r from-teal-500 via-emerald-700 to-emerald-900">
            {error !== '' && error !== 'all-good' ? (
                <div className="fixed top-0 right-0 p-4 border-2 border-red-900 mt-4 mr-2 rounded-lg bg-red-400 bg-opacity-50 transform animate-move-from-right">
                    <div className='flex justify-start items-center'>
                        <RiAlertFill className='' size={30} />
                        <p className='ml-2 font-semibold text-md'>Error:</p>
                        <p className='ml-1 font-normal text-sm'>{error}</p>
                    </div>
                </div>
            ) : (
                null
            )}
            <div className="relative max-w-lg w-full p-8">
                <h1 className='flex justify-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-teal-100 to-white '>Admin Panel</h1>
                <h1 className='flex justify-center mb-16 text-md font-extralight'>Consultorio Odontológico Dra. Karina Alvarez</h1>
                <div className="mb-16 rounded-lg bg-teal-900 shadow-2xl transition duration-500 h-80">
                    <div className="p-6">
                        <h1 className="flex mb-4 text-3xl font-medium">
                            <span>Iniciar</span>
                            <span className="text-teal-500 ml-2">Sesion</span>
                            <BiSolidLogInCircle size={40} className="text-teal-500 ml-2" />
                        </h1>
                        <form className="" onSubmit={handleSignIn}>
                            <div>
                                <label htmlFor="text" className=" mb-1 text-sm font-medium ">Usuario</label>
                                <input disabled={load} type="text" name="user" id="user" value={userName} onChange={(e) => setUserName(e.target.value)} className={`${load ? 'bg-teal-600 text-white' : 'bg-gray-50 text-black'} ${result === 'wrong-userName' ? 'border-red-500 bg-red-300' : 'border-teal-600'} border-2 text-sm focus:outline-none focus:border-teal-400 rounded-lg w-full p-2  font-semibold transition duration-300`} placeholder="nombre.apellido" required />
                            </div>
                            <div className='mt-4'>
                                <label htmlFor="password" className=" mb-1 text-sm font-medium ">Clave</label>
                                <div className='relative'>
                                    <input disabled={load} type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••••••••••••" className={`${load ? 'bg-teal-600 text-white' : 'bg-gray-50 text-black'} ${result === 'wrong-password' ? 'border-red-500 bg-red-300' : 'border-teal-600'} border-2  text-sm focus:outline-none focus:border-teal-400 rounded-lg w-full p-2 font-semibold transition duration-300`} required />
                                    {showPassword ? (
                                        <MdVisibilityOff onClick={() => setShowPassword(!showPassword)} size={24} className="absolute inset-y-0 right-0 mr-2 mt-2 text-teal-900 cursor-pointer transform hover:scale-110 transition duration-150" />
                                    ) : (
                                        <MdVisibility onClick={() => setShowPassword(!showPassword)} size={24} className="absolute inset-y-0 right-0 mr-2 mt-2 text-teal-900 cursor-pointer transform hover:scale-110 transition duration-150" />
                                    )}
                                </div>
                            </div>
                            <div className='flex justify-center'>
                                <button disabled={load} type="submit" className={`${load ? 'w-12 rounded-full scale-110 flex justify-center' : ' scale-100 w-full rounded-lg'} mt-6 bg-teal-600 hover:bg-teal-500 focus:ring-4 focus:ring-teal-500 focus:outline-none font-medium text-md py-2 transition duration-500`}>
                                    {load ? (
                                        <div className='flex justify-center'>
                                            <RingLoader color='white' size={30} />
                                        </div>
                                    ) : (
                                        <div>
                                            Continuar
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
