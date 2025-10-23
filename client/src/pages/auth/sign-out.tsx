import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";
import { useEffect } from "react";

export default function SignOut() {
    const { user } = useAuth();
    
    console.log('masuk sign-out');

    useEffect(() => {
        if (user) signOut(auth)
    }, [user])

    return <div>Signing out...</div>
}