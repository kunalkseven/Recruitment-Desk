import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { CandidateDetailClient } from './CandidateDetailClient'

interface Props {
    params: Promise<{ id: string }>
}

async function getCandidate(id: string, userId: string, role: string) {
    const isAdmin = role === 'SUPER_USER'

    const candidate = await prisma.candidate.findUnique({
        where: { id },
        include: {
            recruiter: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                },
            },
            interviews: {
                orderBy: { scheduledAt: 'desc' },
                include: {
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
                                },
                            },
                        },
                    },
                },
            },
            notes: {
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    })

    if (!candidate) {
        return null
    }

    // Check access - non-admin can only view their own candidates
    if (!isAdmin && candidate.recruiterId !== userId) {
        return null
    }

    return {
        ...candidate,
        createdAt: candidate.createdAt.toISOString(),
        updatedAt: candidate.updatedAt.toISOString(),
        interviews: candidate.interviews.map((i) => ({
            ...i,
            scheduledAt: i.scheduledAt.toISOString(),
            createdAt: i.createdAt.toISOString(),
            updatedAt: i.updatedAt.toISOString(),
            panelMembers: i.panelMembers.map((pm) => ({
                ...pm,
                createdAt: pm.createdAt.toISOString(),
                updatedAt: pm.updatedAt.toISOString(),
            })),
        })),
        notes: candidate.notes.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
            updatedAt: n.updatedAt.toISOString(),
        })),
    }
}

export default async function CandidateDetailPage({ params }: Props) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const { id } = await params
    const candidate = await getCandidate(id, session.user.id, session.user.role)

    if (!candidate) {
        notFound()
    }

    return (
        <CandidateDetailClient
            candidate={candidate}
            currentUserId={session.user.id}
            isAdmin={session.user.role === 'SUPER_USER'}
        />
    )
}
