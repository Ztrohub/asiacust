import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useNetworkStatus() {
    const offlineToastId = useRef<string | number | null>(null);

    useEffect(() => {
        function handleOffline() {
            if (!offlineToastId.current) {
                offlineToastId.current = toast.warning("Koneksi tidak stabil!", {
                    description: "Data mungkin tidak terbaru.",
                    duration: Infinity,
                    action: {
                        label: 'Tutup',
                        onClick: () => {
                            toast.dismiss(offlineToastId.current!)
                            offlineToastId.current = null
                        }
                    }
                })
            }
        }

        function handleOnline() {
            if (offlineToastId.current) {
                toast.dismiss(offlineToastId.current)
                offlineToastId.current = null
            }

            toast.success("Koneksi stabil", {
                description: "Data berhasil diperbarui",
                duration: 5000
            })
        }

        window.addEventListener("offline", handleOffline)
        window.addEventListener("online", handleOnline)

        if (!navigator.onLine) handleOffline()
        
        return () => {
            window.removeEventListener("offline", handleOffline)
            window.removeEventListener("online", handleOnline)
        }
    })
}