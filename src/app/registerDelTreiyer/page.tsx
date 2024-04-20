'use client'

import React, { useState, useEffect } from 'react';
import { IoGameController } from "react-icons/io5";
import { RiSendPlane2Line } from "react-icons/ri";
import { GiCrossedSwords } from "react-icons/gi";

export default function Page() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formSubmit, setFormSubmit] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFormSubmit(false);
        }, 6000);
    
        return () => clearTimeout(timeoutId);
      }, [formSubmit]);

    return (
        <div className="flex bg-zinc-200 z-50 fixed inset-0">
            {formSubmit && (
                <div className='absolute text-xs text-black'>
                    {name} <br /> {email} <br /> {password} <br /> {confirmPassword}
                </div>
            )}
            <div className='flex border-r-4 select-none  border-gray-800 justify-center items-center h-screen bg-zinc-200 bg-opacity-20 w-1/2'>
                <div className='relative flex-col w-[60%] bg-gray-100 border-4 border-gray-800 bg-opacity-100 p-6 rounded-lg shadow-lg'>
                    <GiCrossedSwords size={60} className='absolute text-black right-3 top-3 hover:rotate-180 transition duration-500' />
                    <span className="bg-[#8ebebd] hover:scale-105 transition duration-150  font-semibold tracking-wide text-xl flex justify-center items-center text-black rounded-lg w-fit px-2 py-1 shadow-lg select-none ">
                        Register: <IoGameController className="ml-2" size={22} />
                    </span>
                    <span className="text-sm font-sans  tracking-wide mt-2 mb-4 text-black ml-1 leading-snug text-left w-[60%] flex ">Complete el siguiente formulario de registro para empezar a jugar</span>
                    <div className="bg-black mt-4 bg-opacity-85 shadow-lg w-[80%] p-4 rounded-lg">
                        <form onSubmit={(event) => { event.preventDefault(); setFormSubmit(true); }} className="flex-col select-none">
                            <label className="text-white-700 text-sm font-bold ml-0.5">Nombre:</label>
                            <input onChange={(e) => setName(e.target.value)} className="bg-transparent flex rounded-lg cursor-pointer hover:bg-[#8ebebd] hover:bg-opacity-20 w-full focus:bg-opacity-20 focus:bg-[#8ebebd]  focus:outline-none focus:border-t-[#8ebebd] focus:border-l-[#8ebebd]  focus:border-r-[#8ebebd] border-2 border-t-transparent border-r-transparent border-l-transparent  transition duration-300 ease-in-out  border-[#8ebebd] text-white px-1 py-2 text-sm" type="text" />
                            <label className="text-white-700 text-sm font-bold flex ml-0.5 mt-2">Email:</label>
                            <input onChange={(e) => setEmail(e.target.value)} className="bg-transparent flex rounded-lg cursor-pointer hover:bg-[#8ebebd] hover:bg-opacity-20 w-full  focus:bg-opacity-20 focus:bg-[#8ebebd]  focus:outline-none focus:border-t-[#8ebebd] focus:border-l-[#8ebebd]  focus:border-r-[#8ebebd] border-2 border-t-transparent border-r-transparent border-l-transparent  transition duration-300 ease-in-out  border-[#8ebebd] text-white px-1 py-2 text-sm" type="email" />
                            <label className="text-white-700 text-sm font-bold ml-0.5 mt-2 flex">Contraseña:</label>
                            <input onChange={(e) => setPassword(e.target.value)} className="bg-transparent flex rounded-lg cursor-pointer hover:bg-[#8ebebd] hover:bg-opacity-20 w-full  focus:bg-opacity-20 focus:bg-[#8ebebd]  focus:outline-none focus:border-t-[#8ebebd] focus:border-l-[#8ebebd]  focus:border-r-[#8ebebd] border-2 border-t-transparent border-r-transparent border-l-transparent  transition duration-300 ease-in-out  border-[#8ebebd] text-white px-1 py-2 text-sm" type="password" />
                            <label className="text-white-700 text-sm font-bold ml-0.5 mt-2 flex">Confirmar Contraseña:</label>
                            <input onChange={(e) => setConfirmPassword(e.target.value)} className="bg-transparent flex rounded-lg cursor-pointer hover:bg-[#8ebebd] hover:bg-opacity-20 w-full focus:bg-opacity-20 focus:bg-[#8ebebd]  focus:outline-none focus:border-t-[#8ebebd] focus:border-l-[#8ebebd]  focus:border-r-[#8ebebd] border-2 border-t-transparent border-r-transparent border-l-transparent  transition duration-300 ease-in-out  border-[#8ebebd] text-white px-1 py-2 text-sm" type="password" />
                            <div className="flex text-xs justify-center items-center mt-4">
                                <div className="flex">
                                    <input type="checkbox" className=" accent-[#a5dddc] focus:outline-none border-2 border-gray-300 rounded-md " />
                                    <p className="ml-1 text-gray-300">Keep me signed in</p>
                                </div>
                                <p className="ml-auto  cursor-pointer hover:font-light transition duration-500 font-extralight text-[#8ebebd]">Already a member?</p>
                            </div>
                            <button type="submit" className="flex focus:outline-none hover:scale-105  justify-center items-center h-10 bg-[#8ebebd] mt-8 transition duration-300 hover:bg-[#a5dddc] w-full rounded-sm py-1 font-medium text-xl">Enviar <RiSendPlane2Line className="flex ml-2" size={20} /></button>
                        </form>
                    </div>
                </div>
            </div>
            <div className='flex border-l-4 border-gray-800 justify-center  items-center h-screen bg-gradient-to-t   from-[#8ebebd] from-5%  to-[#b34321] ti-100% w-1/2'>
                <div className='flex-col flex justify-center items-center p-8 '>
                    <div className='text-white font-sans  text-lg mb-2 tracking-wide uppercase select-none'>A real game</div>
                    <div className='text-white font-sans font-bold text-4xl mb-4 tracking-wide uppercase select-none'>Age of   Empires</div>
                    <div className="bg-white rounded-3xl w-24 h-2"></div>
                    <div className=" w-[70%] mt-4 font-sans tracking-widest text-center">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer bibendum eros eu ultricies ultricies. Curabitur accumsan augue ut imperdiet ultrices. Nunc nulla ligula, gravida id.
                    </div>

                </div>
            </div>
        </div>
    );
}
