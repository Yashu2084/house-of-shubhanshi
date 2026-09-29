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
