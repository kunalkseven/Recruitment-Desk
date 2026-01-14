import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const recruiters = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                phone: true,
                department: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        candidates: true,
                        interviews: true,
                    },
                },
            },
        })

        return NextResponse.json({ recruiters })
    } catch (error) {
        console.error('Error fetching recruiters:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recruiters' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, email, password, role, department, phone } = body

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            )
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const recruiter = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: role || 'RECRUITER',
                department,
                phone,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                phone: true,
                department: true,
                isActive: true,
                createdAt: true,
                _count: {
                    select: {
                        candidates: true,
                        interviews: true,
                    },
                },
            },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: 'added a new recruiter',
                details: recruiter.name,
                entityType: 'user',
                entityId: recruiter.id,
            },
        })

        return NextResponse.json({ recruiter })
    } catch (error) {
        console.error('Error creating recruiter:', error)
        return NextResponse.json(
            { error: 'Failed to create recruiter' },
            { status: 500 }
        )
    }
}
