// Placeholder for constants (e.g., API endpoints, colors, dimensions)
export const COLORS = {
  primary: '#111827',
  secondary: '#f3f4f6',
  accent: '#3b82f6',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: 'rgba(229,231,235,0.9)',
} as const;

export const MAP_CONFIG = {
  defaultDelta: 0.01,
  nearbyRadiusM: 1500,
  maxDistanceM: 150,
} as const;

export const UI = {
  borderRadius: {
    small: 12,
    medium: 16,
    large: 22,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
} as const;
