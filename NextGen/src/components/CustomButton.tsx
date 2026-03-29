import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
  style?: any;
}

export const CustomButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
  style
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary': return [styles.button, { backgroundColor: COLORS.secondary }];
      case 'outline': return [styles.button, styles.outlineButton];
      default: return styles.button;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline': return [styles.text, { color: COLORS.primary }];
      default: return styles.text;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : '#FFF'} />
      ) : (
        <View style={styles.content}>
          <Text style={getTextStyle()}>{title}</Text>
          {!!(icon) && <View style={styles.icon}>{typeof icon === 'string' ? <Text style={getTextStyle()}>{icon}</Text> : icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    height: 55,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    elevation: 0,
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: SPACING.sm,
  }
});
