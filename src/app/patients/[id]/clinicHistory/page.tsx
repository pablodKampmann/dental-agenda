'use client'

import { getPatient } from "../../../components/patients/db/getPatient";
import React, { useState, useEffect } from 'react';
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { PatientRecord } from "../../../components/patients/ui/patientRecord";
import { Loading } from "../../../components/general/loading";

export default function ClinicHistory() {
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
            <div className='ml-56'>
                {isLoad ? (
                    <Loading />
                ) : (
                    <div className='ml-2 p-4 mt-16 mr-2 relative'>
                        <PatientRecord patient={patient} />
                        <p>hola</p>
                    </div>
                )}

            </div>
        );
    }
}
