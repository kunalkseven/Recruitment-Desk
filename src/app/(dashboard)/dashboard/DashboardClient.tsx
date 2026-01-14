'use client'

import Link from 'next/link'
import styles from './Dashboard.module.css'

interface DashboardData {
    stats: {
        totalCandidates: number
        todayInterviews: number
        offersMade: number
        hiredThisMonth: number
    }
    pipeline: {
        applied: number
        screening: number
        interview: number
        offer: number
        hired: number
        rejected: number
        onHold: number
    }
    recentCandidates: Array<{
        id: string
        name: string
        email: string
        position: string | null
        status: string
        createdAt: string
        recruiter: { name: string } | null
    }>
    recentActivities: Array<{
        id: string
        action: string
        details: string | null
        createdAt: string
        user: { name: string } | null
    }>
}

interface DashboardClientProps {
    data: DashboardData
    userName: string
}

export function DashboardClient({ data, userName }: DashboardClientProps) {
    const { stats, pipeline, recentCandidates, recentActivities } = data

    const getStatusClass = (status: string) => {
        return `badge badge-${status.toLowerCase().replace('_', '')}`
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return `${days}d ago`
    }

    const pipelineTotal = Object.values(pipeline).reduce((a, b) => a + b, 0)

    return (
        <div className={styles.dashboard}>
            <div className={styles.welcome}>
                <h1>Welcome back, {userName.split(' ')[0]}! 👋</h1>
                <p>Here&apos;s what&apos;s happening with your recruitment pipeline today.</p>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statPrimary}`}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.totalCandidates}</span>
                        <span className={styles.statLabel}>Total Candidates</span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statSecondary}`}>
                    <div className={styles.statIcon}>📅</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.todayInterviews}</span>
                        <span className={styles.statLabel}>Interviews Today</span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statAccent}`}>
                    <div className={styles.statIcon}>📋</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.offersMade}</span>
                        <span className={styles.statLabel}>Offers Extended</span>
                    </div>
                </div>
                <div className={`${styles.statCard} ${styles.statSuccess}`}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.hiredThisMonth}</span>
                        <span className={styles.statLabel}>Hired This Month</span>
                    </div>
                </div>
            </div>

            {/* Pipeline Overview */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Pipeline Overview</h2>
                    <Link href="/pipeline" className={styles.sectionLink}>
                        View Pipeline →
                    </Link>
                </div>
                <div className={styles.pipelineCard}>
                    <div className={styles.pipelineBar}>
                        {pipelineTotal > 0 ? (
                            <>
                                <div
                                    className={styles.pipelineSegment}
                                    style={{
                                        width: `${(pipeline.applied / pipelineTotal) * 100}%`,
                                        background: 'var(--status-applied)'
                                    }}
                                    title={`Applied: ${pipeline.applied}`}
                                />
                                <div
                                    className={styles.pipelineSegment}
                                    style={{
                                        width: `${(pipeline.screening / pipelineTotal) * 100}%`,
                                        background: 'var(--status-screening)'
                                    }}
                                    title={`Screening: ${pipeline.screening}`}
                                />
                                <div
                                    className={styles.pipelineSegment}
                                    style={{
                                        width: `${(pipeline.interview / pipelineTotal) * 100}%`,
                                        background: 'var(--status-interview)'
                                    }}
                                    title={`Interview: ${pipeline.interview}`}
                                />
                                <div
                                    className={styles.pipelineSegment}
                                    style={{
                                        width: `${(pipeline.offer / pipelineTotal) * 100}%`,
                                        background: 'var(--status-offer)'
                                    }}
                                    title={`Offer: ${pipeline.offer}`}
                                />
                                <div
                                    className={styles.pipelineSegment}
                                    style={{
                                        width: `${(pipeline.hired / pipelineTotal) * 100}%`,
                                        background: 'var(--status-hired)'
                                    }}
                                    title={`Hired: ${pipeline.hired}`}
                                />
                            </>
                        ) : (
                            <div className={styles.pipelineEmpty}>No candidates yet</div>
                        )}
                    </div>
                    <div className={styles.pipelineLegend}>
                        <div className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: 'var(--status-applied)' }} />
                            <span>Applied ({pipeline.applied})</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: 'var(--status-screening)' }} />
                            <span>Screening ({pipeline.screening})</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: 'var(--status-interview)' }} />
                            <span>Interview ({pipeline.interview})</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: 'var(--status-offer)' }} />
                            <span>Offer ({pipeline.offer})</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: 'var(--status-hired)' }} />
                            <span>Hired ({pipeline.hired})</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className={styles.twoColumn}>
                {/* Recent Candidates */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Recent Candidates</h2>
                        <Link href="/candidates" className={styles.sectionLink}>
                            View All →
                        </Link>
                    </div>
                    <div className={styles.candidatesList}>
                        {recentCandidates.length > 0 ? (
                            recentCandidates.map((candidate) => (
                                <Link
                                    key={candidate.id}
                                    href={`/candidates/${candidate.id}`}
                                    className={styles.candidateItem}
                                >
                                    <div className={styles.candidateAvatar}>
                                        {candidate.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.candidateInfo}>
                                        <span className={styles.candidateName}>{candidate.name}</span>
                                        <span className={styles.candidatePosition}>
                                            {candidate.position || 'No position specified'}
                                        </span>
                                    </div>
                                    <span className={getStatusClass(candidate.status)}>
                                        {candidate.status.replace('_', ' ')}
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <span>👥</span>
                                <p>No candidates yet. Add your first candidate!</p>
                                <Link href="/candidates/new" className="btn btn-primary">
                                    Add Candidate
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Recent Activity</h2>
                    </div>
                    <div className={styles.activityList}>
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <div key={activity.id} className={styles.activityItem}>
                                    <div className={styles.activityDot} />
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityText}>
                                            <strong>{activity.user?.name}</strong> {activity.action}
                                            {activity.details && <span> - {activity.details}</span>}
                                        </p>
                                        <span className={styles.activityTime}>
                                            {formatDate(activity.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <span>📋</span>
                                <p>No activity yet. Start adding candidates!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <h3>Quick Actions</h3>
                <div className={styles.actionButtons}>
                    <Link href="/candidates/new" className={`btn btn-primary ${styles.actionBtn}`}>
                        <span>➕</span> Add Candidate
                    </Link>
                    <Link href="/pipeline" className={`btn btn-secondary ${styles.actionBtn}`}>
                        <span>📋</span> View Pipeline
                    </Link>
                    <Link href="/interviews" className={`btn btn-secondary ${styles.actionBtn}`}>
                        <span>📅</span> Schedule Interview
                    </Link>
                </div>
            </div>
        </div>
    )
}
