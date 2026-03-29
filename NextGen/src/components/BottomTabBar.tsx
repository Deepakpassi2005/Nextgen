import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, SHADOWS } from '../theme/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const Icon = options.tabBarIcon as any;
          const badge = (options as any).tabBarBadge;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
                {Icon && (
                  <Icon
                    size={22}
                    color={isFocused ? COLORS.surface : COLORS.tabInactive}
                    strokeWidth={isFocused ? 2.5 : 1.8}
                  />
                )}
                {badge !== undefined && badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Keep existing styles...
const styles = StyleSheet.create({
  container: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: COLORS.tabBackground,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeIconWrapper: {
    backgroundColor: COLORS.primary,
    width: 60,
    borderRadius: 20,
    ...SHADOWS.md,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.tabInactive,
    marginTop: 1,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});

export default BottomTabBar;
