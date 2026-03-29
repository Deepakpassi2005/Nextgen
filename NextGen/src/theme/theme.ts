export const COLORS = {
  // Core Brand
  primary: '#4F46E5',      // Indigo-600
  primaryLight: '#818CF8', // Indigo-400
  primaryDark: '#3730A3',  // Indigo-800

  secondary: '#EC4899',    // Pink-500
  secondaryLight: '#F9A8D4',

  accent: '#F59E0B',       // Amber-500
  accentLight: '#FCD34D',

  // Semantic
  success: '#10B981',      // Emerald-500
  successLight: '#6EE7B7',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  warning: '#F59E0B',

  // Surfaces
  background: '#F8F9FF',   // Very subtle blue-tinted white
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1F5F9',

  // Text
  text: '#0F172A',         // Slate-900
  textSecondary: '#64748B', // Slate-500
  textTertiary: '#94A3B8', // Slate-400
  textOnDark: '#FFFFFF',

  // UI Chrome
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',

  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.85)',
  glassStrong: 'rgba(255, 255, 255, 0.95)',
  glassBorder: 'rgba(255, 255, 255, 0.6)',
  overlay: 'rgba(15, 23, 42, 0.5)',

  // Gradients (expressed as tuple pairs for use with LinearGradient)
  gradientPrimary: ['#4F46E5', '#7C3AED'] as const,
  gradientSuccess: ['#10B981', '#059669'] as const,
  gradientWarm: ['#F59E0B', '#EF4444'] as const,
  gradientPink: ['#EC4899', '#F43F5E'] as const,
  gradientTeal: ['#14B8A6', '#0891B2'] as const,
  gradientPurple: ['#8B5CF6', '#6366F1'] as const,

  // Bottom Tab
  tabActive: '#4F46E5',
  tabInactive: '#94A3B8',
  tabBackground: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const TYPOGRAPHY = {
  hero: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -1 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5 },
};
