import { useNetworkStatus } from "@/hooks/network-status";

export function NetworkLisener() {
    useNetworkStatus()
    return null
}