import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UNREAD_COUNT_KEY = 'resq-notifications-unread-count';

const Header = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const readCount = () => {
      const count = Number(localStorage.getItem(UNREAD_COUNT_KEY) || 0);
      setUnreadCount(Number.isNaN(count) ? 0 : count);
    };

    readCount();
    window.addEventListener('resq-notifications-updated', readCount);

    return () => {
      window.removeEventListener('resq-notifications-updated', readCount);
    };
  }, []);

  return (
    <header className="header">
      <div className="container nav-wrap">
        <Link to="/" className="brand">
          🚑 ResQ Kenya
        </Link>
        <nav className="nav-links">
          <Link to="/reports">📍 Nearby Incidents</Link>
          <Link to="/notifications" className="nav-notify-link">
            🔔 Notifications
            {unreadCount > 0 && <span className="nav-notify-badge">{unreadCount}</span>}
          </Link>
          <Link to="/social">💬 Community</Link>
          <Link to="/contacts">📞 Emergency Contacts</Link>
          {user ? (
            <>
              <Link to="/dashboard">📋 Report</Link>
              {user.role === 'admin' && <Link to="/admin">⚙️ Admin</Link>}
              <button type="button" onClick={logout} className="btn-link">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
