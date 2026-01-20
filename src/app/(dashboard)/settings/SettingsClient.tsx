'use client'

import { useTheme } from 'next-themes'
import { User } from 'next-auth'
import styles from './Settings.module.css'
import { useEffect, useState } from 'react'

interface SettingsClientProps {
    user: User
}

export default function SettingsClient({ user }: SettingsClientProps) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>Manage your account settings and preferences</p>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Profile Information</h2>
                    <p className={styles.sectionDescription}>Update your photo and personal details here</p>
                </div>

                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {user.image ? (
                            <img src={user.image} alt={user.name || 'User'} />
                        ) : (
                            <span>{(user.name?.[0] || 'U').toUpperCase()}</span>
                        )}
                    </div>
                    <div className={styles.avatarActions}>
                        <button className="btn btn-secondary btn-sm">Change Photo</button>
                        <span className={styles.avatarHelp}>
                            JPG, GIF or PNG. 1MB max.
                        </span>
                    </div>
                </div>

                <form className={styles.formGrid} onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            defaultValue={user.name || ''}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            defaultValue={user.email || ''}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <input
                            type="text"
                            className="form-input"
                            defaultValue={user.role || 'User'}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Department</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Engineering"
                        />
                    </div>

                    <div className={`${styles.fullWidth} ${styles.actions}`}>
                        <button type="button" className="btn btn-ghost">Cancel</button>
                        <button type="button" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Preferences</h2>
                    <p className={styles.sectionDescription}>Customize your dashboard experience</p>
                </div>

                <div className={styles.formGrid}>
                    <div className="form-group">
                        <label className="form-label">Theme</label>
                        <select
                            className="form-input"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                        >
                            <option value="system">System Preference</option>
                            <option value="dark">Dark Mode</option>
                            <option value="light">Light Mode</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Language</label>
                        <select className="form-input" defaultValue="en">
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    )
}
