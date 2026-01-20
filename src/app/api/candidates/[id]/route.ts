import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const candidate = await prisma.candidate.findUnique({
            where: { id },
            include: {
                recruiter: {
                    select: { id: true, name: true, email: true },
                },
                interviews: {
                    include: {
                        scheduledBy: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { scheduledAt: 'desc' },
                },
                notes: {
                    include: {
                        author: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!candidate) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
        }

        // Check access
        const isAdmin = session.user.role === 'SUPER_USER'
        if (!isAdmin && candidate.recruiterId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({ candidate })
    } catch (error) {
        console.error('Error fetching candidate:', error)
        return NextResponse.json(
            { error: 'Failed to fetch candidate' },
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
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

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

        const candidate = await prisma.candidate.update({
            where: { id },
            data: {
                name: body.name,
                email: body.email?.toLowerCase(),
                phone: body.phone,
                position: body.position,
                experience: body.experience ? parseInt(body.experience) : null,
                currentCompany: body.currentCompany,
                expectedSalary: body.expectedSalary,
                skills: body.skills,
                source: body.source,
                status: body.status,
                recruiterId: body.recruiterId,
            },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: 'updated candidate',
                details: candidate.name,
                entityType: 'candidate',
                entityId: candidate.id,
            },
        })

        return NextResponse.json({ candidate })
    } catch (error) {
        console.error('Error updating candidate:', error)
        return NextResponse.json(
            { error: 'Failed to update candidate' },
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
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

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

        await prisma.candidate.delete({
            where: { id },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: 'deleted candidate',
                details: existingCandidate.name,
                entityType: 'candidate',
                entityId: id,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting candidate:', error)
        return NextResponse.json(
            { error: 'Failed to delete candidate' },
            { status: 500 }
        )
    }
}
