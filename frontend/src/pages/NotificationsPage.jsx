import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const STORAGE_KEY = 'resq-notifications-read-map';
const UNREAD_COUNT_KEY = 'resq-notifications-unread-count';

const setUnreadCount = (count) => {
  localStorage.setItem(UNREAD_COUNT_KEY, String(count));
  window.dispatchEvent(new CustomEvent('resq-notifications-updated'));
};

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

const NotificationsPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

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

  const readMap = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }, []);

  const persistReadMap = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const fetchNearbyNotifications = async (coords) => {
    setLoading(true);
    try {
      const response = await api.get('/reports', {
        params: {
          nearLat: coords.lat,
          nearLng: coords.lng,
          radiusKm: 2,
        },
      });

      const items = (response.data.reports || []).map((report) => ({
        ...report,
        id: report.id,
        title: report.title,
        description: report.description,
        location: report.location_text || 'Location unavailable',
        status: report.status,
        category: report.category,
        severity: report.severity,
        adminComment:
          report.adminUpdates?.length > 0
            ? report.adminUpdates[report.adminUpdates.length - 1]?.message || 'Updated without comment'
            : 'Awaiting admin review',
        createdAt: report.created_at || report.createdAt,
        distanceKm: Number.isFinite(Number(report.latitude ?? report.location?.latitude)) && Number.isFinite(Number(report.longitude ?? report.location?.longitude))
          ? distanceKm(
            Number(coords.lat),
            Number(coords.lng),
            Number(report.latitude ?? report.location?.latitude),
            Number(report.longitude ?? report.location?.longitude)
          )
          : null,
        read: Boolean(readMap[report.id]),
      }));

      setNotifications(items);
      setUnreadCount(items.filter((item) => !item.read).length);
      setError('');
    } catch {
      setError('Failed to load nearby alerts.');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        getLocationName(coords.lat, coords.lng);
        fetchNearbyNotifications(coords);
      },
      () => {
        setError('Please enable location access to receive nearby notifications.');
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const openNotification = (notification) => {
    setSelected(notification);
    if (!notification.read) {
      const nextMap = {
        ...readMap,
        [notification.id]: true,
      };
      persistReadMap(nextMap);
      setNotifications((prev) =>
        {
          const next = prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                read: true,
              }
            : item
          );
          setUnreadCount(next.filter((item) => !item.read).length);
          return next;
        }
      );
    }
  };

  const unread = notifications.filter((item) => !item.read);
  const read = notifications.filter((item) => item.read);

  return (
    <div className="container section">
      <div className="row between">
        <h2>🔔 Nearby Notifications (2km)</h2>
        <button type="button" className="btn btn-outline btn-small" onClick={detectLocation}>
          Refresh Alerts
        </button>
      </div>

      {userLocation && (
        <p className="success">
          Monitoring alerts within 2km of {locationName || 'your location'}
        </p>
      )}

      {error && <p className="error">{error}</p>}
      {loading && <p>Loading notifications...</p>}

      {!loading && (
        <div className="notifications-layout">
          <section className="card">
            <h3>Unread ({unread.length})</h3>
            {unread.length === 0 ? (
              <p>No unread notifications.</p>
            ) : (
              <div className="notification-list">
                {unread.map((item) => (
                  <button key={item.id} type="button" className="notification-item unread" onClick={() => openNotification(item)}>
                    <h4>{item.title}</h4>
                    <p>{item.location}</p>
                    {item.distanceKm !== null && <small>{item.distanceKm.toFixed(2)} km from current location</small>}
                    <br />
                    <small>{item.category} · {item.severity}</small>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h3>Read ({read.length})</h3>
            {read.length === 0 ? (
              <p>No read notifications yet.</p>
            ) : (
              <div className="notification-list">
                {read.map((item) => (
                  <button key={item.id} type="button" className="notification-item" onClick={() => openNotification(item)}>
                    <h4>{item.title}</h4>
                    <p>{item.location}</p>
                    {item.distanceKm !== null && <small>{item.distanceKm.toFixed(2)} km from current location</small>}
                    <br />
                    <small>{item.category} · {item.severity}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {selected && (
        <section className="card section-sm">
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>
          <p><strong>Location:</strong> {selected.location}</p>
          {selected.distanceKm !== null && <p><strong>Distance:</strong> {selected.distanceKm.toFixed(2)} km from current location</p>}
          <p><strong>Status:</strong> {selected.status}</p>
          <p><strong>Admin Comment:</strong> {selected.adminComment}</p>
        </section>
      )}
    </div>
  );
};

export default NotificationsPage;
