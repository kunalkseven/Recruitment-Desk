'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InterviewType, InterviewResult } from '@/types'
import styles from './Interviews.module.css'

interface PanelMember {
    id: string
    name: string | null
    email: string | null
    designation: string | null
    userId: string | null
    feedback: string | null
    rating: number | null
    recommendation: InterviewResult
    user: {
        id: string
        name: string
        email: string
    } | null
}

interface Interview {
    id: string
    scheduledAt: string
    duration: number
    type: InterviewType
    round: number
    location: string | null
    notes: string | null
    feedback: string | null
    rating: number | null
    result: InterviewResult
    candidate: {
        id: string
        name: string
        email: string
        position: string | null
    }
    scheduledBy: {
        id: string
        name: string
    }
    panelMembers: PanelMember[]
}

interface Candidate {
    id: string
    name: string
    email: string
    position: string | null
}

interface Recruiter {
    id: string
    name: string
    email: string
    department: string | null
}

interface InterviewsClientProps {
    interviews: Interview[]
    candidates: Candidate[]
    recruiters: Recruiter[]
    currentUserId: string
}

const INTERVIEW_TYPES: { value: InterviewType; label: string; description: string }[] = [
    { value: 'ONLINE_TEST', label: 'Online Test', description: 'Technical assessment or aptitude test' },
    { value: 'L1_ROUND', label: 'L1 Round', description: 'First-level technical interview' },
    { value: 'L2_ROUND', label: 'L2 Round', description: 'Second-level technical interview' },
    { value: 'L3_ROUND', label: 'L3 Round', description: 'Third-level technical interview' },
    { value: 'HR_DISCUSSION', label: 'HR Discussion', description: 'HR round for fitment and offer' },
]

