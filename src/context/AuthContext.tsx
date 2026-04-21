'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../components/auth/getUser';

interface AuthUser {
    userUid: string;
    displayName: string;
    photoURL: string;
    clinicId: string;
    [key: string]: any;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        async function handleGetUser() {
            try {
                const userData = await getUser(false) as AuthUser;
                if (isMounted) {
                    setUser(userData);
                }
            } catch (error) {
                // Usuario no autenticado — redirigir a /notSign
                if (isMounted) {
                    router.replace('/notSign');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        handleGetUser();

        return () => {
            isMounted = false;
        };
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    return useContext(AuthContext);
}
