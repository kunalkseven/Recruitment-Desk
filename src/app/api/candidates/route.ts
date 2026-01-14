import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateFingerprint } from '@/lib/resumeParser'
import { checkForDuplicates } from '@/lib/duplicateDetection'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const isAdmin = session.user.role === 'SUPER_USER'
        const whereClause: Record<string, unknown> = isAdmin ? {} : { recruiterId: session.user.id }

        if (status && status !== 'all') {
            whereClause.status = status
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { position: { contains: search } },
            ]
        }

        const candidates = await prisma.candidate.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                recruiter: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { interviews: true, notes: true },
                },
            },
        })

        return NextResponse.json({ candidates })
    } catch (error) {
        console.error('Error fetching candidates:', error)
        return NextResponse.json(
            { error: 'Failed to fetch candidates' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string | null
        const position = formData.get('position') as string | null
        const experience = formData.get('experience') as string | null
        const currentCompany = formData.get('currentCompany') as string | null
        const expectedSalary = formData.get('expectedSalary') as string | null
        const skills = formData.get('skills') as string | null
        const source = formData.get('source') as string | null
        const resumeFile = formData.get('resume') as File | null

        if (!name || !email) {
            return NextResponse.json(
                { error: 'Name and email are required' },
                { status: 400 }
            )
        }

        // Generate fingerprint for duplicate detection
        const fingerprint = generateFingerprint({ email, phone: phone || undefined, name })

        // Check for duplicates
        const duplicates = await checkForDuplicates({
            email,
            phone: phone || undefined,
            name,
            fingerprint,
        })

        // Save resume file if provided
        let resumeUrl: string | null = null
        if (resumeFile) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes')
            await mkdir(uploadDir, { recursive: true })

            const filename = `${Date.now()}-${resumeFile.name.replace(/\s+/g, '-')}`
            const filepath = path.join(uploadDir, filename)

            const bytes = await resumeFile.arrayBuffer()
            await writeFile(filepath, Buffer.from(bytes))

            resumeUrl = `/uploads/resumes/${filename}`
        }

        // Create candidate
        const candidate = await prisma.candidate.create({
            data: {
                name,
                email: email.toLowerCase(),
                phone,
                position,
                experience: experience ? parseInt(experience) : null,
                currentCompany,
                expectedSalary,
                skills,
                source,
                resumeUrl,
                fingerprint,
                recruiterId: session.user.id,
                status: 'APPLIED',
            },
            include: {
                recruiter: {
                    select: { id: true, name: true },
                },
            },
        })

        // Log activity
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                action: 'added a new candidate',
                details: candidate.name,
                entityType: 'candidate',
                entityId: candidate.id,
            },
        })

        return NextResponse.json({
            candidate,
            duplicates: duplicates.length > 0 ? duplicates : undefined,
        })
    } catch (error) {
        console.error('Error creating candidate:', error)
        return NextResponse.json(
            { error: 'Failed to create candidate' },
            { status: 500 }
        )
    }
}
