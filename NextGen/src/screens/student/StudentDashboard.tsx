import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Bell,
  User,
  ChevronRight,
  Award,
  LogOut,
  Clock,
  TrendingUp,
  ClipboardList,
  Home,
  FileText,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
  Layout as AnimatedLayout,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RootStackParamList = {
  StudentDashboard: undefined;
  Timetable: undefined;
  QuizAttempt: undefined;
  StudyMaterial: undefined;
  StudentResult: undefined;
  Profile: undefined;
  NoticeHistory: undefined;
  AssignmentList: undefined;
  NoticeDetail: { notice: any };
};

// --- Sub-Components ---

const StatChip = ({ title, value, icon: Icon, color, delay }: any) => (
  <Animated.View entering={FadeInRight.delay(delay).springify()} style={[styles.statChip]}>
    <View style={[styles.statChipIcon, { backgroundColor: color + '20' }]}>
      <Icon size={16} color={color} strokeWidth={2.5} />
    </View>
    <View>
      <Text style={[styles.statChipValue, { color }]}>{value}</Text>
      <Text style={styles.statChipLabel}>{title}</Text>
    </View>
  </Animated.View>
);

const QuickActionCard = ({ title, subtitle, icon: Icon, colors: cardColors, onPress, delay, badge, fullWidth, hasUpdate }: any) => (
  <Animated.View 
    entering={FadeInDown.delay(delay).springify()} 
    style={[styles.actionCardWrapper, fullWidth && styles.actionCardFullWidth]}
  >
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.actionCardIconBg, { backgroundColor: cardColors[0] + '15' }]}>
        <Icon size={26} color={cardColors[0]} strokeWidth={2} />
      </View>
      <Text style={styles.actionCardTitle}>{title}</Text>
      <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={[styles.actionBadge, { backgroundColor: cardColors[0] }]}>
          <Text style={styles.actionBadgeText}>{badge}</Text>
        </View>
      )}
      {fullWidth && (
        <ChevronRight size={18} color={COLORS.textTertiary} style={styles.fullWidthArrow} />
      )}
      {onPress && hasUpdate && (
        <View style={styles.notificationDot} />
      )}
    </TouchableOpacity>
  </Animated.View>
);

