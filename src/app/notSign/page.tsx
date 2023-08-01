'use client'

import React, { useState, useEffect } from 'react';
import { db, auth } from "./../firebase";
import { get, ref } from "firebase/database";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function NotSing() {
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");

    async function handleSignIn(e: any) {
        e.preventDefault();
        const dbRef = ref(db, 'admins/');
        const snapshot = await get(dbRef);
        if (snapshot.val()) {
            Object.keys(snapshot.val()).forEach((key) => {
                if (user === snapshot.val()[key].userName) {
                    setEmail(snapshot.val()[key].email);
                }
            });
            if (email !== "") {
                await signInWithEmailAndPassword(auth, email, password)
            }
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="relative max-w-lg w-full p-8">
                <div className="bg-white rounded-lg shadow dark:bg-gray-700">
                    <div className="px-4 py-8 lg:px-6">
                        <h1 className="mb-4 text-2xl font-medium dark:text-white">
                            <span>Iniciar </span>
                            <span className="text-blue-500">Sesion</span>
                        </h1>
                        <form className="space-y-4" onSubmit={handleSignIn}>
                            <div>
                                <label htmlFor="text" className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Usuario</label>
                                <input type="text" name="user" id="user" value={user} onChange={(e) => setUser(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 focus-within:text-blue-500 block w-full p-2 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" placeholder="nombre.apellido" required />
                            </div>
                            <div>
                                <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">Clave</label>
                                <input type="password" name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 focus-within:text-blue-500 block w-full p-2 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" required />
                            </div>
                            <button type="submit" className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Iniciar Sesion</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
