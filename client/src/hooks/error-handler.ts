import { toast } from "sonner"

export function initGlobalErrorHandler() {
    if (typeof window === 'undefined') return

    window.addEventListener("error", () => {
        console.error("Global error!")
        toast.error("Something went wrong!");
    })

    window.addEventListener("unhandledrejection", () => {
        console.error("Global unhandledrejection!")
        toast.error("Something went wrong!");
    })
}

export function handleError(error: unknown, message = "Something went wrong") {
    console.error(error)
    toast.error(message)
}