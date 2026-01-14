import { ParsedResume } from '@/types'

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Phone regex patterns (handles multiple formats)
const PHONE_REGEX = /(?:\+?(\d{1,3}))?[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g

// Common skills to detect
const COMMON_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP',
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git',
    'HTML', 'CSS', 'Sass', 'Tailwind', 'Bootstrap',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'Agile', 'Scrum', 'Jira', 'Confluence',
    'REST API', 'Microservices', 'CI/CD', 'DevOps',
    'Linux', 'Unix', 'Windows', 'macOS',
    'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator',
    'Communication', 'Leadership', 'Problem Solving', 'Team Management',
]

export function extractEmail(text: string): string | undefined {
    const matches = text.match(EMAIL_REGEX)
    return matches?.[0]?.toLowerCase()
}

export function extractPhone(text: string): string | undefined {
    const matches = text.match(PHONE_REGEX)
    if (matches) {
        // Clean up the phone number
        const phone = matches[0].replace(/[^\d+]/g, '')
        if (phone.length >= 10) {
            return phone
        }
    }
    return undefined
}

export function extractName(text: string): string | undefined {
    // Get the first few lines which usually contain the name
    const lines = text.split('\n').filter(line => line.trim().length > 0)

    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim()

        // Skip lines that look like headers or contain email/phone
        if (line.length > 50) continue
        if (EMAIL_REGEX.test(line)) continue
        if (PHONE_REGEX.test(line)) continue
        if (/resume|curriculum vitae|cv|profile/i.test(line)) continue

        // Check if it looks like a name (2-4 words, mostly letters)
        const words = line.split(/\s+/)
        if (words.length >= 2 && words.length <= 4) {
            const isName = words.every(word => /^[A-Za-z.-]+$/.test(word))
            if (isName) {
                return line
            }
        }
    }

    return undefined
}

export function extractSkills(text: string): string[] {
    const foundSkills: string[] = []
    const lowerText = text.toLowerCase()

    for (const skill of COMMON_SKILLS) {
        if (lowerText.includes(skill.toLowerCase())) {
            foundSkills.push(skill)
        }
    }

    return [...new Set(foundSkills)]
}

export function extractExperience(text: string): number | undefined {
    // Look for patterns like "X years of experience" or "X+ years"
    const patterns = [
        /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i,
        /experience[:\s]*(\d+)\s*(?:years?|yrs?)/i,
        /(\d+)\s*(?:years?|yrs?)\s*(?:in\s+)?(?:software|development|engineering)/i,
    ]

    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
            return parseInt(match[1], 10)
        }
    }

    return undefined
}

export function parseResumeText(text: string): ParsedResume {
    return {
        name: extractName(text),
        email: extractEmail(text),
        phone: extractPhone(text),
        skills: extractSkills(text),
        experience: extractExperience(text),
    }
}

export function generateFingerprint(data: {
    email?: string
    phone?: string
    name?: string
}): string {
    // Create a normalized fingerprint for duplicate detection
    const parts: string[] = []

    if (data.email) {
        parts.push(`email:${data.email.toLowerCase().trim()}`)
    }

    if (data.phone) {
        // Normalize phone number (keep only digits)
        const normalizedPhone = data.phone.replace(/\D/g, '').slice(-10)
        if (normalizedPhone.length >= 10) {
            parts.push(`phone:${normalizedPhone}`)
        }
    }

    if (data.name) {
        // Normalize name (lowercase, remove extra spaces)
        const normalizedName = data.name.toLowerCase().trim().replace(/\s+/g, ' ')
        parts.push(`name:${normalizedName}`)
    }

    return parts.join('|')
}
