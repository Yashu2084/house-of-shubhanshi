// ==============================================================================
// HOUSE OF SHUBHANSHI — UTILITY HELPERS
// ==============================================================================

export const brandInfo = {
  name: 'House of Shubhanshi',
  tagline: 'Wear the Dream',
  email: 'Houseofshubhanshi@gmail.com',
  phone: '+91 9560011351',
  phoneTel: '+919560011351',
  instagram: '@houseofshubhanshi',
  instagramUrl: 'https://www.instagram.com/houseofshubhanshi/',
  whatsappUrl: 'https://wa.me/919560011351'
};

/**
 * Format numbers in Indian Rupee format (e.g. 48500 -> "₹48,500")
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '₹0';
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Format a Date to YYYY-MM-DD
 */
export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate Rental End Date
 * Formula: startDate + (days - 1)
 */
export function calculateRentalEndDate(startDateStr, days) {
  if (!startDateStr || !days) return '';
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return '';
  const start = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  start.setDate(start.getDate() + (parseInt(days, 10) - 1));
  return formatDate(start);
}

/**
 * Get tomorrow's date formatted as YYYY-MM-DD
 */
export function getTomorrowDateStr() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

/**
 * Format display date (e.g. "29 Sep 2026")
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Generate official WhatsApp Direct link for House of Shubhanshi
 */
export function getWhatsAppUrl(message) {
  const phone = '919560011351';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate formatted WhatsApp message for a single product enquiry
 */
export function createSingleProductWhatsAppMessage({
  productName,
  requestType = 'Purchase',
  price,
  rentalDuration,
  rentalStartDate,
  rentalEndDate,
  length,
  customLength,
  customerName,
  phone,
  email,
  notes
}) {
  let msg = `Hello House of Shubhanshi,\n\nI would like to enquire about this piece:\n\n`;
  msg += `Product: ${productName}\n\n`;
  msg += `Request Type: ${requestType}\n\n`;
  msg += `Price: ${typeof price === 'number' ? `₹${price.toLocaleString('en-IN')}` : price}\n\n`;

  if (requestType.toLowerCase().includes('rent')) {
    if (rentalDuration) msg += `Rental Duration: ${rentalDuration} Days\n\n`;
    if (rentalStartDate && rentalEndDate) {
      msg += `Rental Dates: ${rentalStartDate} to ${rentalEndDate}\n\n`;
    }
  }

  if (length) {
    msg += `Length: ${length}\n\n`;
  }
  if (customLength) {
    msg += `Custom Length: ${customLength}\n\n`;
  }

  if (customerName) msg += `Customer Name: ${customerName}\n\n`;
  if (phone) msg += `Phone: ${phone}\n\n`;
  if (email) msg += `Email: ${email}\n\n`;
  if (notes) msg += `Special Notes: ${notes}\n\n`;

  msg += `Please guide me with the next steps, availability and payment details.\n\nThank you.`;
  return msg;
}

/**
 * Generate formatted WhatsApp message for multi-item selection enquiry
 */
export function createSelectionWhatsAppMessage({
  items,
  customerName,
  phone,
  email,
  address,
  notes,
  garmentsSubtotal,
  depositsTotal,
  grandTotal
}) {
  let msg = `Hello House of Shubhanshi,\n\nI would like to enquire about the following pieces from my selection:\n\n`;

  items.forEach((item, index) => {
    const isRental = item.purchaseType === 'RENT';
    msg += `${index + 1}. ${item.name}\n`;
    if (isRental) {
      msg += `   Rental — ${item.rentalDays || 3} Days\n`;
      msg += `   Rental Price: ₹${Number(item.rentalPrice || 0).toLocaleString('en-IN')}\n`;
      if (item.rentalStartDate && item.rentalEndDate) {
        msg += `   Dates: ${item.rentalStartDate} to ${item.rentalEndDate}\n`;
      }
      if (item.securityDeposit > 0) {
        msg += `   Security Deposit (Refundable): ₹${Number(item.securityDeposit).toLocaleString('en-IN')}\n`;
      }
    } else {
      msg += `   Purchase\n`;
      msg += `   Price: ₹${Number(item.price || 0).toLocaleString('en-IN')}\n`;
      if (item.quantity > 1) {
        msg += `   Quantity: ${item.quantity}\n`;
      }
    }
    if (item.length) {
      msg += `   Length: ${item.length}\n`;
    }
    if (item.customLength) {
      msg += `   Custom Length: ${item.customLength}\n`;
    }
    msg += `\n`;
  });

  if (garmentsSubtotal !== undefined) {
    msg += `Garments Subtotal: ₹${Number(garmentsSubtotal).toLocaleString('en-IN')}\n`;
  }
  if (depositsTotal > 0) {
    msg += `Security Deposit: ₹${Number(depositsTotal).toLocaleString('en-IN')}\n`;
  }
  if (grandTotal !== undefined) {
    msg += `Estimated Total: ₹${Number(grandTotal).toLocaleString('en-IN')}\n\n`;
  }

  msg += `Customer Details:\n`;
  if (customerName) msg += `Customer Name: ${customerName}\n`;
  if (phone) msg += `Phone: ${phone}\n`;
  if (email) msg += `Email: ${email}\n`;
  if (address) msg += `Delivery Destination: ${address}\n`;
  if (notes) msg += `Special Notes: ${notes}\n`;

  msg += `\nPlease guide me with the next steps, availability and payment details.\n\nThank you.`;
  return msg;
}

