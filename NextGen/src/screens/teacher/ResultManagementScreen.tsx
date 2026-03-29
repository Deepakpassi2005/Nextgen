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
  Text,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Badge } from 'react-native-paper';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  Award, 
  FileText, 
  Trash2, 
  Edit, 
  ChevronDown, 
  BookOpen, 
  User, 
  ArrowLeft,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  X,
  ChevronRight,
  TrendingUp,
  Layout,
  Award as AwardIcon,
  Layers,
  ClipboardList,
  History,
  CheckCircle,
  AlertCircle,
  Home,
  CheckSquare,
  Bell,
} from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInRight,
  Layout as LayoutAnim,
  FadeInLeft
} from 'react-native-reanimated';
import { GlassCard } from '../../components/GlassCard';
import { CustomButton } from '../../components/CustomButton';
import PageHeader from '../../components/PageHeader';

const { width, height } = Dimensions.get('window');

const EXAM_TYPES = [
  'isa1', 'isa2', 'isa3', 
  'semester1', 'semester2', 'semester3', 'semester4', 'semester5', 'semester6', 
  'peer-learning', 
  'mid-term', 'final', 'quiz', 'assignment', 'project'
];

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useRoute } from '@react-navigation/native';

const ResultManagementScreen = ({ navigation }: { navigation: StackNavigationProp<any> }) => {
  const route = useRoute<RouteProp<any, any>>();
  const quizIdParam = route.params?.quizId;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'post' | 'manage'>('post');
  
  // Quiz specific state
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [answeredStudents, setAnsweredStudents] = useState<any[]>([]);
  const [unansweredStudents, setUnansweredStudents] = useState<any[]>([]);
  const [quizStats, setQuizStats] = useState<any>(null);
  const [activeQuizTab, setActiveQuizTab] = useState<'answered' | 'unanswered'>('answered');
  
  // Post mode state
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedExamType, setSelectedExamType] = useState('isa1');
  const [students, setStudents] = useState<any[]>([]);
  const [resultsEntry, setResultsEntry] = useState<any>({}); 
  const [maxMarks, setMaxMarks] = useState('100');
  const [isMarkingModalVisible, setIsMarkingModalVisible] = useState(false);
  
  const [pastResults, setPastResults] = useState<any[]>([]);
  const [groupedResults, setGroupedResults] = useState<any[]>([]);
  const [classStudentCounts, setClassStudentCounts] = useState<any>({});
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [selectedManageRecord, setSelectedManageRecord] = useState<any>(null);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);

  // Picker states
  const [pickerType, setPickerType] = useState<'class' | 'subject' | 'exam' | null>(null);


  useEffect(() => {
    console.log('[ResultManagement] quizIdParam:', quizIdParam);
    if (quizIdParam) {
      setIsQuizMode(true);
      fetchQuizSubmissions(quizIdParam);
    } else {
      fetchInitialData();
    }
  }, [quizIdParam]);

  const fetchQuizSubmissions = async (qid: string) => {
    try {
      setFetchingData(true);
      const url = `/teacher/quizzes/${qid}/submissions`;
      console.log('[ResultManagement] Fetching quiz submissions from:', url);
      console.log('[ResultManagement] API Base URL:', apiClient.defaults.baseURL);
      const response = await apiClient.get(url);
      const { quiz, answered, notAnswered, stats } = response.data.data;
      setQuizDetails(quiz);
      setAnsweredStudents(answered);
      setUnansweredStudents(notAnswered);
      setQuizStats(stats);
      setActiveTab('manage'); // Switch to results view
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch quiz results');
      fetchInitialData();
    } finally {
      setFetchingData(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setFetchingData(true);
      const response = await apiClient.get('/teacher/profile');
      const teacherClasses = response.data.data.classes || [];
      setClasses(teacherClasses);
      setSubjects(response.data.data.subjects || []);
      
      // Fetch student counts for each class
      const counts: any = {};
      for (const cls of teacherClasses) {
        try {
          const res = await apiClient.get(`/students/class/${cls._id}`);
          counts[cls._id] = res.data.data.length;
        } catch (err) {
          console.error(`Failed to fetch count for class ${cls._id}`);
          counts[cls._id] = 0;
        }
      }
      setClassStudentCounts(counts);
      
      // Auto-fetch past results for manage tab
      fetchPastResultsQuietly(teacherClasses, counts);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch teacher profile');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchPastResultsQuietly = async (teacherClasses = classes, counts = classStudentCounts) => {
    try {
      const response = await apiClient.get('/teacher/results');
      const results = response.data.data;
      setPastResults(results);
      processGroupedResults(results, teacherClasses, counts);
    } catch (err) {
      console.error('Quiet fetch results failed');
    }
  };

  const fetchPastResults = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/teacher/results');
      const results = response.data.data;
      setPastResults(results);
      processGroupedResults(results, classes, classStudentCounts);
      setHasNewUpdates(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch past results');
    } finally {
      setLoading(false);
    }
  };

  const processGroupedResults = (results: any[], teacherClasses: any[], counts: any) => {
    const groupsMap = new Map();

    results.forEach(res => {
      const classId = res.classId?._id || res.classId;
      const key = `${classId}-${res.examType}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          classId: classId,
          className: res.classId?.name || 'Unknown Class',
          examType: res.examType,
          markedCount: 0,
          results: []
        });
      }
      const group = groupsMap.get(key);
      group.markedCount++;
      group.results.push(res);
    });

    const groups: any[] = [];
    groupsMap.forEach(group => {
      const totalStudents = counts[group.classId] || 0;
      group.totalCount = totalStudents;
      group.remainingCount = Math.max(0, totalStudents - group.markedCount);
      groups.push(group);
    });

    setGroupedResults(groups);
  };

  const fetchStudents = async (cid: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/students/class/${cid}`);
      setStudents(response.data.data);
      const initial: any = {};
      response.data.data.forEach((s: any) => {
        initial[s._id] = { marks: '', grade: '' };
      });
      setResultsEntry(initial);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (item: any) => {
    setSelectedClass(item);
    setPickerType(null);
    fetchStudents(item._id);
  };

  const calculateGrade = (score: number, max: number) => {
    if (!max || max <= 0) return 'F';
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 33) return 'E';
    return 'F';
  };

  const updateResultEntry = (id: string, field: string, value: string) => {
    const newEntry = { ...resultsEntry[id], [field]: value };
    if (field === 'marks') {
      const score = parseInt(value) || 0;
      const max = parseInt(maxMarks) || 100;
      newEntry.grade = calculateGrade(score, max);
    }
    setResultsEntry({ ...resultsEntry, [id]: newEntry });
  };

  const handleEdit = (record: any) => {
    setEditingResultId(record._id);
    setSelectedClass(record.classId);
    setSelectedSubject(record.marks?.[0]?.subjectId || record.subjectId);
    setSelectedExamType(record.examType);
    
    const recordScore = record.marks?.[0]?.score ?? record.marksObtained ?? 0;
    const recordMax = record.marks?.[0]?.maxMarks ?? record.maxMarks ?? 100;
    
    setMaxMarks(recordMax.toString());
    const entry: any = {};
    const sid = record.studentId?._id || record.studentId;
    entry[sid] = { marks: recordScore.toString(), grade: record.grade };
    setResultsEntry(entry);
    setStudents([record.studentId]);
    setIsMarkingModalVisible(true);
    setSelectedManageRecord(null);
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject) {
      Alert.alert('Error', 'Please select class and subject first');
      return;
    }

    try {
      setLoading(true);
      if (editingResultId) {
        const studentId = Object.keys(resultsEntry)[0];
        const { marks, grade } = resultsEntry[studentId];
        await apiClient.put(`/teacher/result/${editingResultId}`, {
          marks: [{
            subjectId: selectedSubject._id,
            score: parseInt(marks),
            maxMarks: parseInt(maxMarks) || 100
          }],
          grade,
          published: true
        });
        Alert.alert('Success', 'Result updated successfully!');
      } else {
        let count = 0;
        for (const studentId of Object.keys(resultsEntry)) {
          const { marks, grade } = resultsEntry[studentId];
          if (marks && grade) {
            await apiClient.post('/teacher/result', {
              studentId,
              classId: selectedClass._id,
              examType: selectedExamType,
              marks: [{
                subjectId: selectedSubject._id,
                score: parseInt(marks),
                maxMarks: parseInt(maxMarks) || 100
              }],
              grade,
              published: true, 
            });
            count++;
          }
        }
        Alert.alert('Success', `${count} results posted successfully!`);
      }
      
      setIsMarkingModalVisible(false);
      handleReset();
      fetchPastResultsQuietly();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to submit results');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEditingResultId(null);
    setStudents([]);
    setSelectedClass(null);
    setSelectedSubject(null);
    setResultsEntry({});
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Result',
      'Are you sure you want to delete this result?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/teacher/result/${id}`);
              setPastResults(pastResults.filter(r => r._id !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to delete record');
            }
          }
        }
      ]
    );
  };

  const renderPickerTrigger = (label: string, value: string, type: 'class' | 'subject' | 'exam', icon: any) => (
    <View style={styles.pickerWrapper}>
      <Text style={styles.labelSmall}>{label}</Text>
      <TouchableOpacity 
        activeOpacity={0.7}
        style={styles.pickerBtn}
        onPress={() => setPickerType(type)}
      >
        <GlassCard style={styles.pickerGlass}>
          {icon}
          <Text style={[styles.pickerValue, !value && styles.placeholderText]} numberOfLines={1}>
            {value || `Select ${label}`}
          </Text>
          <ChevronDown size={18} color={COLORS.primary} />
        </GlassCard>
      </TouchableOpacity>
    </View>
  );

  if (fetchingData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Management Center...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        title="Academic Center"
        subtitle="Results & grading"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchInitialData} activeOpacity={0.7}>
            <RefreshCw size={18} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'post' && styles.activeTab]}
          onPress={() => setActiveTab('post')}
        >
          <ClipboardList size={20} color={activeTab === 'post' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'post' && styles.activeTabText]}>Post Results</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
          onPress={() => { setActiveTab('manage'); fetchPastResultsQuietly(); }}
        >
          <History size={20} color={activeTab === 'manage' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>Manage Past</Text>
          {!!hasNewUpdates && <View style={styles.updateDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={fetchingData} onRefresh={isQuizMode ? () => fetchQuizSubmissions(quizIdParam) : (activeTab === 'manage' ? fetchPastResults : fetchInitialData)} />}
      >
        {isQuizMode && quizDetails ? (
           <Animated.View entering={FadeInRight}>
             {/* Stats Card */}
             <GlassCard style={styles.quizStatsCard}>
               <View style={styles.quizStatsHeader}>
                 <Award size={24} color={COLORS.primary} />
                 <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={styles.quizTitleLarge}>{quizDetails.title}</Text>
                   <Text style={styles.quizSubTitle}>Quiz Performance Summary</Text>
                 </View>
               </View>
               
               <View style={styles.statsGrid}>
                 <View style={styles.statItem}>
                   <Text style={styles.statLabelMain}>Total</Text>
                   <Text style={styles.statValueMain}>{quizStats?.total || 0}</Text>
                 </View>
                 <View style={styles.statItem}>
                   <Text style={styles.statLabelMain}>Answered</Text>
                   <Text style={[styles.statValueMain, { color: COLORS.success }]}>{quizStats?.submitted || 0}</Text>
                 </View>
                 <View style={styles.statItem}>
                   <Text style={styles.statLabelMain}>Pending</Text>
                   <Text style={[styles.statValueMain, { color: COLORS.error }]}>{quizStats?.pending || 0}</Text>
                 </View>
               </View>
             </GlassCard>

             <View style={styles.quizTabSelector}>
               <TouchableOpacity 
                 style={[styles.quizSubTab, activeQuizTab === 'answered' && styles.quizSubTabActive]}
                 onPress={() => setActiveQuizTab('answered')}
               >
                 <CheckCircle size={16} color={activeQuizTab === 'answered' ? COLORS.primary : COLORS.textSecondary} />
                 <Text style={[styles.quizSubTabText, activeQuizTab === 'answered' && styles.quizSubTabTextActive]}>
                   Answered ({answeredStudents.length})
                 </Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.quizSubTab, activeQuizTab === 'unanswered' && styles.quizSubTabActive]}
                 onPress={() => setActiveQuizTab('unanswered')}
               >
                 <AlertCircle size={16} color={activeQuizTab === 'unanswered' ? COLORS.error : COLORS.textSecondary} />
                 <Text style={[styles.quizSubTabText, activeQuizTab === 'unanswered' && styles.quizSubTabTextActive]}>
                   Yet to Answer ({unansweredStudents.length})
                 </Text>
               </TouchableOpacity>
             </View>

             <View style={styles.studentList}>
               {(activeQuizTab === 'answered' ? answeredStudents : unansweredStudents).map((item, idx) => (
                 <Animated.View key={idx} entering={FadeInDown.delay(idx * 50)}>
                   <GlassCard style={styles.studentResultCard}>
                     <View style={styles.studentInfoRow}>
                       <View style={styles.avatarCircle}>
                         <User size={18} color={COLORS.primary} />
                       </View>
                       <View style={{ flex: 1, marginLeft: 12 }}>
                         <Text style={styles.studentNameText}>
                           {item.studentId.firstName} {item.studentId.lastName}
                         </Text>
                         <Text style={styles.rollNoText}>Roll No: {item.studentId.rollNumber || 'N/A'}</Text>
                       </View>
                       {activeQuizTab === 'answered' ? (
                         <View style={styles.scoreContainer}>
                           <Text style={styles.scoreLabel}>Score</Text>
                           <Text style={styles.scoreValue}>{item.score} / {item.totalMarks}</Text>
                         </View>
                       ) : (
                         <View style={styles.pendingBadgeDetailed}>
                           <Text style={styles.pendingTextDetailed}>PENDING</Text>
                         </View>
                       )}
                     </View>
                   </GlassCard>
                 </Animated.View>
               ))}
               
               {(activeQuizTab === 'answered' ? answeredStudents : unansweredStudents).length === 0 && (
                 <View style={styles.emptyResults}>
                   <Search size={40} color={COLORS.textSecondary + '50'} />
                   <Text style={styles.emptyResultsText}>No students in this category</Text>
                 </View>
               )}
             </View>
             
             <TouchableOpacity 
               style={styles.exitQuizModeBtn} 
               onPress={() => {
                 setIsQuizMode(false);
                 fetchInitialData();
               }}
             >
               <Text style={styles.exitQuizModeBtnText}>Back to General Results</Text>
             </TouchableOpacity>
           </Animated.View>
        ) : activeTab === 'post' ? (
          <Animated.View entering={FadeInUp.delay(200)}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EXAM CONFIGURATION</Text>
              <GlassCard style={styles.formCard}>
                <View style={styles.row}>
                  {renderPickerTrigger('CLASS', selectedClass?.name, 'class', <Layers size={18} color={COLORS.primary} style={styles.inputIcon} />)}
                  <View style={{ width: 16 }} />
                  {renderPickerTrigger('SUBJECT', selectedSubject?.name, 'subject', <BookOpen size={18} color={COLORS.primary} style={styles.inputIcon} />)}
                </View>

                <View style={[styles.row, { marginTop: 20 }]}>
                  {renderPickerTrigger('EXAM TYPE', selectedExamType.toUpperCase(), 'exam', <Award size={18} color={COLORS.primary} style={styles.inputIcon} />)}
                  <View style={{ width: 16 }} />
                  <View style={styles.pickerWrapper}>
                    <Text style={styles.labelSmall}>MAX MARKS</Text>
                    <View style={styles.marksInputWrapper}>
                      <TextInput
                        style={styles.marksInput}
                        value={maxMarks}
                        onChangeText={setMaxMarks}
                        keyboardType="number-pad"
                        placeholder="100"
                      />
                    </View>
                  </View>
                </View>

                <CustomButton
                  title={students.length > 0 ? `Continue for ${students.length} Students` : "Select Class to Mark"}
                  onPress={() => setIsMarkingModalVisible(true)}
                  disabled={!selectedClass || !selectedSubject || students.length === 0}
                  style={styles.continueBtn}
                  icon={<ChevronRight size={20} color="#FFF" />}
                />
              </GlassCard>
            </View>

            <View style={styles.infoBox}>
              <TrendingUp size={20} color={COLORS.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Real-time Insights</Text>
                <Text style={styles.infoText}>Posted results are instantly visible to students and parents on their respective dashboards.</Text>
              </View>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.manageSection}>
            <View style={styles.sectionHeaderRow}>
               <Text style={styles.sectionTitle}>
                 {selectedGroup ? `${selectedGroup.className} • ${selectedGroup.examType.toUpperCase()}` : 'PAST RECORDS'}
               </Text>
               <View style={styles.countBadge}>
                 <Text style={styles.countText}>
                   {selectedGroup ? `${selectedGroup.results.length} Students` : `${groupedResults.length} Groups`}
                 </Text>
               </View>
            </View>

            {selectedGroup && (
              <TouchableOpacity 
                style={styles.backToGroupsBtn} 
                onPress={() => setSelectedGroup(null)}
              >
                <ArrowLeft size={16} color={COLORS.primary} />
                <Text style={styles.backToGroupsText}>Back to Groups</Text>
              </TouchableOpacity>
            )}

            {(selectedGroup ? selectedGroup.results : groupedResults).length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBg}>
                  <ClipboardList size={40} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyText}>No results posted yet</Text>
                <TouchableOpacity onPress={() => setActiveTab('post')} style={styles.emptyAction}>
                  <Text style={styles.emptyActionText}>Post your first result</Text>
                </TouchableOpacity>
              </View>
            ) : !selectedGroup ? (
              // Grouped View (Cards for each Class + Exam Type)
              groupedResults.map((group: any, index: number) => (
                <Animated.View 
                  key={`${group.classId}-${group.examType}`} 
                  entering={FadeInRight.delay(index * 50)}
                >
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => setSelectedGroup(group)}
                  >
                    <GlassCard style={styles.groupCard}>
                      <View style={styles.groupHeader}>
                        <View style={styles.groupInfo}>
                          <View style={styles.groupIconBg}>
                            <Layers size={20} color={COLORS.primary} />
                          </View>
                          <View>
                            <Text style={styles.groupClassName}>{group.className}</Text>
                            <Text style={styles.groupExamType}>{group.examType.toUpperCase()}</Text>
                          </View>
                        </View>
                        <ChevronRight size={20} color={COLORS.textSecondary} />
                      </View>
                      
                      <View style={styles.groupStats}>
                        <View style={styles.statBox}>
                          <Text style={styles.statLabel}>Marked</Text>
                          <Text style={[styles.statValue, { color: COLORS.success }]}>{group.markedCount}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                          <Text style={styles.statLabel}>Remaining</Text>
                          <Text style={[styles.statValue, { color: group.remainingCount > 0 ? COLORS.error : COLORS.textSecondary }]}>
                            {group.remainingCount}
                          </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                          <Text style={styles.statLabel}>Total</Text>
                          <Text style={styles.statValue}>{group.totalCount}</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              // Detailed View (Student Records for selected group)
              selectedGroup.results.map((record: any, index: number) => (
                <Animated.View 
                  key={record._id} 
                  entering={FadeInRight.delay(index * 50)}
                >
                  <GlassCard style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <View style={styles.studentInfo}>
                        <View style={styles.avatarMini}>
                          <User size={16} color={COLORS.primary} />
                        </View>
                        <View>
                          <Text style={styles.studentName} numberOfLines={1}>
                            {(record.studentId?.firstName || 'Student') + ' ' + (record.studentId?.lastName || '')}
                          </Text>
                          <Text style={styles.recordMeta}>
                            {record.studentId?.rollNo ? `Roll No: ${record.studentId.rollNo}` : 'Student Record'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(record.grade) + '15' }]}>
                        <Text style={[styles.gradeText, { color: getGradeColor(record.grade) }]}>{record.grade}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.recordFooter}>
                       <View style={styles.scoreBox}>
                         <AwardIcon size={14} color={COLORS.primary} />
                         <Text style={styles.scoreText}>
                           {record.marks?.[0]?.score ?? record.marksObtained ?? 0} / {record.marks?.[0]?.maxMarks ?? record.maxMarks ?? 100}
                         </Text>
                       </View>
                       <View style={styles.recordActions}>
                         <TouchableOpacity onPress={() => handleEdit(record)} style={styles.actionIconBtn}>
                           <Edit size={16} color={COLORS.primary} />
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => handleDelete(record._id)} style={[styles.actionIconBtn, { backgroundColor: COLORS.error + '10' }]}>
                           <Trash2 size={16} color={COLORS.error} />
                         </TouchableOpacity>
                       </View>
                    </View>
                  </GlassCard>
                </Animated.View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Marking Modal */}
      <Modal visible={isMarkingModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalBg}>
          <View style={styles.modalFullContent}>
            <View style={styles.modalNavbar}>
               <TouchableOpacity onPress={() => setIsMarkingModalVisible(false)} style={styles.modalCloseBtn}>
                 <ArrowLeft size={24} color={COLORS.text} />
               </TouchableOpacity>
               <View>
                 <Text style={styles.modalNavbarTitle}>{editingResultId ? 'Edit Result' : 'Enter Marks'}</Text>
                 <Text style={styles.modalNavbarSubtitle}>{selectedClass?.name} • {selectedSubject?.name}</Text>
               </View>
            </View>

            <FlatList
              data={students}
              keyExtractor={(s) => s?._id || Math.random().toString()}
              contentContainerStyle={styles.markingList}
              renderItem={({ item: student }) => {
                if (!student) return null;
                const entry = resultsEntry[student._id] || { marks: '', grade: '' };
                return (
                  <View style={styles.markingCard}>
                    <View style={styles.markingInfo}>
                      <Text style={styles.markingStudentName}>
                        {(student.firstName || 'Student') + ' ' + (student.lastName || '')}
                      </Text>
                      {!!(!!student.rollNumber) && <Text style={styles.rollNo}>Roll No: {student.rollNumber}</Text>}
                    </View>
                    <View style={styles.entrySection}>
                      <TextInput
                        style={styles.markEntryInput}
                        value={entry.marks}
                        onChangeText={(v) => updateResultEntry(student._id, 'marks', v)}
                        placeholder="00"
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                      <View style={styles.gradeCircle}>
                        <Text style={styles.gradeCircleText}>{entry.grade || '-'}</Text>
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            <View style={styles.markingFooter}>
              <CustomButton
                title={editingResultId ? "Update Result" : `Publish ${Object.values(resultsEntry).filter((v:any) => v.marks).length} Results`}
                onPress={handleSubmit}
                loading={loading}
                style={styles.finalSubmitBtn}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Selection Picker Modals */}
      <Modal visible={pickerType !== null} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.pickerOverlay} 
          activeOpacity={1} 
          onPress={() => setPickerType(null)}
        >
          <Animated.View entering={FadeInUp} style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <View style={styles.pickerIndicator} />
              <Text style={styles.pickerTitle}>
                {pickerType === 'class' ? 'Select Class' : pickerType === 'subject' ? 'Select Subject' : 'Select Exam Type'}
              </Text>
            </View>
            
            <FlatList
              data={pickerType === 'class' ? classes : pickerType === 'subject' ? subjects : EXAM_TYPES}
              keyExtractor={(item, index) => (typeof item === 'string' ? item : item._id || index.toString())}
              contentContainerStyle={styles.pickerList}
              renderItem={({ item }) => {
                const isString = typeof item === 'string';
                const label = isString ? item.toUpperCase() : item.name;
                const id = isString ? item : item._id;
                const isSelected = pickerType === 'class' ? selectedClass?._id === id : 
                                  pickerType === 'subject' ? selectedSubject?._id === id : 
                                  selectedExamType === id;

                return (
                  <TouchableOpacity 
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      if (pickerType === 'class') handleClassSelect(item);
                      if (pickerType === 'subject') { setSelectedSubject(item); setPickerType(null); }
                      if (pickerType === 'exam') { setSelectedExamType(item); setPickerType(null); }
                    }}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>{label}</Text>
                    {!!(isSelected) && <CheckCircle size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const getGradeColor = (grade: string) => {
  if (['A+', 'A'].includes(grade)) return COLORS.success;
  if (['B', 'C'].includes(grade)) return COLORS.primary;
  if (grade === 'D') return '#F59E0B';
  return COLORS.error;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerAction: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    gap: 8,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: COLORS.primary + '10',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    position: 'absolute',
    top: 10,
    right: 15,
  },
  content: {
    flex: 1,
  },
  manageSection: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    opacity: 0.5,
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  formCard: {
    padding: 16,
    borderRadius: 24,
  },
  row: {
    flexDirection: 'row',
  },
  pickerWrapper: {
    flex: 1,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 4,
    opacity: 0.6,
  },
  pickerBtn: {
    width: '100%',
  },
  pickerGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    minHeight: 58,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 12,
  },
  pickerValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 22,
  },
  placeholderText: {
    fontWeight: '400',
    color: COLORS.textSecondary + '60',
  },
  marksInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  marksInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    paddingVertical: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 24,
  },
  continueBtn: {
    marginTop: 24,
    borderRadius: 16,
    height: 56,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  backToGroupsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backToGroupsText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  groupCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupClassName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  groupExamType: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  groupStats: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E2E8F0',
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  recordCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 22,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  recordMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  gradeText: {
    fontWeight: '800',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  recordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyAction: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  emptyActionText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalBg: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalFullContent: {
    flex: 1,
  },
  modalNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalNavbarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalNavbarSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  markingList: {
    padding: 16,
  },
  markingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  markingInfo: {
    flex: 1,
  },
  markingStudentName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  rollNo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  entrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markEntryInput: {
    width: 60,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gradeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  gradeCircleText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  markingFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  finalSubmitBtn: {
    height: 56,
    borderRadius: 16,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  pickerIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  pickerList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  pickerItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  studentList: {
    marginBottom: 20,
  },
  
  // Quiz Mode Styles
  quizStatsCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  quizStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quizTitleLarge: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  quizSubTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabelMain: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValueMain: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  quizTabSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quizSubTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  quizSubTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  quizSubTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  quizSubTabTextActive: {
    color: COLORS.primary,
  },
  studentResultCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  rollNoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  pendingBadgeDetailed: {
    backgroundColor: COLORS.error + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingTextDetailed: {
    color: COLORS.error,
    fontSize: 10,
    fontWeight: '800',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyResultsText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  exitQuizModeBtn: {
    marginTop: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  exitQuizModeBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default ResultManagementScreen;
