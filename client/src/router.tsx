import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: '/sign-in',
        lazy: async () => ({
            Component: (await import('./pages/auth/sign-in')).default,
        }),
    }
])

export default router;