import { auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    //TODO: use role from shared/types/user.ts
    role: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    role: null
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdTokenResult(true);
                const userRole = token.claims.role as string | undefined;
                setUser(user);
                setRole(userRole || null);
            } else {
                setUser(null);
                setRole(null);
            }

            setLoading(false);
        })

        return () => unsubscribe();
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading, role }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);