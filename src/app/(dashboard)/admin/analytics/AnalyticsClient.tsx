'use client'

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
    LineChart, Line, Legend
} from 'recharts'
import styles from './Analytics.module.css'

interface AnalyticsData {
    funnel: Array<{ stage: string; count: number; fill: string }>
    sourceStats: Array<{ name: string; value: number }>
    trendData: Array<{ date: string; candidates: number; hired: number }>
    recruiterStats: Array<{
        id: string
        name: string
        total: number
        hired: number
        active: number
        conversionRate: number
    }>
    kpis: {
        totalCandidates: number
        totalHired: number
        avgTimeToHire: number
        offerAcceptanceRate: number
    }
}

interface Props {
    data: AnalyticsData
}

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981']

export function AnalyticsClient({ data }: Props) {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Recruitment Analytics</h1>
                <p className={styles.subtitle}>Insights and performance metrics</p>
            </div>

            {/* KPIs */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <span className={styles.kpiValue}>{data.kpis.totalCandidates}</span>
                    <span className={styles.kpiLabel}>Total Candidates</span>
                </div>
                <div className={styles.kpiCard}>
                    <span className={styles.kpiValue}>{data.kpis.totalHired}</span>
                    <span className={styles.kpiLabel}>Hired Candidates</span>
                </div>
                <div className={styles.kpiCard}>
                    <span className={styles.kpiValue}>{data.kpis.avgTimeToHire}d</span>
                    <span className={styles.kpiLabel}>Avg Time to Hire</span>
                </div>
                <div className={styles.kpiCard}>
                    <span className={styles.kpiValue}>{data.kpis.offerAcceptanceRate}%</span>
                    <span className={styles.kpiLabel}>Offer Acceptance</span>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Funnel Chart */}
                <div className={`${styles.card} ${styles.cardFullWidth}`}>
                    <h2 className={styles.cardTitle}>Recruitment Funnel</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.funnel} layout="vertical" margin={{ left: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" />
                                <YAxis dataKey="stage" type="category" stroke="#9ca3af" width={100} />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {data.funnel.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Registration Trends (30 Days)</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickCount={5} />
                                <YAxis stroke="#9ca3af" />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="candidates" stroke="#6366f1" strokeWidth={2} name="New Candidates" />
                                <Line type="monotone" dataKey="hired" stroke="#10b981" strokeWidth={2} name="Hired" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Source Chart */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Candidates by Source</h2>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.sourceStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.sourceStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recruiter Performance Table */}
                <div className={`${styles.card} ${styles.cardFullWidth}`}>
                    <h2 className={styles.cardTitle}>Recruiter Performance</h2>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Recruiter</th>
                                    <th>Total Candidates</th>
                                    <th>Active Pipeline</th>
                                    <th>Hired</th>
                                    <th>Hiring Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recruiterStats.map((stat) => (
                                    <tr key={stat.id}>
                                        <td>{stat.name}</td>
                                        <td>{stat.total}</td>
                                        <td>{stat.active}</td>
                                        <td>{stat.hired}</td>
                                        <td>{stat.conversionRate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
