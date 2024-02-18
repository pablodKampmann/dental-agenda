'use client'

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'
import { auth } from "./../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";

export default function Page() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);

    //CHECK IF THE USER IS LOGGED IN
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsLoad(false);
            } else if (!user) {
                router.push("/notSign");
            }
        });

        return () => unsubscribe();
    }, [router]);

    return (
        <div className='ml-56 h-screen overflow-y-hidden flex-1 ' >
            {isLoad ? (
                <div className='fixed inset-0 backdrop-blur-sm ml-56'>
                    <div className='fixed inset-0 flex items-center justify-center'>
                        <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                            <FaTooth size={100} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className='ml-2 mr-2 p-4 mt-16'>
                    <h1 className='text-red-500'>Holaaaaaa</h1>
                </div >
            )}
        </div>
    )
}
