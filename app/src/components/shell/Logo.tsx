import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: 14 },
    md: { icon: 24, text: 18 },
    lg: { icon: 64, text: 30 },
  }

  const s = sizes[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-foreground shrink-0"
      >
        <circle cx="12" cy="4" r="2.5" fill="currentColor" />
        <circle cx="4" cy="18" r="2.5" fill="currentColor" />
        <circle cx="20" cy="18" r="2.5" fill="currentColor" />
        <line x1="12" y1="6.5" x2="5.5" y2="16" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="6.5" x2="18.5" y2="16" stroke="currentColor" strokeWidth="1.5" />
        <line x1="6.5" y1="18" x2="17.5" y2="18" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {showText && (
        <span className="font-semibold tracking-tight" style={{ fontSize: s.text }}>
          Polymind
        </span>
      )}
    </div>
  )
}
