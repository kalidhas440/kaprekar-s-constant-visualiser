/* ============================================================
   kaprekar.js — Core Kaprekar routine and input validation
   ============================================================ */

/**
 * Pad a number to exactly 4 digits with leading zeros.
 * @param {number} n
 * @returns {string} 4-character string
 */
export function padToFour(n) {
  return String(n).padStart(4, '0');
}

/**
 * Validate a raw input string.
 * Returns { valid: true, value: number } or { valid: false, reason: string }.
 */
export function validateInput(raw) {
  const trimmed = raw.trim();

  if (trimmed === '') {
    return { valid: false, reason: 'Please enter a number.' };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, reason: 'Only digits (0-9) are allowed.' };
  }

  const num = parseInt(trimmed, 10);

  if (num < 1 || num > 9999) {
    return { valid: false, reason: 'Enter a number between 1 and 9999.' };
  }

  // Check if all digits are identical after padding
  const padded = padToFour(num);
  if (new Set(padded.split('')).size === 1) {
    return {
      valid: false,
      reason: `All digits are the same (${padded}). The routine won't converge — try a number with at least two different digits.`,
    };
  }

  return { valid: true, value: num };
}

/**
 * Perform one Kaprekar step.
 * @param {number} num — current number (0–9999)
 * @returns {{ descending: string, ascending: string, difference: number }}
 */
export function kaprekarStep(num) {
  const digits = padToFour(num).split('');
  const descending = digits.slice().sort((a, b) => b - a).join('');
  const ascending  = digits.slice().sort((a, b) => a - b).join('');
  const difference = parseInt(descending, 10) - parseInt(ascending, 10);
  return { descending, ascending, difference };
}

/**
 * Compute the full sequence of Kaprekar steps from `start` to 6174.
 *
 * Each entry in the returned array is:
 *   { current: number, descending: string, ascending: string, next: number }
 *
 * The last entry will have next === 6174 (or current === 6174 if
 * the starting number is already 6174).
 *
 * Safety cap: 10 iterations (the proven maximum for base-10 4-digit
 * numbers is 7, so 10 is more than enough).
 *
 * @param {number} start
 * @returns {Array<Object>}
 */
export function computeSequence(start) {
  const steps = [];
  let current = start;
  const MAX_ITER = 10;

  for (let i = 0; i < MAX_ITER; i++) {
    if (current === 6174 && i > 0) break; // converged on a previous step

    const { descending, ascending, difference } = kaprekarStep(current);
    steps.push({
      step: i + 1,
      current,
      currentPadded: padToFour(current),
      descending,
      ascending,
      next: difference,
    });

    if (difference === 6174) break;
    current = difference;
  }

  return steps;
}
