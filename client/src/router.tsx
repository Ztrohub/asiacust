import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/protected-route";
import { USER_ROLE } from "@/shared/types/user";
import PublicRoute from "./components/public-route";

const router = createBrowserRouter([
    {
        path: '/sign-in',
        element: <PublicRoute />,
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
        children: [
            {
                index: true,
                lazy: async () => ({
                    Component: (await import('./pages/admin/admin')).default
                })
            }
        ]
    },
    {
        path: '/worker',
        element: <ProtectedRoute allowedRoles={[USER_ROLE.TEKNISI, USER_ROLE.HELPER]} />,
        children: [
            {
                index: true,
                lazy: async () => ({
                    Component: (await import('./pages/worker/worker')).default
                })
            }
        ]
    }
])

export default router;