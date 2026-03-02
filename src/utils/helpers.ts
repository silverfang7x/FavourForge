// Placeholder for helper/utility functions (e.g., validation, formatting)

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function formatCoords(lat: number, lon: number, precision = 5): string {
  return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
}

export function truncate(str: string, maxLength: number, suffix = '…'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}
