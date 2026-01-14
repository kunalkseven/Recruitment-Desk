import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RecruitersClient } from './RecruitersClient'

async function getRecruiters() {
    const recruiters = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    candidates: true,
                    interviews: true,
                },
            },
        },
    })

    return recruiters.map(r => ({
        id: r.id,
        email: r.email,
        name: r.name,
        role: r.role,
        avatar: r.avatar,
        phone: r.phone,
        department: r.department,
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
        _count: r._count,
    }))
}

export default async function RecruitersPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    if (session.user.role !== 'SUPER_USER') {
        redirect('/dashboard')
    }

    const recruiters = await getRecruiters()

    return <RecruitersClient recruiters={recruiters} currentUserId={session.user.id} />
}
