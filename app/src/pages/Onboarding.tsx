import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Sun,
  Moon,
  Monitor,
  Users,
  User,
  Building2,
  Globe,
} from 'lucide-react'

const teamSizes = [
  { icon: User, label: 'Solo', value: 'solo' },
  { icon: Users, label: '2-10', value: 'small' },
  { icon: Building2, label: '11-50', value: 'medium' },
  { icon: Globe, label: '50+', value: 'large' },
]

const themes = [
  { icon: Sun, label: 'Light', value: 'light' },
  { icon: Moon, label: 'Dark', value: 'dark' },
  { icon: Monitor, label: 'System', value: 'system' },
]

const models = [
  { name: 'GPT-4o', description: 'Best for general tasks' },
  { name: 'Claude 3.5', description: 'Best for analysis' },
  { name: 'Gemini Pro', description: 'Best for research' },
]

export function Onboarding() {
  const { completeOnboarding, setTheme } = useStore()
  const [step, setStep] = useState(1)
  const [workspaceName, setWorkspaceName] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [selectedTheme, setSelectedTheme] = useState('system')
  const [selectedModel, setSelectedModel] = useState('GPT-4o')

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      setTheme(selectedTheme as 'light' | 'dark' | 'system')
      completeOnboarding()
    }
  }

  const canProceed = () => {
    if (step === 2) return workspaceName.trim() !== ''
    return true
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-12">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-colors',
              s === step ? 'bg-primary' : s < step ? 'bg-primary/40' : 'bg-border'
            )}
          />
        ))}
      </div>

      {/* Step 1 - Welcome */}
      {step === 1 && (
        <div className="text-center max-w-md animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center mx-auto mb-6">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              className="text-ring"
            >
              <circle cx="12" cy="4" r="3" fill="currentColor" />
              <circle cx="4" cy="18" r="3" fill="currentColor" />
              <circle cx="20" cy="18" r="3" fill="currentColor" />
              <line x1="12" y1="7" x2="5.5" y2="16" stroke="currentColor" strokeWidth="1.5" />
              <line x1="12" y1="7" x2="18.5" y2="16" stroke="currentColor" strokeWidth="1.5" />
              <line x1="6.5" y1="18" x2="17.5" y2="18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold mb-3">Welcome to Polymind</h1>
          <p className="text-muted-foreground mb-8">
            Your AI-powered workspace for intelligent conversations
          </p>
          <Button className="h-12 px-8 text-base" onClick={handleNext}>
            Get Started
          </Button>
        </div>
      )}

      {/* Step 2 - Workspace Setup */}
      {step === 2 && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-300">
          <h1 className="text-3xl font-semibold mb-2">Create your workspace</h1>
          <p className="text-muted-foreground mb-8">Set up your team environment</p>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="workspace">Workspace name</Label>
              <Input
                id="workspace"
                placeholder="e.g., Acme Corp"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Team size</Label>
              <div className="grid grid-cols-4 gap-3">
                {teamSizes.map((size) => (
                  <button
                    key={size.value}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 border rounded-xl transition-all',
                      teamSize === size.value
                        ? 'border-ring bg-accent text-accent-foreground'
                        : 'border-border hover:bg-muted'
                    )}
                    onClick={() => setTeamSize(size.value)}
                  >
                    <size.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{size.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button className="flex-1 h-11" onClick={handleNext} disabled={!canProceed()}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 - Preferences */}
      {step === 3 && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-300">
          <h1 className="text-3xl font-semibold mb-2">Personalize your experience</h1>
          <p className="text-muted-foreground mb-8">Choose your preferences</p>

          <div className="space-y-6">
            {/* Theme */}
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 border rounded-xl transition-all',
                      selectedTheme === t.value
                        ? 'border-ring bg-accent text-accent-foreground'
                        : 'border-border hover:bg-muted'
                    )}
                    onClick={() => setSelectedTheme(t.value)}
                  >
                    <t.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label>Default AI Model</Label>
              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.name}
                    className={cn(
                      'flex items-center justify-between w-full p-4 border rounded-xl transition-all text-left',
                      selectedModel === model.name
                        ? 'border-ring bg-accent text-accent-foreground'
                        : 'border-border hover:bg-muted'
                    )}
                    onClick={() => setSelectedModel(model.name)}
                  >
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">{model.description}</div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        selectedModel === model.name ? 'border-ring' : 'border-muted-foreground'
                      )}
                    >
                      {selectedModel === model.name && (
                        <div className="w-2.5 h-2.5 rounded-full bg-ring" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button className="flex-1 h-11" onClick={handleNext}>
              Launch Workspace
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
