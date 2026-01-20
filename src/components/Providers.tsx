'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'
import { useState, useEffect } from 'react'

interface ProvidersProps {
    children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <SessionProvider>{children}</SessionProvider>
    }

    return (
        <SessionProvider>
            <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
                {children}
            </ThemeProvider>
        </SessionProvider>
    )
}
