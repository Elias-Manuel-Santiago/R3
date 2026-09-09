import { useState } from 'react'

type ResetPasswordFormProps = {
  token: string
  onReset: (token: string, password: string) => Promise<void>
}

/** Permite elegir una contraseña nueva usando el token recibido por email. */
export function ResetPasswordForm({ token, onReset }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsLoading(true)
    try {
      await onReset(token, password)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo restablecer la contraseña.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2>Crea una contraseña nueva</h2>
      <label className="field">
        Nueva contraseña
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      <label className="field">
        Confirmar contraseña
        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
      </label>
      {error && <p className="error">{error}</p>}
      <button disabled={isLoading}>{isLoading ? 'Guardando...' : 'Restablecer contraseña'}</button>
    </form>
  )
}
