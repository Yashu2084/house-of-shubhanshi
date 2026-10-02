'use client';

import React from 'react';

const ORDER_STEPS = [
  { key: 'WHATSAPP_ENQUIRY', label: 'Enquiry Received', desc: 'Atelier Consultation Logged' },
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Karigari & Sizing Finalized' },
  { key: 'DISPATCHED', label: 'Dispatched', desc: 'Handcrafted Packaging Sealed' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'En Route to Destination' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Safely Arrived in Your Wardrobe' }
];

const RENTAL_STEPS = [
  { key: 'WHATSAPP_ENQUIRY', label: 'Rental Enquiry', desc: 'Dates & Fitting Logged' },
  { key: 'RESERVED', label: 'Reserved', desc: 'Dates & Piece Locked' },
  { key: 'ACTIVE', label: 'Active Rental', desc: 'Atelier Piece in Patron Care' },
  { key: 'RETURN_PENDING', label: 'Return Pending', desc: 'Scheduled Courier Pickup' },
  { key: 'RETURNED', label: 'Returned & Inspected', desc: 'Deposit Refund Processed' }
];

function normalizeStepIndex(status, isRental) {
  if (!status) return 0;
  const s = String(status).toUpperCase();
  if (s === 'WHATSAPP_ENQUIRY' || s === 'PENDING_WHATSAPP_CONFIRMATION' || s === 'PENDING') return 0;
  if (s === 'CONFIRMED' || s === 'RECEIVED') return 1;
  if (s === 'RESERVED') return 1;
  if (s === 'DISPATCHED' || s === 'ACTIVE') return 2;
  if (s === 'OUT_FOR_DELIVERY' || s === 'RETURN_PENDING') return 3;
  if (s === 'DELIVERED' || s === 'RETURNED') return 4;

  const steps = isRental ? RENTAL_STEPS : ORDER_STEPS;
  const idx = steps.findIndex(step => step.key === s);
  return idx >= 0 ? idx : 0;
}

export default function OrderTimeline({ status = 'WHATSAPP_ENQUIRY', isRental = false }) {
  const steps = isRental ? RENTAL_STEPS : ORDER_STEPS;
  const currentIndex = normalizeStepIndex(status, isRental);

  return (
    <div className="order-timeline-wrap" style={{ margin: '24px 0' }}>
      <div className="status-timeline-horizontal">
        {steps.map((step, idx) => {
          const isDone = currentIndex >= idx;
          const isCurrent = currentIndex === idx;

          let stepClass = 'step-pending';
          if (isCurrent) stepClass = 'step-current';
          else if (isDone) stepClass = 'step-completed';

          return (
            <div key={step.key} className={`timeline-node ${stepClass}`}>
              <div className="timeline-node-dot">
                {isDone && !isCurrent ? '✓' : (idx + 1)}
              </div>
              <div className="timeline-node-content">
                <span className="timeline-node-label">{step.label}</span>
                <span className="timeline-node-desc">{step.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

