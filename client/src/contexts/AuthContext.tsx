import { handleError } from "@/hooks/error-handler";
import { auth } from "@/services/firebase";
import { USER_ROLE } from "@/shared/types/user";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    role: USER_ROLE | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    role: null
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<USER_ROLE | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    const token = await user.getIdTokenResult(true);
                    const userRole = token.claims.role as string | undefined;

                    if (!userRole || !Object.values(USER_ROLE).includes(userRole as USER_ROLE)){
                        return handleError(
                            new Error("Role user is not valid!")
                        )
                    }

                    console.log(userRole)

                    setUser(user);
                    setRole(userRole as USER_ROLE || null);
                } else {
                    setUser(null);
                    setRole(null);
                }
            } catch (error) {
                handleError(error)
                setUser(null)
                setRole(null)
            } finally {
                setLoading(false);
            }

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