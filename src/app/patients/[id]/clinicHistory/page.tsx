'use client'

import Link from 'next/link'
import { getPatient } from "../../../components/getPatient";
import React, { useState, useEffect } from 'react';
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

export default function PatientId() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const pathname = usePathname()
    const id = (pathname.split('/').pop() || null) as string | null;
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
                        <p>hola</p>
                    </div>
                )}
            </div>
        );
    }
}
