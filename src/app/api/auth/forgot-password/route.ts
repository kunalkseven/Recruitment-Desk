import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            // Don't reveal if user exists or not
            return NextResponse.json({ message: 'If your email is registered, you will receive a reset link.' })
        }

        // In production, generate a token and send email
        // For development, log to console
        const resetToken = 'dummy-token-' + Date.now()
        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}&email=${email}`

        console.log('==================================================')
        console.log(`PASSWORD RESET LINK FOR ${email}:`)
        console.log(resetLink)
        console.log('==================================================')

        return NextResponse.json({ message: 'If your email is registered, you will receive a reset link.' })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
