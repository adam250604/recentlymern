import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { toast } from 'react-toastify'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setShowResend(false)
    
    try {
      const ok = await login(email, password)
      if (ok) {
        navigate('/recipes')
      }
    } catch (error) {
      if (error.response?.data?.requiresVerification) {
        setShowResend(true)
        toast.error('Please verify your email before logging in')
      } else {
        toast.error(error.response?.data?.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    try {
      await api.post('/auth/resend-verification', { email })
      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email')
    } finally {
      setResendLoading(false)
    }
  }

  if (isAuthenticated) return <div>Already logged in</div>

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <label>Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Password</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      {showResend && (
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 4 }}>
          <p style={{ margin: '0 0 8px 0', color: '#dc3545' }}>
            Email verification required!
          </p>
          <button 
            onClick={handleResendVerification}
            disabled={resendLoading}
            style={{
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: resendLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>
      )}
      
      <div style={{ marginTop: 8 }}>
        <Link to="/register">Create an account</Link>  <Link to="/reset-password">Forgot password?</Link>
      </div>
    </div>
  )
}
