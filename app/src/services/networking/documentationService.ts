import type { NetworkDesignData } from '@/services/networking/designerService'

export interface BomItem {
    item: string
    role: string
    category: string
    quantity: number
    unitPrice: number
    subtotal: number
}

// تقديرات أسعار إرشادية بالدولار (لأغراض التخطيط فقط)
const PRICE_TABLE: Array<{ match: RegExp; category: string; price: number }> = [
    { match: /firewall|asa|ftd|palo|fortigate/i, category: 'Firewall', price: 3500 },
    { match: /core|distribution|layer ?3|l3|9500|9400|catalyst ?9/i, category: 'Core/Distribution Switch', price: 2500 },
    { match: /switch|access|l2|catalyst|2960|3650/i, category: 'Access Switch', price: 900 },
    { match: /router|isr|asr|edge|gateway/i, category: 'Router', price: 1800 },
    { match: /wireless|access ?point|\bap\b|wifi|wlc/i, category: 'Wireless AP', price: 350 },
    { match: /server|hypervisor|esxi|\bvm\b/i, category: 'Server', price: 4000 },
    { match: /pc|workstation|endpoint|desktop|laptop|host/i, category: 'Endpoint', price: 700 },
]

export function estimateDevice(d: { type?: string; role?: string; modelSuggestion?: string }): { category: string; price: number } {
    const hay = `${d.modelSuggestion ?? ''} ${d.role ?? ''} ${d.type ?? ''}`
    for (const row of PRICE_TABLE) {
        if (row.match.test(hay)) return { category: row.category, price: row.price }
    }
    return { category: 'Other', price: 500 }
}

/** يجمّع الأجهزة في بنود BOM (نفس الموديل يتجمّع مع بعضه). */
export function buildBom(data: NetworkDesignData): BomItem[] {
    const map = new Map<string, BomItem>()
    for (const dev of data.devices ?? []) {
        const est = estimateDevice(dev)
        const key = dev.modelSuggestion?.trim() || dev.type?.trim() || dev.role?.trim() || 'Device'
        const qty = Number(dev.count) || 1
        const existing = map.get(key)
        if (existing) {
            existing.quantity += qty
            existing.subtotal = existing.quantity * existing.unitPrice
        } else {
            map.set(key, { item: key, role: dev.role ?? '', category: est.category, quantity: qty, unitPrice: est.price, subtotal: qty * est.price })
        }
    }
    return Array.from(map.values())
}

export function bomTotal(items: BomItem[]): number {
    return items.reduce((sum, i) => sum + i.subtotal, 0)
}

/** تصدير الـ BOM كـ CSV (يفتح في Excel). */
export function toBomCsv(items: BomItem[]): string {
    const header = ['Item', 'Category', 'Role', 'Quantity', 'Unit Price (USD)', 'Subtotal (USD)']
    const rows = items.map((i) => [i.item, i.category, i.role, String(i.quantity), String(i.unitPrice), String(i.subtotal)])
    rows.push(['', '', '', '', 'TOTAL', String(bomTotal(items))])
    return [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

/** يبني المستند كامل Markdown (للتصدير كملف .md). */
export function buildMarkdownDoc(name: string, data: NetworkDesignData): string {
    const L: string[] = []
    L.push(`# ${name}`, '')
    L.push(`_Polymind — Network Design Document · ${new Date().toLocaleString()}_`, '')
    if (data.summary) L.push('## Executive Summary', '', data.summary, '')

    if (data.devices?.length) {
        L.push('## Device Inventory', '', '| Name | Role | Model | Layer | Qty |', '|---|---|---|---|---|')
        for (const d of data.devices) L.push(`| ${d.name} | ${d.role} | ${d.modelSuggestion} | ${d.layer} | ${d.count} |`)
        L.push('')
    }

    const bom = buildBom(data)
    if (bom.length) {
        L.push('## Bill of Materials (BOM)', '', '| Item | Category | Qty | Unit (USD) | Subtotal (USD) |', '|---|---|---|---|---|')
        for (const b of bom) L.push(`| ${b.item} | ${b.category} | ${b.quantity} | ${b.unitPrice} | ${b.subtotal} |`)
        L.push(`| **Total** |  |  |  | **${bomTotal(bom)}** |`, '', '_* Estimated indicative prices for planning only._', '')
    }

    if (data.ipAddressing?.subnets?.length) {
        L.push('## IP Addressing Plan', '')
        if (data.ipAddressing.strategy) L.push(`_${data.ipAddressing.strategy}_`, '')
        L.push('| VLAN | Name | Network | Mask | Purpose |', '|---|---|---|---|---|')
        for (const s of data.ipAddressing.subnets) L.push(`| ${s.vlanId} | ${s.name} | ${s.network} | ${s.mask} | ${s.purpose} |`)
        L.push('')
    }

    if (data.vlanPlan?.length) {
        L.push('## VLAN Plan', '', '| ID | Name | Subnet | Purpose |', '|---|---|---|---|')
        for (const v of data.vlanPlan) L.push(`| ${v.id} | ${v.name} | ${v.subnet} | ${v.purpose} |`)
        L.push('')
    }

    if (data.routingPlan?.protocol) {
        L.push('## Routing Plan', '', `- **Protocol:** ${data.routingPlan.protocol}`)
        if (data.routingPlan.areas?.length) L.push(`- **Areas:** ${data.routingPlan.areas.join(', ')}`)
        if (data.routingPlan.details) L.push(`- ${data.routingPlan.details}`)
        L.push('')
    }

    if (data.security) {
        L.push('## Security', '')
        if (data.security.firewall) L.push(`- **Firewall:** ${data.security.firewall}`)
        if (data.security.dmz) L.push(`- **DMZ:** ${data.security.dmz}`)
        for (const a of data.security.acls ?? []) L.push(`- ${a}`)
        L.push('')
    }

    if (data.deploymentPlan?.length) {
        L.push('## Deployment Plan', '')
        for (const p of data.deploymentPlan) {
            L.push(`### ${p.phase}`)
            for (const t of p.tasks ?? []) L.push(`- ${t}`)
            L.push('')
        }
    }

    return L.join('\n')
}

/** ينزّل أي نص كملف. */
export function downloadTextFile(filename: string, content: string, mime = 'text/plain'): void {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}