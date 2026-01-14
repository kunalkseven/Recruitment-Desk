import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const recruiter = await prisma.user.findUnique({
            where: { id },
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
                candidates: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        candidates: true,
                        interviews: true,
                    },
                },
            },
        })

        if (!recruiter) {
            return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 })
        }

        return NextResponse.json({ recruiter })
    } catch (error) {
        console.error('Error fetching recruiter:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recruiter' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const recruiter = await prisma.user.update({
            where: { id },
            data: {
                name: body.name,
                phone: body.phone,
                department: body.department,
                role: body.role,
                isActive: body.isActive,
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
            },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: body.isActive !== undefined
                    ? `${body.isActive ? 'activated' : 'deactivated'} recruiter`
                    : 'updated recruiter',
                details: recruiter.name,
                entityType: 'user',
                entityId: recruiter.id,
            },
        })

        return NextResponse.json({ recruiter })
    } catch (error) {
        console.error('Error updating recruiter:', error)
        return NextResponse.json(
            { error: 'Failed to update recruiter' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'SUPER_USER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Don't allow deleting yourself
        if (id === session.user.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            )
        }

        const recruiter = await prisma.user.findUnique({
            where: { id },
        })

        if (!recruiter) {
            return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 })
        }

        await prisma.user.delete({
            where: { id },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: 'deleted recruiter',
                details: recruiter.name,
                entityType: 'user',
                entityId: id,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting recruiter:', error)
        return NextResponse.json(
            { error: 'Failed to delete recruiter' },
            { status: 500 }
        )
    }
}
