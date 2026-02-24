import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="container section">
      <section className="hero">
        <div className="ambulance-icon">🚑</div>
        <h1>Emergency Response & Reporting Platform</h1>
        <p>
          Report incidents in real-time with precise location, attach evidence photos, and receive instant admin
          updates.
        </p>
        <div className="row gap">
          <Link to="/dashboard" className="btn">
            Report an Emergency
          </Link>
          <Link to="/reports" className="btn btn-outline">
            View Community Incidents
          </Link>
        </div>
      </section>

      <section className="grid-3">
        <article className="card">
          <h3>⚡ Real-Time Reporting</h3>
          <p>Submit reports with photos, location, and severity level for immediate response.</p>
        </article>
        <article className="card">
          <h3>🗺️ Nearby Incidents</h3>
          <p>View emergency reports within 1km of your location on a live interactive map.</p>
        </article>
        <article className="card">
          <h3>👤 Anonymous Option</h3>
          <p>Report incidents without revealing your identity when needed for safety.</p>
        </article>
        <article className="card">
          <h3>📱 Social Engagement</h3>
          <p>Comment and like reports to help others stay informed and connected.</p>
        </article>
        <article className="card">
          <h3>👨‍💼 Admin Updates</h3>
          <p>Track progress as administrators update status and actions taken on your report.</p>
        </article>
        <article className="card">
          <h3>📞 Emergency Contacts</h3>
          <p>Quick access to Kenya emergency services and hotlines for immediate help.</p>
        </article>
      </section>
    </div>
  );
};

export default LandingPage;
