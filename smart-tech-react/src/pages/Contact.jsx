import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <main>
      <div className="page-header">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We&apos;d love to hear from you</p>
        </div>
      </div>
      <div className="container section">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <p>Have a question about a product or your order? Our team is here to help.</p>
            <div className="contact-items">
              <div className="contact-item">
                <span className="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <div><strong>Email</strong><p>support@smarttech.com</p></div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.65a16 16 0 0 0 6 6l.91-1.09a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
                <div><strong>Phone</strong><p>+1 (800) 555-0100</p></div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                <div><strong>Hours</strong><p>Mon&ndash;Fri, 9am&ndash;6pm EST</p></div>
              </div>
            </div>
          </div>

          {sent ? (
            <div className="card text-center">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="1.5"/>
                  <polyline points="9 12 11 14 15 10" stroke="#10B981" strokeWidth="2"/>
                </svg>
              </div>
              <h3>Message Sent!</h3>
              <p>Thanks for reaching out. We&apos;ll get back to you within 24 hours.</p>
              <button className="btn btn-primary mt-2" onClick={() => setSent(false)}>Send Another</button>
            </div>
          ) : (
            <form className="card contact-form" onSubmit={handleSubmit}>
              <h2>Send a Message</h2>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input placeholder="Your name" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required /></div>
                <div className="form-group"><label>Email</label><input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required /></div>
              </div>
              <div className="form-group"><label>Subject</label><input placeholder="How can we help?" value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))} required /></div>
              <div className="form-group"><label>Message</label><textarea className="textarea" rows={5} placeholder="Tell us more..." value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} required /></div>
              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
