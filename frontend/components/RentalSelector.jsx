'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { formatPrice, getTomorrowDateStr, calculateRentalEndDate } from '../lib/utils';

export default function RentalSelector({ product, onConfigChange }) {
  const tomorrow = getTomorrowDateStr();
  const [selectedPill, setSelectedPill] = useState(3); // 1, 2, 3, 5, 7 or 'custom'
  const [customDays, setCustomDays] = useState(10);
  const [startDate, setStartDate] = useState(tomorrow);
  const [pricing, setPricing] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [isCheckingAvail, setIsCheckingAvail] = useState(false);
  const [customError, setCustomError] = useState('');

  const minDays = product?.minimumRentalDays || 1;
  const maxDays = product?.maximumRentalDays || 30;

  const activeDays = selectedPill === 'custom' ? parseInt(customDays, 10) || 1 : selectedPill;
  const endDate = calculateRentalEndDate(startDate, activeDays);

  // Fetch authoritative pricing quote from backend
  const fetchPriceQuote = useCallback(async (days) => {
    if (!product?.id || !days || days < 1) return;
    try {
      const res = await api.get(`/rentals/price?productId=${product.id}&days=${days}`);
      if (res && res.success && res.data) {
        setPricing(res.data);
      }
    } catch (err) {
      console.error('Failed to get rental price quote:', err);
    }
  }, [product?.id]);

  // Check inventory availability from backend
  const checkAvailability = useCallback(async (sDate, days) => {
    if (!product?.id || !sDate || !days) return;
    setIsCheckingAvail(true);
    try {
      const res = await api.post('/rentals/check-availability', {
        productId: product.id,
        startDate: sDate,
        rentalDays: days
      });
      if (res && res.success && res.data) {
        setAvailability(res.data);
      }
    } catch (err) {
      console.error('Availability check error:', err);
      setAvailability({ available: false, reason: 'Could not verify atelier availability.' });
    } finally {
      setIsCheckingAvail(false);
    }
  }, [product?.id]);

  useEffect(() => {
    if (activeDays >= minDays && activeDays <= maxDays) {
      setCustomError('');
      fetchPriceQuote(activeDays);
      checkAvailability(startDate, activeDays);
    } else {
      setCustomError(`Please enter a duration between ${minDays} and ${maxDays} days.`);
    }
  }, [activeDays, startDate, minDays, maxDays, fetchPriceQuote, checkAvailability]);

  // Propagate config back to parent modal/page
  useEffect(() => {
    if (pricing && onConfigChange) {
      onConfigChange({
        rentalDays: activeDays,
        rentalStartDate: startDate,
        rentalEndDate: endDate,
        rentalPrice: pricing.hirePrice || pricing.rentalPrice,
        securityDeposit: pricing.securityDeposit,
        totalRentalCost: pricing.totalEstimatedPrice || pricing.totalRentalCost,
        isAvailable: availability ? availability.available : true
      });
    }
  }, [pricing, availability, activeDays, startDate, endDate, onConfigChange]);

  const handlePillClick = (daysVal) => {
    setSelectedPill(daysVal);
  };

  const handleCustomChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setCustomDays(val);
  };

  const deposit = pricing ? pricing.securityDeposit : (product?.rentalDeposit || 0);
  const hireFee = pricing ? (pricing.hirePrice || pricing.rentalPrice) : 0;
  const totalCost = pricing ? (pricing.totalEstimatedPrice || pricing.totalRentalCost) : deposit;

  return (
    <div className="rental-config-section">
      {/* Duration Selector */}
      <div>
        <label className="rental-label">Select Rental Duration</label>
        <div className="rental-duration-pills">
          {[1, 2, 3, 5, 7].map((days) => (
            <button
              key={days}
              type="button"
              className={`duration-pill ${selectedPill === days ? 'active' : ''}`}
              onClick={() => handlePillClick(days)}
            >
              {days} {days === 1 ? 'Day' : 'Days'}
            </button>
          ))}
          <button
            type="button"
            className={`duration-pill duration-pill-custom ${selectedPill === 'custom' ? 'active' : ''}`}
            onClick={() => handlePillClick('custom')}
          >
            Custom
          </button>
        </div>

        {selectedPill === 'custom' && (
          <div className="custom-duration-wrap" style={{ marginTop: '12px' }}>
            <label className="custom-duration-label" htmlFor="customRentalDaysInput">
              ENTER NUMBER OF DAYS
            </label>
            <div className="custom-duration-input-row">
              <input
                type="number"
                id="customRentalDaysInput"
                className="custom-duration-input"
                min={minDays}
                max={maxDays}
                step="1"
                value={customDays}
                onChange={handleCustomChange}
              />
              <span className="custom-duration-hint">({minDays} to {maxDays} days)</span>
            </div>
            {customError && (
              <div style={{ color: '#991B1B', fontSize: '0.74rem', marginTop: '4px' }}>
                {customError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start Date & End Date */}
      <div style={{ marginTop: '14px' }}>
        <label className="rental-label" htmlFor="rentalStartDateInput">
          Select Rental Start Date
        </label>
        <input
          type="date"
          id="rentalStartDateInput"
          className="rental-date-input"
          min={tomorrow}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="rental-period-banner">
        Reserved Period: <strong>{startDate}</strong> &rarr; <strong>{endDate}</strong> ({activeDays} {activeDays === 1 ? 'Day' : 'Days'})
      </div>

      {/* Pricing Breakdown */}
      <div className="rental-cost-breakdown">
        <div className="rental-breakdown-row">
          <span>Rental Hire Fee:</span>
          <span style={{ fontWeight: 600 }}>{formatPrice(hireFee)}</span>
        </div>
        <div className="rental-breakdown-row">
          <span>Refundable Security Deposit:</span>
          <span style={{ fontWeight: 600, color: 'var(--gold-dark)' }}>
            {formatPrice(deposit)}
          </span>
        </div>
        <div className="rental-breakdown-row" style={{ fontSize: '0.72rem', color: '#065F46', fontStyle: 'italic' }}>
          <span>Deposit Refund:</span>
          <span>100% returned upon garment inspection</span>
        </div>
        <div className="rental-breakdown-row total-row">
          <span>Total Payable Today:</span>
          <span>{formatPrice(totalCost)}</span>
        </div>
      </div>

      {/* Availability Status */}
      <div style={{ textAlign: 'center' }}>
        {isCheckingAvail ? (
          <span className="avail-status-pill checking">Checking Atelier Availability...</span>
        ) : availability && availability.available ? (
          <span className="avail-status-pill available">
            ✓ Available for Selected Dates ({availability.remainingCapacity ?? 1} reserved unit available)
          </span>
        ) : (
          <span className="avail-status-pill unavailable">
            ✕ Dates Fully Reserved &bull; Please select alternate dates
          </span>
        )}
      </div>
    </div>
  );
}
