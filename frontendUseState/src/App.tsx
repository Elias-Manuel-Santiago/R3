import { useEffect, useState } from 'react'
import { LoginForm } from './components/LoginForm'
import { EmailVerificationForm } from './components/EmailVerificationForm'
import { PasswordRecoveryForm } from './components/PasswordRecoveryForm'
import { RegisterForm } from './components/RegisterForm'
import { ResetPasswordForm } from './components/ResetPasswordForm'
import { UserCard } from './components/UserCard'
import {
  getCurrentUser,
  login,
  logout,
  register,
  requestPasswordRecovery,
  resendEmailCode,
  resetPassword,
  verifyEmailCode,
} from './services/authApi'
import type { User } from './types/user'
import './App.css'

type View = 'login' | 'register' | 'passwordRecovery'

function App() {
  // Toda la navegación se resuelve con estado, sin usar React Router.
  const [view, setView] = useState<View>('login')
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return window.location.pathname === '/restablecer-contrasena' ? params.get('token') : null
  })

  useEffect(() => {
    // Una cookie válida permite recuperar la sesión al volver a abrir la app.
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsCheckingSession(false))
  }, [])

  async function handleLogin(identifier: string, password: string) {
    const loggedUser = await login(identifier, password)
    setUser(loggedUser.usuario)
    setVerificationExpiresAt(loggedUser.verificationExpiresAt)
    setMessage('')
  }

  async function handleRegister(username: string, email: string, password: string) {
    const registeredUser = await register(username, email, password)
    setUser(registeredUser.usuario)
    setVerificationExpiresAt(registeredUser.verificationExpiresAt)
    setMessage('')
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setUser(null)
      setMessage('Sesión cerrada.')
    }
  }

  if (isCheckingSession) {
    return <main className="page">Comprobando sesión...</main>
  }

  if (resetToken) {
    return (
      <main className="page">
        <section className="auth-box">
          <ResetPasswordForm
            token={resetToken}
            onReset={async (token, password) => {
              await resetPassword(token, password)
              window.history.replaceState({}, '', '/')
              setResetToken(null)
              setUser(null)
              setView('login')
              setMessage('Contraseña restablecida. Inicia sesión nuevamente.')
            }}
          />
        </section>
      </main>
    )
  }

  if (user && !user.email_verified_at) {
    return (
      <main className="page">
        <section className="auth-box">
          <EmailVerificationForm
            email={user.email}
            expiresAt={verificationExpiresAt}
            onVerify={async (code) => setUser(await verifyEmailCode(code))}
            onResend={async () => {
              const response = await resendEmailCode()
              setVerificationExpiresAt(response.expiresAt)
              return response.expiresAt
            }}
          />
        </section>
      </main>
    )
  }

  if (user) {
    return (
      <main className="page">
        <UserCard user={user} onLogout={handleLogout} />
      </main>
    )
  }

  return (
    <main className="page">
      <section className="auth-box" aria-labelledby="title">
        <h1 id="title">Sistema de usuarios</h1>
        {message && <p className="message">{message}</p>}

        {view === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            onShowRegister={() => {
              setMessage('')
              setView('register')
            }}
            onShowPasswordRecovery={() => {
              setMessage('')
              setView('passwordRecovery')
            }}
          />
        ) : view === 'register' ? (
          <RegisterForm
            onRegister={handleRegister}
            onShowLogin={() => {
              setMessage('')
              setView('login')
            }}
          />
        ) : (
          <PasswordRecoveryForm
            onRequest={async (email) => (await requestPasswordRecovery(email)).message}
            onShowLogin={() => {
              setMessage('')
              setView('login')
            }}
          />
        )}
      </section>
    </main>
  )
}

export default App
