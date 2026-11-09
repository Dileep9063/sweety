import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <span className="brand">🍬 Sweety</span>
      {user && (
        <nav>
          <NavLink to="/" end>Readings</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <span className="muted">Hi, {user.name}</span>
          <button className="btn-link" onClick={() => { logout(); navigate('/login'); }}>
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
