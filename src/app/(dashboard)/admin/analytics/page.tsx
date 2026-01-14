import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from './AnalyticsClient'
import { CandidateStatus } from '@/types'

async function getAnalyticsData() {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [candidates, users] = await Promise.all([
        prisma.candidate.findMany({
            select: {
                id: true,
                status: true,
                source: true,
                recruiterId: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        prisma.user.findMany({
            where: { role: 'RECRUITER' },
            select: { id: true, name: true },
        }),
    ])

    // --- Funnel Data ---
    const funnelCounts = candidates.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const funnel = [
        { stage: 'Applied', count: funnelCounts['APPLIED'] || 0, fill: '#6366f1' },
        { stage: 'Screening', count: funnelCounts['SCREENING'] || 0, fill: '#8b5cf6' },
        { stage: 'Interview', count: funnelCounts['INTERVIEW'] || 0, fill: '#d946ef' },
        { stage: 'Offer', count: funnelCounts['OFFER'] || 0, fill: '#f59e0b' },
        { stage: 'Hired', count: funnelCounts['HIRED'] || 0, fill: '#10b981' },
    ]

    // --- KPIs ---
    const totalCandidates = candidates.length
    const totalHired = funnelCounts['HIRED'] || 0
    const totalOffers = funnelCounts['OFFER'] || 0

    // Avg Time to Hire
    const hiredCandidates = candidates.filter(c => c.status === 'HIRED')
    const totalDaysToHire = hiredCandidates.reduce((sum, c) => {
        const diff = c.updatedAt.getTime() - c.createdAt.getTime()
        return sum + diff
    }, 0)
    const avgTimeToHire = hiredCandidates.length > 0
        ? Math.round((totalDaysToHire / hiredCandidates.length) / (1000 * 60 * 60 * 24))
        : 0

    // Offer Acceptance Rate (Note: Simplification, assuming HIRED comes from OFFER)
    // Actually, HIRED is resolved. OFFER is pending offers? or All offers?
    // Assuming status flow is linear, HIRED candidates passed through OFFER.
    // So distinct offers made = Currently OFFER status + HIRED + REJECTED (if rejected after offer)?
    // For simplicity: Offers Made = OFFER + HIRED. Acceptance = HIRED / Offers Made
    const offersMade = (funnelCounts['OFFER'] || 0) + (funnelCounts['HIRED'] || 0)
    const offerAcceptanceRate = offersMade > 0
        ? Math.round((totalHired / offersMade) * 100)
        : 0

    // --- Source Stats ---
    const sourceCounts = candidates.reduce((acc, c) => {
        const source = c.source || 'Direct'
        acc[source] = (acc[source] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const sourceStats = Object.entries(sourceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5 sources

    // --- Recruiter Stats ---
    const recruiterStats = users.map(user => {
        const userCandidates = candidates.filter(c => c.recruiterId === user.id)
        const total = userCandidates.length
        const hired = userCandidates.filter(c => c.status === 'HIRED').length
        const active = userCandidates.filter(c => !['HIRED', 'REJECTED'].includes(c.status)).length
        const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0

        return {
            id: user.id,
            name: user.name,
            total,
            hired,
            active,
            conversionRate
        }
    }).sort((a, b) => b.hired - a.hired)

    // --- Trend Data (Last 30 Days) ---
    const trendMap = new Map<string, { candidates: number; hired: number }>()

    // Initialize dates
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        // Format MM-DD for chart
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        trendMap.set(dateStr, { candidates: 0, hired: 0 })
    }

    candidates.forEach(c => {
        if (c.createdAt >= thirtyDaysAgo) {
            const dateStr = c.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (trendMap.has(dateStr)) {
                trendMap.get(dateStr)!.candidates++
            }
        }
        if (c.status === 'HIRED' && c.updatedAt >= thirtyDaysAgo) {
            const dateStr = c.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (trendMap.has(dateStr)) {
                trendMap.get(dateStr)!.hired++
            }
        }
    })

    const trendData = Array.from(trendMap.entries()).map(([date, stats]) => ({
        date,
        candidates: stats.candidates,
        hired: stats.hired,
    }))

    return {
        funnel,
        sourceStats,
        trendData,
        recruiterStats,
        kpis: {
            totalCandidates,
            totalHired,
            avgTimeToHire,
            offerAcceptanceRate,
        }
    }
}

export default async function AnalyticsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (session.user.role !== 'SUPER_USER') {
        redirect('/dashboard')
    }

    const data = await getAnalyticsData()

    return <AnalyticsClient data={data} />
}
