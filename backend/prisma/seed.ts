import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'testadmin@yopmail.com'
    console.log(`Seeding data for ${email}...`)

    // 1. Create or Update User
    const hashedPassword = await bcrypt.hash('password123', 10)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Test Admin',
            password: hashedPassword,
            role: 'SUPER_USER',
            department: 'Engineering',
            phone: '+1234567890',
        },
    })

    console.log(`User created: ${user.id}`)

    // 2. Clear existing demo data (optional, but good for idempotency if we tracked it)
    // For now, we just add new data or let it be. To avoid duplicates, we can check count.
    const candidateCount = await prisma.candidate.count({ where: { recruiterId: user.id } })
    if (candidateCount > 0) {
        console.log('Candidates already exist, skipping candidate creation.')
    } else {
        // 3. Create Candidates
        const candidatesData = [
            { name: 'Sarah Jones', email: 'sarah.j@example.com', position: 'Senior Frontend Dev', status: 'INTERVIEW', experience: 5 },
            { name: 'Michael Chen', email: 'm.chen@example.com', position: 'Backend Engineer', status: 'OFFER', experience: 8 },
            { name: 'Jessica Wu', email: 'jess.wu@example.com', position: 'Product Designer', status: 'APPLIED', experience: 3 },
            { name: 'David Miller', email: 'd.miller@example.com', position: 'DevOps Engineer', status: 'SCREENING', experience: 6 },
            { name: 'Emily Davis', email: 'emily.d@example.com', position: 'Frontend Dev', status: 'REJECTED', experience: 2 },
        ] as const;

        for (const cand of candidatesData) {
            await prisma.candidate.create({
                data: {
                    ...cand,
                    recruiterId: user.id,
                    source: 'LinkedIn',
                    notes: {
                        create: {
                            content: 'Strong profile, good communication skills.',
                            authorId: user.id
                        }
                    }
                }
            })
        }
        console.log(`Created ${candidatesData.length} candidates`)
    }

    // 4. Create Interviews (linked to the first candidate for demo)
    const candidate = await prisma.candidate.findFirst({ where: { email: 'sarah.j@example.com' } })
    if (candidate) {
        // Check if interview exists
        const interviewCount = await prisma.interview.count({ where: { candidateId: candidate.id } })
        if (interviewCount === 0) {
            await prisma.interview.create({
                data: {
                    candidateId: candidate.id,
                    scheduledById: user.id,
                    scheduledAt: new Date(new Date().setHours(14, 0, 0, 0)), // Today 2 PM
                    type: 'L1_ROUND',
                    duration: 60,
                    location: 'Google Meet',
                }
            })
            console.log('Created today\'s interview')
        }
    }

    // 5. Create Recent Activity
    await prisma.activity.createMany({
        data: [
            { action: 'Created new candidate', entityType: 'candidate', details: 'Sarah Jones', userId: user.id },
            { action: 'Scheduled interview', entityType: 'interview', details: 'L1 Round with Sarah Jones', userId: user.id },
            { action: 'Sent offer', entityType: 'candidate', details: 'Michael Chen', userId: user.id },
        ]
    })
    console.log('Created activities')

    console.log('Seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
