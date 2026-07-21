"use client"

import { useState } from "react"
import { getCompanyLogoUrl, getCompanyInitials, getCompanyColor } from "@/lib/company-logos"

interface CompanyLogoProps {
  company?: string
  size?: number
  className?: string
  rounded?: string
}

export function CompanyLogo({ company, size = 40, className = "", rounded = "rounded-lg" }: CompanyLogoProps) {
  const [error, setError] = useState(false)
  const src = getCompanyLogoUrl(company)
  const initials = getCompanyInitials(company)
  const bg = getCompanyColor(company)

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center text-white font-bold text-xs shrink-0 ${rounded} ${className}`}
        style={{ width: size, height: size, backgroundColor: bg }}
        aria-label={company}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={company}
      width={size}
      height={size}
      className={`object-cover shrink-0 ${rounded} ${className}`}
      style={{ width: size, height: size }}
      onError={() => setError(true)}
    />
  )
}
