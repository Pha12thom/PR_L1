import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="container section">
      <section className="hero landing-hero">
        <div className="landing-hero-left">
          <div className="ambulance-icon"></div>
          <h1>Emergency Response & Reporting Platform</h1>
          <p>
            Report incidents in real-time with precise location, attach evidence photos, and receive instant admin
            updates.
          </p>
          <div className="row gap landing-hero-actions">
            <Link to="/dashboard" className="btn">
              Report an Emergency
            </Link>
            <Link to="/reports" className="btn btn-outline landing-btn-light">
              View Community Incidents
            </Link>
          </div>
        </div>
        <div className="landing-hero-right">
          <div className="landing-mini-card">
            <strong>24/7 Response</strong>
            <span>Fast reporting and admin follow-up</span>
          </div>
          <div className="landing-mini-card">
            <strong>Live Nearby Alerts</strong>
            <span>See incidents around your area instantly</span>
          </div>
          <div className="landing-mini-card">
            <strong>Safe Reporting</strong>
            <span>Anonymous or named reports supported</span>
          </div>
        </div>
      </section>

      <section className="home-gallery card">
        <div className="home-gallery-head">
          <h3>Emergency Services </h3>
          <p> RECEIVE REAL TIME UPDATES FOR ALL EMERGENCIES.</p>
        </div>

        <div className="home-gallery-grid">
          <article className="home-photo-card">
            <img src="/home/ambulance.webp" alt="Ambulance emergency response" className="home-photo-img" />
            <div className="home-photo-meta">
              <strong>Ambulance Team</strong>
              <span>Fast response by TEAM</span>
            </div>
          </article>

          <article className="home-photo-card">
            <img src="/home/ingram-texas-a-fire-department.webp" alt="Police and fire extinguisher response" className="home-photo-img" />
            <div className="home-photo-meta">
              <strong>Police & Fire Response</strong>
              <span> Fire emegergencies response</span>
            </div>
          </article>

          <article className="home-photo-card">
            <img src="/home/police.webp" alt="Security response officers" className="home-photo-img" />
            <div className="home-photo-meta">
              <strong>Security Officers</strong>
              <span>receive security updates from officials</span>
            </div>
          </article>
        </div>
      </section>

      <section className="landing-features grid-3">
        <article className="card landing-feature-card">
          <h3>⚡ Real-Time Reporting</h3>
          <p>Submit reports with photos, location, and severity level for immediate response.</p>
        </article>
        <article className="card landing-feature-card">
          <h3>🗺️ Nearby Incidents</h3>
          <p>View emergency reports within 1km of your location on a live interactive map.</p>
        </article>
        <article className="card landing-feature-card">
          <h3>👤 Anonymous Option</h3>
          <p>Report incidents without revealing your identity when needed for safety.</p>
        </article>
        <article className="card landing-feature-card">
          <h3>📱 Social Engagement</h3>
          <p>Comment and like reports to help others stay informed and connected.</p>
        </article>
        <article className="card landing-feature-card">
          <h3>👨‍💼 Admin Updates</h3>
          <p>Track progress as administrators update status and actions taken on your report.</p>
        </article>
        <article className="card landing-feature-card">
          <h3>📞 Emergency Contacts</h3>
          <p>Quick access to Kenya emergency services and hotlines for immediate help.</p>
        </article>
      </section>
    </div>
  );
};

export default LandingPage;
