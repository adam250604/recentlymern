import { useState } from 'react'
import api from '../api/axios'
import { toast } from 'react-toastify'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email })
      toast.success('If the email exists, a reset link has been sent')
    } catch {
      toast.error('Failed to request reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Password Reset</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <label>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}
