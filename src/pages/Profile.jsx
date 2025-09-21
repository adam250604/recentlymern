import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { toast } from 'react-toastify'
import { useParams, useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, logout } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const viewingOwn = !id || id === user?.id
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [loading, setLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [profileUser, setProfileUser] = useState(null)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (viewingOwn) {
      setProfileUser(user)
      setForm({ name: user?.name || '', email: user?.email || '' })
    } else {
      api.get(`/users/${id}`).then(({ data }) => {
        setProfileUser(data)
        setIsFollowing(data.isFollowing)
      })
    }
  }, [id, user])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/users/me', form)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const onPasswordReset = async () => {
    try {
      await api.post('/auth/reset-password', { email: form.email })
      toast.success('Password reset email sent')
    } catch {
      toast.error('Failed to request reset')
    }
  }

  const handleFollow = async () => {
    try {
      await api.post(`/users/${id}/follow`)
      setIsFollowing(true)
      toast.success('Followed user')
    } catch {
      toast.error('Failed to follow user')
    }
  }
  const handleUnfollow = async () => {
    try {
      await api.delete(`/users/${id}/follow`)
      setIsFollowing(false)
      toast.success('Unfollowed user')
    } catch {
      toast.error('Failed to unfollow user')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmMessage = `Are you sure you want to delete your account? This action cannot be undone and will permanently delete:
    
• All your recipes
• All your comments
• Your profile and account data

Type "DELETE" to confirm:`

    const userInput = window.prompt(confirmMessage)
    
    if (userInput !== 'DELETE') {
      toast.info('Account deletion cancelled')
      return
    }

    setDeletingAccount(true)
    try {
      await api.delete('/users/me')
      toast.success('Account deleted successfully')
      logout()
      navigate('/')
    } catch (error) {
      toast.error('Failed to delete account')
      console.error('Delete account error:', error)
    } finally {
      setDeletingAccount(false)
    }
  }

  if (!profileUser) return <div>Loading...</div>

  if (viewingOwn) {
    return (
      <form onSubmit={onSubmit} style={{ maxWidth: 480, margin: '0 auto', display: 'grid', gap: 12 }}>
        <h2>Profile</h2>
        <label>Name</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onPasswordReset}>
          Send password reset
        </button>
        <button type="button" onClick={logout}>
          Logout
        </button>
        <button 
          type="button" 
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: deletingAccount ? 'not-allowed' : 'pointer',
            opacity: deletingAccount ? 0.6 : 1
          }}
        >
          {deletingAccount ? 'Deleting Account...' : 'Delete Account'}
        </button>
      </form>
    )
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', display: 'grid', gap: 12 }}>
      <h2>{profileUser.name}'s Profile</h2>
      <div>Email: {profileUser.email}</div>
      <div>
        {isFollowing ? (
          <button onClick={handleUnfollow}>Unfollow</button>
        ) : (
          <button onClick={handleFollow}>Follow</button>
        )}
      </div>
    </div>
  )
}
