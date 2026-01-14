'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import styles from './Sidebar.module.css'

const menuItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/candidates', icon: '👥', label: 'Candidates' },
    { href: '/pipeline', icon: '📋', label: 'Pipeline' },
    { href: '/interviews', icon: '📅', label: 'Interviews' },
]

const adminItems = [
    { href: '/admin/recruiters', icon: '👔', label: 'Recruiters' },
    { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const isSuperUser = session?.user?.role === 'SUPER_USER'

    const handleSignOut = () => {
        signOut({ callbackUrl: '/login' })
    }

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>RD</div>
                <span className={styles.logoText}>Recruitment Desk</span>
            </div>

            <nav className={styles.nav}>
                <div className={styles.navSection}>
                    <span className={styles.navSectionTitle}>Main Menu</span>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    ))}
                </div>

                {isSuperUser && (
                    <div className={styles.navSection}>
                        <span className={styles.navSectionTitle}>Administration</span>
                        {adminItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            <div className={styles.footer}>
                <Link href="/settings" className={styles.navItem}>
                    <span className={styles.navIcon}>⚙️</span>
                    <span className={styles.navLabel}>Settings</span>
                </Link>
                <button onClick={handleSignOut} className={styles.navItem}>
                    <span className={styles.navIcon}>🚪</span>
                    <span className={styles.navLabel}>Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
