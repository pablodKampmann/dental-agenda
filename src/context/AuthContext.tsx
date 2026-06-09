"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "../services/auth/getUser";

interface AuthUser {
  userUid: string;
  displayName: string;
  clinicId: string;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function refreshUser() {
    try {
      const userData = (await getUser(false)) as AuthUser;
      setUser(userData);
    } catch {
      router.replace("/notSign");
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function handleGetUser() {
      try {
        const userData = (await getUser(false)) as AuthUser;
        if (isMounted) {
          setUser(userData);
        }
      } catch {
        if (isMounted) {
          router.replace("/notSign");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
