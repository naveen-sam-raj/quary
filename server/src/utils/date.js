/**
 * Date utilities for Asia/Kolkata timezone
 * Asia/Kolkata has a constant UTC+5:30 offset with no daylight saving time.
 */

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19,800,000 ms

/**
 * Returns a Date object representing the start of the day (00:00:00.000 IST)
 * for a given date or current time.
 * @param {Date|string|number} [date=new Date()]
 * @returns {Date}
 */
export const getStartOfDayIST = (date = new Date()) => {
  const d = new Date(date);
  const istTime = new Date(d.getTime() + IST_OFFSET_MS);
  const y = istTime.getUTCFullYear();
  const m = istTime.getUTCMonth();
  const day = istTime.getUTCDate();
  return new Date(Date.UTC(y, m, day) - IST_OFFSET_MS);
};

/**
 * Returns a Date object representing the end of the day (23:59:59.999 IST)
 * for a given date or current time.
 * @param {Date|string|number} [date=new Date()]
 * @returns {Date}
 */
export const getEndOfDayIST = (date = new Date()) => {
  const d = new Date(date);
  const istTime = new Date(d.getTime() + IST_OFFSET_MS);
  const y = istTime.getUTCFullYear();
  const m = istTime.getUTCMonth();
  const day = istTime.getUTCDate();
  return new Date(Date.UTC(y, m, day, 23, 59, 59, 999) - IST_OFFSET_MS);
};

/**
 * Adds calendar days to a date in IST and returns the end of that day.
 * @param {Date|string|number} date
 * @param {number} days
 * @returns {Date}
 */
export const addDaysIST = (date, days) => {
  const d = new Date(date);
  const istTime = new Date(d.getTime() + IST_OFFSET_MS);
  const y = istTime.getUTCFullYear();
  const m = istTime.getUTCMonth();
  const day = istTime.getUTCDate() + days;
  return new Date(Date.UTC(y, m, day, 23, 59, 59, 999) - IST_OFFSET_MS);
};

/**
 * Calculates remaining calendar days in Asia/Kolkata timezone.
 * Returns null if validTill is null (e.g. Treasury batches with no expiry).
 * @param {Date|string|null} validTill
 * @param {Date|string|number} [fromDate=new Date()]
 * @returns {number|null}
 */
export const getDaysLeftIST = (validTill, fromDate = new Date()) => {
  if (!validTill) return null;
  const startOfFrom = getStartOfDayIST(fromDate);
  const startOfValid = getStartOfDayIST(validTill);
  const diffMs = startOfValid.getTime() - startOfFrom.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
};

/**
 * Checks whether a batch is expired in Asia/Kolkata timezone.
 * Rule: A batch is expired only after the END of its validTill day.
 * @param {Date|string|null} validTill
 * @param {Date|string|number} [currentDate=new Date()]
 * @returns {boolean}
 */
export const isExpiredIST = (validTill, currentDate = new Date()) => {
  if (!validTill) return false;
  const startOfToday = getStartOfDayIST(currentDate);
  const validTillDate = new Date(validTill);
  return validTillDate.getTime() < startOfToday.getTime();
};
