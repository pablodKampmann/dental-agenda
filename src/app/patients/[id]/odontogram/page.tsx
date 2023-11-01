'use client'

import { getPatient } from "../../../components/getPatient";
import React, { useState, useEffect } from 'react';
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { PatientRecord } from "./../../../components/patientRecord";

export default function odontogram() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const pathname = usePathname()
    const id = pathname.split('/').slice(-2, -1)[0] || null;
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

    if (id !== null) {

        return (
            <div className='ml-56 mt-2'>
                {isLoad ? (
                    <div className='fixed inset-0 backdrop-blur-sm ml-56'>
                        <div className='fixed inset-0 flex items-center justify-center'>
                            <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                                <FaTooth size={100} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className='ml-2 p-4 mt-16 mr-2 relative'>
                        <PatientRecord patient={patient} />

                        <div className="border-4 border-teal-500 mt-8 rounded-3xl ml-1 mr-1 bg-teal-700">
                            <div className="bg-black py-8 px-20 rounded-3xl flex justify-center items-center">
                                <div className="flex items-center justify-center w-full">
                                    <div className="w-32 h-64 border border-black relative">
                                        <div className="relative w-40 h-40 border-4 border-gray-500">
                                            <div className="top-1/4 left-1/4 w-20 h-20 border-4 border-gray-500"></div>
                                            <div className=" border-t-2 border-l-2 border-gray-500 border-solid border-opacity-100 top-0 left-0"></div>
                                            <rect x="50" y="50" width="100" height="100" fill="" stroke="black" stroke-width="2" />
                                            <rect x="75" y="75" width="50" height="50" fill="" stroke="black" stroke-width="2" />
                                            <line x1="50" y1="50" x2="75" y2="75" stroke="black" stroke-width="2" />
                                            <line x1="150" y1="50" x2="125" y2="75" stroke="black" stroke-width="2" />
                                            <line x1="50" y1="150" x2="75" y2="125" stroke="black" stroke-width="2" />
                                            <line x1="150" y1="150" x2="125" y2="125" stroke="black" stroke-width="2" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
