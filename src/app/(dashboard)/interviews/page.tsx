import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InterviewsClient } from './InterviewsClient'

async function getInterviews(userId: string, role: string) {
    const isAdmin = role === 'SUPER_USER'

    const interviews = await prisma.interview.findMany({
        where: isAdmin ? {} : { scheduledById: userId },
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

    return interviews.map((interview) => ({
        ...interview,
        scheduledAt: interview.scheduledAt.toISOString(),
        createdAt: interview.createdAt.toISOString(),
        updatedAt: interview.updatedAt.toISOString(),
        panelMembers: interview.panelMembers.map((pm) => ({
            ...pm,
            createdAt: pm.createdAt.toISOString(),
            updatedAt: pm.updatedAt.toISOString(),
        })),
    }))
}

async function getCandidates(userId: string, role: string) {
    const isAdmin = role === 'SUPER_USER'

    const candidates = await prisma.candidate.findMany({
        where: isAdmin ? {} : { recruiterId: userId },
        select: {
            id: true,
            name: true,
            email: true,
            position: true,
        },
        orderBy: { name: 'asc' },
    })

    return candidates
}

async function getRecruiters() {
    return prisma.user.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            email: true,
            department: true,
        },
        orderBy: { name: 'asc' },
    })
}

export default async function InterviewsPage() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    const [interviews, candidates, recruiters] = await Promise.all([
        getInterviews(session.user.id, session.user.role),
        getCandidates(session.user.id, session.user.role),
        getRecruiters(),
    ])

    return (
        <InterviewsClient
            interviews={interviews}
            candidates={candidates}
            recruiters={recruiters}
            currentUserId={session.user.id}
        />
    )
}
