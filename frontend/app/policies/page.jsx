'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { brandInfo } from '../../lib/utils';

export default function PoliciesPage() {
  const { user } = useAuth();
  const { showToast } = useCart();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [orderRef, setOrderRef] = useState('');
  const [productName, setProductName] = useState('');
  const [requestType, setRequestType] = useState('Exchange');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!email) setEmail(user.email || '');
      if (!phone) setPhone(user.phone || '');
    }
  }, [user]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 3) {
      alert('You can upload up to 3 photos/videos.');
      return;
    }
    setFiles(selected);
    const previews = selected.map(file => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  const generateWhatsAppDirectLink = () => {
    let msg = `Hello House of Shubhanshi,\n\nI would like to initiate an Exchange/Return request:\n\n`;
    msg += `• Customer Name: ${name || user?.name || 'Patron'}\n`;
    if (phone || user?.phone) msg += `• Phone: ${phone || user?.phone}\n`;
    if (email || user?.email) msg += `• Email: ${email || user?.email}\n`;
    if (orderRef) msg += `• Order / Enquiry ID: #${orderRef}\n`;
    if (productName) msg += `• Product: ${productName}\n`;
    msg += `• Request Type: ${requestType}\n`;
    if (reason) msg += `• Reason: ${reason}\n`;
    if (description) msg += `• Details: ${description}\n`;
    msg += `\nI have unboxing photos/videos ready to share. Please advise me with next steps.\n\nThank you.`;
    return `https://wa.me/919560011351?text=${encodeURIComponent(msg)}`;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setErrorMsg('Please provide a phone number or email address so our concierge can reach you.');
      return;
    }
    if (!productName.trim()) {
      setErrorMsg('Please enter the product name.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please describe the issue or your request reason.');
      return;
    }

    try {
      setSubmitting(true);
      // Simulate/persist request submission
      await new Promise(resolve => setTimeout(resolve, 800));
      setSubmitted(true);
      showToast('Exchange / Return request submitted.');
    } catch (err) {
      setErrorMsg('Failed to submit request. Please contact us directly on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ paddingTop: '130px', minHeight: '85vh', paddingBottom: '90px', backgroundColor: '#FDFBF7' }}>
      <div className="container" style={{ maxWidth: '960px', padding: '0 20px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="section-tag" style={{ color: 'var(--gold)', letterSpacing: '0.18em' }}>
            ATELIER CLIENT CARE
          </span>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'var(--brown-dark)', margin: '6px 0 10px', fontWeight: 500 }}>
            POLICIES &amp; CARE GUIDELINES
          </h1>
          <div className="gold-divider" style={{ margin: '0 auto 16px' }}><span className="gold-divider-diamond"></span></div>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-brown)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>
            At House of Shubhanshi, every silhouette is handcrafted with meticulous artistry.
            Please review our exchange, refund, and care guidelines below.
          </p>
        </div>

        {/* POLICY CARDS CONTAINER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '56px' }}>
          
          {/* CARD 1: REFUND POLICY */}
          <div className="policy-card" style={{
            background: 'var(--white)',
            border: '1px solid var(--gold-border)',
            borderRadius: '4px',
            padding: 'clamp(24px, 4vw, 40px)',
            boxShadow: '0 8px 24px rgba(59, 29, 20, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(201, 160, 74, 0.12)',
                color: 'var(--gold-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
              }}>
                🛡️
              </div>
              <div>
                <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', margin: 0 }}>
                  Refund Policy
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', margin: '2px 0 0' }}>
                  We stand behind the craftsmanship and quality of our garments.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px', fontSize: '0.92rem', color: 'var(--brown-dark)', lineHeight: 1.8 }}>
              <p style={{ marginBottom: '14px' }}>
                Refunds or exchanges are strictly applicable for <strong>defective, damaged, or incorrect products</strong> received. If your piece arrives with:
              </p>
              
              <ul style={{ paddingLeft: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Manufacturing defects</strong> (seam stitching irregularities, fabric flaws, beadwork/embroidery tears)</li>
                <li><strong>Damaged in transit</strong> (outer packaging compromised, torn fabric during shipping)</li>
                <li><strong>Incorrect product delivered</strong> (differing from the piece or size confirmed via WhatsApp)</li>
                <li><strong>Missing items</strong> (accessories, dupattas, or belts absent from the parcel)</li>
              </ul>

              {/* Exclusion Box (Reference image style) */}
              <div style={{
                background: '#FFF8F6',
                border: '1px solid #E6C5BA',
                borderRadius: '4px',
                padding: '20px',
                marginTop: '16px'
              }}>
                <div style={{ fontWeight: 600, color: '#882218', fontSize: '0.92rem', marginBottom: '10px' }}>
                  Important: In accordance with luxury atelier standards, we do not offer refunds for:
                </div>
                <ul style={{ paddingLeft: '20px', margin: 0, color: '#682018', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Change of mind, personal preference, or buyer's remorse</li>
                  <li>Products that have been worn, laundered, perfume-scented, or tailored/altered</li>
                  <li>Products without original security tags, duster pouch, and atelier packaging intact</li>
                  <li>Slight color variations (resulting from natural handloom dyeing or mobile/monitor screen calibration)</li>
                  <li>Requests submitted after 48 hours of parcel delivery</li>
                </ul>
              </div>
            </div>
          </div>

          {/* CARD 2: HOW TO REQUEST EXCHANGE / REFUND */}
          <div className="policy-card" style={{
            background: 'var(--white)',
            border: '1px solid var(--gold-border)',
            borderRadius: '4px',
            padding: 'clamp(24px, 4vw, 40px)',
            boxShadow: '0 8px 24px rgba(59, 29, 20, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(201, 160, 74, 0.12)',
                color: 'var(--gold-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
              }}>
                ⏱️
              </div>
              <div>
                <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', margin: 0 }}>
                  How to Request Exchange / Refund
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', margin: '2px 0 0' }}>
                  Follow these steps to initiate your request with our concierge.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '22px' }}>
              <ol style={{ paddingLeft: '24px', margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.92rem', color: 'var(--brown-dark)', lineHeight: 1.7 }}>
                <li>
                  <strong>Contact us within 48 hours</strong> of receiving your parcel via WhatsApp at{' '}
                  <a href={brandInfo.whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold-dark)', fontWeight: 600, textDecoration: 'underline' }}>
                    +91 9560011351
                  </a>{' '}
                  or by emailing{' '}
                  <a href={`mailto:${brandInfo.email}`} style={{ color: 'var(--gold-dark)', fontWeight: 600, textDecoration: 'underline' }}>
                    {brandInfo.email}
                  </a>.
                </li>
                <li>
                  <strong>Provide your details:</strong> Include your full name, Enquiry Reference ID (if available), product name, and the specific reason for your exchange or refund request.
                </li>
                <li>
                  <strong>Share clear photos or video:</strong> Provide continuous 360° unboxing footage or high-resolution photos displaying the exact issue or defect.
                </li>
                <li>
                  <strong>Wait for review:</strong> Our atelier quality control team will inspect the details and respond with confirmation and shipping instructions within 24–48 hours.
                </li>
                <li>
                  <strong>Ship the product back:</strong> Pack the piece securely in its original packaging as directed. Keep the return courier tracking receipt safe until inspection is concluded.
                </li>
              </ol>
            </div>
          </div>

          {/* CARD 3: IMPORTANT TERMS & CONDITIONS */}
          <div className="policy-card" style={{
            background: 'var(--white)',
            border: '1px solid var(--gold-border)',
            borderRadius: '4px',
            padding: 'clamp(24px, 4vw, 40px)',
            boxShadow: '0 8px 24px rgba(59, 29, 20, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(201, 160, 74, 0.12)',
                color: 'var(--gold-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0
              }}>
                ℹ️
              </div>
              <div>
                <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', margin: 0 }}>
                  Important Terms &amp; Conditions
                </h2>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', margin: '2px 0 0' }}>
                  Please read carefully before confirming a purchase or rental.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <ul style={{ paddingLeft: '24px', margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--brown-dark)', lineHeight: 1.75 }}>
                <li>
                  <strong>Handcrafted Artistry:</strong> All pieces are handcrafted by Indian master karigars. Minor variations in weave, texture, threadwork, and embroidery placement are characteristics of authentic craftsmanship, not flaws.
                </li>
                <li>
                  <strong>Screen Display Variations:</strong> Garment colors may appear subtly different across mobile screens, monitors, and studio lighting. Slight variation within natural fabric tolerances is expected and is not valid grounds for refund.
                </li>
                <li>
                  <strong>Unboxing Video Requirement:</strong> A continuous, uncut unboxing video starting before opening the exterior courier seal is strictly required for transit damage, tear, or missing item claims.
                </li>
                <li>
                  <strong>Inspection Rights:</strong> We reserve the right to inspect and decline returned pieces that show evidence of wear, cosmetic staining, alteration, or perfume scent.
                </li>
                <li>
                  <strong>Settlement Method:</strong> Since purchases are coordinated directly via WhatsApp, approved refunds are transferred to the customer's bank account or UPI ID within 7–10 business days after garment inspection.
                </li>
                <li>
                  <strong>Sale &amp; Bespoke Pieces:</strong> Custom made-to-measure orders and sale archive pieces are eligible for complimentary size adjustments or exchange only, unless an irreparable defect exists.
                </li>
                <li>
                  <strong>Policy Modifications:</strong> House of Shubhanshi reserves the right to amend or update these terms at any time in accordance with atelier operational standards.
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* SECTION 4: RETURN / EXCHANGE OFFER REQUEST FORM */}
        <div id="request-form" style={{
          background: 'var(--white)',
          border: '1px solid var(--gold-border)',
          borderRadius: '4px',
          padding: 'clamp(28px, 4.5vw, 48px)',
          boxShadow: '0 10px 32px rgba(59, 29, 20, 0.06)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span className="section-tag" style={{ color: 'var(--gold)', letterSpacing: '0.14em' }}>
              ONLINE SUBMISSION
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', color: 'var(--brown-dark)', margin: '4px 0 8px', fontWeight: 500 }}>
              Exchange &amp; Return Request Form
            </h2>
            <div className="gold-divider" style={{ margin: '0 auto 12px' }}><span className="gold-divider-diamond"></span></div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-brown)', maxWidth: '580px', margin: '0 auto' }}>
              Fill in your details below to submit a formal request to our quality team, or connect directly via WhatsApp.
            </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', background: '#FDFBF7', border: '1px solid var(--gold-border)', borderRadius: '4px' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--gold)', marginBottom: '12px' }}>✓</div>
              <h3 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', marginBottom: '8px' }}>
                Request Received by the Atelier
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-brown)', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.7 }}>
                Thank you, {name}. Our team will review your enquiry and get back to you within 24–48 hours via WhatsApp or Email.
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={generateWhatsAppDirectLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                >
                  FOLLOW UP ON WHATSAPP
                </a>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="btn btn-gold-outline-dark"
                  style={{ padding: '12px 20px' }}
                >
                  SUBMIT ANOTHER ENQUIRY
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
              
              {errorMsg && (
                <div className="auth-alert error" style={{ marginBottom: '10px' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reqName">Full Name *</label>
                  <input
                    type="text"
                    id="reqName"
                    className="form-input"
                    placeholder="e.g. Shubha Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reqPhone">WhatsApp / Contact Phone *</label>
                  <input
                    type="tel"
                    id="reqPhone"
                    className="form-input"
                    placeholder="+91 95600 11351"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reqEmail">Email Address</label>
                  <input
                    type="email"
                    id="reqEmail"
                    className="form-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reqOrderRef">Order / Enquiry ID (If known)</label>
                  <input
                    type="text"
                    id="reqOrderRef"
                    className="form-input"
                    placeholder="e.g. HS10042"
                    value={orderRef}
                    onChange={(e) => setOrderRef(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reqProduct">Product Name *</label>
                  <input
                    type="text"
                    id="reqProduct"
                    className="form-input"
                    placeholder="e.g. Purple Embroidered Kurta Set"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reqType">Request Type *</label>
                  <select
                    id="reqType"
                    className="form-input"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    style={{ background: 'var(--white)', cursor: 'pointer' }}
                  >
                    <option value="Exchange">Exchange (Size / Fit adjustment)</option>
                    <option value="Defect or Damage Claim">Defect or Damage claim</option>
                    <option value="Wrong Item Received">Wrong item received</option>
                    <option value="Missing Item">Missing item from order</option>
                    <option value="Rental Return">Rental return &amp; deposit enquiry</option>
                    <option value="Other">Other enquiry</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reqReason">Reason Summary</label>
                <input
                  type="text"
                  id="reqReason"
                  className="form-input"
                  placeholder="Brief summary (e.g. Needs size M instead of S, seam flaw on left sleeve)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reqDesc">Detailed Description *</label>
                <textarea
                  id="reqDesc"
                  className="form-input"
                  rows="4"
                  placeholder="Please describe the issue in detail, condition of garment, date received, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reqFiles">
                  Attach Photo / Video Proof (Optional)
                </label>
                <input
                  type="file"
                  id="reqFiles"
                  className="form-input"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  style={{ padding: '8px 12px' }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-brown)', marginTop: '4px', display: 'block' }}>
                  Supported: JPG, PNG, WEBP, MP4 (Max 3 files). You can also share photos/videos directly on WhatsApp.
                </span>

                {filePreviews.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {filePreviews.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="Proof preview"
                        style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--gold-border)' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={submitting}
                  style={{ flex: 1, minWidth: '220px', padding: '16px', letterSpacing: '0.1em' }}
                >
                  {submitting ? 'SUBMITTING REQUEST...' : 'SUBMIT REQUEST'}
                </button>

                <a
                  href={generateWhatsAppDirectLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold-outline-dark"
                  style={{
                    flex: 1,
                    minWidth: '240px',
                    padding: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    letterSpacing: '0.08em',
                    color: 'var(--brown-dark)'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  PREFER WHATSAPP? CONTACT US DIRECTLY
                </a>
              </div>
            </form>
          )}
        </div>

      </div>
    </main>
  );
}
