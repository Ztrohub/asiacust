import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { USER_ROLE } from "@/shared/types/user";

interface Props {
    allowedRoles: string[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
    const { user, loading, role } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/sign-in" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role || "")) {
        if (role === USER_ROLE.ADMIN) return <Navigate to="/admin" replace />
        if (role === USER_ROLE.TEKNISI || role === USER_ROLE.HELPER) return <Navigate to="/worker" replace />
    }

    return <Outlet />;
}