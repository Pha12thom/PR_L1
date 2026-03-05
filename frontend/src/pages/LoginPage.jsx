import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const inviteCredentials = useMemo(() => {
    const email = searchParams.get('email') || '';
    const password = searchParams.get('password') || '';
    const auto = searchParams.get('autologin') === '1';
    return { email, password, auto };
  }, [searchParams]);

  useEffect(() => {
    if (!inviteCredentials.email && !inviteCredentials.password) return;
    setForm({ email: inviteCredentials.email, password: inviteCredentials.password });
  }, [inviteCredentials.email, inviteCredentials.password]);

  useEffect(() => {
    const autoSignIn = async () => {
      if (!inviteCredentials.auto || !inviteCredentials.email || !inviteCredentials.password) return;
      try {
        await login(inviteCredentials.email, inviteCredentials.password, true);
        navigate('/messages');
      } catch (err) {
        setError(err.response?.data?.message || 'Auto login failed. Please sign in manually.');
      }
    };
    autoSignIn();
  }, [inviteCredentials, login, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container section narrow auth-page-wrap">
      <form className="card form auth-card" onSubmit={onSubmit} autoComplete="on">
        <div className="auth-top">
          <div className="auth-flag" aria-label="Kenya flag">
            🇰🇪
          </div>
          <h2>Sign In</h2>
          <p className="auth-subtitle">Welcome back. Access your emergency reporting dashboard.</p>
        </div>
        {error && <p className="error">{error}</p>}
        <input
          placeholder="Email"
          type="email"
          name="email"
          autoComplete="email username"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div className="password-field-wrap">
          <input
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            className="password-eye-btn"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <label className="check auth-check">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me on this device
        </label>
        <button className="btn" type="submit">
          Sign In
        </button>
        <p className="auth-switch-text">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
