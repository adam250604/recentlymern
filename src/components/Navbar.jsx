import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth()
  const navigate = useNavigate()
  const onLogout = () => { logout(); navigate('/login') }
  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/recipes" className="brand">Recipes</Link>
        <div className="navlinks" style={{ display: 'flex', gap: 8 }}>
          <NavLink to="/recipes">Browse</NavLink>
          {isAuthenticated && <NavLink to="/recipes/new">New</NavLink>}
          {isAuthenticated && <NavLink to="/dashboard">Dashboard</NavLink>}
        </div>
        <div className="spacer" />
        <div className="navlinks" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isAuthenticated && (<>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>)}
          {isAuthenticated && (<>
            <NavLink to="/profile">{user?.name || user?.email || 'Profile'}</NavLink>
            <button className="btn ghost" onClick={onLogout}>Logout</button>
          </>)}
        </div>
      </div>
    </nav>
  )
}
