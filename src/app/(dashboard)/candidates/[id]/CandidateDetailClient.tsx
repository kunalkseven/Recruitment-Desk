'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './CandidateDetail.module.css'

interface Props {
    candidate: {
        id: string
        name: string
        email: string
        phone?: string | null
        position?: string | null
        experience?: number | null
        currentCompany?: string | null
        expectedSalary?: string | null
        resumeUrl?: string | null
        skills?: string | null
        status: string
        source?: string | null
        createdAt: string
        updatedAt: string
        recruiter: {
            id: string
            name: string
            email: string
            department?: string | null
        }
        interviews: Array<{
            id: string
            scheduledAt: string
            type: string
            round: number
            result: string
            duration: number
            location?: string | null
            scheduledBy: {
                id: string
                name: string
            }
        }>
        notes: Array<{
            id: string
            content: string
            createdAt: string
            author: {
                id: string
                name: string
            }
        }>
    }
    currentUserId: string
    isAdmin: boolean
}

const STATUS_LABELS: Record<string, string> = {
    APPLIED: 'Applied',
    SCREENING: 'Screening',
    INTERVIEW: 'Interview',
    OFFER: 'Offer',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
    ON_HOLD: 'On Hold',
}

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
    ONLINE_TEST: 'Online Test',
    L1_ROUND: 'L1 Round',
    L2_ROUND: 'L2 Round',
    HR_DISCUSSION: 'HR Discussion',
}

