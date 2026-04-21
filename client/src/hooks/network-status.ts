import { useEffect, useRef } from "react";
import { toast } from "sonner";

const OFFLINE_TOAST_ID = "global-offline-toast";

async function checkConnectivity(): Promise<boolean> {
    try {
        const baseURL = import.meta.env.VITE_BACKEND_URL || '/api'
        const response = await fetch(`${baseURL}/health`, {
            method: 'GET',
            cache: 'no-store'
        })
        return response.ok
    } catch {
        return false
    }
}

export function useNetworkStatus() {
    const offlineToastShown = useRef(false);

    useEffect(() => {
        function showOfflineToast() {
            if (offlineToastShown.current) return;
            offlineToastShown.current = true;
            toast.warning("Koneksi tidak stabil!", {
                id: OFFLINE_TOAST_ID,
                description: "Data mungkin tidak terbaru.",
                duration: Infinity,
                action: {
                    label: 'Tutup',
                    onClick: () => {
                        toast.dismiss(OFFLINE_TOAST_ID);
                        offlineToastShown.current = false;
                    }
                }
            });
        }

        async function handleOffline() {
            const isReallyOnline = await checkConnectivity();
            if (!isReallyOnline) {
                showOfflineToast();
            }
        }

        async function handleOnline() {
            const checkOnline = await checkConnectivity();
            if (!checkOnline) return;

            offlineToastShown.current = false;
            toast.dismiss(OFFLINE_TOAST_ID);
            toast.success("Koneksi stabil", {
                description: "Refresh untuk perbarui data",
                duration: 5000
            });
        }

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        // Actually check real connectivity on mount
        const timeoutId = setTimeout(async () => {
            const isReallyOnline = await checkConnectivity();
            if (!isReallyOnline) {
                showOfflineToast();
            }
        }, 500);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
            clearTimeout(timeoutId);
        };
    }, []);
    
}