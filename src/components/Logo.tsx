interface LogoProps {
  variant?: 'mark' | 'icon' | 'full'
  className?: string
  iconClassName?: string
  textClassName?: string
  showText?: boolean
}

export default function Logo({
  variant = 'mark',
  className = '',
  iconClassName = '',
  textClassName = '',
  showText = true,
}: LogoProps) {
  if (variant === 'full') {
    return <img src="/logo.png" alt="MÔ SALO" className={`object-contain ${className}`} />
  }

  if (variant === 'icon') {
    return <img src="/logo-icon.png" alt="MÔ SALO" className={`object-contain ${className}`} />
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/logo-icon.png" alt="" className={`object-contain ${iconClassName}`} />
      {showText && <span className={`font-bold text-lg whitespace-nowrap ${textClassName}`}>MÔ SALO</span>}
    </div>
  )
}
