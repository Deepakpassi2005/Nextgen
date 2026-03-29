import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  Award, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  ArrowLeft,
  Layout,
  TrendingUp,
  ShieldCheck,
  Calendar,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  Layout as AnimatedLayout 
} from 'react-native-reanimated';

const GlassCard = ({ children, style }: any) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

const StudentResultScreen = () => {
  const navigation = useNavigation();
  const [results, setResults] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'exam' | 'quiz'>('exam');
  const [quizSubjectFilter, setQuizSubjectFilter] = useState('All');
  const [selectedQuizResult, setSelectedQuizResult] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [resResponse, profileResponse] = await Promise.all([
        apiClient.get('/student/results'),
        apiClient.get('/student/profile')
      ]);
      
      const resultsData = resResponse.data.data || [];
      const profile = profileResponse.data.data;
      setResults(resultsData);
      setStudentProfile(profile);

      if (profile?._id) {
          const attResponse = await apiClient.get(`/analytics/analytics?type=student&studentId=${profile._id}`);
          setAttendance(attResponse.data.data.attendance);
      }
    } catch (error) {
      console.error('Error fetching student results', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const calculateTotal = (marksArray: any[]) => {
    let obtained = 0;
    let total = 0;
    marksArray?.forEach(m => {
      obtained += m.score || 0;
      total += m.maxMarks || 100;
    });
    return { obtained, total, percentage: total > 0 ? (obtained / total) * 100 : 0 };
  };

  const filteredResults = results.filter(r => {
    if (activeTab === 'exam') return r.examType !== 'quiz';
    const isQuiz = r.examType === 'quiz';
    if (!isQuiz) return false;
    if (quizSubjectFilter === 'All') return true;
    return r.marks[0]?.subjectId?.name === quizSubjectFilter;
  });

  const uniqueSubjects = ['All', ...new Set(results.filter(r => r.examType === 'quiz').map(r => r.marks[0]?.subjectId?.name).filter(Boolean))];

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Results</Text>
          <Text style={styles.headerSubtitle}>Academic Performance</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'exam' && styles.activeTab]}
          onPress={() => setActiveTab('exam')}
        >
          <TrendingUp size={16} color={activeTab === 'exam' ? '#FFF' : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'exam' && styles.activeTabText]}>Exam Results</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'quiz' && styles.activeTab]}
          onPress={() => setActiveTab('quiz')}
        >
          <Layout size={16} color={activeTab === 'quiz' ? '#FFF' : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'quiz' && styles.activeTabText]}>Quiz Results</Text>
        </TouchableOpacity>
      </View>

      {/* Subject Filter for Quizzes */}
      {activeTab === 'quiz' && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {uniqueSubjects.map(subject => (
              <TouchableOpacity
                key={subject}
                style={[styles.filterPill, quizSubjectFilter === subject && styles.activeFilterPill]}
                onPress={() => setQuizSubjectFilter(subject)}
              >
                <Text style={[styles.filterText, quizSubjectFilter === subject && styles.activeFilterText]}>{subject}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredResults}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item, index }) => {
          if (activeTab === 'quiz') {
            const m = item.marks[0];
            const date = new Date(item.createdAt);
            const day = date.getDate();
            const month = date.toLocaleString('default', { month: 'short' });
            
            return (
              <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
                <TouchableOpacity 
                  style={styles.quizCard} 
                  onPress={() => {
                    setSelectedQuizResult(item);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.quizDateBox}>
                    <Text style={styles.quizDay}>{day}</Text>
                    <Text style={styles.quizMonth}>{month}</Text>
                  </View>
                  <View style={styles.quizInfo}>
                    <Text style={styles.quizSubject}>{m?.subjectId?.name || 'Quiz'}</Text>
                    <Text style={styles.quizMeta}>Automatically Graded</Text>
                  </View>
                  <View style={styles.quizScoreBox}>
                    <Text style={styles.quizScore}>{m?.score}/{m?.maxMarks}</Text>
                    <ChevronRight size={18} color={COLORS.textTertiary} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }

          const { obtained, total, percentage } = calculateTotal(item.marks);
          const isPass = parseFloat(percentage.toString()) >= 33;
          const isFinalResult = item.marks?.length >= 3;

          return (
            <Animated.View entering={FadeInDown.delay(index * 200).springify()}>
              <GlassCard style={styles.certificateCard}>
                <View style={styles.certDecoration} />
                
                <View style={styles.certHeader}>
                  <ShieldCheck size={40} color={COLORS.primary} strokeWidth={2} />
                  <Text style={styles.certMainTitle}>OFFICIAL RESULT</Text>
                  <Text style={styles.certExamType}>{item.examType.toUpperCase()}</Text>
                </View>

                <View style={styles.certBody}>
                    <View style={styles.studentInfoRow}>
                        <View>
                            <Text style={styles.infoLabel}>STUDENT NAME</Text>
                            <Text style={styles.infoValue}>{studentProfile?.firstName} {studentProfile?.lastName}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.infoLabel}>RECORD NO.</Text>
                            <Text style={styles.infoValue}>#{studentProfile?.rollNumber || Math.floor(Math.random() * 9000) + 1000}</Text>
                        </View>
                    </View>

                    <View style={styles.marksSection}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHead, { flex: 2, textAlign: 'left' }]}>SUBJECT</Text>
                            <Text style={styles.tableHead}>SCORE</Text>
                            <Text style={styles.tableHead}>MAX</Text>
                        </View>
                        {item.marks?.map((m: any, idx: number) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 2, textAlign: 'left', fontWeight: '800' }]}>{m.subjectId?.name || 'Subject'}</Text>
                                <Text style={[styles.tableCell, { color: COLORS.primary }]}>{m.score}</Text>
                                <Text style={styles.tableCell}>{m.maxMarks || 100}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLabel}>TOTAL MARKS</Text>
                            <Text style={styles.summaryValue}>{obtained}/{total}</Text>
                        </View>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLabel}>PERCENTAGE</Text>
                            <Text style={styles.summaryValue}>{percentage.toFixed(1)}%</Text>
                        </View>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLabel}>GRADE</Text>
                            <Text style={[styles.summaryValue, { color: isPass ? COLORS.success : COLORS.error }]}>{item.grade || (isPass ? 'A' : 'F')}</Text>
                        </View>
                    </View>

                    <View style={styles.certFooter}>
                        <View style={styles.footerItem}>
                            <Clock size={14} color={COLORS.textSecondary} />
                            <Text style={styles.footerText}>Att: {attendance || 0}%</Text>
                        </View>
                        <View style={[styles.badge, isPass ? styles.passBadge : styles.failBadge]}>
                            <Text style={[styles.badgeText, isPass ? styles.passText : styles.failText]}>
                                {isPass ? 'PROMOTED' : 'DETAINED'}
                            </Text>
                        </View>
                        {isFinalResult && isPass && (
                            <View style={styles.finalAward}>
                                <Award size={14} color="#FFF" />
                                <Text style={styles.finalAwardText}>FINAL</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.signaturesRow}>
                        <View style={styles.sigContainer}>
                            <View style={styles.sigLine} />
                            <Text style={styles.sigLabel}>Principal</Text>
                        </View>
                        <View style={styles.sealArea}>
                            <View style={styles.sealCircle}>
                                <ShieldCheck size={28} color={COLORS.primary + '40'} />
                                <Text style={styles.sealText}>CERTIFIED</Text>
                            </View>
                        </View>
                        <View style={styles.sigContainer}>
                            <View style={styles.sigLine} />
                            <Text style={styles.sigLabel}>Class Teacher</Text>
                        </View>
                    </View>
                </View>
              </GlassCard>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Award size={64} color={COLORS.textSecondary + '40'} />
            <Text style={styles.emptyText}>No {activeTab} results</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'exam' 
                ? 'Your exam results will appear here once they are officially released.' 
                : 'Results for automatically graded quizzes will be listed here.'}
            </Text>
          </View>
        }
      />

      {/* Quiz Detail Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quiz Result Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Clock size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {selectedQuizResult && (
              <View style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Subject</Text>
                    <Text style={styles.detailValue}>{selectedQuizResult.marks[0]?.subjectId?.name || 'General'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} color={COLORS.textSecondary} />
                      <Text style={styles.detailLabel}>Date</Text>
                    </View>
                    <Text style={styles.detailValue}>{new Date(selectedQuizResult.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>

                <View style={styles.scoreHighlight}>
                  <Text style={styles.scoreLabel}>Final Score</Text>
                  <Text style={styles.scoreMain}>{selectedQuizResult.marks[0]?.score} / {selectedQuizResult.marks[0]?.maxMarks}</Text>
                  <View style={[styles.statusBadge, selectedQuizResult.grade === 'Pass' ? styles.passBadge : styles.failBadge]}>
                    <Text style={[styles.statusText, selectedQuizResult.grade === 'Pass' ? styles.passText : styles.failText]}>
                      GRADED: {selectedQuizResult.grade?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: '#FFF',
  },
  filterContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  activeFilterPill: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 50,
  },
  glassCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    ...SHADOWS.card,
  },
  certificateCard: {
    marginBottom: SPACING.xl,
    padding: 24,
    overflow: 'hidden',
  },
  certDecoration: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
    borderRadius: 18,
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  certMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 3,
    marginTop: 10,
  },
  certExamType: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginTop: 4,
  },
  certBody: {
    flex: 1,
  },
  studentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  marksSection: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHead: {
    flex: 1,
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  certFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  passBadge: {
    backgroundColor: COLORS.success + '15',
  },
  failBadge: {
    backgroundColor: COLORS.error + '15',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  passText: {
    color: COLORS.success,
  },
  failText: {
    color: COLORS.error,
  },
  finalAward: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  finalAwardText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sigContainer: {
    width: 80,
    alignItems: 'center',
  },
  sigLine: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.textSecondary + '40',
    marginBottom: 6,
  },
  sigLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  sealArea: {
    alignItems: 'center',
  },
  sealCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.primary + '40',
    marginTop: 2,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  quizDateBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quizDay: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  quizMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  quizInfo: {
    flex: 1,
  },
  quizSubject: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  quizMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  quizScoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quizScore: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.success,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 20,
  },
  detailCard: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border + '30',
    marginVertical: 4,
  },
  scoreHighlight: {
    alignItems: 'center',
    backgroundColor: COLORS.primary + '05',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary + '10',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreMain: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOWS.sm,
  },
  modalBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default StudentResultScreen;
