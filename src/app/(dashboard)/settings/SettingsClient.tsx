'use client'

import { useTheme } from 'next-themes'
import { User } from 'next-auth'
import styles from './Settings.module.css'
import { useEffect, useState } from 'react'

interface SettingsClientProps {
    user: User & { department?: string; phone?: string }
}

export default function SettingsClient({ user }: SettingsClientProps) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [name, setName] = useState(user.name || '')
    const [department, setDepartment] = useState(user.department || '')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSave = async () => {
        setSaving(true)
        setMessage(null)

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, department }),
            })

            if (!response.ok) {
                throw new Error('Failed to save')
            }

            setMessage({ type: 'success', text: 'Profile updated successfully!' })
        } catch {
            setMessage({ type: 'error', text: 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setName(user.name || '')
        setDepartment(user.department || '')
        setMessage(null)
    }

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

                {message && (
                    <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
                        {message.text}
                    </div>
                )}

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
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Engineering"
                        />
                    </div>

                    <div className={`${styles.fullWidth} ${styles.actions}`}>
                        <button type="button" className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
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
