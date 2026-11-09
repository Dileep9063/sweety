import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await login(email, password); }
    catch (err) { setError(err.message); setLoading(false); }
  }

  return (
    <form className="card auth-card form-grid" onSubmit={handleSubmit}>
      <h1>Log in</h1>
      <label>Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
      <p className="muted">No account? <Link to="/register">Sign up</Link></p>
      <p className="muted small">Demo: demo@sweety.com / password123 (after running the seed script)</p>
    </form>
  );
}
