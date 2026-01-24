import 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            role: string
            image?: string | null
            department?: string
            phone?: string
        }
    }

    interface User {
        id: string
        email: string
        name: string
        role: string
        image?: string | null
        department?: string
        phone?: string
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string
        role: string
        department?: string
        phone?: string
    }
}
