import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../theme/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  color?: string;      // gradient/background color
  dark?: boolean;      // white text mode (for colored headers)
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightElement,
  color,
  dark = false,
}) => {
  const textColor = dark ? '#FFFFFF' : COLORS.text;
  const subColor = dark ? 'rgba(255,255,255,0.7)' : COLORS.textSecondary;
  const iconBg = dark ? 'rgba(255,255,255,0.2)' : COLORS.surfaceMuted;

  return (
    <View style={[styles.header, color ? { backgroundColor: color } : styles.lightHeader]}>
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} backgroundColor={color || COLORS.surface} />

      {onBack && (
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: iconBg }]} onPress={onBack}>
          <ArrowLeft size={20} color={textColor} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text> : null}
      </View>

      {rightElement ? (
        <View style={styles.right}>{rightElement}</View>
      ) : (
        <View style={styles.right} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  lightHeader: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  right: { minWidth: 40 },
});

export default PageHeader;
