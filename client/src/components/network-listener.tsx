import { useNetworkStatus } from "@/hooks/network-status";

export function NetworkListener() {
    useNetworkStatus()
    return null
}