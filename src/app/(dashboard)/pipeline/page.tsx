import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PipelineClient } from './PipelineClient'
import { CandidateStatus } from '@/types'

interface CandidateData {
    id: string
    name: string
    email: string
    position: string | null
    status: CandidateStatus
    createdAt: Date
    updatedAt: Date
    recruiter: {
        id: string
        name: string
    } | null
}

async function getCandidatesByStatus(userId: string, role: string) {
    const isAdmin = role === 'SUPER_USER'
    const whereClause = isAdmin ? {} : { recruiterId: userId }

    const candidates = await prisma.candidate.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
            recruiter: {
                select: { id: true, name: true },
            },
        },
    })

    return candidates.map((c: CandidateData) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }))
}

export default async function PipelinePage() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    const candidates = await getCandidatesByStatus(session.user.id, session.user.role)

    return <PipelineClient candidates={candidates} />
}
