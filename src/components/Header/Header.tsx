'use client'

import { useSession } from 'next-auth/react'
import styles from './Header.module.css'

interface HeaderProps {
    title?: string
}

export function Header({ title }: HeaderProps) {
    const { data: session } = useSession()

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                {title && <h1 className={styles.title}>{title}</h1>}
            </div>

            <div className={styles.right}>
                <div className={styles.search}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search candidates, interviews..."
                        className={styles.searchInput}
                    />
                </div>

                <button className={styles.iconButton} title="Notifications">
                    <span>🔔</span>
                    <span className={styles.badge}>3</span>
                </button>

                <div className={styles.user}>
                    <div className={styles.avatar}>
                        {session?.user?.name ? getInitials(session.user.name) : 'U'}
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{session?.user?.name || 'User'}</span>
                        <span className={styles.userRole}>
                            {session?.user?.role === 'SUPER_USER' ? 'Admin' : 'Recruiter'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    )
}
