import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import apiClient from '../../api/client';
import { ClipboardList, Clock, CheckCircle, AlertCircle, ChevronRight, Home, CheckSquare, Bell, User } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PageHeader from '../../components/PageHeader';

import { StackNavigationProp } from '@react-navigation/stack';

const AssignmentListScreen = ({ navigation }: { navigation: StackNavigationProp<any> }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [subjects, setSubjects] = useState<string[]>(['All']);

  const fetchAssignments = async () => {
    try {
      const response = await apiClient.get('/student/assignments');
      const data = response.data.data || [];
      setAssignments(data);
      
      // Extract unique subjects
      const uniqueSubjects = ['All', ...new Set(data.map((a: any) => a.subjectId?.name).filter(Boolean))];
      setSubjects(uniqueSubjects as string[]);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
    const unsubscribe = navigation.addListener('focus', fetchAssignments);
    return unsubscribe;
  }, [navigation]);

  const getStatus = (item: any) => {
    return item.status || 'pending';
  };

  const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    submitted: { color: COLORS.success, bg: COLORS.success + '15', icon: CheckCircle, label: 'Submitted' },
    overdue:   { color: COLORS.error,   bg: COLORS.error   + '15', icon: AlertCircle, label: 'Overdue'   },
    pending:   { color: '#F59E0B',      bg: '#F59E0B15',           icon: Clock,       label: 'Pending'   },
  };

  const renderItem = ({ item, index }: any) => {
    const status = getStatus(item);
    const cfg = statusConfig[status];
    const Icon = cfg.icon;
    const dueDate = new Date(item.dueDate);

    return (
      <Animated.View entering={FadeInDown.delay(index * 70).springify()}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('AssignmentSubmit', { assignment: item })}
        >
          <View style={[styles.cardLeft, { backgroundColor: COLORS.primary + '12' }]}>
            <ClipboardList size={22} color={COLORS.primary} strokeWidth={2} />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Icon size={11} color={cfg.color} strokeWidth={2.5} />
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={styles.cardSubject}>{item.subjectId?.name || 'Subject'}</Text>
            <View style={styles.cardMeta}>
              <Clock size={12} color={COLORS.textTertiary} strokeWidth={2} />
              <Text style={styles.cardMetaText}>
                Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              {item.grade && (
                <View style={styles.gradePill}>
                  <Text style={styles.gradeText}>Grade: {item.grade}</Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Assignments"
        subtitle="Submit your work"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject}
              style={[styles.filterChip, selectedSubject === subject && styles.filterChipActive]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text style={[styles.filterChipText, selectedSubject === subject && styles.filterChipTextActive]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : assignments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No Assignments</Text>
          <Text style={styles.emptySubtitle}>You have no pending assignments yet.</Text>
        </View>
      ) : (
        <FlatList
          data={assignments.filter(a => selectedSubject === 'All' || a.subjectId?.name === selectedSubject)}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAssignments(); }}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    gap: 12,
    ...SHADOWS.card,
  },
  cardLeft: {
    width: 46,
    height: 46,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  cardSubject: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '500' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500' },
  gradePill: {
    marginLeft: 8,
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  gradeText: { fontSize: 11, color: COLORS.success, fontWeight: '700' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  
  filterContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
});

export default AssignmentListScreen;
