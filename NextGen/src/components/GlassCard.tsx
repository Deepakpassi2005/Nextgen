import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { COLORS } from '../theme/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  elevated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, elevated = false }) => (
  <View style={[styles.card, elevated && styles.elevated, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#94A3B8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 10px rgba(148,163,184,0.12)' },
    }),
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 16px rgba(79,70,229,0.12)' },
    }),
  },
});

export default GlassCard;
