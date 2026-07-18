import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Logo } from '@/components/shell/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Chrome } from 'lucide-react'
import { authService } from '@/services/auth/authService'
import { useStore } from '@/store/useStore'

export function Auth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [name, setName] = useState('')
  const setUser = useStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const user = isRegistering
        ? await authService.register({
            name: name.trim(),
            email,
            password,
            password_confirmation: password,
          })
        : await authService.login({ email, password })
      setUser(user)
      navigate('/workspace')
    } catch (err) {
      setError((err as Error).message || 'Unable to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setIsLoading(true)
    try {
      window.location.assign(await authService.oauthRedirect('google'))
    } catch (err) {
      setError((err as Error).message || 'Unable to start Google sign-in.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-accent to-background items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="400" cy="200" r="8" fill="currentColor" className="text-ring" />
            <circle cx="250" cy="350" r="8" fill="currentColor" className="text-ring" />
            <circle cx="550" cy="350" r="8" fill="currentColor" className="text-ring" />
            <line x1="400" y1="208" x2="258" y2="344" stroke="currentColor" strokeWidth="2" className="text-ring/40" />
            <line x1="400" y1="208" x2="542" y2="344" stroke="currentColor" strokeWidth="2" className="text-ring/40" />
            <line x1="258" y1="358" x2="542" y2="358" stroke="currentColor" strokeWidth="2" className="text-ring/40" />
            <circle cx="150" cy="450" r="6" fill="currentColor" className="text-ring/30" />
            <circle cx="650" cy="450" r="6" fill="currentColor" className="text-ring/30" />
            <circle cx="400" cy="500" r="6" fill="currentColor" className="text-ring/30" />
            <line x1="256" y1="354" x2="156" y2="446" stroke="currentColor" strokeWidth="1.5" className="text-ring/20" />
            <line x1="544" y1="354" x2="644" y2="446" stroke="currentColor" strokeWidth="1.5" className="text-ring/20" />
            <line x1="400" y1="358" x2="400" y2="494" stroke="currentColor" strokeWidth="1.5" className="text-ring/20" />
          </svg>
        </div>
        <div className="relative z-10 text-center">
          <Logo size="lg" className="justify-center mb-4" />
          <p className="text-lg text-muted-foreground max-w-sm">
            Your AI-powered workspace for intelligent conversations
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <h1 className="text-3xl font-semibold mb-2">{isRegistering ? 'Create your account' : 'Welcome back'}</h1>
          <p className="text-muted-foreground mb-8">{isRegistering ? 'Start your AI workspace' : 'Sign in to your AI workspace'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
                minLength={isRegistering ? 8 : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                isRegistering ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-11 gap-2" onClick={handleGoogle} disabled={isLoading}>
            <Chrome className="h-4 w-4" />
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="text-ring hover:underline font-medium"
              onClick={() => {
                setIsRegistering((value) => !value)
                setError('')
              }}
            >
              {isRegistering ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
