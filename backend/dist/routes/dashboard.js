"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/stats', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const [totalCandidates, appliedCount, screeningCount, interviewCount, offerCount, hiredCount, rejectedCount, onHoldCount, todayInterviews, recentCandidates, recentActivities,] = yield Promise.all([
            prisma_1.prisma.candidate.count({ where: whereClause }),
            prisma_1.prisma.candidate.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'APPLIED' }) }),
            prisma_1.prisma.candidate.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'SCREENING' }) }),
            prisma_1.prisma.candidate.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'INTERVIEW' }) }),
            prisma_1.prisma.candidate.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'OFFER' }) }),
            prisma_1.prisma.candidate.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'HIRED' }) }),
            prisma_1.prisma.candidate.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'REJECTED' }) }),
            prisma_1.prisma.candidate.count({ where: Object.assign(Object.assign({}, whereClause), { status: 'ON_HOLD' }) }),
            prisma_1.prisma.interview.count({
                where: Object.assign({ scheduledAt: {
                        gte: todayStart,
                        lt: todayEnd,
                    } }, (isAdmin ? {} : { scheduledById: userId })),
            }),
            prisma_1.prisma.candidate.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    recruiter: {
                        select: { name: true },
                    },
                },
            }),
            prisma_1.prisma.activity.findMany({
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
            recentCandidates: recentCandidates.map(c => (Object.assign(Object.assign({}, c), { createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() }))),
            recentActivities: recentActivities.map(a => (Object.assign(Object.assign({}, a), { createdAt: a.createdAt.toISOString() }))),
        };
        res.json(data);
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
