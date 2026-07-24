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
    return (
      <img
        src="/logo.png"
        alt="MÔ SALO"
        className={`max-w-full max-h-8 h-8 w-auto object-contain ${className}`}
      />
    )
  }

  if (variant === 'icon') {
    return (
      <img
        src="/logo-icon.png"
        alt="MÔ SALO"
        className={`max-w-full max-h-full h-full w-full object-contain ${className}`}
      />
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo-icon.png"
        alt=""
        className={`h-8 w-auto max-h-8 max-w-8 object-contain ${iconClassName}`}
      />
      {showText && <span className={`font-bold text-lg whitespace-nowrap ${textClassName}`}>MÔ SALO</span>}
    </div>
  )
}
