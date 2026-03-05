import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const ASSET_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const SocialPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  const loadReports = async () => {
    try {
      const res = await api.get('/reports');
      setReports(res.data.reports || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const likeReport = async (id) => {
    await api.post(`/social/reports/${id}/like`);
    await loadReports();
  };

  const addComment = async (id) => {
    const text = comments[id];
    if (!text || !user) return;
    try {
      await api.post(`/reports/${id}/comments`, { text });
      setComments((prev) => ({ ...prev, [id]: '' }));
      await loadReports();
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  if (loading) return <div className="container section">Loading...</div>;

  return (
    <div className="container section social-page">
      <section className="social-hero card">
        <h2>Community Pulse ✨</h2>
        <p>Live emergency conversation feed — share updates, support incidents, and keep everyone informed.</p>
      </section>

      <div className="social-feed section-sm">
        {reports.length === 0 ? (
          <p>No reports yet. Be the first to report!</p>
        ) : (
          reports.map((report) => (
            <article key={report.id} className="card social-post-card">
              <div className="social-post-head">
                <div>
                  <h4>{report.title}</h4>
                  <p className="social-meta">@{(report.reporter_name || 'anonymous').replace(/\s+/g, '').toLowerCase()} · {report.category}</p>
                </div>
                <span className={`status-pill ${report.status === 'resolved' ? 'status-approved' : 'status-pending'}`}>
                  {report.status}
                </span>
              </div>

              <p>{report.description}</p>

              <p className="social-meta">
                <strong>Severity:</strong> {report.severity}
              </p>

              {report.images && report.images.length > 0 && (
                <div className="community-img-grid">
                  {report.images.map((img) => (
                    <button
                      key={img}
                      type="button"
                      className="image-thumb-btn"
                      onClick={() => setPreviewImage(`${ASSET_BASE}${img}`)}
                      aria-label="Open full image"
                    >
                      <img src={`${ASSET_BASE}${img}`} alt="incident" className="community-report-img" />
                    </button>
                  ))}
                </div>
              )}

              <div className="social-actions">
                <span>💜 {report.likes?.length || 0} supports</span>
                {user && (
                  <button className="btn btn-small social-like-btn" onClick={() => likeReport(report.id)}>
                    Support This Report
                  </button>
                )}
              </div>

              <div className="comments">
                <h5 className="social-comments-title">💬 Community Comments</h5>
                {report.comments && report.comments.length > 0 ? (
                  <ul className="social-comment-list">
                    {report.comments.map((comment) => (
                      <li key={comment.id} className="social-comment-item">
                        <strong>{comment.user_name}:</strong>
                        <span>{comment.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="social-empty">No comments yet. Be the first!</p>
                )}

                {user ? (
                  <div className="row gap social-comment-input-row">
                    <input
                      value={comments[report.id] || ''}
                      onChange={(e) => setComments((prev) => ({ ...prev, [report.id]: e.target.value }))}
                      placeholder="Share your insights..."
                    />
                    <button
                      className="btn btn-small"
                      onClick={() => addComment(report.id)}
                      disabled={!comments[report.id]}
                    >
                      Post
                    </button>
                  </div>
                ) : (
                  <p className="social-empty" style={{ marginTop: '12px' }}>
                    <a href="/login" className="social-login-link">
                      Log in
                    </a>
                    {' '}
                    to comment
                  </p>
                )}
              </div>
            </article>
          ))
        )}
      </div>

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
    </div>
  );
};

export default SocialPage;
