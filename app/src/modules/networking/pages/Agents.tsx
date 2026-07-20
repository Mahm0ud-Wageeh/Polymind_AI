import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from '@/store/useStore'

export default function Agents() {
    const navigate = useNavigate()
    const agents = useStore((s) => s.agents)
    const loadAgents = useStore((s) => s.loadAgents)
    const activeAgentId = useStore((s) => s.activeAgentId)
    const setActiveAgent = useStore((s) => s.setActiveAgent)

    useEffect(() => {
        void loadAgents().catch(() => undefined)
    }, [loadAgents])

    const selectAgent = (id: string) => {
        setActiveAgent(id)
        navigate('/workspace')
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold">AI Engineering Agents</h1>
                <p className="text-muted-foreground">اختر خبيرًا متخصصًا ليقود المحادثة في الشات.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => selectAgent(agent.id)}
                        className={`text-left rounded-xl border p-4 transition hover:shadow-md ${activeAgentId === agent.id ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                    >
                        <div className="font-medium">{agent.name}</div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{agent.description}</p>
                        {activeAgentId === agent.id && (
                            <span className="mt-3 inline-block text-xs text-primary">نشط الآن</span>
                        )}
                    </button>
                ))}
                {agents.length === 0 && (
                    <p className="text-sm text-muted-foreground">لا يوجد وكلاء بعد — شغّل الـ seeder.</p>
                )}
            </div>
        </div>
    )
}
