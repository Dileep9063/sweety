import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await register(name, email, password); }
    catch (err) { setError(err.message); setLoading(false); }
  }

  return (
    <form className="card auth-card form-grid" onSubmit={handleSubmit}>
      <h1>Create account</h1>
      <label>Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>Password (min 8 characters)
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={loading}>{loading ? 'Creating…' : 'Sign up'}</button>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </form>
  );
}
