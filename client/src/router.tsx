import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/protected-route";
import { USER_ROLE } from "@/shared/types/user";
import PublicRoute from "./components/public-route";
import NotFoundError from "./pages/utils/errors/not-found-error";
import GeneralError from "./pages/utils/errors/general-error";

const router = createBrowserRouter([
    {
        path: '/',
        element: <PublicRoute />,
        errorElement: <GeneralError />,
        children: [
            {
                index: true,
                element: <Navigate to="/sign-in" replace />
            }
        ]
    },
    {
        path: '/sign-in',
        element: <PublicRoute />,
        errorElement: <GeneralError />,
        children : [
            {
                index: true,
                lazy: async () => ({
                    Component: (await import('./pages/auth/sign-in')).default,
                }),
            }
        ]
    },
    {
        path: '/sign-out',
        element: <ProtectedRoute allowedRoles={[]}/>,
        errorElement: <GeneralError />,
        children: [
            {
                index: true,
                lazy: async () => ({
                    Component: (await import('./pages/auth/sign-out')).default,
                })
            }
        ]
    },
    {
        path: '/admin',
        element: <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN]}/>,
        errorElement: <GeneralError />,
        children: [
            {
                index: true,
                lazy: async () => ({
                    Component: (await import('./pages/admin/dashboard')).default
                })
            },
            {
                path: 'users',
                lazy: async () => ({
                    Component: (await import('./pages/admin/user')).default
                })
            }
        ]
    },
    {
        path: '/worker',
        element: <ProtectedRoute allowedRoles={[USER_ROLE.TEKNISI, USER_ROLE.HELPER]} />,
        errorElement: <GeneralError />,
        children: [
            {
                index: true,
                lazy: async () => ({
                    Component: (await import('./pages/worker/worker')).default
                })
            }
        ]
    },
    {
        path: '*',
        Component: NotFoundError
    }
])

export default router;