'use client'

import { ReactNode } from 'react'
import { SiteConfigProvider } from './SiteConfigProvider'

export default function Providers({ children }: { children: ReactNode }) {
  return <SiteConfigProvider>{children}</SiteConfigProvider>
}
