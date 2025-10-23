import { useAuth } from "@/contexts/AuthContext";
import { USER_ROLE } from "@/shared/types/user";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function PublicRoute() {
    const { user, role, loading } = useAuth()

    const location = useLocation();

    const from = location.state?.from?.pathname;

    if (loading) {
        return <div>Loading...</div>;
    }

    if (user) {

        if (from) {
            return <Navigate to={from} replace />
        }

        if (role === USER_ROLE.ADMIN) return <Navigate to="/admin" replace />
        if (role === USER_ROLE.TEKNISI || role === USER_ROLE.HELPER) return <Navigate to="/worker" replace />
    }

    return <Outlet />
}