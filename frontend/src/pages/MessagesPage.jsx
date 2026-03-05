import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const MessagesPage = () => {
  const { user } = useAuth();
  const [dispatches, setDispatches] = useState([]);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [statusForm, setStatusForm] = useState({ status: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/inbox');
      const items = res.data.dispatches || [];
      setDispatches(items);
      if (items.length > 0 && !selectedDispatch) {
        setSelectedDispatch(items[0]);
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (dispatchId) => {
    try {
      const res = await api.get(`/messages/dispatches/${dispatchId}/messages`);
      setMessages(res.data.messages || []);
      if (res.data.dispatch) {
        setSelectedDispatch(res.data.dispatch);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load conversation');
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    if (selectedDispatch?.id) {
      loadMessages(selectedDispatch.id);
    }
  }, [selectedDispatch?.id]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedDispatch?.id) return;
    try {
      const res = await api.post(`/messages/dispatches/${selectedDispatch.id}/messages`, { text: trimmed });
      setMessages(res.data.messages || []);
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const updateDispatchStatus = async () => {
    if (!statusForm.status || !selectedDispatch?.id) return;
    try {
      const res = await api.patch(`/messages/dispatches/${selectedDispatch.id}/status`, statusForm);
      const updated = res.data.dispatch;
      setDispatches((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setSelectedDispatch((prev) => ({ ...prev, ...updated }));
      if (statusForm.message) {
        await loadMessages(selectedDispatch.id);
      }
      setStatusForm({ status: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const sortedDispatches = useMemo(
    () => [...dispatches].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)),
    [dispatches]
  );

  if (loading) return <div className="container section">Loading messages...</div>;

  return (
    <div className="container section">
      <div className="row between">
        <h2>💬 Case Messages</h2>
        <button type="button" className="btn btn-outline btn-small" onClick={loadInbox}>
          Refresh
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="messages-layout">
        <section className="card messages-list-card">
          <h3>Assigned Cases ({sortedDispatches.length})</h3>
          {sortedDispatches.length === 0 ? (
            <p>No dispatched cases yet.</p>
          ) : (
            <div className="messages-dispatch-list">
              {sortedDispatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`messages-dispatch-item ${selectedDispatch?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedDispatch(item)}
                >
                  <strong>{item.report_title}</strong>
                  <small>{item.organization_name}</small>
                  <small>Status: {item.status}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card messages-chat-card">
          {!selectedDispatch ? (
            <p>Select a case to start conversation.</p>
          ) : (
            <>
              <h3>{selectedDispatch.report_title}</h3>
              <p className="social-meta">
                Org: {selectedDispatch.organization_name} · Severity: {selectedDispatch.severity} · Case status: {selectedDispatch.status}
              </p>

              <div className="messages-thread">
                {messages.length === 0 ? (
                  <p>No messages yet for this case.</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-bubble ${msg.sender_id === user?.id ? 'mine' : 'theirs'}`}
                    >
                      <strong>{msg.sender_name}</strong>
                      <p>{msg.body}</p>
                      <small>{new Date(msg.created_at).toLocaleString()}</small>
                    </div>
                  ))
                )}
              </div>

              <div className="form" style={{ marginTop: '10px' }}>
                <textarea
                  placeholder="Write a private case message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button className="btn" onClick={sendMessage} disabled={!text.trim()}>
                  Send Message
                </button>
              </div>

              <div className="card section-sm" style={{ borderLeftColor: 'var(--purple-1)' }}>
                <h4 style={{ marginTop: 0 }}>Update Case Progress</h4>
                <div className="form">
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">-- Select status --</option>
                    <option value="in-review">In Review</option>
                    <option value="responding">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <textarea
                    placeholder="Optional status message to the other side"
                    value={statusForm.message}
                    onChange={(e) => setStatusForm((prev) => ({ ...prev, message: e.target.value }))}
                  />
                  <button className="btn btn-small" onClick={updateDispatchStatus} disabled={!statusForm.status}>
                    Update Progress
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default MessagesPage;
