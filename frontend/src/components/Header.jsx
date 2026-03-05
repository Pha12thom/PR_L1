import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UNREAD_COUNT_KEY = 'resq-notifications-unread-count';

const Header = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

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

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navClass = ({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`;
  const initials = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <button type="button" className="sidebar-mobile-toggle" onClick={() => setMenuOpen((prev) => !prev)}>
        ☰ Menu
      </button>

      <header className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/" className="brand sidebar-brand">
            ResQ Kenya
          </Link>
          <p className="sidebar-subtitle">Digital Emergency Hub</p>
          {user && (
            <div className="sidebar-profile-chip">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="profile" className="sidebar-avatar" />
              ) : (
                <div className="sidebar-avatar sidebar-avatar-fallback">{initials}</div>
              )}
              <div>
                <strong>{user.name}</strong>
                <small>{user.role === 'admin' ? 'Administrator' : user.organizationName || 'User'}</small>
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/reports" className={navClass}>Nearby Incidents</NavLink>
          <NavLink to="/notifications" className={navClass}>
            <span className="nav-notify-link">Notifications {unreadCount > 0 && <span className="nav-notify-badge">{unreadCount}</span>}</span>
          </NavLink>
          <NavLink to="/social" className={navClass}>Community</NavLink>
          <NavLink to="/contacts" className={navClass}>Emergency Contacts</NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className={navClass}>👤 Profile</NavLink>
              <NavLink to="/dashboard" className={navClass}>Report</NavLink>
              <NavLink to="/messages" className={navClass}>💬 Messages</NavLink>
              {user.role === 'admin' && <NavLink to="/admin" className={navClass}>⚙️ Admin</NavLink>}
              {user.role === 'admin' && <NavLink to="/admin/logs" className={navClass}>📜 Site Logs</NavLink>}
              <button type="button" onClick={logout} className="btn-link sidebar-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>Login</NavLink>
              <NavLink to="/register" className={navClass}>Sign Up</NavLink>
            </>
          )}
        </nav>
      </header>
    </>
  );
};

export default Header;
