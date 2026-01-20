import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only admins can fetch the full list of recruiters for assignment
        // Although arguably recruiters might want to see who else is there, limiting to admin/superuser for now as per request "Admin can assign"
        const isAdmin = session.user.role === 'SUPER_USER'
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const recruiters = await prisma.user.findMany({
            where: {
                role: {
                    in: ['RECRUITER', 'SUPER_USER']
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json({ recruiters })
    } catch (error) {
        console.error('Error fetching recruiters:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recruiters' },
            { status: 500 }
        )
    }
}
