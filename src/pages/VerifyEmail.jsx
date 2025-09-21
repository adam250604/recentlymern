import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { toast } from 'react-toastify'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      if (!token) {
        setMessage('No verification token provided')
        setLoading(false)
        return
      }

      try {
        const { data } = await api.post('/auth/verify-email', { token })
        setMessage(data.message)
        toast.success('Email verified successfully!')
        setTimeout(() => navigate('/login'), 2000)
      } catch (error) {
        setMessage(error.response?.data?.message || 'Verification failed')
        toast.error('Email verification failed')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Verifying your email...</h2>
        <div>Please wait while we verify your email address.</div>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 500, margin: '0 auto' }}>
      <h2>Email Verification</h2>
      <div style={{ 
        padding: '1rem', 
        backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
        color: message.includes('successfully') ? '#155724' : '#721c24',
        borderRadius: '4px',
        margin: '1rem 0'
      }}>
        {message}
      </div>
      <button 
        onClick={() => navigate('/login')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Go to Login
      </button>
    </div>
  )
}
