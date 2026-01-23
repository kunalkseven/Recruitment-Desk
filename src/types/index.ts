import { Role, CandidateStatus as PrismaCandidateStatus, InterviewType as PrismaInterviewType, InterviewResult } from '@prisma/client'

export type { Role, InterviewResult }

export type CandidateStatus = PrismaCandidateStatus | 'DOCUMENT_VERIFICATION'
export type InterviewType = PrismaInterviewType | 'L3_ROUND'

export interface User {
    id: string
    email: string
    name: string
    role: Role
    avatar?: string | null
    phone?: string | null
    department?: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export interface Candidate {
    id: string
    email: string
    name: string
    phone?: string | null
    position?: string | null
    experience?: number | null
    currentCompany?: string | null
    expectedSalary?: string | null
    resumeUrl?: string | null
    resumeText?: string | null
    skills?: string | null
    status: CandidateStatus
    source?: string | null
    fingerprint?: string | null
    recruiterId: string
    recruiter?: User
    interviews?: Interview[]
    notes?: Note[]
    createdAt: Date
    updatedAt: Date
}

export interface Interview {
    id: string
    candidateId: string
    candidate?: Candidate
    scheduledById: string
    scheduledBy?: User
    scheduledAt: Date
    type: InterviewType
    round: number
    notes?: string | null
    feedback?: string | null
    rating?: number | null
    result: InterviewResult
    createdAt: Date
    updatedAt: Date
}

export interface Note {
    id: string
    content: string
    candidateId: string
    candidate?: Candidate
    authorId: string
    author?: User
    createdAt: Date
    updatedAt: Date
}

export interface Activity {
    id: string
    action: string
    details?: string | null
    entityType?: string | null
    entityId?: string | null
    userId: string
    user?: User
    createdAt: Date
}

export interface DuplicateMatch {
    candidate: Candidate
    matchScore: number
    matchedFields: string[]
}

export interface ParsedResume {
    name?: string
    email?: string
    phone?: string
    skills?: string[]
    experience?: number
    currentCompany?: string
}

export interface DashboardStats {
    totalCandidates: number
    interviewsToday: number
    offersMade: number
    hiredThisMonth: number
    pipelineByStatus: Record<CandidateStatus, number>
}

export const PIPELINE_STAGES: { status: CandidateStatus; label: string; color: string }[] = [
    { status: 'APPLIED', label: 'Applied', color: '#6366f1' },
    { status: 'SCREENING', label: 'Screening', color: '#8b5cf6' },
    { status: 'INTERVIEW', label: 'Interview', color: '#a855f7' },
    { status: 'OFFER', label: 'Offer', color: '#06b6d4' },
    { status: 'DOCUMENT_VERIFICATION', label: 'Document Verification', color: '#f59e0b' },
    { status: 'HIRED', label: 'Hired', color: '#10b981' },
    { status: 'REJECTED', label: 'Rejected', color: '#ef4444' },
    { status: 'ON_HOLD', label: 'On Hold', color: '#f59e0b' },
]
