import { Link, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UNREAD_COUNT_KEY = 'resq-notifications-unread-count';

const Header = () => {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });
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

      <header className={`sidebar ${menuOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <Link to="/" className="brand sidebar-brand">
            <span className="brand-short">R</span>
            <span className="brand-full label">ResQ Kenya</span>
          </Link>
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="sidebar-collapse-toggle"
            onClick={() => {
              setCollapsed((p) => {
                const next = !p;
                try {
                  localStorage.setItem('sidebar-collapsed', String(next));
                } catch (e) {}
                return next;
              });
            }}
          >
            {collapsed ? '»' : '«'}
          </button>
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
          <NavLink to="/reports" className={navClass}>
            <span className="icon">📍</span>
            <span className="label">Nearby Incidents</span>
          </NavLink>
          <NavLink to="/notifications" className={navClass}>
            <span className="icon">🔔</span>
            <span className="label nav-notify-link">Notifications {unreadCount > 0 && <span className="nav-notify-badge">{unreadCount}</span>}</span>
          </NavLink>
          <NavLink to="/social" className={navClass}>
            <span className="icon">👥</span>
            <span className="label">Community</span>
          </NavLink>
          <NavLink to="/contacts" className={navClass}>
            <span className="icon">📞</span>
            <span className="label">Emergency Contacts</span>
          </NavLink>
          {user ? (
            <>
              <NavLink to="/profile" className={navClass}>
                <span className="icon">👤</span>
                <span className="label">Profile</span>
              </NavLink>
              <NavLink to="/dashboard" className={navClass}>
                <span className="icon">⚠️</span>
                <span className="label">Report</span>
              </NavLink>
              <NavLink to="/messages" className={navClass}>
                <span className="icon">💬</span>
                <span className="label">Messages</span>
              </NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" className={navClass}>
                  <span className="icon">⚙️</span>
                  <span className="label">Admin</span>
                </NavLink>
              )}
              {user.role === 'admin' && (
                <NavLink to="/admin/logs" className={navClass}>
                  <span className="icon">📜</span>
                  <span className="label">Site Logs</span>
                </NavLink>
              )}
              <button type="button" onClick={logout} className="btn-link sidebar-logout">
                <span className="icon">↩️</span>
                <span className="label">Logout</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                <span className="icon">🔐</span>
                <span className="label">Login</span>
              </NavLink>
              <NavLink to="/register" className={navClass}>
                <span className="icon">📝</span>
                <span className="label">Sign Up</span>
              </NavLink>
            </>
          )}
        </nav>
      </header>
    </>
  );
};

export default Header;
