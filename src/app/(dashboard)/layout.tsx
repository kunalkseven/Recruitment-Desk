import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar/Sidebar'
import { Header } from '@/components/Header/Header'
import styles from './layout.module.css'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className={styles.layout}>
            <Sidebar />
            <div className={styles.main}>
                <Header />
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    )
}
