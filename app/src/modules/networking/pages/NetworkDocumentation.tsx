import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FileText, Printer, Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { designerService, type NetworkDesignResponse } from '@/services/networking/designerService'
import { buildBom, bomTotal, toBomCsv, downloadTextFile } from '@/services/networking/documentationService'
import { networkToolsService } from '@/services/networking/networkToolsService'

const money = (n: number) => `$${n.toLocaleString('en-US')}`

export default function NetworkDocumentation() {
    const [designs, setDesigns] = useState<NetworkDesignResponse[]>([])
    const [selectedId, setSelectedId] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let alive = true
        designerService.list()
            .then((list) => {
                if (!alive) return
                const ready = list.filter((d) => d.designData)
                setDesigns(ready)
                setSelectedId(ready[0]?.id ?? '')
            })
            .catch((e) => { if (alive) setError((e as Error)?.message ?? 'Failed to load designs') })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false }
    }, [])

    const selected = useMemo(() => designs.find((d) => d.id === selectedId) ?? null, [designs, selectedId])
    const data = selected?.designData ?? null
    const bom = useMemo(() => (data ? buildBom(data) : []), [data])

    const downloadDocumentation = async () => {
        if (!selected) return
        try {
            const document = await networkToolsService.documentation(selected.id)
            downloadTextFile(document.filename, document.markdown, 'text/markdown')
        } catch (cause) {
            setError((cause as Error).message)
        }
    }

    if (loading) {
        return <div className="flex-1 h-full grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="flex-1 h-full min-h-0 overflow-y-auto">
            <style>{`
        .doc-table{width:100%;border-collapse:collapse;margin-top:.75rem;font-size:.8rem}
        .doc-table th,.doc-table td{border:1px solid hsl(var(--border));padding:.4rem .6rem;text-align:left}
        .doc-table th{background:hsl(var(--muted))}
        @media print{
          body *{visibility:hidden !important}
          #polymind-doc,#polymind-doc *{visibility:visible !important}
          #polymind-doc{position:absolute;left:0;top:0;width:100%;color:#000 !important;background:#fff !important}
          #polymind-doc .doc-table th,#polymind-doc .doc-table td{border-color:#999 !important}
          .no-print{display:none !important}
        }
      `}</style>

            {/* Toolbar */}
            <div className="no-print sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-6 py-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Network Documentation</span>
                </div>
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="ml-auto h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring"
                >
                    {designs.length === 0 && <option value="">لا توجد تصاميم</option>}
                    {designs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <Button variant="outline" size="sm" disabled={!data} className="gap-1.5"
                    onClick={() => { if (data && selected) downloadTextFile(`${selected.name}-BOM.csv`, toBomCsv(bom), 'text/csv') }}>
                    <FileSpreadsheet className="h-4 w-4" /> BOM CSV
                </Button>
                <Button variant="outline" size="sm" disabled={!data} className="gap-1.5"
                    onClick={() => void downloadDocumentation()}>
                    <Download className="h-4 w-4" /> Markdown
                </Button>
                <Button size="sm" disabled={!data} className="gap-1.5" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print / PDF
                </Button>
            </div>

            {error && <p className="p-6 text-sm text-destructive">{error}</p>}
            {!data && !error && (
                <p className="p-6 text-sm text-muted-foreground">مفيش تصميم متاح. روح لـ Network Designer واعمل تصميم الأول، وهيظهر هنا تلقائيًا.</p>
            )}

            {data && selected && (
                <article id="polymind-doc" className="mx-auto max-w-4xl px-8 py-10 text-foreground">
                    <header className="mb-8 border-b border-border pb-6">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Polymind · Network Design Document</p>
                        <h1 className="mt-2 text-3xl font-bold">{selected.name}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">{new Date(selected.createdAt).toLocaleString()}</p>
                    </header>

                    <Section title="1. Executive Summary">
                        <p className="leading-relaxed text-sm">{data.summary}</p>
                    </Section>

                    {data.topology && data.topology.layers && data.topology.layers.length > 0 && (
                        <Section title="2. Topology Overview">
                            <ul className="space-y-1.5">
                                {data.topology.layers.map((l, i) => (
                                    <li key={i} className="text-sm"><span className="font-medium">{l.name}:</span> <span className="text-muted-foreground">{l.description}</span></li>
                                ))}
                            </ul>
                            {data.topology.connections && data.topology.connections.length > 0 && (
                                <table className="doc-table">
                                    <thead><tr><th>From</th><th>To</th><th>Medium</th></tr></thead>
                                    <tbody>{data.topology.connections.map((c, i) => <tr key={i}><td>{c.from}</td><td>{c.to}</td><td>{c.medium}</td></tr>)}</tbody>
                                </table>
                            )}
                        </Section>
                    )}

                    {data.devices && data.devices.length > 0 && (
                        <Section title="3. Device Inventory">
                            <table className="doc-table">
                                <thead><tr><th>Name</th><th>Role</th><th>Model</th><th>Layer</th><th>Qty</th></tr></thead>
                                <tbody>{data.devices.map((d, i) => <tr key={i}><td>{d.name}</td><td>{d.role}</td><td>{d.modelSuggestion}</td><td>{d.layer}</td><td>{d.count}</td></tr>)}</tbody>
                            </table>
                        </Section>
                    )}

                    {bom.length > 0 && (
                        <Section title="4. Bill of Materials (BOM)">
                            <table className="doc-table">
                                <thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Unit (USD)</th><th>Subtotal</th></tr></thead>
                                <tbody>
                                    {bom.map((b, i) => <tr key={i}><td>{b.item}</td><td>{b.category}</td><td>{b.quantity}</td><td>{money(b.unitPrice)}</td><td>{money(b.subtotal)}</td></tr>)}
                                    <tr className="font-semibold"><td colSpan={4} className="text-right">Estimated Total</td><td>{money(bomTotal(bom))}</td></tr>
                                </tbody>
                            </table>
                            <p className="mt-2 text-xs text-muted-foreground">* أسعار إرشادية تقديرية لأغراض التخطيط فقط.</p>
                        </Section>
                    )}

                    {data.ipAddressing && data.ipAddressing.subnets && data.ipAddressing.subnets.length > 0 && (
                        <Section title="5. IP Addressing Plan">
                            {data.ipAddressing.strategy && <p className="text-sm text-muted-foreground mb-1">{data.ipAddressing.strategy}</p>}
                            <table className="doc-table">
                                <thead><tr><th>VLAN</th><th>Name</th><th>Network</th><th>Mask</th><th>Purpose</th></tr></thead>
                                <tbody>{data.ipAddressing.subnets.map((s, i) => <tr key={i}><td>{s.vlanId}</td><td>{s.name}</td><td>{s.network}</td><td>{s.mask}</td><td>{s.purpose}</td></tr>)}</tbody>
                            </table>
                        </Section>
                    )}

                    {data.vlanPlan && data.vlanPlan.length > 0 && (
                        <Section title="6. VLAN Plan">
                            <table className="doc-table">
                                <thead><tr><th>ID</th><th>Name</th><th>Subnet</th><th>Purpose</th></tr></thead>
                                <tbody>{data.vlanPlan.map((v, i) => <tr key={i}><td>{v.id}</td><td>{v.name}</td><td>{v.subnet}</td><td>{v.purpose}</td></tr>)}</tbody>
                            </table>
                        </Section>
                    )}

                    {data.routingPlan && data.routingPlan.protocol && (
                        <Section title="7. Routing Plan">
                            <p className="text-sm"><span className="font-medium">Protocol:</span> {data.routingPlan.protocol}</p>
                            {data.routingPlan.areas && data.routingPlan.areas.length > 0 && <p className="text-sm"><span className="font-medium">Areas:</span> {data.routingPlan.areas.join(', ')}</p>}
                            {data.routingPlan.details && <p className="text-sm text-muted-foreground mt-1">{data.routingPlan.details}</p>}
                        </Section>
                    )}

                    {data.security && (
                        <Section title="8. Security">
                            {data.security.firewall && <p className="text-sm"><span className="font-medium">Firewall:</span> {data.security.firewall}</p>}
                            {data.security.dmz && <p className="text-sm"><span className="font-medium">DMZ:</span> {data.security.dmz}</p>}
                            {data.security.acls && data.security.acls.length > 0 && (
                                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{data.security.acls.map((a, i) => <li key={i}>{a}</li>)}</ul>
                            )}
                        </Section>
                    )}

                    {data.deploymentPlan && data.deploymentPlan.length > 0 && (
                        <Section title="9. Deployment Plan">
                            {data.deploymentPlan.map((p, i) => (
                                <div key={i} className="mb-3">
                                    <p className="font-medium text-sm">{p.phase}</p>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">{(p.tasks ?? []).map((t, j) => <li key={j}>{t}</li>)}</ul>
                                </div>
                            ))}
                        </Section>
                    )}

                    {data.rackRecommendations && data.rackRecommendations.length > 0 && (
                        <Section title="10. Rack Layout">
                            <table className="doc-table">
                                <thead><tr><th>Unit</th><th>Device</th></tr></thead>
                                <tbody>{data.rackRecommendations.map((r, i) => <tr key={i}><td>{r.unit}</td><td>{r.device}</td></tr>)}</tbody>
                            </table>
                        </Section>
                    )}

                    <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">Generated by Polymind — AI Network Engineering Platform</footer>
                </article>
            )}
        </div>
    )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mb-6">
            <h2 className="mb-2 text-lg font-semibold border-b border-border/60 pb-1">{title}</h2>
            {children}
        </section>
    )
}
