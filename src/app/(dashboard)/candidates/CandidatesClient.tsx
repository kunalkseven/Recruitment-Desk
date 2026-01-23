'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CandidateStatus } from '@/types'
import styles from './Candidates.module.css'

interface Candidate {
    id: string
    name: string
    email: string
    phone: string | null
    position: string | null
    experience: number | null
    status: CandidateStatus
    source: string | null
    createdAt: string
    recruiter: {
        id: string
        name: string
        email: string
    } | null
    _count: {
        interviews: number
        notes: number
    }
}

interface CandidatesClientProps {
    candidates: Candidate[]
    isAdmin: boolean
}

const statusOptions: CandidateStatus[] = [
    'APPLIED',
    'SCREENING',
    'INTERVIEW',
    'OFFER',
    'DOCUMENT_VERIFICATION',
    'HIRED',
    'REJECTED',
    'ON_HOLD',
]

export function CandidatesClient({ candidates, isAdmin }: CandidatesClientProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')

    const filteredCandidates = candidates
        .filter((c) => {
            const matchesSearch =
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.email.toLowerCase().includes(search.toLowerCase()) ||
                c.position?.toLowerCase().includes(search.toLowerCase())
            const matchesStatus = statusFilter === 'all' || c.status === statusFilter
            return matchesSearch && matchesStatus
        })
        .sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            } else {
                return a.name.localeCompare(b.name)
            }
        })

    const getStatusClass = (status: string) => {
        return `badge badge-${status.toLowerCase().replace('_', '')}`
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1>Candidates</h1>
                    <span className={styles.count}>{filteredCandidates.length} total</span>
                </div>
                <Link href="/candidates/new" className="btn btn-primary">
                    <span>➕</span> Add Candidate
                </Link>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchWrapper}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, email, or position..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={styles.select}
                >
                    <option value="all">All Status</option>
                    {statusOptions.map((status) => (
                        <option key={status} value={status}>
                            {status.replace('_', ' ')}
                        </option>
                    ))}
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
                    className={styles.select}
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name A-Z</option>
                </select>
            </div>

            {filteredCandidates.length > 0 ? (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>Position</th>
                                <th>Status</th>
                                <th>Experience</th>
                                {isAdmin && <th>Recruiter</th>}
                                <th>Interviews</th>
                                <th>Added</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCandidates.map((candidate) => (
                                <tr key={candidate.id}>
                                    <td>
                                        <div className={styles.candidateCell}>
                                            <div className={styles.avatar}>
                                                {candidate.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className={styles.name}>{candidate.name}</span>
                                                <span className={styles.email}>{candidate.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.position}>
                                            {candidate.position || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={getStatusClass(candidate.status)}>
                                            {candidate.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        {candidate.experience
                                            ? `${candidate.experience} yrs`
                                            : '—'}
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <span className={styles.recruiter}>
                                                {candidate.recruiter?.name || '—'}
                                            </span>
                                        </td>
                                    )}
                                    <td>
                                        <span className={styles.interviews}>
                                            {candidate._count.interviews}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.date}>
                                            {formatDate(candidate.createdAt)}
                                        </span>
                                    </td>
                                    <td>
                                        <Link
                                            href={`/candidates/${candidate.id}`}
                                            className={styles.viewBtn}
                                        >
                                            View →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>👥</span>
                    <h3>No candidates found</h3>
                    <p>
                        {search || statusFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Add your first candidate to get started'}
                    </p>
                    {!search && statusFilter === 'all' && (
                        <Link href="/candidates/new" className="btn btn-primary">
                            Add Candidate
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
