import { MapContainer, Marker, Popup, TileLayer, Polyline } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';

const defaultCenter = [-1.286389, 36.817223];

const severityColors = {
  low: '#3b82f6',
  medium: '#facc15',
  high: '#f97316',
  critical: '#ef4444',
};

const userIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzAwMWYzZiIgc3Ryb2tlPSIjY2UxMTI2IiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSI4IiBmaWxsPSIjY2UxMTI2Ii8+PC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const isValidCoordinatePair = (coords) =>
  Array.isArray(coords)
  && coords.length === 2
  && Number.isFinite(Number(coords[0]))
  && Number.isFinite(Number(coords[1]))
  && Math.abs(Number(coords[0])) <= 90
  && Math.abs(Number(coords[1])) <= 180;

const severityIcon = (severity) =>
  divIcon({
    className: 'severity-map-icon',
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;border:2px solid #fff;background:${severityColors[severity] || '#6b7280'};box-shadow:0 0 0 2px rgba(0,0,0,0.16)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const ReportMap = ({ reports, userLocation, selectedReport, onMarkerClick }) => {
  const hasValidUserLocation = isValidCoordinatePair(userLocation);
  const center = hasValidUserLocation
    ? [Number(userLocation[0]), Number(userLocation[1])]
    : defaultCenter;

  return (
    <MapContainer key={`${center[0]}-${center[1]}`} center={center} zoom={15} scrollWheelZoom className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hasValidUserLocation && (
        <Marker position={center} icon={userIcon}>
          <Popup>📍 Your Location</Popup>
        </Marker>
      )}

      {reports
        .map((report) => {
          const latitude = Number(report.latitude ?? report.location?.latitude);
          const longitude = Number(report.longitude ?? report.location?.longitude);
          const valid = Number.isFinite(latitude)
            && Number.isFinite(longitude)
            && Math.abs(latitude) <= 90
            && Math.abs(longitude) <= 180;
          return valid ? { report, latitude, longitude } : null;
        })
        .filter(Boolean)
        .map(({ report, latitude, longitude }) => (
          <Marker
            key={report.id}
            position={[latitude, longitude]}
            icon={severityIcon(report.severity)}
            eventHandlers={{
              click: () => onMarkerClick(report),
            }}
          >
            <Popup>
              <div style={{ maxWidth: '200px' }}>
                <strong>{report.title}</strong>
                <br />
                Category: {report.category}
                <br />
                Severity: <strong>{report.severity || 'N/A'}</strong>
                <br />
                Status: <strong style={{ color: '#ce1126' }}>{report.status}</strong>
              </div>
            </Popup>
          </Marker>
        ))}

      {selectedReport && hasValidUserLocation && (
        <Polyline
          positions={[
            [Number(userLocation[0]), Number(userLocation[1])],
            [
              Number(selectedReport.latitude ?? selectedReport.location?.latitude),
              Number(selectedReport.longitude ?? selectedReport.location?.longitude),
            ],
          ]}
          color="#7b5cff"
          weight={2}
          opacity={0.7}
          dashArray="5, 5"
        />
      )}
    </MapContainer>
  );
};

export default ReportMap;
