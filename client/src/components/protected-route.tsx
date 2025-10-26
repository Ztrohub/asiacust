import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { USER_ROLE } from "@/shared/types/user";
import { LoadingPage } from "./custom/loading-page";
import AppShell from "./app-shell";

interface Props {
    allowedRoles: string[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
    const { user, loading, role } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingPage />;
    }

    if (!user) {
        return <Navigate to="/sign-in" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role || "")) {
        if (role === USER_ROLE.ADMIN) return <Navigate to="/admin" replace />
        if (role === USER_ROLE.TEKNISI || role === USER_ROLE.HELPER) return <Navigate to="/worker" replace />
    }

    return <AppShell />;
}