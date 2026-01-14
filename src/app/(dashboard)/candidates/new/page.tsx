'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './NewCandidate.module.css'

interface ParsedData {
    name?: string
    email?: string
    phone?: string
    skills?: string[]
    experience?: number
}

interface DuplicateMatch {
    candidate: {
        id: string
        name: string
        email: string
        status: string
        recruiter?: {
            name: string
        }
    }
    matchScore: number
    matchedFields: string[]
}

export default function NewCandidatePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [parsing, setParsing] = useState(false)
    const [error, setError] = useState('')
    const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
    const [showDuplicateModal, setShowDuplicateModal] = useState(false)
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        position: '',
        experience: '',
        currentCompany: '',
        expectedSalary: '',
        skills: '',
        source: '',
    })

    const handleFileUpload = useCallback(async (file: File) => {
        setResumeFile(file)
        setParsing(true)
        setError('')

        try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)

            const response = await fetch('/api/upload/resume', {
                method: 'POST',
                body: formDataUpload,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to parse resume')
            }

            // Fill form with parsed data
            const parsed: ParsedData = result.parsed
            setFormData((prev) => ({
                ...prev,
                name: parsed.name || prev.name,
                email: parsed.email || prev.email,
                phone: parsed.phone || prev.phone,
                skills: parsed.skills?.join(', ') || prev.skills,
                experience: parsed.experience?.toString() || prev.experience,
            }))

            // Check for duplicates
            if (result.duplicates && result.duplicates.length > 0) {
                setDuplicates(result.duplicates)
                setShowDuplicateModal(true)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse resume')
        } finally {
            setParsing(false)
        }
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file && (file.type === 'application/pdf' ||
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                handleFileUpload(file)
            } else {
                setError('Please upload a PDF or DOCX file')
            }
        },
        [handleFileUpload]
    )

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileUpload(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const submitData = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                submitData.append(key, value)
            })
            if (resumeFile) {
                submitData.append('resume', resumeFile)
            }

            const response = await fetch('/api/candidates', {
                method: 'POST',
                body: submitData,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create candidate')
            }

            router.push(`/candidates/${result.candidate.id}`)
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create candidate')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    ← Back
                </button>
                <h1>Add New Candidate</h1>
            </div>

            <div className={styles.content}>
                {/* Resume Upload Section */}
                <div className={styles.uploadSection}>
                    <h2>📄 Upload Resume</h2>
                    <p>Upload a resume to auto-fill candidate information</p>

                    <div
                        className={`${styles.dropzone} ${parsing ? styles.parsing : ''}`}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        {parsing ? (
                            <div className={styles.parsingState}>
                                <div className="spinner" />
                                <span>Parsing resume...</span>
                            </div>
                        ) : resumeFile ? (
                            <div className={styles.uploadedState}>
                                <span className={styles.fileIcon}>📄</span>
                                <span className={styles.fileName}>{resumeFile.name}</span>
                                <button
                                    onClick={() => setResumeFile(null)}
                                    className={styles.removeBtn}
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className={styles.uploadIcon}>📤</span>
                                <span className={styles.uploadText}>
                                    Drag and drop a resume here, or{' '}
                                    <label className={styles.browseLabel}>
                                        browse
                                        <input
                                            type="file"
                                            accept=".pdf,.docx"
                                            onChange={handleFileSelect}
                                            className={styles.fileInput}
                                        />
                                    </label>
                                </span>
                                <span className={styles.uploadHint}>Supports PDF and DOCX</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Candidate Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <h2>👤 Candidate Details</h2>

                    {error && (
                        <div className={styles.error}>
                            <span>⚠️</span>
                            {error}
                        </div>
                    )}

                    <div className={styles.formGrid}>
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
                                placeholder="john@example.com"
                                required
                            />
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

                        <div className={styles.formGroup}>
                            <label htmlFor="position">Position</label>
                            <input
                                id="position"
                                name="position"
                                type="text"
                                value={formData.position}
                                onChange={handleInputChange}
                                placeholder="Software Engineer"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="experience">Years of Experience</label>
                            <input
                                id="experience"
                                name="experience"
                                type="number"
                                min="0"
                                max="50"
                                value={formData.experience}
                                onChange={handleInputChange}
                                placeholder="5"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="currentCompany">Current Company</label>
                            <input
                                id="currentCompany"
                                name="currentCompany"
                                type="text"
                                value={formData.currentCompany}
                                onChange={handleInputChange}
                                placeholder="Google"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="expectedSalary">Expected Salary</label>
                            <input
                                id="expectedSalary"
                                name="expectedSalary"
                                type="text"
                                value={formData.expectedSalary}
                                onChange={handleInputChange}
                                placeholder="$150,000"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="source">Source</label>
                            <select
                                id="source"
                                name="source"
                                value={formData.source}
                                onChange={handleInputChange}
                            >
                                <option value="">Select source</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Indeed">Indeed</option>
                                <option value="Naukri">Naukri</option>
                                <option value="Referral">Referral</option>
                                <option value="Company Website">Company Website</option>
                                <option value="Job Fair">Job Fair</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="skills">Skills</label>
                        <textarea
                            id="skills"
                            name="skills"
                            value={formData.skills}
                            onChange={handleInputChange}
                            placeholder="JavaScript, React, Node.js, Python..."
                            rows={3}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner spinner-sm" />
                                    Creating...
                                </>
                            ) : (
                                'Create Candidate'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Duplicate Modal */}
            {showDuplicateModal && duplicates.length > 0 && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>⚠️ Potential Duplicate Found</h2>
                            <button
                                onClick={() => setShowDuplicateModal(false)}
                                className={styles.modalClose}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <p>
                                We found candidates that may match the resume you uploaded.
                                Please review before proceeding.
                            </p>
                            <div className={styles.duplicateList}>
                                {duplicates.map((match) => (
                                    <div key={match.candidate.id} className={styles.duplicateItem}>
                                        <div className={styles.duplicateInfo}>
                                            <span className={styles.duplicateName}>
                                                {match.candidate.name}
                                            </span>
                                            <span className={styles.duplicateEmail}>
                                                {match.candidate.email}
                                            </span>
                                            <span className={styles.duplicateRecruiter}>
                                                Handled by: {match.candidate.recruiter?.name || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className={styles.duplicateMeta}>
                                            <span className={`badge badge-${match.candidate.status.toLowerCase()}`}>
                                                {match.candidate.status}
                                            </span>
                                            <span className={styles.matchScore}>
                                                {match.matchScore}% match
                                            </span>
                                            <span className={styles.matchedFields}>
                                                Matched: {match.matchedFields.join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => {
                                    setShowDuplicateModal(false)
                                    if (duplicates[0]) {
                                        router.push(`/candidates/${duplicates[0].candidate.id}`)
                                    }
                                }}
                                className="btn btn-secondary"
                            >
                                View Existing Candidate
                            </button>
                            <button
                                onClick={() => setShowDuplicateModal(false)}
                                className="btn btn-primary"
                            >
                                Create Anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
