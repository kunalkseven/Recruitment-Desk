import { Router, Request } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// Define a custom interface for the authenticated request
interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

router.get('/stats', authenticate, async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id: userId, role } = user;
        const isAdmin = role === 'SUPER_USER';
        const whereClause = isAdmin ? {} : { recruiterId: userId };

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const [
            totalCandidates,
            appliedCount,
            screeningCount,
            interviewCount,
            offerCount,
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
            prisma.candidate.count({ where: { ...whereClause, status: 'HIRED' } }),
            prisma.candidate.count({ where: { ...whereClause, status: 'REJECTED' } }),
            prisma.candidate.count({ where: { ...whereClause, status: 'ON_HOLD' } }),
            prisma.interview.count({
                where: {
                    scheduledAt: {
                        gte: todayStart,
                        lt: todayEnd,
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
        ]);

        const data = {
            stats: {
                totalCandidates,
                todayInterviews,
                offersMade: offerCount,
                hiredThisMonth: hiredCount, // Logic for 'hiredThisMonth' was just total hired in original code, keeping as is
            },
            pipeline: {
                applied: appliedCount,
                screening: screeningCount,
                interview: interviewCount,
                offer: offerCount,
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
        };

        res.json(data);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
