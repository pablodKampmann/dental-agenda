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
                        <PatientRecord patient={patient} />
                        <div className="border-4 border-teal-500 mt-8 rounded-3xl ml-1 mr-1 bg-teal-700">
                            <div className="bg-black py-8 px-20 rounded-3xl flex justify-center items-center">
                                <div className="flex items-center justify-center w-full">
                                    <div className="w-32 h-64 border border-black relative">
                                        <div className="w-1/3 h-1/4 bg-white absolute top-0 left-0"></div>
                                        <div className="w-1/4 h-1/2 bg-white absolute top-1/4 right-0"></div>
                                        <div className="w-1/4 h-1/2 bg-white absolute top-1/4 left-0"></div>
                                        <div className="w-1/3 h-1/4 bg-white absolute bottom-0 left-0"></div>
                                        <div className="w-1/3 h-1/2 bg-white absolute top-1/4 left-1/3"></div>
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
