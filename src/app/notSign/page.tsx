'use client'

import React, { useState } from 'react';
import { db, auth } from "./../firebase";
import { get, ref } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from 'next/navigation'
import { RingLoader } from "react-spinners";
import { BiSolidLogInCircle } from 'react-icons/bi';

export default function NotSing() {
    const router = useRouter();
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [load, setLoad] = useState(false);

    async function handleSignIn(e: any) {
        e.preventDefault();
        setLoad(true);
        const dbRef = ref(db, 'admins/');
        const snapshot = await get(dbRef);
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach((key) => {
                if (user === snapshot.val()[key].userName) {
                    setEmail(snapshot.val()[key].email);
                }
            });
            if (email !== "") {
                const user = await signInWithEmailAndPassword(auth, email, password)
                if (user) {
                    router.push('/')
                }
            }
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-r from-teal-500 via-emerald-700 to-emerald-900">
            <div className="relative max-w-lg w-full p-8">
                <div className="rounded-lg bg-teal-900 shadow-2xl transition duration-500 h-80">
                    <div className="p-6">
                        <h1 className="flex mb-4 text-3xl font-medium">
                            <span>Iniciar</span>
                            <span className="text-teal-500 ml-2">Sesion</span>
                            <BiSolidLogInCircle size={40} className="text-teal-500 ml-2" />
                        </h1>
                        <form className="" onSubmit={handleSignIn}>
                            <div>
                                <label htmlFor="text" className=" mb-1 text-sm font-medium ">Usuario</label>
                                <input type="text" name="user" id="user" value={user} onChange={(e) => setUser(e.target.value)} className="border-2 border-teal-600 bg-gray-50 text-sm focus:outline-none focus:border-teal-400 rounded-lg w-full p-2 text-black font-semibold" placeholder="nombre.apellido" required />
                            </div>
                            <div className='mt-4'>
                                <label htmlFor="password" className=" mb-1 text-sm font-medium ">Clave</label>
                                <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="•••••••••••••" className="border-2 border-teal-600 bg-gray-50 text-sm focus:outline-none focus:border-teal-400 rounded-lg w-full p-2 text-black font-semibold" required />
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
            <button className='bg-red-500' onClick={() => setLoad(!load)}>Hola</button>
        </div>
    );
}
