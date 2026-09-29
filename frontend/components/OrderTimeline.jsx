'use client';

import React from 'react';

const ORDER_STEPS = [
  { key: 'RECEIVED', label: 'Order Received', desc: 'Crafting & Karigari Commenced' },
  { key: 'DISPATCHED', label: 'Dispatched', desc: 'Handcrafted Packaging Sealed' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'En Route to Destination' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Safely Arrived in Your Wardrobe' }
];

const RENTAL_STEPS = [
  { key: 'RESERVED', label: 'Reserved', desc: 'Dates & Piece Locked' },
  { key: 'ACTIVE', label: 'Active Rental', desc: 'Atelier Piece in Patron Care' },
  { key: 'RETURN_PENDING', label: 'Return Pending', desc: 'Scheduled Courier Pickup' },
  { key: 'RETURNED', label: 'Returned & Inspected', desc: 'Deposit Refund Processed' }
];

export default function OrderTimeline({ status = 'RECEIVED', isRental = false }) {
  const steps = isRental ? RENTAL_STEPS : ORDER_STEPS;
  const currentIndex = steps.findIndex(s => s.key === status);

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
