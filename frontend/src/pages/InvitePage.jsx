import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

const InvitePage = () => {
  const { token } = useParams();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvite = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/invite/${token}`);
        setInvite(res.data.invite || null);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Invite not available');
      } finally {
        setLoading(false);
      }
    };
    loadInvite();
  }, [token]);

  return (
    <div className="container section narrow auth-page-wrap">
      <div className="card auth-card">
        <div className="auth-top">
          <div className="auth-flag" aria-label="Kenya flag">🇰🇪</div>
          <h2>Authority Access Invite</h2>
        </div>

        {loading && <p>Loading invite details...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && invite && (
          <div className="form">
            <p><strong>Organization:</strong> {invite.organizationName}</p>
            <p><strong>Login Email:</strong> {invite.email}</p>
            <p><strong>Temporary Password:</strong> {invite.password}</p>
            <p><strong>Expires:</strong> {new Date(invite.expiresAt).toLocaleString()}</p>
            <p className="success">Use these details to log in and access assigned emergency cases.</p>
            <Link
              to={`/login?email=${encodeURIComponent(invite.email)}&password=${encodeURIComponent(invite.password)}&autologin=1`}
              className="btn"
            >
              Proceed to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
