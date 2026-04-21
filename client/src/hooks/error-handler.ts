import { toast } from "sonner"

export function initGlobalErrorHandler() {
    if (typeof window === 'undefined') return

    window.addEventListener("error", (e) => {
        if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || 
            e.message === 'ResizeObserver loop limit exceeded') {
            return;
        }

        console.error("Global error!", e.message)
        toast.error("Terjadi kesalahan!");
    })

    window.addEventListener("unhandledrejection", (e) => {
        if (e.reason && e.reason.message && (
            e.reason.message.includes('ResizeObserver')
        )) {
            return;
        }

        console.error("Global unhandledrejection!")
        toast.error("Terjadi kesalahan!");
    })
}

export function handleError(error: Error) {
    console.error(error)
    toast.error(error.message)
}