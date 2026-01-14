import { prisma } from '@/lib/prisma'
import { DuplicateMatch, Candidate } from '@/types'

interface DuplicateCheckInput {
    email?: string
    phone?: string
    name?: string
    fingerprint?: string
    excludeCandidateId?: string
}

export async function checkForDuplicates(
    input: DuplicateCheckInput
): Promise<DuplicateMatch[]> {
    const matches: DuplicateMatch[] = []

    // Build OR conditions for duplicate check
    const orConditions: any[] = []

    // Check by email (strongest match)
    if (input.email) {
        orConditions.push({ email: input.email.toLowerCase() })
    }

    // Check by phone
    if (input.phone) {
        const normalizedPhone = input.phone.replace(/\D/g, '').slice(-10)
        orConditions.push({
            phone: {
                contains: normalizedPhone,
            },
        })
    }

    // Check by fingerprint
    if (input.fingerprint) {
        orConditions.push({ fingerprint: input.fingerprint })
    }

    if (orConditions.length === 0) {
        return matches
    }

    // Query database
    const candidates = await prisma.candidate.findMany({
        where: {
            OR: orConditions,
            ...(input.excludeCandidateId && {
                NOT: { id: input.excludeCandidateId },
            }),
        },
        include: {
            recruiter: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
    })

    // Calculate match scores
    for (const candidate of candidates) {
        const matchedFields: string[] = []
        let score = 0

        // Email match (highest weight)
        if (input.email && candidate.email.toLowerCase() === input.email.toLowerCase()) {
            matchedFields.push('email')
            score += 50
        }

        // Phone match
        if (input.phone && candidate.phone) {
            const inputPhone = input.phone.replace(/\D/g, '').slice(-10)
            const candidatePhone = candidate.phone.replace(/\D/g, '').slice(-10)
            if (inputPhone === candidatePhone) {
                matchedFields.push('phone')
                score += 30
            }
        }

        // Name match (fuzzy)
        if (input.name && candidate.name) {
            const inputName = input.name.toLowerCase().trim()
            const candidateName = candidate.name.toLowerCase().trim()
            if (inputName === candidateName) {
                matchedFields.push('name')
                score += 20
            } else if (
                inputName.includes(candidateName) ||
                candidateName.includes(inputName)
            ) {
                matchedFields.push('name (partial)')
                score += 10
            }
        }

        if (matchedFields.length > 0) {
            matches.push({
                candidate: candidate as unknown as Candidate,
                matchScore: score,
                matchedFields,
            })
        }
    }

    // Sort by match score (highest first)
    return matches.sort((a, b) => b.matchScore - a.matchScore)
}

export function formatDuplicateAlert(matches: DuplicateMatch[]): string {
    if (matches.length === 0) return ''

    const topMatch = matches[0]
    const recruiterName = topMatch.candidate.recruiter?.name || 'Unknown'

    return `Potential duplicate found! This candidate matches "${topMatch.candidate.name}" (${topMatch.matchedFields.join(', ')}) currently being handled by ${recruiterName}.`
}
