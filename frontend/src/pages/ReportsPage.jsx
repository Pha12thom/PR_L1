import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ReportMap from '../components/ReportMap';

const ASSET_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const toRad = (value) => (value * Math.PI) / 180;
const distanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const getLocationName = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const name = data.address?.city || data.address?.town || data.address?.county || data.address?.country || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLocationName(name);
    } catch (err) {
      console.error('Geocoding error:', err);
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const loadNearby = async (coords) => {
    setLoading(true);
    try {
      const res = await api.get('/reports', {
        params: {
          nearLat: coords.lat,
          nearLng: coords.lng,
          radiusKm: 1,
        },
      });
      setReports(res.data.reports || []);
      setLocationError('');
    } catch (err) {
      setLocationError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const findNearby = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation([coords.lat, coords.lng]);
        getLocationName(coords.lat, coords.lng);
        loadNearby(coords);
      },
      () => {
        setLocationError('Please enable location access');
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    findNearby();
  }, []);

  return (
    <div className="container section">
      <div className="row between">
        <h2>Nearby Emergency Incidents (1km radius)</h2>
        <button className="btn btn-outline " onClick={findNearby} disabled={loading}>
          {loading ? 'Loading...' : '📍 Refresh Location'}
        </button>
      </div>

      {locationError && <p className="error">{locationError}</p>}
      {userLocation && (
        <p className="success">
          ✓ Showing incidents within 1km of your location: {locationName || 'Loading location...'}
        </p>
      )}

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'stretch' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReportMap 
            reports={reports} 
            userLocation={userLocation}
            selectedReport={selectedReport}
            onMarkerClick={setSelectedReport}
          />
        </div>
        
        {selectedReport && (
          <div className="card" style={{ width: '400px', maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <button
              type="button"
              className="btn btn-small btn-outline"
              onClick={() => setSelectedReport(null)}
              style={{ alignSelf: 'flex-end', marginBottom: '12px' }}
            >
              ✕ Close
            </button>

            <h3 style={{ margin: '0 0 12px 0', color: '#000' }}>{selectedReport.title}</h3>
            
            <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#666' }}>
              {selectedReport.description}
            </p>

            <div className="incident-meta" style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '6px' }}>
                <strong>Category:</strong> {selectedReport.category}
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Severity:</strong> <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{selectedReport.severity}</span>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <strong>Status:</strong> <span className={`status-pill ${selectedReport.status === 'resolved' ? 'status-approved' : 'status-pending'}`}>{selectedReport.status}</span>
              </div>
            </div>

            <div style={{ marginBottom: '12px', fontSize: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>Location:</strong> {selectedReport.location_text || 'Location not specified'}
              </p>
              {userLocation && Number.isFinite(Number(selectedReport.latitude ?? selectedReport.location?.latitude)) && Number.isFinite(Number(selectedReport.longitude ?? selectedReport.location?.longitude)) && (
                <p style={{ marginBottom: '8px' }}>
                  <strong>Distance:</strong>{' '}
                  {distanceKm(
                    Number(userLocation[0]),
                    Number(userLocation[1]),
                    Number(selectedReport.latitude ?? selectedReport.location?.latitude),
                    Number(selectedReport.longitude ?? selectedReport.location?.longitude)
                  ).toFixed(2)} km from your location
                </p>
              )}
            </div>

            <div style={{ marginBottom: '12px', fontSize: '0.85rem' }}>
              <strong>Reported by:</strong> {selectedReport.anonymous ? '📍 Anonymous' : selectedReport.reporter_name}
            </div>

            {selectedReport.images && selectedReport.images.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '0.85rem' }}>Images:</strong>
                <div className="community-img-grid" style={{ marginTop: '8px' }}>
                  {selectedReport.images.map((img) => (
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
              </div>
            )}

            <div style={{ fontSize: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: 'auto' }}>
              <strong>Admin Comment:</strong>
              <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                {selectedReport.adminUpdates?.length
                  ? selectedReport.adminUpdates[selectedReport.adminUpdates.length - 1]?.message || 'Updated without comment'
                  : 'Awaiting admin review'}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="risk-legend card">
        <h4>Risk Level Legend</h4>
        <div className="risk-legend-items">
          <span><i style={{ background: '#3b82f6' }} />Low</span>
          <span><i style={{ background: '#facc15' }} />Medium</span>
          <span><i style={{ background: '#f97316' }} />High</span>
          <span><i style={{ background: '#ef4444' }} />Critical</span>
        </div>
      </div>

      {!selectedReport && (
        <section className="section-sm">
          <h3>Incident Details</h3>
          {reports.length === 0 ? (
            <p>No incidents within 1km of your location.</p>
          ) : (
            <div className="incident-list card">
              {reports.map((report) => (
                <article key={report.id} className="incident-row">
                  <div className="incident-row-head">
                    <h4>{report.title}</h4>
                    <span className={`status-pill ${report.status === 'resolved' ? 'status-approved' : 'status-pending'}`}>
                      {report.status === 'resolved' ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p>{report.description}</p>
                  <div className="incident-meta">
                    <span><strong>Category:</strong> {report.category}</span>
                    <span><strong>Severity:</strong> {report.severity}</span>
                    <span><strong>Status:</strong> {report.status}</span>
                  </div>
                  <p><strong>Location:</strong> {report.location_text || 'Location not specified'}</p>
                  {userLocation && Number.isFinite(Number(report.latitude ?? report.location?.latitude)) && Number.isFinite(Number(report.longitude ?? report.location?.longitude)) && (
                    <p>
                      <strong>Distance:</strong>{' '}
                      {distanceKm(
                        Number(userLocation[0]),
                        Number(userLocation[1]),
                        Number(report.latitude ?? report.location?.latitude),
                        Number(report.longitude ?? report.location?.longitude)
                      ).toFixed(2)} km from current location
                    </p>
                  )}
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
                  <p>
                    <strong>Admin Comment:</strong>{' '}
                    {report.adminUpdates?.length
                      ? report.adminUpdates[report.adminUpdates.length - 1]?.message || 'Updated without comment'
                      : 'Awaiting admin review'}
                  </p>
                  <div className="incident-links">
                    <Link to="/social">Discuss in community</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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
    </div>
  );
};

export default ReportsPage;
