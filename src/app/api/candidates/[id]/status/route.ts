import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const { status } = await request.json()

        const existingCandidate = await prisma.candidate.findUnique({
            where: { id },
        })

        if (!existingCandidate) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
        }

        // Check access
        const isAdmin = session.user.role === 'SUPER_USER'
        if (!isAdmin && existingCandidate.recruiterId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const oldStatus = existingCandidate.status

        const candidate = await prisma.candidate.update({
            where: { id },
            data: { status },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: `moved candidate from ${oldStatus} to ${status}`,
                details: candidate.name,
                entityType: 'candidate',
                entityId: candidate.id,
            },
        })

        return NextResponse.json({ candidate })
    } catch (error) {
        console.error('Error updating candidate status:', error)
        return NextResponse.json(
            { error: 'Failed to update candidate status' },
            { status: 500 }
        )
    }
}
