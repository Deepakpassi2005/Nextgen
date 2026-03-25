import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  Text as RNText,
  Platform,
  Dimensions,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  Check, 
  X, 
  Send, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Users,
  Calendar,
  Filter,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Home,
  CheckSquare,
  Bell,
  User
} from 'lucide-react-native';
import { GlassCard } from '../../components/GlassCard';
import { CustomButton } from '../../components/CustomButton';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInRight,
  Layout,
  SlideInRight
} from 'react-native-reanimated';
import PageHeader from '../../components/PageHeader';

const { width } = Dimensions.get('window');

import { StackNavigationProp } from '@react-navigation/stack';

const MarkAttendanceScreen = ({ navigation }: { navigation: StackNavigationProp<any> }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({}); // studentId -> 'present' | 'absent' | 'late'
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [classDropdownVisible, setClassDropdownVisible] = useState(false);


  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await apiClient.get('/classes');
        const classList = response.data.data || [];
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClass(classList[0]._id);
        }
      } catch (error) {
        console.error('Error fetching classes', error);
        Alert.alert('Error', 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const studentsRes = await apiClient.get(`/students/class/${selectedClass}`);
        const classStudents = studentsRes.data.data || [];
        setStudents(classStudents);

        const historyRes = await apiClient.get(`/teacher/attendance/${selectedClass}`);
        const history = historyRes.data.data || [];

        const targetDateStr = selectedDate.toISOString().split('T')[0];
        
        const existingRecord = history.find((record: any) => {
          return new Date(record.date).toISOString().split('T')[0] === targetDateStr;
        });

        const initialAtt: any = {};
        if (existingRecord) {
          setExistingRecordId(existingRecord._id);
          existingRecord.students.forEach((s: any) => {
             const sId = s.studentId._id || s.studentId;
             initialAtt[sId] = s.status;
          });
          classStudents.forEach((student: any) => {
            if (!initialAtt[student._id]) initialAtt[student._id] = 'present';
          });
        } else {
          setExistingRecordId(null);
          classStudents.forEach((s: any) => {
            initialAtt[s._id] = 'present';
          });
        }
        setAttendance(initialAtt);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, [selectedClass, selectedDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const setStatus = (id: string, status: 'present' | 'absent' | 'late') => {
    setAttendance((prev: any) => ({ ...prev, [id]: status }));
  };

  const submitAttendance = async () => {
    if (!selectedClass) return;
    try {
      const records = Object.keys(attendance).map((id) => ({
        studentId: id,
        status: attendance[id],
      }));
      
      const payload = {
        classId: selectedClass,
        date: selectedDate.toISOString(),
        students: records,
      };

      if (existingRecordId) {
        await apiClient.put(`/attendance/${existingRecordId}`, payload);
        Alert.alert('Success', 'Attendance updated successfully');
      } else {
        await apiClient.post('/teacher/attendance/mark', payload);
        Alert.alert('Success', 'Attendance marked successfully');
      }
      navigation.goBack();
      
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit attendance');
    }
  };


  const renderControls = () => (
    <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.tabWrapper}>
      <GlassCard style={styles.selectorCard}>
        <View style={styles.selectorRow}>
          <TouchableOpacity 
            style={styles.selectorBtn} 
            onPress={() => setClassDropdownVisible(true)}
          >
            <RNText style={styles.selectorLabel}>CLASS / SECTION</RNText>
            <View style={styles.selectorValueRow}>
              <RNText style={styles.selectorValue} numberOfLines={1}>
                {classes.find(c => c._id === selectedClass)?.name || 'Select Class'}
              </RNText>
              <Filter size={14} color={COLORS.primary} />
            </View>
          </TouchableOpacity>

          <View style={styles.verticalDivider} />

          <View style={styles.dateSelector}>
            <RNText style={styles.selectorLabel}>DATE</RNText>
            <View style={styles.dateControlRow}>
              <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
                <ChevronLeft size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <RNText style={styles.dateValueText}>
                {selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </RNText>
              <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
                <ChevronRight size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GlassCard>

      <View style={styles.summaryGrid}>
        <GlassCard style={[styles.summaryCard, { backgroundColor: COLORS.primary + '08' }]}>
          <Users size={16} color={COLORS.primary} />
          <RNText style={styles.summaryCount}>{students.length}</RNText>
          <RNText style={styles.summaryLabel}>Total</RNText>
        </GlassCard>
        <GlassCard style={[styles.summaryCard, { backgroundColor: COLORS.success + '08' }]}>
          <CheckCircle2 size={16} color={COLORS.success} />
          <RNText style={[styles.summaryCount, { color: COLORS.success }]}>
            {Object.values(attendance).filter(v => v === 'present').length}
          </RNText>
          <RNText style={styles.summaryLabel}>Present</RNText>
        </GlassCard>
        <GlassCard style={[styles.summaryCard, { backgroundColor: COLORS.error + '08' }]}>
          <XCircle size={16} color={COLORS.error} />
          <RNText style={[styles.summaryCount, { color: COLORS.error }]}>
            {Object.values(attendance).filter(v => v === 'absent').length}
          </RNText>
          <RNText style={styles.summaryLabel}>Absent</RNText>
        </GlassCard>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.markAllBtn}
          onPress={() => {
            const allPresent: any = {};
            students.forEach(s => allPresent[s._id] = 'present');
            setAttendance(allPresent);
          }}
        >
          <RNText style={styles.markAllText}>Mark all present</RNText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderClassPicker = () => (
    <Modal
      visible={classDropdownVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setClassDropdownVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeInUp} style={styles.pickerContainer}>
          <GlassCard style={styles.pickerGlassCard}>
            <View style={styles.pickerHeader}>
              <RNText style={styles.pickerTitle}>Select Class</RNText>
              <TouchableOpacity onPress={() => setClassDropdownVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerScroll}>
              {classes.map(c => (
                <TouchableOpacity 
                  key={c._id} 
                  style={[styles.pickerItem, selectedClass === c._id && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedClass(c._id);
                    setClassDropdownVisible(false);
                  }}
                >
                  <RNText style={[styles.pickerItemText, selectedClass === c._id && styles.pickerItemTextActive]}>
                    {c.name}
                  </RNText>
                  {!!(selectedClass === c._id) && <CheckCircle2 size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        title="Mark Attendance"
        subtitle="Daily student presence"
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={students}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderControls}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInRight.delay(index * 20)} layout={Layout.springify()}>
            <GlassCard style={styles.studentCard}>
              <View style={styles.studentInfoRow}>
                <View style={styles.avatarContainer}>
                  <RNText style={styles.avatarText}>{item.name.charAt(0)}</RNText>
                </View>
                <View style={styles.studentDetails}>
                  <RNText style={styles.studentName}>{item.name}</RNText>
                  <RNText style={styles.studentRoll}>Roll: {item.rollNumber || 'N/A'}</RNText>
                </View>
                
                <View style={styles.statusSelectors}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.miniStatusBtn, 
                      attendance[item._id] === 'present' && styles.presentActive
                    ]}
                    onPress={() => setStatus(item._id, 'present')}
                  >
                    <Check size={16} color={attendance[item._id] === 'present' ? '#FFF' : COLORS.success} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.miniStatusBtn, 
                      attendance[item._id] === 'late' && styles.lateActive
                    ]}
                    onPress={() => setStatus(item._id, 'late')}
                  >
                    <Clock3 size={16} color={attendance[item._id] === 'late' ? '#FFF' : '#F59E0B'} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.miniStatusBtn, 
                      attendance[item._id] === 'absent' && styles.absentActive
                    ]}
                    onPress={() => setStatus(item._id, 'absent')}
                  >
                    <X size={16} color={attendance[item._id] === 'absent' ? '#FFF' : COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}
      />

      <View style={styles.footer}>
        <CustomButton
          title={existingRecordId ? 'Update Attendance' : 'Submit Attendance'}
          onPress={submitAttendance}
          icon={<Send size={18} color="#FFF" />}
          style={styles.submitBtn}
        />
      </View>

      {renderClassPicker()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    opacity: 0.8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  tabWrapper: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  selectorCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorBtn: {
    flex: 1.2,
    paddingVertical: SPACING.sm,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  verticalDivider: {
    width: 1,
    height: 35,
    backgroundColor: COLORS.border + '40',
    marginHorizontal: SPACING.md,
  },
  dateSelector: {
    flex: 1,
  },
  dateControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateArrow: {
    padding: 4,
  },
  dateValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  studentCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  studentDetails: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentRoll: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusSelectors: {
    flexDirection: 'row',
    gap: 8,
  },
  miniStatusBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border + '60',
  },
  presentActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  lateActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  absentActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '40',
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
  },
  submitBtn: {
    height: 56,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '60%',
  },
  pickerGlassCard: {
    borderRadius: 0,
    borderWidth: 0,
    padding: SPACING.lg,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

export default MarkAttendanceScreen;
