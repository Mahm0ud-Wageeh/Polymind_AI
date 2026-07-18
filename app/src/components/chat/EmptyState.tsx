import { useNavigate } from 'react-router'
import { useStore } from '@/store/useStore'
import { Logo } from '@/components/shell/Logo'
import {
  Network,
  Shield,
  GitBranch,
  FileCode2,
  ScanSearch,
  Router,
} from 'lucide-react'

/**
 * Empty-state suggestions for the AI chat. Each is both a quick prompt the
 * user can send into the chat AND, where useful, a deeplink to a dedicated
 * module via the registry path. Keeping this networking-specific makes the
 * workspace feel purpose-built from the first interaction.
 */
const suggestions = [
  {
    icon: Router,
    title: 'Design a campus network',
    prompt:
      'Design a campus network for 3 buildings, 500 employees, dual ISP, Active Directory, VoIP, guest WiFi, and multiple VLANs with OSPF routing.',
    to: '/designer',
  },
  {
    icon: GitBranch,
    title: 'Plan VLANs & subnetting',
    prompt:
      'I have a 10.0.0.0/16. Plan VLANs for Finance, HR, IT, Guest, VoIP, and CCTV with inter-VLAN routing and a /26 per VLAN.',
  },
  {
    icon: FileCode2,
    title: 'Generate a switch config',
    prompt:
      'Generate a Cisco IOS config for a core switch with VLANs 10,20,30, a trunk uplink to a distribution switch, and OSPF area 0.',
    to: '/configurator',
  },
  {
    icon: Shield,
    title: 'Review an ACL / firewall',
    prompt:
      'Review this access-list for a DMZ-facing edge router and suggest improvements for least-privilege and logging:',
  },
  {
    icon: ScanSearch,
    title: 'Analyze a router config',
    prompt:
      'Attached is a running-config from a border router. Find misconfigurations, security gaps, and suggest an optimized topology.',
    to: '/analyzer',
  },
  {
    icon: Network,
    title: 'Troubleshoot OSPF neighbors',
    prompt:
      'Two OSPF routers on the same subnet are stuck in EXSTART state. VLAN MTU is 1500. Walk me through the likely causes and commands to debug.',
  },
]

export function EmptyState() {
  const navigate = useNavigate()
  // Reuse the single source of truth for sending messages instead of
  // duplicating conversation-creation and fake-AI logic here.
  const sendMessage = useStore((state) => state.sendMessage)

  const handleSuggestion = (prompt: string, to?: string) => {
    // If the suggestion maps to a dedicated module, route there (the module
    // page can prefill + run the task itself). Otherwise send the prompt
    // straight into the chat workspace.
    if (to) {
      navigate(to)
      return
    }
    void sendMessage(prompt)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 overflow-y-auto">
      <div className="text-center mb-6 sm:mb-8 animate-fade-in">
        <Logo size="lg" className="justify-center mb-4" />
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
          Design, automate & secure your network
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Describe what you need, or start from one of these:
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-2xl animate-slide-in-bottom">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.title}
            className="flex items-center gap-3 p-3.5 sm:p-4 text-left border border-border rounded-xl bg-card hover:bg-accent hover:border-ring/40 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ease-smooth group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => handleSuggestion(suggestion.prompt, suggestion.to)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground transition-colors shrink-0">
              <suggestion.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">{suggestion.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
