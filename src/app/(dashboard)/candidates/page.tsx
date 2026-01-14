import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CandidatesClient } from './CandidatesClient'

async function getCandidates(userId: string, role: string) {
    const isAdmin = role === 'SUPER_USER'

    const candidates = await prisma.candidate.findMany({
        where: isAdmin ? {} : { recruiterId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
            recruiter: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            _count: {
                select: {
                    interviews: true,
                    notes: true,
                },
            },
        },
    })

    return candidates.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }))
}

export default async function CandidatesPage() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    const candidates = await getCandidates(session.user.id, session.user.role)

    return <CandidatesClient candidates={candidates} isAdmin={session.user.role === 'SUPER_USER'} />
}
