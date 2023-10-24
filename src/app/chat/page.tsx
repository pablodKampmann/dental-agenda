'use client'

import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react';
import { auth } from "./../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";

export default function Chat() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);

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
        <div>
            {isLoad ? (
                <div className='fixed inset-0 backdrop-blur-sm ml-64'>
                    <div className='fixed inset-0 flex items-center justify-center'>
                        <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                            <FaTooth size={100} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 ml-64 mt-16 relative">
                    <p className='text-teal-500'>Que onda</p>
                </div>
            )}
        </div>
    );
}