export function CandidateDetailClient({ candidate, currentUserId, isAdmin }: Props) {
    const router = useRouter()
    const [newNote, setNewNote] = useState('')
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    // Skills can be either JSON array or comma-separated string
    const parseSkills = (skillsStr: string | null | undefined): string[] => {
        if (!skillsStr) return []
        try {
            const parsed = JSON.parse(skillsStr)
            return Array.isArray(parsed) ? parsed : [skillsStr]
        } catch {
            // If not valid JSON, treat as comma-separated string
            return skillsStr.split(',').map((s) => s.trim()).filter(Boolean)
        }
    }
    const skills = parseSkills(candidate.skills)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    const getStatusClass = (status: string) => {
        const statusMap: Record<string, string> = {
            APPLIED: styles.statusApplied,
            SCREENING: styles.statusScreening,
            INTERVIEW: styles.statusInterview,
            OFFER: styles.statusOffer,
            HIRED: styles.statusHired,
            REJECTED: styles.statusRejected,
            ON_HOLD: styles.statusOnHold,
        }
        return statusMap[status] || styles.statusApplied
    }

    const getResultClass = (result: string) => {
        const resultMap: Record<string, string> = {
            PASS: styles.resultPass,
            FAIL: styles.resultFail,
            PENDING: styles.resultPending,
            NO_SHOW: styles.resultNoShow,
        }
        return resultMap[result] || styles.resultPending
    }

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdatingStatus(true)
        try {
            const response = await fetch(`/api/candidates/${candidate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (response.ok) {
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to update status:', error)
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleAddNote = async () => {
        if (!newNote.trim()) return

        setIsAddingNote(true)
        try {
            const response = await fetch(`/api/candidates/${candidate.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newNote }),
            })

            if (response.ok) {
                setNewNote('')
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to add note:', error)
        } finally {
            setIsAddingNote(false)
        }
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Link href="/candidates" className={styles.backLink}>
                        ← Back to Candidates
                    </Link>
                    <h1 className={styles.title}>{candidate.name}</h1>
                    <p className={styles.subtitle}>
                        {candidate.position || 'No position specified'} • Added {formatDate(candidate.createdAt)}
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <select
                        className={styles.statusSelect}
                        value={candidate.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isUpdatingStatus}
                    >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <span className={`${styles.statusBadge} ${getStatusClass(candidate.status)}`}>
                        {STATUS_LABELS[candidate.status]}
                    </span>
                </div>
            </div>

            <div className={styles.content}>
                {/* Main Info */}
                <div className={styles.mainSection}>
                    {/* Contact Info Card */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Contact Information</h2>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Email</span>
                                <a href={`mailto:${candidate.email}`} className={styles.infoValue}>
                                    {candidate.email}
                                </a>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Phone</span>
                                <span className={styles.infoValue}>{candidate.phone || 'Not provided'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Current Company</span>
                                <span className={styles.infoValue}>{candidate.currentCompany || 'Not provided'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Experience</span>
                                <span className={styles.infoValue}>
                                    {candidate.experience ? `${candidate.experience} years` : 'Not provided'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Expected Salary</span>
                                <span className={styles.infoValue}>{candidate.expectedSalary || 'Not provided'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Source</span>
                                <span className={styles.infoValue}>{candidate.source || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Skills Card */}
                    {skills.length > 0 && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Skills</h2>
                            <div className={styles.skillsContainer}>
                                {skills.map((skill: string, index: number) => (
                                    <span key={index} className={styles.skillTag}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resume Card */}
                    {candidate.resumeUrl && (
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}>Resume</h2>
                            <a
                                href={candidate.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.resumeLink}
                            >
                                📄 View Resume
                            </a>
                        </div>
                    )}

                    {/* Interviews Card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Interviews</h2>
                            <Link href={`/interviews?candidate=${candidate.id}`} className={styles.addButton}>
                                + Schedule Interview
                            </Link>
                        </div>
                        {candidate.interviews.length === 0 ? (
                            <p className={styles.emptyState}>No interviews scheduled yet.</p>
                        ) : (
                            <div className={styles.interviewList}>
                                {candidate.interviews.map((interview) => (
                                    <div key={interview.id} className={styles.interviewItem}>
                                        <div className={styles.interviewHeader}>
                                            <span className={styles.interviewType}>
                                                {INTERVIEW_TYPE_LABELS[interview.type]} (Round {interview.round})
                                            </span>
                                            <span className={`${styles.interviewResult} ${getResultClass(interview.result)}`}>
                                                {interview.result}
                                            </span>
                                        </div>
                                        <div className={styles.interviewMeta}>
                                            <span>📅 {formatDateTime(interview.scheduledAt)}</span>
                                            <span>⏱️ {interview.duration} min</span>
                                            <span>👤 {interview.scheduledBy.name}</span>
                                        </div>
                                        {interview.location && (
                                            <div className={styles.interviewLocation}>📍 {interview.location}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    {/* Assigned Recruiter */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Assigned Recruiter</h2>
                        <div className={styles.recruiterInfo}>
                            <div className={styles.recruiterAvatar}>
                                {candidate.recruiter.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className={styles.recruiterName}>{candidate.recruiter.name}</p>
                                <p className={styles.recruiterEmail}>{candidate.recruiter.email}</p>
                                {candidate.recruiter.department && (
                                    <p className={styles.recruiterDept}>{candidate.recruiter.department}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className={styles.card}>
                        <h2 className={styles.cardTitle}>Notes</h2>
                        <div className={styles.addNoteForm}>
                            <textarea
                                className={styles.noteInput}
                                placeholder="Add a note..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows={3}
                            />
                            <button
                                className={styles.addNoteButton}
                                onClick={handleAddNote}
                                disabled={isAddingNote || !newNote.trim()}
                            >
                                {isAddingNote ? 'Adding...' : 'Add Note'}
                            </button>
                        </div>
                        {candidate.notes.length === 0 ? (
                            <p className={styles.emptyState}>No notes yet.</p>
                        ) : (
                            <div className={styles.notesList}>
                                {candidate.notes.map((note) => (
                                    <div key={note.id} className={styles.noteItem}>
                                        <div className={styles.noteHeader}>
                                            <span className={styles.noteAuthor}>{note.author.name}</span>
                                            <span className={styles.noteDate}>{formatDate(note.createdAt)}</span>
                                        </div>
                                        <p className={styles.noteContent}>{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
