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
                            <div className="bg-whte py-8 px-20 rounded-3xl flex justify-center items-center">
                                <div className="flex items-center justify-center w-full">
                                    <polygon points="0,0 	20,0 	15,5 	5,5" fill="white" stroke="white" stroke-width="0.5" id="T" opacity="1"></polygon>
                                    <polygon points="5,15 	15,15 	20,20 	0,20" fill="white" stroke="white" stroke-width="0.5" id="B" opacity="1"></polygon>
                                    <polygon points="15,5 	20,0 	20,20 	15,15" fill="white" stroke="white" stroke-width="0.5" id="R" opacity="1"></polygon>
                                    <polygon points="0,0 	5,5 	5,15 	0,20" fill="white" stroke="white" stroke-width="0.5" id="L" opacity="1"></polygon>
                                    <polygon points="5,5 	15,5 	15,15 	5,15" fill="white" stroke="white" stroke-width="0.5" id="C" opacity="1"></polygon>
                                    <text x="6" y="30" stroke="navy" fill="navy" stroke-width="0.1" className="font-size: 6pt;font-weight:normal">18</text>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