// --- Main Component ---

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [seenStatus, setSeenStatus] = useState<Record<string, string>>({});

  const checkSeenStatus = useCallback(async (dashboardData: any) => {
    if (!dashboardData) return;
    const categories = ['notices', 'pendingQuizzes', 'latestAssignment', 'latestStudyMaterial', 'latestResult'];
    const newStatus: Record<string, string> = {};
    
    for (const cat of categories) {
      const val = await AsyncStorage.getItem(`@seen_${cat}`);
      newStatus[cat] = val || '';
    }
    setSeenStatus(newStatus);
  }, []);

  const markAsSeen = async (category: string, id: string) => {
    if (!id) return;
    await AsyncStorage.setItem(`@seen_${category}`, id);
    setSeenStatus(prev => ({ ...prev, [category]: id }));
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await apiClient.get('/student/dashboard');
      const d = response.data.data;
      setData(d);
      await checkSeenStatus(d);
    } catch (error) {
      console.error('Error fetching student dashboard', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) fetchDashboardData();
  }, [isFocused, fetchDashboardData]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const isCurrentPeriod = (timeSlot: string) => {
    const start = parseTime(timeSlot);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return currentTime >= start && currentTime < end;
  };

  const sortedTimetable = useMemo(() => {
    if (!data?.todaysTimetable) return [];
    return [...data.todaysTimetable].sort((a, b) => {
      const aIsCurrent = isCurrentPeriod(a.timeSlot);
      const bIsCurrent = isCurrentPeriod(b.timeSlot);
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      return parseTime(a.timeSlot).getTime() - parseTime(b.timeSlot).getTime();
    });
  }, [data?.todaysTimetable, currentTime]);

  const greetingText = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning ☀️';
    if (hour < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const API_BASE = apiClient.defaults.baseURL?.replace('/api', '') || '';
  const avatarUri = data?.studentPhoto ? `${API_BASE}/${data.studentPhoto}` : null;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.surface} />}
      >
        {/* === HERO HEADER === */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.hero}>
          {/* Decorative circles */}
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />

          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <View style={styles.avatarContainer}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(data?.studentName || user?.name || 'S')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>
              <View style={styles.heroGreetingBlock}>
                <Text style={styles.heroGreeting}>{greetingText()}</Text>
                <Text style={styles.heroName} numberOfLines={1}>
                  {data?.studentName || user?.name || 'Student'}
                </Text>
                <Text style={styles.heroDate}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <LogOut size={18} color={COLORS.surface} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Stat Chips Row */}
          <View style={styles.statChipsRow}>
            <StatChip title="Attendance" value={`${Math.round(data?.attendancePercent || 0)}%`} icon={Calendar} color="#A5F3FC" delay={150} />
            <View style={styles.statDivider} />
            <StatChip title="Avg. Score" value={`${Math.round(data?.averageScore || 0)}%`} icon={TrendingUp} color="#BBF7D0" delay={250} />
            <View style={styles.statDivider} />
            <StatChip title="Quizzes" value={data?.pendingQuizzes?.length || 0} icon={Award} color="#FDE68A" delay={350} />
          </View>
        </Animated.View>

        {/* === BODY === */}
        <View style={styles.body}>

          {/* Section: Quick Actions */}
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Access</Text>
            </View>
            <View style={styles.actionGrid}>
              <QuickActionCard
                title="Notices"
                subtitle={(data?.notices?.length > 0 && data?.notices?.[0]?._id !== seenStatus.notices) ? "New updates" : "Stay informed"}
                icon={Bell}
                colors={['#6366F1', '#818CF8']}
                hasUpdate={data?.notices?.length > 0 && data?.notices?.[0]?._id !== seenStatus.notices}
                onPress={() => {
                  if (data?.notices?.[0]?._id) markAsSeen('notices', data?.notices?.[0]?._id);
                  navigation.navigate('NoticeHistory');
                }}
                delay={300}
                badge={data?.notices?.length}
              />
              <QuickActionCard
                title="Materials"
                subtitle={(data?.latestStudyMaterial?._id && data?.latestStudyMaterial?._id !== seenStatus.latestStudyMaterial) ? "New resources" : "Study resources"}
                icon={BookOpen}
                colors={['#EC4899', '#F472B6']}
                hasUpdate={!!(data?.latestStudyMaterial?._id && data?.latestStudyMaterial?._id !== seenStatus.latestStudyMaterial)}
                onPress={() => {
                  if (data?.latestStudyMaterial?._id) markAsSeen('latestStudyMaterial', data?.latestStudyMaterial?._id);
                  navigation.navigate('StudyMaterial');
                }}
                delay={350}
              />
              <QuickActionCard
                title="Assignments"
                subtitle={(data?.latestAssignment?._id && data?.latestAssignment?._id !== seenStatus.latestAssignment) ? "New tasks" : "Submit work"}
                icon={ClipboardList}
                colors={['#14B8A6', '#2DD4BF']}
                hasUpdate={!!(data?.latestAssignment?._id && data?.latestAssignment?._id !== seenStatus.latestAssignment)}
                onPress={() => {
                  if (data?.latestAssignment?._id) markAsSeen('latestAssignment', data?.latestAssignment?._id);
                  navigation.navigate('AssignmentList');
                }}
                delay={400}
              />
              <QuickActionCard
                title="Quizzes"
                subtitle={(data?.pendingQuizzes?.length > 0 && data?.pendingQuizzes?.[0]?._id !== seenStatus.pendingQuizzes) ? "New quizzes" : "Test yourself"}
                icon={Award}
                colors={['#10B981', '#34D399']}
                hasUpdate={data?.pendingQuizzes?.length > 0 && data?.pendingQuizzes?.[0]?._id !== seenStatus.pendingQuizzes}
                onPress={() => {
                  if (data?.pendingQuizzes?.[0]?._id) markAsSeen('pendingQuizzes', data?.pendingQuizzes?.[0]?._id);
                  navigation.navigate('QuizAttempt');
                }}
                delay={450}
                badge={data?.pendingQuizzes?.length}
              />
              <QuickActionCard
                title="Results"
                subtitle={(data?.latestResult?._id && data?.latestResult?._id !== seenStatus.latestResult) ? "New scores" : "View scores"}
                icon={CheckCircle}
                colors={['#F59E0B', '#FBBF24']}
                hasUpdate={!!(data?.latestResult?._id && data?.latestResult?._id !== seenStatus.latestResult)}
                onPress={() => {
                  if (data?.latestResult?._id) markAsSeen('latestResult', data?.latestResult?._id);
                  navigation.navigate('StudentResult');
                }}
                delay={500}
                fullWidth={true}
              />
            </View>
          </Animated.View>

          {/* Section: Today's Timetable */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.timetableSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Classes</Text>
              <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigation.navigate('Timetable')}>
                <Text style={styles.seeAllText}>Full Schedule</Text>
                <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {sortedTimetable.length > 0 ? (
              <View style={styles.timetableList}>
                {sortedTimetable.map((slot: any, index: number) => {
                  const isActive = isCurrentPeriod(slot.timeSlot);
                  return (
                    <Animated.View
                      key={slot._id || index}
                      entering={FadeInRight.delay(600 + index * 80).springify()}
                      layout={AnimatedLayout.springify()}
                    >
                      <View style={[styles.timetableItem, isActive && styles.timetableItemActive]}>
                        {/* Timeline dot */}
                        <View style={styles.timelineLeft}>
                          <View style={[styles.timelineDot, isActive && styles.timelineDotActive]}>
                            {isActive && <View style={styles.timelineDotInner} />}
                          </View>
                          {index < sortedTimetable.length - 1 && <View style={styles.timelineLine} />}
                        </View>

                        <View style={[styles.timetableCard, isActive && styles.timetableCardActive]}>
                          <View style={styles.timetableCardLeft}>
                            <Text style={[styles.timetableSubject, isActive && styles.timetableSubjectActive]}>
                              {slot.subjectId?.name || 'Subject'}
                            </Text>
                            <Text style={styles.timetableTeacher}>
                              👤 {slot.teacherId?.name || 'Teacher'}
                            </Text>
                          </View>
                          <View style={styles.timetableCardRight}>
                            <View style={[styles.timeChip, isActive && styles.timeChipActive]}>
                              <Clock size={11} color={isActive ? COLORS.primary : COLORS.textSecondary} strokeWidth={2.5} />
                              <Text style={[styles.timetableTime, isActive && styles.timetableTimeActive]}>
                                {slot.timeSlot}
                              </Text>
                            </View>
                            {isActive && (
                              <View style={styles.ongoingBadge}>
                                <Text style={styles.ongoingBadgeText}>● LIVE</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyTitle}>No Classes Today</Text>
                <Text style={styles.emptySubtitle}>Enjoy your free day!</Text>
              </View>
            )}
          </Animated.View>

          {/* Section: Latest Notice */}
          {data?.notices?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(600)} style={styles.noticeSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Latest Notice</Text>
                <TouchableOpacity style={styles.seeAllBtn} onPress={() => navigation.navigate('NoticeHistory')}>
                  <Text style={styles.seeAllText}>View All</Text>
                  <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.noticeCard}
                onPress={() => navigation.navigate('NoticeDetail', { notice: data.notices[0] })}
                activeOpacity={0.75}
              >
                <View style={styles.noticeIconBg}>
                  <Bell size={20} color={COLORS.secondary} />
                </View>
                <View style={styles.noticeInfo}>
                  <Text style={styles.noticeTitle} numberOfLines={1}>{data.notices[0].title}</Text>
                  <Text style={styles.noticeContent} numberOfLines={2}>{data.notices[0].content}</Text>
                </View>
                <ChevronRight size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* === BOTTOM TAB BAR === */}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },

  // === Hero ===
  hero: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 4,
  },
  heroCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: COLORS.surface },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  heroGreetingBlock: { flex: 1 },
  heroGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 2 },
  heroName: { fontSize: 22, fontWeight: '800', color: COLORS.surface, letterSpacing: -0.3 },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  // Stat chips
  statChipsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statChip: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 8 },
  statChipIcon: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statChipValue: { fontSize: 16, fontWeight: '800', color: COLORS.surface },
  statChipLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 1 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  // === Body ===
  body: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { ...TYPOGRAPHY.h3, color: COLORS.text },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  actionCardWrapper: { width: (SCREEN_WIDTH - 44) / 2 },
  actionCardFullWidth: { width: SCREEN_WIDTH - 32 },
  actionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    alignItems: 'flex-start',
    minHeight: 110,
    ...SHADOWS.card,
    position: 'relative',
    overflow: 'hidden',
  },
  actionCardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  actionCardSubtitle: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '500' },
  actionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Timetable
  timetableSection: { marginBottom: 28 },
  timetableList: { paddingLeft: 4 },
  timetableItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timetableItemActive: {},
  timelineLeft: {
    width: 28,
    alignItems: 'center',
    paddingTop: 4,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary + '30',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: COLORS.border,
    marginTop: 2,
    marginBottom: -8,
  },
  timetableCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    marginLeft: 10,
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  timetableCardActive: {
    backgroundColor: COLORS.primary + '08',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
  },
  timetableCardLeft: { flex: 1 },
  timetableCardRight: { alignItems: 'flex-end', gap: 6 },
  timetableSubject: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  timetableSubjectActive: { color: COLORS.primary },
  timetableTeacher: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timeChipActive: { backgroundColor: COLORS.primary + '15' },
  timetableTime: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  timetableTimeActive: { color: COLORS.primary },
  ongoingBadge: {
    backgroundColor: COLORS.error + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ongoingBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.error, letterSpacing: 0.5 },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary },

  // Notice
  noticeSection: { marginBottom: 16 },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    gap: 14,
    ...SHADOWS.card,
  },
  noticeIconBg: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeInfo: { flex: 1 },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  noticeContent: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  notificationDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  fullWidthArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -9,
  },
});

export default StudentDashboard;
