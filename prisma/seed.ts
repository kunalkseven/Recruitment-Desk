import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Create super user
    const superUserPassword = await bcrypt.hash('admin123', 10)
    const superUser = await prisma.user.upsert({
        where: { email: 'admin@recruitmentdesk.com' },
        update: {},
        create: {
            email: 'admin@recruitmentdesk.com',
            name: 'Admin User',
            password: superUserPassword,
            role: 'SUPER_USER',
            department: 'Human Resources',
            phone: '+1 (555) 000-0001',
        },
    })
    console.log('✅ Created super user:', superUser.email)

    // Create regular recruiters
    const recruiterPassword = await bcrypt.hash('recruiter123', 10)

    const recruiter1 = await prisma.user.upsert({
        where: { email: 'john@recruitmentdesk.com' },
        update: {},
        create: {
            email: 'john@recruitmentdesk.com',
            name: 'John Smith',
            password: recruiterPassword,
            role: 'RECRUITER',
            department: 'Engineering',
            phone: '+1 (555) 000-0002',
        },
    })
    console.log('✅ Created recruiter:', recruiter1.email)

    const recruiter2 = await prisma.user.upsert({
        where: { email: 'sarah@recruitmentdesk.com' },
        update: {},
        create: {
            email: 'sarah@recruitmentdesk.com',
            name: 'Sarah Johnson',
            password: recruiterPassword,
            role: 'RECRUITER',
            department: 'Sales',
            phone: '+1 (555) 000-0003',
        },
    })
    console.log('✅ Created recruiter:', recruiter2.email)

    // Create sample candidates
    const candidates = [
        {
            name: 'Alice Williams',
            email: 'alice.williams@email.com',
            phone: '+1 (555) 111-0001',
            position: 'Senior Frontend Developer',
            experience: 5,
            currentCompany: 'Tech Corp',
            expectedSalary: '$150,000',
            skills: 'React, TypeScript, Next.js, CSS, GraphQL',
            status: 'INTERVIEW' as const,
            source: 'LinkedIn',
            recruiterId: recruiter1.id,
        },
        {
            name: 'Bob Martinez',
            email: 'bob.martinez@email.com',
            phone: '+1 (555) 111-0002',
            position: 'Backend Engineer',
            experience: 3,
            currentCompany: 'Startup Inc',
            expectedSalary: '$120,000',
            skills: 'Node.js, Python, PostgreSQL, Docker, AWS',
            status: 'SCREENING' as const,
            source: 'Indeed',
            recruiterId: recruiter1.id,
        },
        {
            name: 'Carol Chen',
            email: 'carol.chen@email.com',
            phone: '+1 (555) 111-0003',
            position: 'Full Stack Developer',
            experience: 4,
            currentCompany: 'Digital Agency',
            expectedSalary: '$135,000',
            skills: 'React, Node.js, MongoDB, TypeScript',
            status: 'OFFER' as const,
            source: 'Referral',
            recruiterId: recruiter2.id,
        },
        {
            name: 'David Park',
            email: 'david.park@email.com',
            phone: '+1 (555) 111-0004',
            position: 'DevOps Engineer',
            experience: 6,
            currentCompany: 'Cloud Systems',
            expectedSalary: '$160,000',
            skills: 'Kubernetes, Terraform, AWS, CI/CD, Linux',
            status: 'APPLIED' as const,
            source: 'Naukri',
            recruiterId: recruiter1.id,
        },
        {
            name: 'Emily Davis',
            email: 'emily.davis@email.com',
            phone: '+1 (555) 111-0005',
            position: 'Data Scientist',
            experience: 2,
            currentCompany: 'Analytics Co',
            expectedSalary: '$110,000',
            skills: 'Python, Machine Learning, TensorFlow, SQL',
            status: 'HIRED' as const,
            source: 'Company Website',
            recruiterId: recruiter2.id,
        },
        {
            name: 'Frank Thompson',
            email: 'frank.thompson@email.com',
            phone: '+1 (555) 111-0006',
            position: 'Product Manager',
            experience: 7,
            currentCompany: 'Product Labs',
            expectedSalary: '$180,000',
            skills: 'Agile, Scrum, Jira, Product Strategy',
            status: 'INTERVIEW' as const,
            source: 'LinkedIn',
            recruiterId: superUser.id,
        },
        {
            name: 'Gina Rodriguez',
            email: 'gina.rodriguez@email.com',
            phone: '+1 (555) 111-0007',
            position: 'HR Manager',
            experience: 8,
            currentCompany: 'People First',
            expectedSalary: '$130,000',
            skills: 'Employee Relations, Recruitment, HRIS',
            status: 'DOCUMENT_VERIFICATION' as any,
            source: 'Indeed',
            recruiterId: recruiter2.id,
        },
    ]

    for (const candidateData of candidates) {
        const candidate = await prisma.candidate.create({
            data: candidateData,
        })
        console.log('✅ Created candidate:', candidate.name)
    }

    // Create some activities
    await prisma.activity.createMany({
        data: [
            {
                userId: superUser.id,
                action: 'added a new candidate',
                details: 'Frank Thompson',
                entityType: 'candidate',
            },
            {
                userId: recruiter1.id,
                action: 'moved candidate from SCREENING to INTERVIEW',
                details: 'Alice Williams',
                entityType: 'candidate',
            },
            {
                userId: recruiter2.id,
                action: 'extended offer to candidate',
                details: 'Carol Chen',
                entityType: 'candidate',
            },
            {
                userId: recruiter2.id,
                action: 'moved candidate to DOCUMENT_VERIFICATION',
                details: 'Carol Chen',
                entityType: 'candidate',
            },
            {
                userId: recruiter2.id,
                action: 'hired candidate',
                details: 'Emily Davis',
                entityType: 'candidate',
            },
        ],
    })
    console.log('✅ Created sample activities')

    console.log('🎉 Seed completed successfully!')
    console.log('')
    console.log('📝 Login credentials:')
    console.log('   Super User: admin@recruitmentdesk.com / admin123')
    console.log('   Recruiter 1: john@recruitmentdesk.com / recruiter123')
    console.log('   Recruiter 2: sarah@recruitmentdesk.com / recruiter123')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
