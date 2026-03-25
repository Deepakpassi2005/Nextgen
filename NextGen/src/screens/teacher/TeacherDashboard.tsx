import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
} from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  Users, Calendar, Clock, BookOpen, Bell,
  User, ChevronRight, TrendingUp,
  PlusCircle, ClipboardList, CheckSquare,
  Home, LogOut, FileText, Settings,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TeacherStackParamList = {
  TeacherDashboard: undefined;
  MarkAttendance: undefined;
  Punching: undefined;
  QuizManagement: undefined;
  ResultManagement: undefined;
  StudyMaterial: undefined;
  StudyMaterialUpload: undefined;
  Messaging: undefined;
  AssignmentManagement: undefined;
  Profile: undefined;
  NoticeHistory: undefined;
  SendNotice: { editNotice?: any } | undefined;
  NoticeDetail: { notice: any };
};

const parseTimeSlot = (timeStr: string) => {
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  } catch (e) {
    return new Date(0);
  }
};

// ─── Quick Action Card ────────────────────────────────────────────────────────
const ActionCard = ({ icon: Icon, label, sublabel, color, bgColor, onPress, index, hasUpdate, badge }: any) => (
  <Animated.View
    entering={FadeInDown.delay(index * 80).springify()}
    style={styles.actionCardWrapper}
  >
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.actionIconBg, { backgroundColor: bgColor }]}>
        <Icon size={24} color={color} strokeWidth={2} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      {sublabel && <Text style={styles.actionSublabel}>{sublabel}</Text>}
      {badge !== undefined && badge > 0 && (
        <View style={[styles.actionBadge, { backgroundColor: color }]}>
          <Text style={styles.actionBadgeText}>{badge}</Text>
        </View>
      )}
      {hasUpdate && <View style={styles.notificationDot} />}
    </TouchableOpacity>
  </Animated.View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TeacherDashboard = ({ navigation }: { navigation: StackNavigationProp<TeacherStackParamList> }) => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime] = useState(new Date());
  const [seenStatus, setSeenStatus] = useState<Record<string, string>>({});

  const checkSeenStatus = async (dashboardData: any) => {
    if (!dashboardData) return;
    const noticeVal = await AsyncStorage.getItem('@seen_teacher_notice');
    const submissionVal = await AsyncStorage.getItem('@seen_teacher_submission');
    setSeenStatus({
      notice: noticeVal || '',
      submission: submissionVal || '',
    });
  };

  const markAsSeen = async (category: string, id: string) => {
    if (!id) return;
    await AsyncStorage.setItem(`@seen_teacher_${category}`, id);
    setSeenStatus(prev => ({ ...prev, [category]: id }));
  };

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/teacher/dashboard');
      const d = response.data.data;
      setData(d);
      await checkSeenStatus(d);
    } catch (error) {
      console.error('Error fetching teacher dashboard', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    if (isFocused) fetchDashboardData(); 
  }, [isFocused]);

  const onRefresh = () => { setRefreshing(true); fetchDashboardData(); };

  const greetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const API_BASE = apiClient.defaults.baseURL?.replace('/api', '') || '';
  const avatarUri = data?.profilePhoto ? `${API_BASE}/${data.profilePhoto}` : null;
  const name = data?.teacherName || user?.name || 'Teacher';

  const actions = [
    { 
      icon: CheckSquare, label: 'Attendance', sublabel: 'Mark students', color: '#4F46E5', bgColor: '#EEF2FF', 
      onPress: () => navigation.navigate('MarkAttendance'),
    },
    { icon: Users,       label: 'Punching',   sublabel: 'Track presence',  color: '#8B5CF6', bgColor: '#F5F3FF', onPress: () => navigation.navigate('Punching') },
    { 
      icon: PlusCircle,  label: 'Quizzes',    sublabel: 'Manage tests',   color: '#10B981', bgColor: '#ECFDF5', 
      onPress: () => navigation.navigate('QuizManagement'),
      badge: data?.pendingQuizzes?.length
    },
    { 
      icon: Bell,        
      label: 'Notices',    
      sublabel: (data?.latestNotice?._id && data?.latestNotice?._id !== seenStatus.notice) ? 'New updates' : 'Send & view',   
      color: '#F59E0B', 
      bgColor: '#FFFBEB', 
      hasUpdate: !!(data?.latestNotice?._id && data?.latestNotice?._id !== seenStatus.notice),
      badge: data?.importantNotices?.length,
      onPress: () => {
        if (data?.latestNotice?._id) markAsSeen('notice', data?.latestNotice?._id);
        navigation.navigate('NoticeHistory');
      } 
    },
    { icon: TrendingUp,  label: 'Results',    sublabel: 'Grade & marks',  color: '#F97316', bgColor: '#FFF7ED', onPress: () => navigation.navigate('ResultManagement') },
    { icon: BookOpen,    label: 'Materials',  sublabel: 'Upload files',   color: '#EC4899', bgColor: '#FDF2F8', onPress: () => navigation.navigate('StudyMaterial') },
    { 
      icon: ClipboardList, 
      label: 'Assignments', 
      sublabel: (data?.latestSubmission?._id && data?.latestSubmission?._id !== seenStatus.submission) ? 'New submissions' : 'Set tasks' ,  
      color: '#14B8A6', 
      bgColor: '#F0FDFA', 
      hasUpdate: !!(data?.latestSubmission?._id && data?.latestSubmission?._id !== seenStatus.submission),
      onPress: () => {
        if (data?.latestSubmission?._id) markAsSeen('submission', data?.latestSubmission?._id);
        navigation.navigate('AssignmentManagement');
      } 
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3730A3" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.surface} />}
      >
        {/* === HERO HEADER === */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <View style={styles.heroDecor3} />

          {/* Top Row: Avatar + Greeting + Logout */}
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <View style={styles.avatarRing}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{name[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.activeBadge} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{greetingText()}</Text>
                <Text style={styles.heroName} numberOfLines={1}>{name}</Text>
                <View style={styles.heroDateRow}>
                  <Calendar size={11} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                  <Text style={styles.heroDate}>
                    {' '}{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <LogOut size={18} color={COLORS.surface} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{Math.round(data?.monthlyAttendancePercent || 0)}%</Text>
              <Text style={styles.statLabel}>Avg Attendance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{data?.classesToday || 0}</Text>
              <Text style={styles.statLabel}>Classes Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{data?.pendingQuizzes?.length || 0}</Text>
              <Text style={styles.statLabel}>Active Quizzes</Text>
            </View>
          </View>
        </Animated.View>

        {/* === BODY === */}
        <View style={styles.body}>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={styles.sectionTitle}>Management Tools</Text>
            <View style={styles.actionGrid}>
              {actions.map((action, index) => (
                <ActionCard key={action.label} {...action} index={index} />
              ))}
            </View>
          </Animated.View>

          {/* Today's Timetable */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.timetableSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Text style={styles.dayLabel}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]}</Text>
            </View>

            {data?.todaysTimetable?.length > 0 ? (
              <View style={styles.timeline}>
                {[...data.todaysTimetable]
                  .sort((a, b) => parseTimeSlot(a.timeSlot).getTime() - parseTimeSlot(b.timeSlot).getTime())
                  .map((slot: any, index: number) => {
                    const startTime = parseTimeSlot(slot.timeSlot);
                    const now = currentTime;
                    const isActive = now >= startTime && now < new Date(startTime.getTime() + 60 * 60 * 1000);
                    const isPast = now >= new Date(startTime.getTime() + 70 * 60 * 1000);

                    return (
                      <Animated.View
                        key={slot._id || index}
                        entering={FadeInRight.delay(500 + index * 80).springify()}
                        style={styles.timelineRow}
                      >
                        {/* Time Column */}
                        <View style={styles.timeCol}>
                          <Text style={[styles.timeText, isActive && styles.timeTextActive, isPast && styles.timeTextPast]}>
                            {slot.timeSlot}
                          </Text>
                        </View>

                        {/* Line + Dot */}
                        <View style={styles.timelineCenter}>
                          <View style={[styles.dot, isActive && styles.dotActive, isPast && styles.dotPast]}>
                            {isActive && <View style={styles.dotPulse} />}
                          </View>
                          {index < data.todaysTimetable.length - 1 && (
                            <View style={[styles.vertLine, isPast && styles.vertLinePast]} />
                          )}
                        </View>

                        {/* Card */}
                        <View style={[styles.slotCard, isActive && styles.slotCardActive, isPast && styles.slotCardPast]}>
                          <Text style={[styles.slotClass, isActive && styles.slotClassActive]}>
                            {slot.classId?.name || 'Class'}
                          </Text>
                          <Text style={styles.slotSubject}>{slot.subjectId?.name || 'Subject'}</Text>
                          {isActive && (
                            <View style={styles.livePill}>
                              <Text style={styles.livePillText}>● LIVE NOW</Text>
                            </View>
                          )}
                        </View>
                      </Animated.View>
                    );
                  })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyTitle}>No Classes Today</Text>
                <Text style={styles.emptySubtitle}>Enjoy your free day!</Text>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },

  // Hero
  hero: {
    backgroundColor: '#3730A3',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 4,
  },
  heroDecor1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)', top: -80, right: -50,
  },
  heroDecor2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: 20,
  },
  heroDecor3: {
    position: 'absolute', width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: 20, right: 100,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarRing: {
    position: 'relative',
    marginRight: 14,
    padding: 2.5,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: COLORS.surface },
  activeBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#3730A3',
  },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 2 },
  heroName: { fontSize: 20, fontWeight: '800', color: COLORS.surface, letterSpacing: -0.3, marginBottom: 3 },
  heroDateRow: { flexDirection: 'row', alignItems: 'center' },
  heroDate: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', color: COLORS.surface },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: 14 },
  dayLabel: {
    backgroundColor: COLORS.primary + '15',
    color: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },

  // Action Grid — 3 columns: 2×16 outer padding + 2×12 gaps = 56px
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  actionCardWrapper: { width: (SCREEN_WIDTH - 32 - 16) / 2 },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 12,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  actionIconBg: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  actionSublabel: { fontSize: 9, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2, fontWeight: '500' },

  // Timeline Timetable
  timetableSection: { marginBottom: 28 },
  timeline: {},
  timelineRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  timeCol: { width: 75, paddingTop: 6, alignItems: 'flex-end', paddingRight: 12 },
  timeText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  timeTextActive: { color: COLORS.primary, fontWeight: '800' },
  timeTextPast: { color: COLORS.textTertiary },
  timelineCenter: { width: 24, alignItems: 'center', paddingTop: 8 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: COLORS.primary, elevation: 3 },
  dotPast: { backgroundColor: COLORS.textTertiary },
  dotPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.surface },
  vertLine: { flex: 1, width: 1.5, backgroundColor: COLORS.border, marginTop: 2, height: 40 },
  vertLinePast: { backgroundColor: COLORS.textTertiary + '40' },
  slotCard: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    marginBottom: 4,
    ...SHADOWS.sm,
  },
  slotCardActive: {
    backgroundColor: COLORS.primary + '08',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
  },
  slotCardPast: { opacity: 0.55 },
  slotClass: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  slotClassActive: { color: COLORS.primary },
  slotSubject: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  livePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  livePillText: { fontSize: 9, fontWeight: '800', color: COLORS.error, letterSpacing: 0.5 },

  // Empty State  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  actionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  actionBadgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: '800',
  },
});

export default TeacherDashboard;