export function InterviewsClient({
    interviews: initialInterviews,
    candidates,
    recruiters,
    currentUserId,
}: InterviewsClientProps) {
    const router = useRouter()
    const [interviews, setInterviews] = useState(initialInterviews)
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'all'>('upcoming')
    const [editingInterview, setEditingInterview] = useState<Interview | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        candidateId: '',
        type: 'ONLINE_TEST' as InterviewType,
        scheduledAt: '',
        duration: 60,
        location: '',
        notes: '',
    })

    const [panelMembers, setPanelMembers] = useState<Array<{
        type: 'internal' | 'external'
        userId?: string
        name?: string
        email?: string
        designation?: string
    }>>([])

    const now = new Date()
    const filteredInterviews = interviews.filter((interview) => {
        const interviewDate = new Date(interview.scheduledAt)
        if (activeTab === 'upcoming') return interviewDate >= now
        if (activeTab === 'past') return interviewDate < now
        return true
    })

    const getTypeStyles = (type: InterviewType) => {
        switch (type) {
            case 'ONLINE_TEST':
                return styles.typeOnlineTest
            case 'L1_ROUND':
                return styles.typeL1
            case 'L2_ROUND':
                return styles.typeL2
            case 'L3_ROUND':
                return styles.typeL3
            case 'HR_DISCUSSION':
                return styles.typeHR
            default:
                return ''
        }
    }

    const getResultStyles = (result: InterviewResult) => {
        switch (result) {
            case 'PASS':
                return 'badge-hired'
            case 'FAIL':
                return 'badge-rejected'
            case 'NO_SHOW':
                return 'badge-onhold'
            default:
                return 'badge-applied'
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'duration' ? parseInt(value, 10) : value,
        }))
    }

    const addPanelMember = (type: 'internal' | 'external') => {
        setPanelMembers((prev) => [
            ...prev,
            type === 'internal'
                ? { type: 'internal', userId: '' }
                : { type: 'external', name: '', email: '', designation: '' },
        ])
    }

    const removePanelMember = (index: number) => {
        setPanelMembers((prev) => prev.filter((_, i) => i !== index))
    }

    const updatePanelMember = (index: number, field: string, value: string) => {
        setPanelMembers((prev) =>
            prev.map((pm, i) => (i === index ? { ...pm, [field]: value } : pm))
        )
    }

    const openEditModal = (interview: Interview) => {
        setEditingInterview(interview)
        setFormData({
            candidateId: interview.candidate.id,
            type: interview.type,
            scheduledAt: new Date(interview.scheduledAt).toISOString().slice(0, 16),
            duration: interview.duration,
            location: interview.location || '',
            notes: interview.notes || '',
        })
        setPanelMembers(
            interview.panelMembers.map((pm) =>
                pm.userId
                    ? { type: 'internal' as const, userId: pm.userId }
                    : { type: 'external' as const, name: pm.name || '', email: pm.email || '', designation: pm.designation || '' }
            )
        )
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingInterview(null)
        setFormData({
            candidateId: '',
            type: 'ONLINE_TEST',
            scheduledAt: '',
            duration: 60,
            location: '',
            notes: '',
        })
        setPanelMembers([])
        setError('')
    }

    // Handle delete interview
    const handleDelete = async (interviewId: string, candidateName: string) => {
        if (!confirm(`Are you sure you want to delete the interview with ${candidateName}? This action cannot be undone.`)) {
            return
        }

        setDeletingId(interviewId)

        try {
            const response = await fetch(`/api/interviews?id=${interviewId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const result = await response.json()
                throw new Error(result.error || 'Failed to delete interview')
            }

            // Remove from local state
            setInterviews((prev) => prev.filter((i) => i.id !== interviewId))
            router.refresh()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete interview')
        } finally {
            setDeletingId(null)
        }
    }

    // Get minimum datetime (now) for date picker
    const getMinDateTime = () => {
        const now = new Date()
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
        return now.toISOString().slice(0, 16)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Client-side validation for past dates
        const scheduledDate = new Date(formData.scheduledAt)
        if (scheduledDate < new Date()) {
            setError('Cannot schedule interview in the past')
            return
        }

        setLoading(true)

        try {
            const isEditing = !!editingInterview
            const url = '/api/interviews'
            const method = isEditing ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(isEditing && { id: editingInterview.id }),
                    ...formData,
                    panelMembers: (formData.type === 'L1_ROUND' || formData.type === 'L2_ROUND' || formData.type === 'L3_ROUND')
                        ? panelMembers
                        : [],
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || (isEditing ? 'Failed to update interview' : 'Failed to schedule interview'))
            }

            closeModal()
            router.refresh()

            // Update interviews list
            if (isEditing) {
                setInterviews((prev) =>
                    prev.map((i) => (i.id === result.interview.id ? result.interview : i))
                )
            } else {
                setInterviews((prev) => [...prev, result.interview])
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : (editingInterview ? 'Failed to update interview' : 'Failed to schedule interview'))
        } finally {
            setLoading(false)
        }
    }

    const showPanelSection = formData.type === 'L1_ROUND' || formData.type === 'L2_ROUND' || formData.type === 'L3_ROUND'

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>📅 Interviews</h1>
                    <p>Schedule and manage candidate interviews</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <span>➕</span> Schedule Interview
                </button>
            </div>

            {/* Interview Round Cards */}
            <div className={styles.roundsGrid}>
                {INTERVIEW_TYPES.map((type) => {
                    const count = interviews.filter((i) => i.type === type.value).length
                    const pending = interviews.filter(
                        (i) => i.type === type.value && i.result === 'PENDING'
                    ).length
                    return (
                        <div key={type.value} className={`${styles.roundCard} ${getTypeStyles(type.value)}`}>
                            <h3>{type.label}</h3>
                            <p>{type.description}</p>
                            <div className={styles.roundStats}>
                                <span>{count} Total</span>
                                <span>{pending} Pending</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'upcoming' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Upcoming ({interviews.filter((i) => new Date(i.scheduledAt) >= now).length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'past' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('past')}
                >
                    Past ({interviews.filter((i) => new Date(i.scheduledAt) < now).length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All ({interviews.length})
                </button>
            </div>

            {/* Interview List */}
            {filteredInterviews.length > 0 ? (
                <div className={styles.interviewList}>
                    {filteredInterviews.map((interview) => (
                        <div key={interview.id} className={styles.interviewCard}>
                            <div className={styles.interviewHeader}>
                                <span className={`${styles.typeBadge} ${getTypeStyles(interview.type)}`}>
                                    {INTERVIEW_TYPES.find((t) => t.value === interview.type)?.label}
                                </span>
                                <span className={`badge ${getResultStyles(interview.result)}`}>
                                    {interview.result}
                                </span>
                            </div>

                            <div className={styles.interviewBody}>
                                <div className={styles.candidateInfo}>
                                    <div className={styles.avatar}>
                                        {interview.candidate.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4>{interview.candidate.name}</h4>
                                        <p>{interview.candidate.position || 'No position'}</p>
                                    </div>
                                </div>

                                <div className={styles.interviewDetails}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailIcon}>🗓️</span>
                                        <span>{formatDate(interview.scheduledAt)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailIcon}>⏱️</span>
                                        <span>{interview.duration} mins</span>
                                    </div>
                                    {interview.location && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailIcon}>📍</span>
                                            <span>{interview.location}</span>
                                        </div>
                                    )}
                                </div>

                                {interview.panelMembers.length > 0 && (
                                    <div className={styles.panelSection}>
                                        <span className={styles.panelLabel}>Panel:</span>
                                        <div className={styles.panelList}>
                                            {interview.panelMembers.map((pm) => (
                                                <span key={pm.id} className={styles.panelMember}>
                                                    {pm.user?.name || pm.name}
                                                    {pm.designation && ` (${pm.designation})`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.interviewFooter}>
                                <span className={styles.scheduledBy}>
                                    Scheduled by {interview.scheduledBy.name}
                                </span>
                                {new Date(interview.scheduledAt) >= now && (
                                    <div className={styles.footerActions}>
                                        <button
                                            onClick={() => openEditModal(interview)}
                                            className="btn btn-sm btn-secondary"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(interview.id, interview.candidate.name)}
                                            className="btn btn-sm btn-danger"
                                            disabled={deletingId === interview.id}
                                        >
                                            {deletingId === interview.id ? 'Deleting...' : '🗑️ Delete'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📅</span>
                    <h3>No {activeTab} interviews</h3>
                    <p>Schedule an interview to get started</p>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        Schedule Interview
                    </button>
                </div>
            )}

            {/* Schedule Interview Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingInterview ? 'Edit Interview' : 'Schedule Interview'}</h2>
                            <button onClick={closeModal} className={styles.modalClose}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && (
                                <div className={styles.error}>
                                    <span>⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label htmlFor="candidateId">Candidate *</label>
                                <select
                                    id="candidateId"
                                    name="candidateId"
                                    value={formData.candidateId}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!!editingInterview}
                                >
                                    <option value="">Select a candidate</option>
                                    {candidates.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} - {c.position || 'No position'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Interview Round *</label>
                                <div className={styles.roundOptions}>
                                    {INTERVIEW_TYPES.map((type) => (
                                        <label
                                            key={type.value}
                                            className={`${styles.roundOption} ${formData.type === type.value ? styles.roundOptionActive : ''
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={type.value}
                                                checked={formData.type === type.value}
                                                onChange={handleInputChange}
                                            />
                                            <span className={styles.roundOptionLabel}>{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="scheduledAt">Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        id="scheduledAt"
                                        name="scheduledAt"
                                        value={formData.scheduledAt}
                                        onChange={handleInputChange}
                                        min={getMinDateTime()}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="duration">Duration (mins)</label>
                                    <select
                                        id="duration"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                    >
                                        <option value={30}>30 mins</option>
                                        <option value={45}>45 mins</option>
                                        <option value={60}>60 mins</option>
                                        <option value={90}>90 mins</option>
                                        <option value={120}>120 mins</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="location">Location / Meeting Link</label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="Zoom link, Google Meet, or office room"
                                />
                            </div>

                            {/* Panel Members Section for L1/L2 */}
                            {showPanelSection && (
                                <div className={styles.panelFormSection}>
                                    <div className={styles.panelFormHeader}>
                                        <h3>👥 Panel Members</h3>
                                        <div className={styles.panelAddButtons}>
                                            <button
                                                type="button"
                                                onClick={() => addPanelMember('internal')}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                + Team Member
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addPanelMember('external')}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                + External
                                            </button>
                                        </div>
                                    </div>

                                    {panelMembers.length === 0 && (
                                        <p className={styles.panelHint}>
                                            Add panel members who will conduct the {formData.type === 'L1_ROUND' ? 'L1' : formData.type === 'L2_ROUND' ? 'L2' : 'L3'} interview
                                        </p>
                                    )}

                                    {panelMembers.map((pm, index) => (
                                        <div key={index} className={styles.panelMemberForm}>
                                            {pm.type === 'internal' ? (
                                                <select
                                                    value={pm.userId || ''}
                                                    onChange={(e) => updatePanelMember(index, 'userId', e.target.value)}
                                                    className={styles.panelSelect}
                                                >
                                                    <option value="">Select team member</option>
                                                    {recruiters
                                                        .filter((r) => r.id !== currentUserId)
                                                        .map((r) => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.name} ({r.department || 'No dept'})
                                                            </option>
                                                        ))}
                                                </select>
                                            ) : (
                                                <div className={styles.externalFields}>
                                                    <input
                                                        type="text"
                                                        placeholder="Name"
                                                        value={pm.name || ''}
                                                        onChange={(e) => updatePanelMember(index, 'name', e.target.value)}
                                                    />
                                                    <input
                                                        type="email"
                                                        placeholder="Email"
                                                        value={pm.email || ''}
                                                        onChange={(e) => updatePanelMember(index, 'email', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Designation"
                                                        value={pm.designation || ''}
                                                        onChange={(e) => updatePanelMember(index, 'designation', e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removePanelMember(index)}
                                                className={styles.removeBtn}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label htmlFor="notes">Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Any special instructions or topics to cover"
                                    rows={3}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading} className="btn btn-primary">
                                    {loading
                                        ? (editingInterview ? 'Updating...' : 'Scheduling...')
                                        : (editingInterview ? 'Update Interview' : 'Schedule Interview')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
