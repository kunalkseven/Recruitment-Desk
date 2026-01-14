import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
    params: Promise<{ id: string }>
}

// POST /api/candidates/[id]/notes - Add a note to a candidate
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { content } = body

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
        }

        // Check if candidate exists and user has access
        const candidate = await prisma.candidate.findUnique({
            where: { id },
            select: { recruiterId: true },
        })

        if (!candidate) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
        }

        const isAdmin = session.user.role === 'SUPER_USER'
        if (!isAdmin && candidate.recruiterId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Create note
        const note = await prisma.note.create({
            data: {
                content: content.trim(),
                candidateId: id,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                action: 'Added note',
                entityType: 'candidate',
                entityId: id,
                userId: session.user.id,
            },
        })

        return NextResponse.json(note, { status: 201 })
    } catch (error) {
        console.error('Failed to add note:', error)
        return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
    }
}

// GET /api/candidates/[id]/notes - Get all notes for a candidate
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Check if candidate exists and user has access
        const candidate = await prisma.candidate.findUnique({
            where: { id },
            select: { recruiterId: true },
        })

        if (!candidate) {
            return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
        }

        const isAdmin = session.user.role === 'SUPER_USER'
        if (!isAdmin && candidate.recruiterId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const notes = await prisma.note.findMany({
            where: { candidateId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        return NextResponse.json(notes)
    } catch (error) {
        console.error('Failed to fetch notes:', error)
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }
}
