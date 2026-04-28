import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  const passwordChecks = {
    length: form.password.length >= 8,
    lowercase: /[a-z]/.test(form.password),
    uppercase: /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[^A-Za-z0-9]/.test(form.password),
  };

  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    if (!isPasswordStrong) {
      setError('Please meet all password requirements before creating your account.');
      return;
    }

    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const apiError = err.response?.data;
      if (Array.isArray(apiError?.errors) && apiError.errors.length > 0) {
        setValidationErrors(apiError.errors.map((item) => item.message || item.msg).filter(Boolean));
      }
      setError(apiError?.message || 'Registration failed. Please verify your details and try again.');
    }
  };

  return (
    <div className="container section narrow auth-page-wrap">
      <form className="card form auth-card" onSubmit={onSubmit} autoComplete="on">
        <div className="auth-top">
          <div className="auth-flag" aria-label="Kenya flag">
            🇰🇪
          </div>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join the platform and start reporting emergencies quickly.</p>
        </div>
        {error && <p className="error">{error}</p>}
        {validationErrors.length > 0 && (
          <ul className="register-validation-list">
            {validationErrors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        <input
          placeholder="Name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          placeholder="Phone"
          name="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <div className="password-field-wrap">
          <input
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
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

        <ul className="register-password-checklist">
          <li className={passwordChecks.length ? 'ok' : ''}>At least 8 characters</li>
          <li className={passwordChecks.lowercase ? 'ok' : ''}>Contains a lowercase letter</li>
          <li className={passwordChecks.uppercase ? 'ok' : ''}>Contains an uppercase letter</li>
          <li className={passwordChecks.number ? 'ok' : ''}>Contains a number</li>
          <li className={passwordChecks.special ? 'ok' : ''}>Contains a special character</li>
        </ul>

        <button className="btn" type="submit">
          Register
        </button>
        <p className="auth-switch-text">
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
