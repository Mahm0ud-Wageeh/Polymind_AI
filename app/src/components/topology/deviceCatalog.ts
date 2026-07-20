import type { DeviceCategory } from './topologyUtils'
import { deviceColor } from './topologyUtils'

export interface PaletteItem {
    key: string
    label: string
    category: DeviceCategory
    role: string
}

/** الأجهزة اللي بتظهر في مكتبة السحب والإفلات. */
export const DEVICE_CATALOG: PaletteItem[] = [
    { key: 'router', label: 'Router', category: 'router', role: 'Layer 3 Router' },
    { key: 'l3switch', label: 'L3 Switch', category: 'switch', role: 'Core / Distribution' },
    { key: 'l2switch', label: 'L2 Switch', category: 'switch', role: 'Access Switch' },
    { key: 'firewall', label: 'Firewall', category: 'firewall', role: 'Security / Edge' },
    { key: 'server', label: 'Server', category: 'server', role: 'Data Center' },
    { key: 'pc', label: 'PC / Host', category: 'pc', role: 'Endpoint' },
    { key: 'wireless', label: 'Access Point', category: 'wireless', role: 'Wireless AP' },
    { key: 'cloud', label: 'Internet / WAN', category: 'cloud', role: 'ISP / Cloud' },
]

export function paletteColor(cat: DeviceCategory): string {
    return deviceColor(cat)
}