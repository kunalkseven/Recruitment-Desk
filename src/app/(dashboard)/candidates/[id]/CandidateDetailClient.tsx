'use client'

import { useState, useEffect } from 'react'
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
    DOCUMENT_VERIFICATION: 'Document Verification',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
    ON_HOLD: 'On Hold',
}

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
    ONLINE_TEST: 'Online Test',
    L1_ROUND: 'L1 Round',
    L2_ROUND: 'L2 Round',
    L3_ROUND: 'L3 Round',
    HR_DISCUSSION: 'HR Discussion',
}

export function CandidateDetailClient({ candidate, currentUserId, isAdmin }: Props) {
    const router = useRouter()
    const [newNote, setNewNote] = useState('')
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isAssigning, setIsAssigning] = useState(false)
    const [recruiters, setRecruiters] = useState<Array<{ id: string; name: string }>>([])
    const [selectedRecruiter, setSelectedRecruiter] = useState(candidate.recruiter.id)

    const [editForm, setEditForm] = useState({
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || '',
        position: candidate.position || '',
        experience: candidate.experience?.toString() || '',
        currentCompany: candidate.currentCompany || '',
        expectedSalary: candidate.expectedSalary || '',
    })

    // Fetch recruiters if admin
    useEffect(() => {
        if (isAdmin) {
            fetch('/api/users/recruiters')
                .then(res => res.json())
                .then(data => {
                    if (data.recruiters) setRecruiters(data.recruiters)
                })
                .catch(err => console.error('Failed to fetch recruiters:', err))
        }
    }, [isAdmin])

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
            DOCUMENT_VERIFICATION: styles.statusDocVerification,
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
                method: 'PUT',
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

    const handleReassign = async () => {
        if (selectedRecruiter === candidate.recruiter.id) {
            setIsAssigning(false)
            return
        }

        try {
            // Reusing the PUT endpoint, but we need to ensure the backend supports updating recruiterId
            // The existing backend PUT updates many fields but not recruiterId. I will need to update the backend too.
            // Wait, looking at previous backend code... 
            // The PUT code (Step 3) ONLY updates details, NOT recruiterId.
            // I should use a specific call or update the PUT to accept recruiterId?
            // Let's assume I will update the backend to accept 'recruiterId' in PUT.

            const response = await fetch(`/api/candidates/${candidate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recruiterId: selectedRecruiter }),
            })

            if (response.ok) {
                setIsAssigning(false)
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to reassign candidate:', error)
        }
    }

    const handleUpdateCandidate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch(`/api/candidates/${candidate.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            })

            if (response.ok) {
                setIsEditing(false)
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to update candidate:', error)
        }
    }

    const handleDeleteCandidate = async () => {
        if (!confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
            return
        }

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/candidates/${candidate.id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                router.push('/candidates')
                router.refresh()
            }
        } catch (error) {
            console.error('Failed to delete candidate:', error)
            setIsDeleting(false)
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
                    <button
                        onClick={() => setIsEditing(true)}
                        className={styles.editButton}
                        disabled={isUpdatingStatus || isDeleting}
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleDeleteCandidate}
                        className={styles.deleteButton}
                        disabled={isUpdatingStatus || isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
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

            {/* Edit Modal */}
            {isEditing && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Candidate</h2>
                            <button
                                onClick={() => setIsEditing(false)}
                                className={styles.modalClose}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCandidate} className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone</label>
                                <input
                                    type="text"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Position</label>
                                <input
                                    type="text"
                                    value={editForm.position}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Experience (Years)</label>
                                <input
                                    type="number"
                                    value={editForm.experience}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, experience: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Current Company</label>
                                <input
                                    type="text"
                                    value={editForm.currentCompany}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, currentCompany: e.target.value }))}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Expected Salary</label>
                                <input
                                    type="text"
                                    value={editForm.expectedSalary}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, expectedSalary: e.target.value }))}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelButton}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.saveButton}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                            <div className={styles.resumeActions}>
                                <a
                                    href={candidate.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.resumeLink}
                                >
                                    📄 Preview Resume
                                </a>
                                <a
                                    href={candidate.resumeUrl}
                                    download
                                    className={styles.resumeDownload}
                                >
                                    ⬇️ Download
                                </a>
                            </div>
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
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Assigned Recruiter</h2>
                            {isAdmin && !isAssigning && (
                                <button
                                    onClick={() => setIsAssigning(true)}
                                    className={styles.changeButton}
                                >
                                    Change
                                </button>
                            )}
                        </div>

                        {isAssigning ? (
                            <div className={styles.reassignForm}>
                                <select
                                    value={selectedRecruiter}
                                    onChange={(e) => setSelectedRecruiter(e.target.value)}
                                    className={styles.recruiterSelect}
                                >
                                    {recruiters.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                                <div className={styles.reassignActions}>
                                    <button
                                        onClick={() => setIsAssigning(false)}
                                        className={styles.cancelSmallButton}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReassign}
                                        className={styles.saveSmallButton}
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
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
                        )}
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
