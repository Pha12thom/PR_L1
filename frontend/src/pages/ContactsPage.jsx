import { useEffect, useState } from 'react';
import api from '../api/client';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/contacts')
      .then((res) => setContacts(res.data.contacts || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container section">Loading emergency contacts...</div>;

  return (
    <div className="container section">
      <h2>🚨 Kenya Emergency Contacts</h2>
      <p style={{ marginBottom: '24px', fontSize: '1.05rem' }}>
        Quick access to emergency services across Kenya. Save these numbers for urgent situations.
      </p>

      <div className="grid-2">
        {contacts.map((contact) => (
          <article key={contact.id} className="card" style={{ position: 'relative' }}>
            <h4 style={{ color: 'var(--kenya-red)' }}>{contact.name}</h4>
            <p style={{ fontSize: '0.95rem' }}>{contact.description}</p>
            <div
              style={{
                backgroundColor: 'var(--light-gray)',
                padding: '12px',
                borderRadius: '6px',
                marginTop: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '6px' }}>
                Call
              </div>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: '700',
                  color: 'var(--kenya-red)',
                  letterSpacing: '2px',
                }}
              >
                {contact.phone}
              </div>
            </div>
            <button
              className="btn"
              style={{ marginTop: '12px', width: '100%' }}
              onClick={() => {
                if (contact.phone) {
                  window.location.href = `tel:${contact.phone}`;
                }
              }}
            >
              Call Now
            </button>
          </article>
        ))}
      </div>

      <article
        className="card"
        style={{ marginTop: '32px', backgroundColor: 'rgba(206, 17, 38, 0.05)' }}
      >
        <h3>📱 Tips for Emergency Calls</h3>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li>State the location of emergency clearly</li>
          <li>Describe the situation calmly and accurately</li>
          <li>Stay on the line until help arrives</li>
          <li>For life-threatening emergencies, always call 999 first</li>
          <li>Use ResQ Kenya to document incidents for future reference</li>
        </ul>
      </article>
    </div>
  );
};

export default ContactsPage;
