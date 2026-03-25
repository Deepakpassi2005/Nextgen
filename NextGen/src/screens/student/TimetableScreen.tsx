import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import apiClient from '../../api/client';
import { Clock, BookOpen, User as UserIcon, Home, CheckSquare, Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PageHeader from '../../components/PageHeader';

import { StackNavigationProp } from '@react-navigation/stack';

const TimetableScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const response = await apiClient.get('/student/timetable');
        setData(response.data.data);
      } catch (error) {
        console.error('Error fetching student timetable', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  const currentDaySchedule = useMemo(() => {
    if (!data?.slots) return [];
    return data.slots.filter((slot: any) => slot.day === activeDay);
  }, [data?.slots, activeDay]);

  const subjectColors = ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#6366F1', '#14B8A6'];

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Timetable" subtitle="Your Schedule" onBack={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="Timetable"
        subtitle={data?.className || 'Your Schedule'}
        onBack={() => navigation.goBack()}
      />

      {/* Day Selector */}
      <View style={styles.daySelectorWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {days.map((day) => {
            const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const isActive = activeDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, isActive && styles.dayChipActive]}
                onPress={() => setActiveDay(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayChipAbbr, isActive && styles.dayChipAbbrActive]}>
                  {day.substring(0, 3)}
                </Text>
                {isToday && <View style={[styles.todayDot, isActive && styles.todayDotActive]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Count Badge */}
      <View style={styles.countRow}>
        <Text style={styles.activeDay}>{activeDay}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{currentDaySchedule.length} classes</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentDaySchedule.length > 0 ? (
          currentDaySchedule.map((slot: any, index: number) => {
            const color = subjectColors[index % subjectColors.length];
            return (
              <Animated.View key={slot._id || index} entering={FadeInDown.delay(index * 80).springify()}>
                <View style={styles.card}>
                  <View style={[styles.cardAccent, { backgroundColor: color }]} />
                  <View style={styles.cardBody}>
                    <Text style={styles.subjectName}>{slot.subjectId?.name || 'Subject'}</Text>
                    <View style={styles.metaRow}>
                      <UserIcon size={13} color={COLORS.textSecondary} strokeWidth={2} />
                      <Text style={styles.metaText}>{slot.teacherId?.name || 'Teacher'}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <View style={[styles.timeChip, { backgroundColor: color + '15' }]}>
                      <Clock size={12} color={color} strokeWidth={2.5} />
                      <Text style={[styles.timeText, { color }]}>{slot.timeSlot}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📆</Text>
            <Text style={styles.emptyTitle}>No Classes</Text>
            <Text style={styles.emptySubtitle}>No classes scheduled for {activeDay}</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  daySelectorWrap: {
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dayRow: { paddingHorizontal: 16, gap: 10 },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    minWidth: 60,
  },
  dayChipActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  dayChipAbbr: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  dayChipAbbrActive: { color: '#FFF' },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 4 },
  todayDotActive: { backgroundColor: 'rgba(255,255,255,0.7)' },

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeDay: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  countBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  countText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 12,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardAccent: { width: 5, borderTopLeftRadius: BORDER_RADIUS.lg, borderBottomLeftRadius: BORDER_RADIUS.lg },
  cardBody: { flex: 1, padding: 16 },
  subjectName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  cardRight: { justifyContent: 'center', paddingRight: 16 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    gap: 5,
  },
  timeText: { fontSize: 12, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary },
});

export default TimetableScreen;
