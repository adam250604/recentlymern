import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { toast } from 'react-toastify'

export default function ConfirmResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/confirm-reset', { token, password })
      toast.success('Password reset successful!')
      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return <div style={{ maxWidth: 420, margin: '2rem auto', color: 'red' }}>Invalid or missing reset token.</div>
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Set New Password</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <label>New Password</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}
