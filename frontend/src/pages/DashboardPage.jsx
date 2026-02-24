import { useEffect, useState } from 'react';
import api from '../api/client';

const ASSET_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const DashboardPage = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    severity: 'medium',
    locationText: '',
    contactPhone: '',
    anonymous: false,
    latitude: '',
    longitude: '',
  });
  const [images, setImages] = useState([]);
  const [fileCount, setFileCount] = useState(0);
  const [myReports, setMyReports] = useState([]);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const loadMine = async () => {
    const res = await api.get('/reports/mine');
    setMyReports(res.data.reports || []);
  };

  useEffect(() => {
    loadMine().catch(() => null);
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        setLocationError('');
      },
      () => {
        setLocationError('Please enable location access');
      }
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setNotice('Maximum 5 images allowed');
      setFileCount(0);
      setImages([]);
      return;
    }
    const withPreview = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
    }));
    setImages(withPreview);
    setFileCount(files.length);
  };

  const removeSelectedImage = (imageId) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === imageId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const next = prev.filter((item) => item.id !== imageId);
      setFileCount(next.length);
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setNotice('');

    if (!form.latitude || !form.longitude) {
      setNotice('Location access is required. Please enable location in browser settings');
      return;
    }

    if (fileCount === 0) {
      setNotice('At least 1 image is required');
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    images.forEach((item) => data.append('images', item.file));

    try {
      await api.post('/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNotice('✓ Report submitted successfully. Admins will review shortly.');
      setForm({
        title: '',
        description: '',
        category: 'general',
        severity: 'medium',
        locationText: '',
        contactPhone: '',
        anonymous: false,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      images.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setImages([]);
      setFileCount(0);
      await loadMine();
    } catch (err) {
      setNotice(`Error: ${err.response?.data?.message || 'Report submission failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <h2>User Dashboard</h2>

      <section className="grid-3 section-sm">
        <article className="card">
          <h4>Total Reports</h4>
          <p><strong>{myReports.length}</strong></p>
        </article>
        <article className="card">
          <h4>Resolved</h4>
          <p><strong>{myReports.filter((report) => report.status === 'resolved').length}</strong></p>
        </article>
        <article className="card">
          <h4>High/Critical</h4>
          <p><strong>{myReports.filter((report) => ['high', 'critical'].includes(report.severity)).length}</strong></p>
        </article>
      </section>

      <section className="section-sm">
        <h3>My Reports</h3>
        {myReports.length === 0 ? (
          <p>No reports yet. Submit one below to help your community.</p>
        ) : (
          <div className="grid-2">
            {myReports.map((report) => (
              <article key={report.id} className="card">
                <h4>{report.title}</h4>
                <p>{report.description}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span style={{ color: report.status === 'resolved' ? '#1b5e20' : '#d32f2f' }}>
                    {report.status?.toUpperCase()}
                  </span>
                </p>
                <p><strong>Severity:</strong> {report.severity || 'N/A'}</p>

                {report.images && report.images.length > 0 && (
                  <div className="img-grid">
                    {report.images.map((img) => (
                      <img key={img} src={`${ASSET_BASE}${img}`} alt="my incident" className="report-img" />
                    ))}
                  </div>
                )}

                {report.adminUpdates?.length > 0 && (
                  <div>
                    <strong>Admin Updates:</strong>
                    <ul>
                      {report.adminUpdates.map((update) => (
                        <li key={update.id}>
                          <strong>{update.status}:</strong> {update.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <h3 className="section-sm">Create New Emergency Report</h3>

      <form className="card form" onSubmit={onSubmit}>
        {notice && <p className={notice.includes('✓') ? 'success' : 'error'}>{notice}</p>}

        {locationError && <p className="error">📍 {locationError}</p>}
        {form.latitude && form.longitude && (
          <p className="success">✓ Location: {form.latitude.slice(0, 8)}, {form.longitude.slice(0, 8)}</p>
        )}

        <input
          placeholder="Incident title *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          placeholder="Describe the emergency in detail *"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />

        <div className="row gap">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="general">General</option>
            <option value="medical">Medical Emergency</option>
            <option value="fire">Fire</option>
            <option value="security">Security/Crime</option>
            <option value="accident">Traffic Accident</option>
          </select>
          <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
            <option value="low">Low Priority</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical/Life Threat</option>
          </select>
        </div>

        <input
          placeholder="Location description (e.g., Nairobi CBD, Kimathi Street)"
          value={form.locationText}
          onChange={(e) => setForm({ ...form, locationText: e.target.value })}
        />

        <div className="row gap">
          <input placeholder="Latitude (auto-filled)" value={form.latitude} readOnly />
          <input placeholder="Longitude (auto-filled)" value={form.longitude} readOnly />
          <button type="button" className="btn btn-outline btn-small" onClick={detectLocation}>
            Re-check Location
          </button>
        </div>

        <input placeholder="Contact phone (optional)" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />

        <label className="check">
          <input
            type="checkbox"
            checked={form.anonymous}
            onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
          />
          Report anonymously
        </label>

        <div>
          <label>
            Attach photos ({fileCount}/5) *
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            required
          />
          <small>Attach 1-5 photos of the incident for verification</small>
          {images.length > 0 && (
            <div className="upload-preview-grid">
              {images.map((item) => (
                <div key={item.id} className="upload-preview-item">
                  <img src={item.previewUrl} alt={item.file.name} className="report-img" />
                  <button
                    type="button"
                    className="upload-remove-btn"
                    onClick={() => removeSelectedImage(item.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

    </div>
  );
};

export default DashboardPage;
