const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <h4>ResQ Kenya</h4>
          <p>National emergency reporting and coordinated response platform.</p>
          <p className="footer-muted">Fast reporting. Verified updates. Safer communities.</p>
        </div>
        <div>
          <h5>Quick Access</h5>
          <ul className="footer-list">
            <li>Nearby Incidents</li>
            <li>Community Updates</li>
            <li>Emergency Contacts</li>
          </ul>
        </div>
        <div>
          <h5>Emergency Hotlines</h5>
          <ul className="footer-list">
            <li>Police: 999</li>
            <li>Ambulance: 1199</li>
            <li>Fire & Rescue: 112</li>
          </ul>
        </div>
        <div>
          <h5>Trust & Safety</h5>
          <p className="footer-muted">Anonymous reporting is supported. Location is used only for incident response relevance.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© 2026 ResQ Kenya. Built for Kenya, aligned with public service standards.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
