// src/lib/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { UserRole } from "@/lib/role-utils";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  district?: string | null;
  vendorShop?: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession?.() || {};
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email!,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        district: session.user.district,
        vendorShop: session.user.vendorShop,
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const login = async (email: string, password: string, role: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      role,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading: status === "loading",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}