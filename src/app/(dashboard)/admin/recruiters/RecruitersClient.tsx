'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Role } from '@prisma/client'
import styles from './Recruiters.module.css'

interface Recruiter {
    id: string
    email: string
    name: string
    role: Role
    avatar: string | null
    phone: string | null
    department: string | null
    isActive: boolean
    createdAt: string
    _count: {
        candidates: number
        interviews: number
    }
}

interface RecruitersClientProps {
    recruiters: Recruiter[]
    currentUserId: string
}

export function RecruitersClient({ recruiters: initialRecruiters, currentUserId }: RecruitersClientProps) {
    const router = useRouter()
    const [recruiters, setRecruiters] = useState(initialRecruiters)
    const [showModal, setShowModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'RECRUITER' as Role,
        department: '',
        phone: '',
    })

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleEditClick = (recruiter: Recruiter) => {
        setEditingId(recruiter.id)
        setFormData({
            name: recruiter.name,
            email: recruiter.email,
            password: '', // Password not required for edit unless changing
            role: recruiter.role,
            department: recruiter.department || '',
            phone: recruiter.phone || '',
        })
        setShowModal(true)
    }

    const handleDeleteClick = async (recruiterId: string) => {
        if (!confirm('Are you sure you want to delete this recruiter? This action cannot be undone.')) {
            return
        }

        setDeletingId(recruiterId)
        try {
            const response = await fetch(`/api/recruiters/${recruiterId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setRecruiters(prev => prev.filter(r => r.id !== recruiterId))
                router.refresh()
            } else {
                const data = await response.json()
                alert(data.error || 'Failed to delete recruiter')
            }
        } catch (error) {
            console.error('Failed to delete recruiter:', error)
            alert('Failed to delete recruiter')
        } finally {
            setDeletingId(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const url = editingId ? `/api/recruiters/${editingId}` : '/api/recruiters'
            const method = editingId ? 'PUT' : 'POST'

            // For edits, only send password if it's provided
            const body = { ...formData }
            if (editingId && !body.password) {
                delete (body as any).password
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || `Failed to ${editingId ? 'update' : 'create'} recruiter`)
            }

            if (editingId) {
                setRecruiters(prev => prev.map(r => r.id === editingId ? { ...r, ...result.recruiter } : r))
            } else {
                setRecruiters(prev => [result.recruiter, ...prev])
            }

            setShowModal(false)
            setEditingId(null)
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'RECRUITER',
                department: '',
                phone: '',
            })
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : `Failed to ${editingId ? 'update' : 'create'} recruiter`)
        } finally {
            setLoading(false)
        }
    }

    const toggleActive = async (recruiterId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/recruiters/${recruiterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive }),
            })

            if (response.ok) {
                setRecruiters(prev =>
                    prev.map(r =>
                        r.id === recruiterId ? { ...r, isActive: !isActive } : r
                    )
                )
                router.refresh()
            }
        } catch {
            console.error('Failed to toggle recruiter status')
        }
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
                <div>
                    <h1>👔 Recruiters</h1>
                    <p>Manage your recruitment team</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null)
                        setFormData({
                            name: '',
                            email: '',
                            password: '',
                            role: 'RECRUITER',
                            department: '',
                            phone: '',
                        })
                        setShowModal(true)
                    }}
                    className="btn btn-primary"
                >
                    <span>➕</span> Add Recruiter
                </button>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{recruiters.length}</span>
                    <span className={styles.statLabel}>Total Recruiters</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {recruiters.filter(r => r.isActive).length}
                    </span>
                    <span className={styles.statLabel}>Active</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {recruiters.filter(r => r.role === 'SUPER_USER').length}
                    </span>
                    <span className={styles.statLabel}>Admins</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>
                        {recruiters.reduce((sum, r) => sum + r._count.candidates, 0)}
                    </span>
                    <span className={styles.statLabel}>Total Candidates</span>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Recruiter</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Candidates</th>
                            <th>Interviews</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {recruiters.map(recruiter => (
                            <tr key={recruiter.id}>
                                <td>
                                    <div className={styles.recruiterCell}>
                                        <div className={styles.avatar}>
                                            {recruiter.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className={styles.name}>{recruiter.name}</span>
                                            <span className={styles.email}>{recruiter.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${recruiter.role === 'SUPER_USER' ? 'badge-offer' : 'badge-applied'}`}>
                                        {recruiter.role === 'SUPER_USER' ? 'Admin' : 'Recruiter'}
                                    </span>
                                </td>
                                <td>{recruiter.department || '—'}</td>
                                <td>{recruiter._count.candidates}</td>
                                <td>{recruiter._count.interviews}</td>
                                <td>
                                    <span className={`badge ${recruiter.isActive ? 'badge-hired' : 'badge-rejected'}`}>
                                        {recruiter.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>{formatDate(recruiter.createdAt)}</td>
                                <td>
                                    {recruiter.id !== currentUserId && (
                                        <div className={styles.actions}>
                                            <button
                                                onClick={() => handleEditClick(recruiter)}
                                                className={styles.iconButton}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => toggleActive(recruiter.id, recruiter.isActive)}
                                                className={`btn btn-sm ${recruiter.isActive ? 'btn-danger' : 'btn-secondary'}`}
                                            >
                                                {recruiter.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(recruiter.id)}
                                                className={styles.iconButton}
                                                title="Delete"
                                                disabled={deletingId === recruiter.id}
                                            >
                                                {deletingId === recruiter.id ? '...' : '🗑️'}
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Recruiter Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editingId ? 'Edit Recruiter' : 'Add New Recruiter'}</h2>
                            <button onClick={() => setShowModal(false)} className={styles.modalClose}>
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
                                <label htmlFor="name">Full Name *</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email">Email Address *</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@company.com"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="password">
                                    Password {editingId ? '(Leave blank to keep current)' : '*'}
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="••••••••"
                                    required={!editingId}
                                    minLength={6}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="role">Role</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                    >
                                        <option value="RECRUITER">Recruiter</option>
                                        <option value="SUPER_USER">Admin</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="department">Department</label>
                                    <input
                                        id="department"
                                        name="department"
                                        type="text"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        placeholder="Engineering"
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Recruiter')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
