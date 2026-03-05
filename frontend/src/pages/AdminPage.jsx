import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/client';

const PAGE_SIZE = 12;
const ASSET_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const AdminPage = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [activeTab, setActiveTab] = useState('reports');
  const [userSearch, setUserSearch] = useState('');
  const [mapReport, setMapReport] = useState(null);
  const [adminLocation, setAdminLocation] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resettingAll, setResettingAll] = useState(false);

  const load = async () => {
    try {
      const [reportsRes, usersRes] = await Promise.all([
        api.get('/admin/reports'),
        api.get('/admin/users'),
      ]);
      setReports(reportsRes.data.reports || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setMessage(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Get admin's current location for directions
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setAdminLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.error('Admin location error:', err)
      );
    }
  }, []);

  const showMapDirections = (report) => {
    setMapReport(report);
  };

  const closeMap = () => {
    setMapReport(null);
  };

  // Report filtering
  const normalizedSearch = search.trim().toLowerCase();
  const filteredReports = reports.filter((report) => {
    const statusMatch = statusFilter === 'all' || report.status === statusFilter;
    const text = `${report.title || ''} ${report.description || ''} ${report.category || ''} ${report.location_text || ''}`.toLowerCase();
    const searchMatch = !normalizedSearch || text.includes(normalizedSearch);
    return statusMatch && searchMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleReports = filteredReports.slice(pageStart, pageStart + PAGE_SIZE);

  // User filtering
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const text = `${user.name || ''} ${user.email || ''}`.toLowerCase();
    return !normalizedUserSearch || text.includes(normalizedUserSearch);
  });

  const submitUpdate = async (reportId) => {
    const payload = updates[reportId];
    if (!payload?.status) {
      setMessage('Status is required');
      return;
    }

    try {
      await api.patch(`/admin/reports/${reportId}/status`, {
        status: payload.status,
        message: payload.message || '',
      });

      setMessage('✓ Status updated');
      setTimeout(() => setMessage(''), 3000);
      await load();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const promoteUser = async (userId) => {
    if (!window.confirm('Promote this user to admin?')) return;
    try {
      await api.post(`/admin/users/${userId}/promote`);
      setMessage('✓ User promoted to admin');
      setTimeout(() => setMessage(''), 3000);
      await load();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const demoteUser = async (userId) => {
    if (!window.confirm('Demote this user to regular user?')) return;
    try {
      await api.post(`/admin/users/${userId}/demote`);
      setMessage('✓ User demoted');
      setTimeout(() => setMessage(''), 3000);
      await load();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const revokeUser = async (userId) => {
    if (!window.confirm('⚠️ This will permanently revoke this user account. Continue?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setMessage('✓ User account revoked');
      setTimeout(() => setMessage(''), 3000);
      await load();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm('Delete this report permanently? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/reports/${reportId}`);
      setMessage('✓ Report deleted');
      setTimeout(() => setMessage(''), 3000);
      await load();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const resetAllData = async () => {
    if (!resetPassword.trim()) {
      setMessage('Enter your admin password to reset all data');
      return;
    }
    if (!window.confirm('This will delete all reports, comments, likes, updates and all users except your admin account. Continue?')) return;

    setResettingAll(true);
    try {
      await api.post('/admin/reset-all', { password: resetPassword });
      setMessage('✓ Full reset completed');
      setResetPassword('');
      setTimeout(() => setMessage(''), 3500);
      await load();
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setResettingAll(false);
    }
  };

  if (loading) return <div className="container section">Loading...</div>;

  return (
    <div className="container section">
      <h2>⚙️ Admin Dashboard</h2>
      {message && (
        <p className={message.includes('✓') ? 'success' : 'error'} style={{ marginBottom: '16px' }}>
          {message}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--border)' }}>
        <button
          className={`btn ${activeTab === 'reports' ? '' : 'btn-outline'}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Reports
        </button>
        <button
          className={`btn ${activeTab === 'users' ? '' : 'btn-outline'}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
      </div>

      {activeTab === 'reports' && (
        <>
          <div className="card" style={{ borderLeftColor: 'var(--kenya-red)', marginBottom: '14px' }}>
            <h4 style={{ marginTop: 0 }}>Danger Zone</h4>
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
              Reset all system data and keep only your current admin account.
            </p>
            <div className="row gap">
              <input
                type="password"
                placeholder="Re-enter admin password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                style={{ maxWidth: '320px' }}
              />
              <button
                className="btn btn-small"
                style={{ backgroundColor: 'var(--kenya-red)' }}
                onClick={resetAllData}
                disabled={resettingAll}
              >
                {resettingAll ? 'Resetting...' : 'Reset All Data'}
              </button>
            </div>
          </div>

          <div className="admin-toolbar card">
            <div className="admin-toolbar-row">
              <p>
                Total reports: <strong>{reports.length}</strong> | Showing: <strong>{filteredReports.length}</strong>
              </p>
              <p>Page {page} of {totalPages}</p>
            </div>
            <div className="admin-toolbar-controls">
              <input
                placeholder="Search title, category, description, location"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
              />
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All status</option>
                <option value="submitted">Submitted</option>
                <option value="in-review">In Review</option>
                <option value="responding">Responding</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            {visibleReports.length === 0 ? (
              <p>No reports yet.</p>
            ) : (
              visibleReports.map((report) => (
                <article key={report.id} className="card">
                  <button
                    type="button"
                    className="admin-report-row"
                    onClick={() =>
                      setExpandedReportId((prev) => (prev === report.id ? null : report.id))
                    }
                  >
                    <div>
                      <h4>{report.title}</h4>
                      <p>{report.category} · {report.severity} · {report.status}</p>
                    </div>
                    <span>{expandedReportId === report.id ? '▾' : '▸'}</span>
                  </button>

                  {expandedReportId === report.id && (
                    <>
                      <p>{report.description}</p>

                      <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
                        <p>
                          <strong>Reporter:</strong> {report.reporter_name}
                        </p>
                        <p>
                          <strong>Category:</strong> {report.category} | <strong>Severity:</strong> {report.severity}
                        </p>
                        <p>
                          <strong>Location:</strong> {report.location_text || 'Not specified'}
                          {report.latitude && report.longitude && (
                            <button 
                              className="btn btn-small" 
                              style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '0.8rem' }}
                              onClick={() => showMapDirections(report)}
                            >
                              📍 View on Map
                            </button>
                          )}
                        </p>
                      </div>

                      {report.images && report.images.length > 0 && (
                        <div className="img-grid">
                          {report.images.map((img) => (
                            <button
                              key={img}
                              type="button"
                              className="image-thumb-btn"
                              onClick={() => setPreviewImage(`${ASSET_BASE}${img}`)}
                              aria-label="Open full image"
                            >
                              <img src={`${ASSET_BASE}${img}`} alt="incident upload" className="report-img" />
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ marginBottom: '12px' }}>
                        <button
                          className="btn btn-small"
                          style={{ backgroundColor: 'var(--kenya-red)' }}
                          onClick={() => deleteReport(report.id)}
                        >
                          🗑️ Delete Report
                        </button>
                      </div>

                      <div className="form">
                        <label style={{ marginBottom: '8px' }}>
                          <strong>Update Status</strong>
                        </label>
                        <select
                          value={updates[report.id]?.status || ''}
                          onChange={(e) =>
                            setUpdates((prev) => ({
                              ...prev,
                              [report.id]: { ...prev[report.id], status: e.target.value },
                            }))
                          }
                          style={{ marginBottom: '8px' }}
                        >
                          <option value="">-- Select Status --</option>
                          <option value="submitted">Submitted</option>
                          <option value="in-review">In Review</option>
                          <option value="responding">Responding</option>
                          <option value="resolved">Resolved</option>
                        </select>

                        <textarea
                          placeholder="Admin update message or actions taken..."
                          value={updates[report.id]?.message || ''}
                          onChange={(e) =>
                            setUpdates((prev) => ({
                              ...prev,
                              [report.id]: { ...prev[report.id], message: e.target.value },
                            }))
                          }
                          style={{ minHeight: '80px', marginBottom: '8px' }}
                        />

                        <button
                          className="btn"
                          onClick={() => submitUpdate(report.id)}
                          disabled={!updates[report.id]?.status}
                        >
                          Save Update
                        </button>
                      </div>

                      {report.adminUpdates && report.adminUpdates.length > 0 && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                          <strong style={{ fontSize: '0.9rem' }}>Update History:</strong>
                          <ul style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                            {report.adminUpdates.map((item) => (
                              <li key={item.id} style={{ marginBottom: '6px' }}>
                                <strong style={{ color: 'var(--kenya-red)' }}>{item.status}</strong>
                                {item.message && `: ${item.message}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </article>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination-row">
              <button className="btn btn-outline btn-small" disabled={page <= 1} onClick={() => setCurrentPage(page - 1)}>
                Previous
              </button>
              <span>{page} / {totalPages}</span>
              <button className="btn btn-outline btn-small" disabled={page >= totalPages} onClick={() => setCurrentPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'users' && (
        <>
          <div className="admin-toolbar card">
            <div className="admin-toolbar-row">
              <p>Total users: <strong>{users.length}</strong> | Admins: <strong>{users.filter(u => u.role === 'admin').length}</strong></p>
            </div>
            <div className="admin-toolbar-controls">
              <input
                placeholder="Search by name or email"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredUsers.length === 0 ? (
              <p>No users found.</p>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${user.role === 'admin' ? 'var(--kenya-red)' : 'var(--border)'}` }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0' }}>{user.name}</h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{user.email}</p>
                    <p style={{ margin: '0', fontSize: '0.85rem' }}>
                      <span style={{ 
                        backgroundColor: user.role === 'admin' ? 'var(--kenya-red)' : 'var(--success)', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {user.role.toUpperCase()}
                      </span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {user.role === 'user' && (
                      <button className="btn btn-small" onClick={() => promoteUser(user.id)}>
                        ⬆️ Promote
                      </button>
                    )}
                    {user.role === 'admin' && (
                      <button className="btn btn-outline btn-small" onClick={() => demoteUser(user.id)}>
                        ⬇️ Demote
                      </button>
                    )}
                    <button className="btn btn-small" style={{ backgroundColor: 'var(--kenya-red)' }} onClick={() => revokeUser(user.id)}>
                      🚫 Revoke
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {previewImage && (
        <div className="image-lightbox" onClick={() => setPreviewImage(null)}>
          <button
            type="button"
            className="btn btn-small image-lightbox-close"
            onClick={() => setPreviewImage(null)}
          >
            ✕ Close
          </button>
          <img src={previewImage} alt="full incident" className="image-lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {mapReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '2px solid var(--border)' }}>
              <h3 style={{ margin: 0 }}>📍 {mapReport.title}</h3>
              <button className="btn btn-small" onClick={closeMap} style={{ padding: '8px 16px' }}>✕ Close</button>
            </div>
            
            <div style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
              <p><strong>Location:</strong> {mapReport.location_text || 'Not specified'}</p>
              {adminLocation && (
                <p><strong>Route:</strong> Purple line shows direction from your current location to incident</p>
              )}
            </div>

            <div style={{ flex: 1, height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
              {mapReport.latitude && mapReport.longitude && (
                <MapContainer
                  center={[Number(mapReport.latitude), Number(mapReport.longitude)]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[Number(mapReport.latitude), Number(mapReport.longitude)]}>
                    <Popup>
                      <strong>{mapReport.title}</strong><br />
                      {mapReport.category} - {mapReport.severity}
                    </Popup>
                  </Marker>
                  {adminLocation && (
                    <>
                      <Marker position={adminLocation}>
                        <Popup>Your Location</Popup>
                      </Marker>
                      <Polyline
                        positions={[
                          adminLocation,
                          [Number(mapReport.latitude), Number(mapReport.longitude)]
                        ]}
                        color="#7b5cff"
                        weight={3}
                        dashArray="10, 10"
                      />
                    </>
                  )}
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
