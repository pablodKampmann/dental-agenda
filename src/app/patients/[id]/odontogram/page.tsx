'use client'

import { getPatient } from "../../../components/getPatient";
import React, { useState, useEffect } from 'react';
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RiArrowGoBackFill } from 'react-icons/ri';
import { usePathname } from 'next/navigation'

export default function Odontogram() {
    const router = useRouter();
    const pathname = usePathname()
    const id = pathname.split('/').slice(-2, -1)[0] || null;
    const [isLoad, setIsLoad] = useState(true);
    const [patient, setPatient] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && patient) {
                setIsLoad(false);
            } else if (!user) {
                router.push("/notSign");
            }
        });

        return () => unsubscribe();
    }, [router, patient]);

    useEffect(() => {
        async function get() {
            try {
                const data = await getPatient(id);
                setPatient(data);
            } catch (error) {
                console.error(error);
            }
        }

        get();
    }, [id]);

    return (
        <div className='ml-64 mt-2'>
            {isLoad ? (
                <div className='fixed inset-0 backdrop-blur-sm ml-64'>
                    <div className='fixed inset-0 flex items-center justify-center'>
                        <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                            <FaTooth size={100} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className='ml-2 p-4 mt-16 mr-2 relative'>
                    <div className='flex mb-2'>
                        <Link prefetch={true} href="/patients">
                            <RiArrowGoBackFill size={50} className={`mb-4 hover:scale-125 duration-150 ease-in-out text-teal-800`} />
                        </Link>
                        <div className='flex mx-auto items-center mb-2'>
                            <Link prefetch={true} href={`/patients/${id}`}>
                                <button className='bg-gray-500 hover:bg-teal-900  shadow-lg ml-4  h-10 border-2 focus:outline-none border-teal-500 text-white text-lg font-semibold rounded-l-lg transition duration-300 px-3'>Info. Basica</button>
                            </Link>
                            <Link prefetch={true} href={`/patients/${id}/clinicHistory`}>
                                <button className='bg-gray-500 hover:bg-teal-900  shadow-lg h-10 border-2 focus:outline-none border-teal-500 text-white text-lg font-semibold transition duration-300 px-3'>Historia Clinica</button>
                            </Link>
                            <button className='bg-teal-500 border-4 shadow-lg h-10 focus:outline-none border-teal-500 text-white  text-lg font-semibold rounded-r-lg transition duration-300 px-3'>Odontograma</button>
                        </div>
                    </div>
                    <h1 className="flex justify-center items-center text-3xl text-teal-500 font-semibold">ODONTOGRAMA</h1>
                </div>
            )}
        </div>
    )
}
