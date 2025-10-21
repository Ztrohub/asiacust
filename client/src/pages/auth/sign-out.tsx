import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";

export default function SignOut() {
    const { user } = useAuth();

    useEffect(() => {
        if (user) signOut(auth)
    }, [user])

    return <Navigate to="/sign-in" replace />
}