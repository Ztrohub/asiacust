import { useAuth } from "@/contexts/AuthContext";
import { USER_ROLE } from "@/shared/types/user";
import { Navigate, Outlet } from "react-router-dom";

export default function PublicRoute() {
    const { user, role, loading } = useAuth()

    if (loading) {
        return <div>Loading...</div>;
    }

    if (user) {
        if (role === USER_ROLE.ADMIN) return <Navigate to="/admin" replace />
        if (role === USER_ROLE.TEKNISI || role === USER_ROLE.HELPER) return <Navigate to="/worker" replace />
    }

    return <Outlet />
}