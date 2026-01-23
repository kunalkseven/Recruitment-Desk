import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CandidateStatus } from '@/types'
import { DashboardClient } from './DashboardClient'

async function getDashboardData(userId: string, role: string) {
    const isAdmin = role === 'SUPER_USER'
    const whereClause = isAdmin ? {} : { recruiterId: userId }

    const [
        totalCandidates,
        appliedCount,
        screeningCount,
        interviewCount,
        offerCount,
        docVerificationCount,
        hiredCount,
        rejectedCount,
        onHoldCount,
        todayInterviews,
        recentCandidates,
        recentActivities,
    ] = await Promise.all([
        prisma.candidate.count({ where: whereClause }),
        prisma.candidate.count({ where: { ...whereClause, status: 'APPLIED' } }),
        prisma.candidate.count({ where: { ...whereClause, status: 'SCREENING' } }),
        prisma.candidate.count({ where: { ...whereClause, status: 'INTERVIEW' } }),
        prisma.candidate.count({ where: { ...whereClause, status: 'OFFER' } }),
        prisma.candidate.count({ where: { ...whereClause, status: 'DOCUMENT_VERIFICATION' as any } }),
        prisma.candidate.count({ where: { ...whereClause, status: 'HIRED' } }),
        prisma.candidate.count({ where: { ...whereClause, status: 'REJECTED' } }),
        prisma.candidate.count({ where: { ...whereClause, status: 'ON_HOLD' } }),
        prisma.interview.count({
            where: {
                scheduledAt: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                ...(isAdmin ? {} : { scheduledById: userId }),
            },
        }),
        prisma.candidate.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                recruiter: {
                    select: { name: true },
                },
            },
        }),
        prisma.activity.findMany({
            where: isAdmin ? {} : { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: {
                    select: { name: true },
                },
            },
        }),
    ])

    return {
        stats: {
            totalCandidates,
            todayInterviews,
            offersMade: offerCount,
            hiredThisMonth: hiredCount,
        },
        pipeline: {
            applied: appliedCount,
            screening: screeningCount,
            interview: interviewCount,
            offer: offerCount,
            docVerification: docVerificationCount,
            hired: hiredCount,
            rejected: rejectedCount,
            onHold: onHoldCount,
        },
        recentCandidates: recentCandidates.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
        })),
        recentActivities: recentActivities.map(a => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
        })),
    }
}

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    const data = await getDashboardData(session.user.id, session.user.role)

    return <DashboardClient data={data} userName={session.user.name} />
}
