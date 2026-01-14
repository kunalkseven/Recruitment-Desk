'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './Login.module.css'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.branding}>
                    <div className={styles.logo}>RD</div>
                    <h1>Recruitment Desk</h1>
                    <p>Streamline your hiring process with our powerful recruitment management platform.</p>
                </div>
                <div className={styles.features}>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>👥</span>
                        <div>
                            <h3>Candidate Management</h3>
                            <p>Track candidates through every stage of the hiring process</p>
                        </div>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>📋</span>
                        <div>
                            <h3>Visual Pipeline</h3>
                            <p>Kanban-style board to manage your recruitment pipeline</p>
                        </div>
                    </div>
                    <div className={styles.feature}>
                        <span className={styles.featureIcon}>🔔</span>
                        <div>
                            <h3>Duplicate Detection</h3>
                            <p>Automatic alerts when candidates already exist in the system</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <h2>Welcome back</h2>
                        <p>Sign in to your account to continue</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.error}>
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder="you@company.com"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className={styles.options}>
                            <label className={styles.checkbox}>
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <Link href="/forgot-password" className={styles.forgotLink}>
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner spinner-sm" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <p>
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className={styles.link}>
                                Contact your administrator
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
