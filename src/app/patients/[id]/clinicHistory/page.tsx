'use client'

import { getPatient } from "./../../../../components/patients/db/getPatient";
import { getUser } from "@/components/auth/getUser";
import React, { useState, useEffect } from 'react';
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { PatientRecord } from "./../../../../components/patients/ui/patientRecord";
import { Loading } from "./../../../../components/general/loading";

export default function ClinicHistory() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const pathname = usePathname()
    const id = pathname.split('/').slice(-2, -1)[0] || null;
    const [patient, setPatient] = useState<any>(null);

    const [clinicId, setClinicId] = useState<string | null >(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/notSign");
            }
        });

        return () => unsubscribe();
    }, [router]);

     useEffect(() => {
        async function fetchClinicId() {
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
    }, [id,clinicId]);

    if (id !== null) {
        return (
            <div>
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
