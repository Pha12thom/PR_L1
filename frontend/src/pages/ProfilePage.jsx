import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, refreshMe } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const saveProfile = async () => {
    setError('');
    setMessage('');
    try {
      await api.put('/auth/profile', profileForm);
      await refreshMe();
      setMessage('✓ Profile updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const changePassword = async () => {
    setError('');
    setMessage('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Please fill current and new password');
      return;
    }
    try {
      const res = await api.put('/auth/change-password', passwordForm);
      setMessage(`✓ ${res.data.message || 'Password updated'}`);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="container section">
      <h2>👤 Profile Settings</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="card section-sm">
        <h3>Basic Profile</h3>
        <div className="form">
          <input
            placeholder="Full name"
            value={profileForm.name}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            placeholder="Email"
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            placeholder="Phone"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <input
            placeholder="Profile photo URL (optional)"
            value={profileForm.avatarUrl}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
          />
          <button className="btn" onClick={saveProfile}>Save Profile</button>
        </div>
      </section>

      <section className="card section-sm">
        <h3>Change Password</h3>
        <div className="form">
          <input
            placeholder="Current password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
          />
          <input
            placeholder="New password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
          />
          <button className="btn btn-small" onClick={changePassword}>Update Password</button>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
