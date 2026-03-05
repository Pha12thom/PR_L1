import { useEffect, useState } from 'react';
import api from '../api/client';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/logs', { params: { limit: 300 } });
      setLogs(res.data.logs || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="container section">
      <div className="row between">
        <h2>📜 Site Activity Logs</h2>
        <button className="btn btn-outline btn-small" onClick={loadLogs} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh Logs'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <section className="card section-sm">
        {loading ? (
          <p>Loading logs...</p>
        ) : logs.length === 0 ? (
          <p>No logs available yet.</p>
        ) : (
          <div className="logs-table-wrap">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>{item.actor_name || 'System'}</td>
                    <td>{item.actor_role || 'system'}</td>
                    <td>{item.action}</td>
                    <td>{item.entity_type}{item.entity_id ? `:${item.entity_id.slice(0, 8)}` : ''}</td>
                    <td>{item.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminLogsPage;
