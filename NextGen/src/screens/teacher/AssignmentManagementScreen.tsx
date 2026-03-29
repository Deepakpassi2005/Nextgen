import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  TextInput,
  ScrollView,
  Linking,
  PanResponder,
  Animated as RNAnimated
} from 'react-native';
import { CONFIG } from '../../config';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  ClipboardList, 
  Trash2, 
  Plus, 
  BookOpen, 
  Calendar, 
  Layers,
  X,
  Upload,
  CheckCircle,
  Clock,
  ArrowLeft,
  Users,
  Home,
  CheckSquare,
  Bell,
  User,
  Paperclip,
  FileSearch,
  ExternalLink
} from 'lucide-react-native';
import { GlassCard } from '../../components/GlassCard';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import PageHeader from '../../components/PageHeader';

const { width, height } = Dimensions.get('window');

import { StackNavigationProp } from '@react-navigation/stack';

const AssignmentManagementScreen = ({ navigation }: { navigation: StackNavigationProp<any> }) => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classList, setClassList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  
  // Create Modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    dueDate: new Date(),
    attachments: [] as any[],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);


  // Submissions Modal
  const [submissionsModalVisible, setSubmissionsModalVisible] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading Modal
  const [gradingModalVisible, setGradingModalVisible] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  // PanResponder for swipe-to-close modal
  const panY = React.useRef(new RNAnimated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          closeSubmissions();
        } else {
          RNAnimated.spring(panY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const closeSubmissions = () => {
    RNAnimated.timing(panY, {
      toValue: 1000,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setSubmissionsModalVisible(false);
      panY.setValue(0);
    });
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes');
      setClassList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async (classId: string) => {
    if (!classId || classId === 'all') {
      setSubjectList([]);
      return;
    }
    try {
      const response = await apiClient.get(`/subjects?classId=${classId}`);
      setSubjectList(response.data.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAssignments = async () => {
    if (filterClass === 'all') {
      setAssignments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.get(`/teacher/assignments/class/${filterClass}`);
      setAssignments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (filterClass !== 'all') {
      fetchSubjects(filterClass);
      fetchAssignments();
    } else {
      setAssignments([]);
      setLoading(false);
    }
  }, [filterClass]);

  const handleCreateAssignment = async () => {
    if (!formData.title || !formData.classId || !formData.subjectId) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('classId', formData.classId);
      formDataToSend.append('subjectId', formData.subjectId);
      formDataToSend.append('dueDate', formData.dueDate.toISOString());
      
      formData.attachments.forEach((file: any) => {
        formDataToSend.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as any);
      });

      await apiClient.post('/teacher/assignments', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      });

      Alert.alert('Success', 'Assignment posted and students notified successfully!');
      setCreateModalVisible(false);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        classId: filterClass !== 'all' ? filterClass : '',
        subjectId: '',
        dueDate: new Date(),
        attachments: [],
      });
      fetchAssignments();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Assignment',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await apiClient.delete(`/teacher/assignments/${id}`);
              fetchAssignments();
              Alert.alert('Success', 'Assignment deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete assignment');
            }
          }
        }
      ]
    );
  };

  const openSubmissions = async (assignment: any) => {
    setActiveAssignment(assignment);
    setSubmissionsModalVisible(true);
    setLoadingSubmissions(true);
    try {
      const response = await apiClient.get(`/teacher/assignments/${assignment._id}/submissions`);
      setSubmissions(response.data.data || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch submissions');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const submitGrade = async () => {
    if (!gradeInput || isNaN(Number(gradeInput))) {
      Alert.alert('Error', 'Please enter a valid numeric grade');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.put(`/teacher/assignments/submissions/${activeSubmission._id}/grade`, {
        grade: Number(gradeInput),
        feedback: feedbackInput,
      });
      Alert.alert('Success', 'Grade submitted');
      setGradingModalVisible(false);
      // Refresh submissions
      const response = await apiClient.get(`/teacher/assignments/${activeAssignment._id}/submissions`);
      setSubmissions(response.data.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit grade');
    } finally {
      setSubmitting(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, result.assets[0]],
        }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const renderAssignmentCard = ({ item, index }: any) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.iconBox}>
              <ClipboardList size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubject}>{item.subjectId?.name || 'Subject'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleDelete(item._id, item.title)}
          >
            <Trash2 size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Clock size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submissionsBtn}
          onPress={() => openSubmissions(item)}
        >
          <Users size={18} color="#FFF" />
          <Text style={styles.submissionsBtnText}>View Submissions</Text>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="Assignments"
        subtitle="Manage student tasks"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, filterClass === 'all' && styles.filterChipActive]}
            onPress={() => setFilterClass('all')}
          >
            <Text style={[styles.filterChipText, filterClass === 'all' && styles.filterChipTextActive]}>
              Select Class First
            </Text>
          </TouchableOpacity>
          {classList.map(cls => (
            <TouchableOpacity 
              key={cls._id}
              style={[styles.filterChip, filterClass === cls._id && styles.filterChipActive]}
              onPress={() => setFilterClass(cls._id)}
            >
              <Text style={[styles.filterChipText, filterClass === cls._id && styles.filterChipTextActive]}>
                {cls.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filterClass === 'all' ? (
        <View style={styles.emptyContainer}>
          <Layers size={60} color={COLORS.primary + '50'} />
          <Text style={styles.emptyTitle}>Select a Class</Text>
          <Text style={styles.emptySub}>Please select a class above to view assignments.</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ClipboardList size={60} color={COLORS.primary + '50'} />
          <Text style={styles.emptyTitle}>No Assignments</Text>
          <Text style={styles.emptySub}>You haven't posted any assignments for this class yet.</Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          renderItem={renderAssignmentCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAssignments} />}
        />
      )}

      {filterClass !== 'all' && (
        <TouchableOpacity style={styles.fab} onPress={() => {
          setFormData(prev => ({ ...prev, classId: filterClass }));
          setCreateModalVisible(true);
        }}>
          <Plus size={24} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Create Assignment Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Assignment</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={t => setFormData({...formData, title: t})}
                  placeholder="e.g. Chapter 4 Quiz"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {subjectList.map(sub => (
                    <TouchableOpacity 
                      key={sub._id}
                      style={[styles.subChip, formData.subjectId === sub._id && styles.subChipActive]}
                      onPress={() => setFormData({...formData, subjectId: sub._id})}
                    >
                      <Text style={[styles.subChipText, formData.subjectId === sub._id && styles.subChipTextActive]}>
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Calendar size={20} color={COLORS.primary} />
                  <Text style={styles.dateBtnText}>{formData.dueDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.dueDate}
                    mode="date"
                    display="default"
                    onChange={(event: any, selectedDate: any) => {
                      setShowDatePicker(false);
                      if (selectedDate) setFormData({...formData, dueDate: selectedDate});
                    }}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={t => setFormData({...formData, description: t})}
                  placeholder="Instructions..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                <Upload size={20} color={COLORS.primary} />
                <Text style={styles.uploadBtnText}>Attach Document (Optional)</Text>
              </TouchableOpacity>
              {formData.attachments.length > 0 && (
                <View style={styles.attachmentList}>
                  {formData.attachments.map((att, i) => (
                    <View key={i} style={styles.attachmentChip}>
                      <Paperclip size={14} color={COLORS.primary} />
                      <Text style={styles.attachmentChipText} numberOfLines={1}>{att.name}</Text>
                      <TouchableOpacity onPress={() => removeAttachment(i)} style={styles.removeChipBtn}>
                        <X size={14} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                onPress={handleCreateAssignment}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Post Assignment</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Submissions Modal */}
      <Modal visible={submissionsModalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <RNAnimated.View 
            style={[
              styles.fullModalContent, 
              { transform: [{ translateY: panY }] }
            ]}
          >
            <View style={styles.swipeHandleContainer} {...panResponder.panHandlers}>
              <View style={styles.swipeHandle} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submissions</Text>
              <TouchableOpacity onPress={closeSubmissions}>
                <X size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {loadingSubmissions ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : submissions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Users size={60} color={COLORS.primary + '50'} />
                <Text style={styles.emptyTitle}>No Submissions</Text>
                <Text style={styles.emptySub}>No students have submitted yet.</Text>
              </View>
            ) : (
              <FlatList
                data={submissions}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: SPACING.md }}
                renderItem={({ item }) => (
                  <View style={styles.submissionCard}>
                    <View style={styles.subHeader}>
                      <Text style={styles.subStudentName}>{item.studentId?.name || 'Unknown'}</Text>
                      {item.grade ? (
                        <View style={styles.gradedBadge}>
                          <Text style={styles.gradedText}>Graded: {item.grade}</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingText}>Pending Review</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.subDate}>Submitted: {new Date(item.submittedAt).toLocaleString()}</Text>
                    {item.content ? <Text style={styles.subContent}>"{item.content}"</Text> : null}
                    
                    {item.attachments && item.attachments.length > 0 && (
                      <View style={styles.subAttachments}>
                        <Text style={styles.attachmentLabel}>Attachments:</Text>
                        {item.attachments.map((file: any, index: number) => (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.attachmentItem}
                            onPress={() => {
                              const downloadUrl = `${CONFIG.API_BASE_URL}/public/download?fileUrl=${encodeURIComponent(file.url)}&fileName=${encodeURIComponent(file.filename)}`;
                              Linking.openURL(downloadUrl).catch(err => 
                                Alert.alert('Error', 'Could not open file URL')
                              );
                            }}
                          >
                            <Paperclip size={14} color={COLORS.primary} />
                            <Text style={styles.attachmentName} numberOfLines={1}>{file.filename}</Text>
                            <ExternalLink size={12} color={COLORS.textSecondary} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.gradeBtn} 
                      onPress={() => {
                        setActiveSubmission(item);
                        setGradeInput(item.grade ? String(item.grade) : '');
                        setFeedbackInput(item.feedback || '');
                        setGradingModalVisible(true);
                      }}
                    >
                      <Text style={styles.gradeBtnText}>{item.grade ? 'Update Grade' : 'Grade Submission'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </RNAnimated.View>
        </View>
      </Modal>

      {/* Grading Modal */}
      <Modal visible={gradingModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.gradeModalContent}>
            <Text style={styles.modalTitle}>Grade Submission</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Grade (0-100)</Text>
              <TextInput
                style={styles.input}
                value={gradeInput}
                onChangeText={setGradeInput}
                keyboardType="numeric"
                placeholder="Ex: 95"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Feedback (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={feedbackInput}
                onChangeText={setFeedbackInput}
                placeholder="Good work..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setGradingModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={submitGrade} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Grade</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  filterSection: { backgroundColor: COLORS.surface, paddingBottom: SPACING.sm },
  filterScroll: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: COLORS.primary },
  
  listContainer: { padding: SPACING.md, paddingBottom: 100, gap: SPACING.md },
  card: { padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  iconBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  cardSubject: { fontSize: 12, color: COLORS.textSecondary },
  deleteBtn: { padding: 8 },
  cardDetails: { flexDirection: 'row', marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  detailText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 6 },
  submissionsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 10, borderRadius: 8,
  },
  submissionsBtnText: { color: '#FFF', fontWeight: '600', marginLeft: 8 },
  
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    minHeight: '80%', padding: SPACING.lg,
  },
  fullModalContent: {
    backgroundColor: COLORS.background, flex: 1, marginTop: 50,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  gradeModalContent: {
    backgroundColor: COLORS.background, margin: 24, borderRadius: 16,
    padding: SPACING.lg, alignSelf: 'center', width: '90%', marginTop: 'auto', marginBottom: 'auto'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: SPACING.md, fontSize: 15, color: COLORS.text,
  },
  textArea: { minHeight: 100 },
  
  subChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB'
  },
  subChipActive: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary },
  subChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  subChipTextActive: { color: COLORS.primary },
  
  dateBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING.md,
  },
  dateBtnText: { marginLeft: 10, fontSize: 15, color: COLORS.text },
  
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primary,
    borderRadius: 12, padding: SPACING.lg, marginBottom: SPACING.xl,
  },
  uploadBtnText: { color: COLORS.primary, fontWeight: '600', marginLeft: 8 },
  
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 40,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },

  submissionCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subStudentName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  gradedBadge: { backgroundColor: COLORS.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  gradedText: { color: COLORS.success, fontSize: 12, fontWeight: '700' },
  pendingBadge: { backgroundColor: COLORS.warning + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  pendingText: { color: COLORS.warning, fontSize: 12, fontWeight: '700' },
  subDate: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  subContent: { fontSize: 14, color: COLORS.text, fontStyle: 'italic', marginBottom: 12 },
  gradeBtn: {
    alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 8,
  },
  gradeBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  
  subAttachments: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', padding: 14, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: COLORS.text, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '600' },
  attachmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 15,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    maxWidth: '100%',
  },
  attachmentChipText: {
    fontSize: 12,
    color: COLORS.text,
    flexShrink: 1,
  },
  removeChipBtn: {
    padding: 2,
  },
  swipeHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  swipeHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.border,
  },
});

export default AssignmentManagementScreen;
