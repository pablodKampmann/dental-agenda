'use client'

import { getPatient } from "./../../../../components/patients/db/getPatient";
import React, { useState, useEffect } from 'react';
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { PatientRecord } from "./../../../../components/patients/ui/patientRecord";
import Image from 'next/image'
import { getUser } from "@/components/auth/getUser";

export default function Odontogram() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const pathname = usePathname()
    const id = pathname.split('/').slice(-2, -1)[0] || null;
    const [patient, setPatient] = useState<any>(null);
    const [clinicId, setClinicId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/notSign");
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() =>{
        async function fetchClinicId(){
            const id = await getUser(true);
            setClinicId(id as string);
        }
        fetchClinicId();
    }, []);

    useEffect(() => {
        if (!clinicId) return;
        async function get() {
            try {
                const data = await getPatient(id, clinicId as string);
                setPatient(data);
                setIsLoad(false);
            } catch (error) {
                console.error(error);
            }
        }

        get();
    }, [id, clinicId]);

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
                        <div className="justify-center items-center border-2 select-none mt-8 border-gray-600 rounded-lg shadow-lg">
                            <h1 className="bg-teal-600 text-xl text-center rounded-t-md border-b-2 border-gray-600">ODONTOGRAMA</h1>
                            <div className="p-2">
                                <Image
                                    src="/46cd610bbe30d71e851afa6c9a9f2e8a.svg"
                                    width={40}
                                    height={40}
                                    alt="Picture of the author"
                                    quality={100}
                                    className="hover:bg-teal-300 hover:bg-opacity-30 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
