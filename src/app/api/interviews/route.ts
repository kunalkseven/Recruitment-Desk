import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const candidateId = searchParams.get('candidateId')

        const isAdmin = session.user.role === 'SUPER_USER'
        const whereClause: Record<string, unknown> = isAdmin
            ? {}
            : { scheduledById: session.user.id }

        if (candidateId) {
            whereClause.candidateId = candidateId
        }

        const interviews = await prisma.interview.findMany({
            where: whereClause,
            orderBy: { scheduledAt: 'asc' },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                    },
                },
                scheduledBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                panelMembers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json({ interviews })
    } catch (error) {
        console.error('Error fetching interviews:', error)
        return NextResponse.json(
            { error: 'Failed to fetch interviews' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            candidateId,
            type,
            scheduledAt,
            duration,
            location,
            notes,
            panelMembers,
        } = body

        if (!candidateId || !scheduledAt) {
            return NextResponse.json(
                { error: 'Candidate and scheduled time are required' },
                { status: 400 }
            )
        }

        // Validate that scheduledAt is not in the past
        const scheduledDate = new Date(scheduledAt)
        const now = new Date()
        if (scheduledDate < now) {
            return NextResponse.json(
                { error: 'Cannot schedule interview in the past' },
                { status: 400 }
            )
        }

        // Verify candidate access
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
        })

        if (!candidate) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
        }

        const isAdmin = session.user.role === 'SUPER_USER'
        if (!isAdmin && candidate.recruiterId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Create interview with panel members
        const interview = await prisma.interview.create({
            data: {
                candidateId,
                scheduledById: session.user.id,
                type: type || 'ONLINE_TEST',
                scheduledAt: new Date(scheduledAt),
                duration: duration || 60,
                location,
                notes,
                panelMembers: {
                    create: panelMembers?.map((pm: {
                        type: string
                        userId?: string
                        name?: string
                        email?: string
                        designation?: string
                    }) => ({
                        userId: pm.type === 'internal' ? pm.userId : null,
                        name: pm.type === 'external' ? pm.name : null,
                        email: pm.type === 'external' ? pm.email : null,
                        designation: pm.type === 'external' ? pm.designation : null,
                    })) || [],
                },
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                    },
                },
                scheduledBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                panelMembers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        })

        // Update candidate status to INTERVIEW if not already
        if (candidate.status === 'APPLIED' || candidate.status === 'SCREENING') {
            await prisma.candidate.update({
                where: { id: candidateId },
                data: { status: 'INTERVIEW' },
            })
        }

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: `scheduled ${type} interview`,
                details: candidate.name,
                entityType: 'interview',
                entityId: interview.id,
            },
        })

        return NextResponse.json({ interview })
    } catch (error) {
        console.error('Error creating interview:', error)
        return NextResponse.json(
            { error: 'Failed to create interview' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            id,
            type,
            scheduledAt,
            duration,
            location,
            notes,
            panelMembers,
        } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Interview ID is required' },
                { status: 400 }
            )
        }

        // Validate that scheduledAt is not in the past
        if (scheduledAt) {
            const scheduledDate = new Date(scheduledAt)
            const now = new Date()
            if (scheduledDate < now) {
                return NextResponse.json(
                    { error: 'Cannot schedule interview in the past' },
                    { status: 400 }
                )
            }
        }

        // Find the interview
        const existingInterview = await prisma.interview.findUnique({
            where: { id },
            include: {
                candidate: true,
            },
        })

        if (!existingInterview) {
            return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
        }

        const isAdmin = session.user.role === 'SUPER_USER'
        if (!isAdmin && existingInterview.scheduledById !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Update panel members: delete existing and create new ones if provided
        if (panelMembers !== undefined) {
            await prisma.interviewPanel.deleteMany({
                where: { interviewId: id },
            })
        }

        // Update interview
        const interview = await prisma.interview.update({
            where: { id },
            data: {
                type: type || existingInterview.type,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : existingInterview.scheduledAt,
                duration: duration ? parseInt(String(duration), 10) : existingInterview.duration,
                location: location !== undefined ? location : existingInterview.location,
                notes: notes !== undefined ? notes : existingInterview.notes,
                panelMembers: panelMembers !== undefined ? {
                    create: panelMembers?.map((pm: {
                        type: string
                        userId?: string
                        name?: string
                        email?: string
                        designation?: string
                    }) => ({
                        userId: pm.type === 'internal' ? pm.userId : null,
                        name: pm.type === 'external' ? pm.name : null,
                        email: pm.type === 'external' ? pm.email : null,
                        designation: pm.type === 'external' ? pm.designation : null,
                    })) || [],
                } : undefined,
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        position: true,
                    },
                },
                scheduledBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                panelMembers: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: `updated ${interview.type} interview`,
                details: existingInterview.candidate.name,
                entityType: 'interview',
                entityId: interview.id,
            },
        })

        return NextResponse.json({ interview })
    } catch (error) {
        console.error('Error updating interview:', error)
        return NextResponse.json(
            { error: 'Failed to update interview' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Interview ID is required' },
                { status: 400 }
            )
        }

        // Find the interview
        const existingInterview = await prisma.interview.findUnique({
            where: { id },
            include: {
                candidate: true,
            },
        })

        if (!existingInterview) {
            return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
        }

        const isAdmin = session.user.role === 'SUPER_USER'
        if (!isAdmin && existingInterview.scheduledById !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Delete panel members first (due to foreign key constraint)
        await prisma.interviewPanel.deleteMany({
            where: { interviewId: id },
        })

        // Delete the interview
        await prisma.interview.delete({
            where: { id },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: `deleted ${existingInterview.type} interview`,
                details: existingInterview.candidate.name,
                entityType: 'interview',
                entityId: id,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting interview:', error)
        return NextResponse.json(
            { error: 'Failed to delete interview' },
            { status: 500 }
        )
    }
}
