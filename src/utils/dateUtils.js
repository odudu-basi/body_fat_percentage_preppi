/**
 * Date utility functions that handle local timezone properly
 */

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get a specific date in YYYY-MM-DD format using local timezone
 * @param {Date} date - The date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current timestamp in ISO format (for created_at/updated_at fields)
 * @returns {string} ISO timestamp string
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Check if two dates are the same day (ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} True if same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Parse a date-only string (YYYY-MM-DD) in local timezone
 * Avoids timezone issues when parsing date strings
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in local timezone
 */
const parseDateLocal = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a date for display
 * @param {Date|string} date - The date to format (Date object or YYYY-MM-DD string)
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date) => {
  const d = typeof date === 'string' ? parseDateLocal(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default {
  getTodayLocalDate,
  getLocalDateString,
  getCurrentTimestamp,
  isSameDay,
  formatDateForDisplay,
};
