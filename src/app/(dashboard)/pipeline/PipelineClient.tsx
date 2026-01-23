'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CandidateStatus } from '@/types'
import styles from './Pipeline.module.css'

interface Candidate {
    id: string
    name: string
    email: string
    position: string | null
    status: CandidateStatus
    updatedAt: string
    recruiter: { id: string; name: string } | null
}

interface PipelineClientProps {
    candidates: Candidate[]
}

const PIPELINE_COLUMNS: { status: CandidateStatus; label: string; color: string }[] = [
    { status: 'APPLIED', label: 'Applied', color: '#6366f1' },
    { status: 'SCREENING', label: 'Screening', color: '#8b5cf6' },
    { status: 'INTERVIEW', label: 'Interview', color: '#a855f7' },
    { status: 'OFFER', label: 'Offer', color: '#06b6d4' },
    { status: 'DOCUMENT_VERIFICATION', label: 'Document Verification', color: '#f59e0b' },
    { status: 'HIRED', label: 'Hired', color: '#10b981' },
    { status: 'REJECTED', label: 'Rejected', color: '#ef4444' },
]

export function PipelineClient({ candidates: initialCandidates }: PipelineClientProps) {
    const [candidates, setCandidates] = useState(initialCandidates)
    const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null)
    const [dragOverColumn, setDragOverColumn] = useState<CandidateStatus | null>(null)

    const getCandidatesByStatus = (status: CandidateStatus) => {
        return candidates.filter(c => c.status === status)
    }

    const handleDragStart = (e: React.DragEvent, candidateId: string) => {
        setDraggedCandidate(candidateId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragEnd = () => {
        setDraggedCandidate(null)
        setDragOverColumn(null)
    }

    const handleDragOver = (e: React.DragEvent, status: CandidateStatus) => {
        e.preventDefault()
        setDragOverColumn(status)
    }

    const handleDragLeave = () => {
        setDragOverColumn(null)
    }

    const handleDrop = async (e: React.DragEvent, newStatus: CandidateStatus) => {
        e.preventDefault()
        setDragOverColumn(null)

        if (!draggedCandidate) return

        const candidate = candidates.find(c => c.id === draggedCandidate)
        if (!candidate || candidate.status === newStatus) return

        // Optimistic update
        setCandidates(prev =>
            prev.map(c =>
                c.id === draggedCandidate ? { ...c, status: newStatus } : c
            )
        )

        // API call
        try {
            const response = await fetch(`/api/candidates/${draggedCandidate}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (!response.ok) {
                // Revert on error
                setCandidates(prev =>
                    prev.map(c =>
                        c.id === draggedCandidate ? { ...c, status: candidate.status } : c
                    )
                )
            }
        } catch {
            // Revert on error
            setCandidates(prev =>
                prev.map(c =>
                    c.id === draggedCandidate ? { ...c, status: candidate.status } : c
                )
            )
        }

        setDraggedCandidate(null)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)

        if (diff === 0) return 'Today'
        if (diff === 1) return 'Yesterday'
        if (diff < 7) return `${diff} days ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Pipeline</h1>
                    <p>Drag and drop candidates between stages</p>
                </div>
                <Link href="/candidates/new" className="btn btn-primary">
                    <span>➕</span> Add Candidate
                </Link>
            </div>

            <div className={styles.pipeline}>
                {PIPELINE_COLUMNS.map(column => {
                    const columnCandidates = getCandidatesByStatus(column.status)
                    const isOver = dragOverColumn === column.status

                    return (
                        <div
                            key={column.status}
                            className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
                            onDragOver={(e) => handleDragOver(e, column.status)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.status)}
                        >
                            <div className={styles.columnHeader}>
                                <div
                                    className={styles.columnDot}
                                    style={{ background: column.color }}
                                />
                                <span className={styles.columnTitle}>{column.label}</span>
                                <span className={styles.columnCount}>{columnCandidates.length}</span>
                            </div>

                            <div className={styles.columnContent}>
                                {columnCandidates.map(candidate => (
                                    <div
                                        key={candidate.id}
                                        className={`${styles.card} ${draggedCandidate === candidate.id ? styles.cardDragging : ''
                                            }`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, candidate.id)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <Link href={`/candidates/${candidate.id}`} className={styles.cardLink}>
                                            <div className={styles.cardHeader}>
                                                <div className={styles.cardAvatar}>
                                                    {candidate.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className={styles.cardInfo}>
                                                    <span className={styles.cardName}>{candidate.name}</span>
                                                    <span className={styles.cardPosition}>
                                                        {candidate.position || 'No position'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.cardMeta}>
                                                <span className={styles.cardRecruiter}>
                                                    {candidate.recruiter?.name || 'Unassigned'}
                                                </span>
                                                <span className={styles.cardDate}>
                                                    {formatDate(candidate.updatedAt)}
                                                </span>
                                            </div>
                                        </Link>
                                    </div>
                                ))}

                                {columnCandidates.length === 0 && (
                                    <div className={styles.emptyColumn}>
                                        <span>📭</span>
                                        <p>No candidates</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
