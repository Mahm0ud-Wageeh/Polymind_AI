import { ChatArea } from '@/components/chat/ChatArea'
import { Composer } from '@/components/chat/Composer'
import { useStore } from '@/store/useStore'

/**
 * Workspace / AI Chat page.
 * بيعرض مؤشّر الوكيل النشط فوق صندوق الكتابة لو فيه وكيل مختار.
 */
export default function Workspace() {
  const activeAgentId = useStore((s) => s.activeAgentId)
  const agents = useStore((s) => s.agents)
  const setActiveAgent = useStore((s) => s.setActiveAgent)
  const active = agents.find((a) => a.id === activeAgentId)

  return (
    <>
      <ChatArea />
      {active && (
        <div className="mx-auto w-full max-w-3xl px-4">
          <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-primary/10 text-primary w-fit">
            <span>الوكيل: {active.name}</span>
            <button onClick={() => setActiveAgent(null)} className="hover:underline">إلغاء</button>
          </div>
        </div>
      )}
      <Composer />
    </>
  )
}