import React, { useState, useEffect, useRef } from 'react';
import {
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Keyboard,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useQuizStore, type Question, type TeacherQuiz, type Class } from '../../store';
import { useUserStore } from '../../store';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import { GlassCard } from '../../components/GlassCard';
import { CustomButton } from '../../components/CustomButton';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit3,
  Clock,
  HelpCircle,
  CheckCircle2,
  ArrowLeft,
  Layout as LayoutIcon,
  BookOpen,
  Layers,
  ArrowRight,
  X,
  Type,
  AlignLeft,
  Info,
  Calendar,
  CheckCircle,
  AlertCircle,
  Home,
  CheckSquare,
  Bell,
  User as UserIcon
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInRight,
  Layout,
  SlideInRight,
  FadeInLeft
} from 'react-native-reanimated';
import PageHeader from '../../components/PageHeader';

const { width } = Dimensions.get('window');

import { StackNavigationProp } from '@react-navigation/stack';

export default function QuizManagementScreen({ navigation }: { navigation: StackNavigationProp<any> }) {
  const { user } = useUserStore();
  const {
    addQuiz,
    teacherQuizzes,
    classes,
    subjects,
    isLoading,
    loadData,
    updateQuiz,
    deleteQuiz
  } = useQuizStore();

  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);


  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [classMenuVisible, setClassMenuVisible] = useState(false);
  const [subjectMenuVisible, setSubjectMenuVisible] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'initial-question',
      text: '',
      marks: 1,
      type: 'mcq',
      options: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false },
      ],
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>('initial-question');

  useEffect(() => {
    loadData();
  }, []);

  const handleEditQuiz = (quiz: TeacherQuiz) => {
    setEditingQuizId(quiz.id);
    setTitle(quiz.title);
    setDescription(quiz.description || '');
    setDuration(quiz.duration.toString());

    const cls = classes.find(c => c._id === (typeof quiz.classId === 'object' ? quiz.classId._id : quiz.classId));
    setSelectedClass(cls || null);
    setSelectedSubject(typeof quiz.subjectId === 'object' ? quiz.subjectId : { _id: quiz.subjectId, name: 'Subject' });

    setQuestions(quiz.questions.map(q => ({
      ...q,
      id: q.id || Math.random().toString(36).substr(2, 9)
    })));

    setIsEditing(true);
    setExpandedQuestion(quiz.questions[0]?.id || null);
  };

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(cls);
    setClassMenuVisible(false);
  };

  const handleDeleteQuiz = (id: string, quizTitle: string) => {
    Alert.alert(
      'Delete Quiz',
      `Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteQuiz(id);
              Alert.alert('Success', 'Quiz deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete quiz');
            }
          }
        }
      ]
    );
  };

  const handleAddQuestion = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newQuestion: Question = {
      id: newId,
      text: '',
      marks: 1,
      type: 'mcq',
      options: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false },
      ],
    };
    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(newId);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length === 1) {
      Alert.alert('Error', 'A quiz must have at least one question.');
      return;
    }
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const toggleOptionCorrect = (qId: string, oId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: q.options.map(o => ({
            ...o,
            isCorrect: o.id === oId
          }))
        };
      }
      return q;
    }));
  };

  const updateOptionText = (qId: string, oId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          options: q.options.map(o => o.id === oId ? { ...o, text } : o)
        };
      }
      return q;
    }));
  };

  const handleCreateOrUpdate = async () => {
    if (!title || !selectedClass || !selectedSubject || !duration) {
      Alert.alert('Missing Fields', 'Please fill in all required quiz details.');
      return;
    }

    // Basic validation for questions
    const invalidQuestion = questions.find(q => !q.text || q.options.every(o => !o.isCorrect) || q.options.some(o => !o.text));
    if (invalidQuestion) {
      Alert.alert('Incomplete Questions', 'Please ensure all questions have text, four options, and one correct answer marked.');
      return;
    }

    setLoading(true);
    try {
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
      const quizData = {
        title,
        description,
        duration: parseInt(duration),
        totalMarks,
        classId: selectedClass._id,
        subjectId: selectedSubject._id,
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          marks: q.marks,
          options: q.options.map(o => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
        }))
      };

      if (isEditing && editingQuizId) {
        await updateQuiz(editingQuizId, quizData);
        Alert.alert('Success', 'Quiz updated successfully!');
      } else {
        await addQuiz(quizData);
        Alert.alert('Success', 'New quiz created and published!');
      }
      handleCancelCreate();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingQuizId(null);
    setTitle('');
    setDescription('');
    setDuration('30');
    setSelectedClass(null);
    setSelectedSubject(null);
    setQuestions([{
      id: 'initial-question',
      text: '',
      marks: 1,
      type: 'mcq',
      options: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false },
      ],
    }]);
    setExpandedQuestion('initial-question');
  };

  if (!isCreating && !isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <PageHeader
          title="Quizzes"
          subtitle="Manage your class quizzes"
          onBack={() => navigation.goBack()}
          rightElement={
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.7}
              onPress={() => setIsCreating(true)}
            >
              <Plus size={20} color="#FFF" />
            </TouchableOpacity>
          }
        />

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[COLORS.primary]} />}
        >
          {isLoading ? (
            <View style={[styles.centered, { marginTop: 100 }]}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : teacherQuizzes.length === 0 ? (
            <Animated.View entering={FadeInUp.delay(400)} style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <LayoutIcon size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
              <Text style={styles.emptySubtitle}>Start by creating your first assessment for your students.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => setIsCreating(true)}
              >
                <Text style={styles.emptyBtnText}>Create First Quiz</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            teacherQuizzes.map((quiz, index) => (
              <Animated.View
                key={quiz.id}
                entering={FadeInRight.delay(index * 100).duration(500)}
              >
                <GlassCard style={styles.quizCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.quizInfoColumn}>
                      <Text style={styles.quizTitle} numberOfLines={1}>{quiz.title}</Text>
                      <View style={styles.badgeRow}>
                        <View style={styles.classBadge}>
                          <BookOpen size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                          <Text style={styles.badgeText}>
                            {typeof quiz.classId === 'object' ? quiz.classId.name : (quiz.classId || 'Class')}
                          </Text>
                        </View>
                        <View style={styles.subjectBadge}>
                          <Text style={styles.subjectBadgeText}>
                            {typeof quiz.subjectId === 'object' ? (quiz.subjectId as any).name : (quiz.subjectId || 'Subject')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleEditQuiz(quiz)}
                        style={styles.cardActionBtn}
                      >
                        <Edit3 size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDeleteQuiz(quiz.id, quiz.title)}
                        style={[styles.cardActionBtn, { backgroundColor: COLORS.error + '10' }]}
                      >
                        <Trash2 size={18} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.quizDesc} numberOfLines={2}>
                    {quiz.description || 'Assessing student knowledge through dynamic questions.'}
                  </Text>

                  <View style={styles.divider} />

                  <View style={styles.cardFooter}>
                    <View style={styles.footerInfoItem}>
                      <Clock size={16} color={COLORS.textSecondary} />
                      <Text style={styles.footerInfoText}>{quiz.duration} mins</Text>
                    </View>
                    <View style={styles.footerInfoItem}>
                      <HelpCircle size={16} color={COLORS.textSecondary} />
                      <Text style={styles.footerInfoText}>{quiz.questions?.length || 0} Questions</Text>
                    </View>
                      <TouchableOpacity 
                        activeOpacity={0.7} 
                        style={styles.viewResultBtn}
                        onPress={() => navigation.navigate('ResultManagement', { quizId: quiz.id })}
                      >
                      <Text style={styles.viewResultText}>Results</Text>
                      <ArrowRight size={14} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Designer Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <TouchableOpacity onPress={handleCancelCreate} style={styles.backBtnWrapper}>
            <ArrowLeft size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit Quiz' : 'New Quiz'}</Text>
            <Text style={styles.headerSubtitle}>Assessment Designer</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContentLarge}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(200)}>
            <GlassCard style={styles.formCard}>
              <Text style={styles.sectionHeading}>GENERAL INFO</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.labelSmall}>QUIZ TITLE</Text>
                <View style={styles.inputWrapper}>
                  <Type size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="e.g. Midterm Physics Exam"
                    placeholderTextColor={COLORS.textSecondary + '70'}
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.labelSmall}>DESCRIPTION (OPTIONAL)</Text>
                <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
                  <AlignLeft size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Provide context for your students..."
                    placeholderTextColor={COLORS.textSecondary + '70'}
                    value={description}
                    onChangeText={setDescription}
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    multiline
                    numberOfLines={3}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.labelSmall}>DURATION (MIN)</Text>
                  <View style={styles.inputWrapper}>
                    <Clock size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <TextInput
                      placeholder="30"
                      placeholderTextColor={COLORS.textSecondary + '70'}
                      value={duration}
                      onChangeText={setDuration}
                      keyboardType="number-pad"
                      style={styles.input}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.labelSmall}>TARGET CLASS</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.selectorBtn}
                    onPress={() => setClassMenuVisible(true)}
                  >
                    <View style={styles.selectorContent}>
                      <Layers size={18} color={COLORS.primary} style={styles.inputIcon} />
                      <Text style={[styles.selectorValueText, !selectedClass && styles.placeholderText]} numberOfLines={1}>
                        {selectedClass ? selectedClass.name : 'Select'}
                      </Text>
                      <ChevronDown size={18} color={COLORS.textSecondary} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputGroup, { marginTop: 16 }]}>
                <Text style={styles.labelSmall}>SUBJECT</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.selectorBtn}
                  onPress={() => setSubjectMenuVisible(true)}
                >
                  <View style={styles.selectorContent}>
                    <BookOpen size={18} color={COLORS.primary} style={styles.inputIcon} />
                    <Text style={[styles.selectorValueText, !selectedSubject && styles.placeholderText]} numberOfLines={1}>
                      {selectedSubject ? selectedSubject.name : 'Select Subject'}
                    </Text>
                    <ChevronDown size={18} color={COLORS.textSecondary} />
                  </View>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Questions Section */}
          <Animated.View entering={FadeInUp.delay(300)} style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>QUESTIONS ({questions.length})</Text>
            <View style={styles.marksBadge}>
              <Text style={styles.marksText}>{questions.reduce((sum, q) => sum + (q.marks || 1), 0)} Total Marks</Text>
            </View>
          </Animated.View>

          <View style={styles.questionsList}>
            {questions.map((question, index) => (
              <Animated.View
                key={question.id}
                layout={Layout.springify()}
                entering={FadeInLeft.delay(index * 100)}
                style={[
                  styles.questionCard,
                  expandedQuestion === question.id && styles.questionCardExpanded
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                  style={styles.questionBar}
                >
                  <View style={styles.questionBarLeft}>
                    <View style={styles.qIndex}>
                      <Text style={styles.qIndexText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.questionBarTitle} numberOfLines={1}>
                      {question.text || 'Empty Question'}
                    </Text>
                  </View>
                  {expandedQuestion === question.id ? (
                    <ChevronUp size={20} color={COLORS.primary} />
                  ) : (
                    <ChevronDown size={20} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>

                {!!(expandedQuestion === question.id) && (
                  <View style={styles.questionBody}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.labelSmall}>QUESTION TEXT</Text>
                      <TextInput
                        placeholder="Enter the question here..."
                        placeholderTextColor={COLORS.textSecondary + '70'}
                        value={question.text}
                        onChangeText={(text) => updateQuestionText(question.id, text)}
                        style={[styles.inputLarge, { backgroundColor: '#FFF' }]}
                        multiline
                      />
                    </View>

                    <View style={styles.optionsGrid}>
                      <Text style={styles.labelSmall}>OPTIONS & CORRECT ANSWER</Text>
                      {question.options?.map((option, optIndex) => (
                        <View key={option.id} style={styles.optionRow}>
                          <TouchableOpacity
                            onPress={() => toggleOptionCorrect(question.id, option.id)}
                            style={[
                              styles.checkCircle,
                              option.isCorrect && styles.checkCircleActive
                            ]}
                          >
                            {!!(option.isCorrect) && <CheckCircle size={14} color="#FFF" />}
                          </TouchableOpacity>
                          <TextInput
                            placeholder={`Option ${optIndex + 1}`}
                            placeholderTextColor={COLORS.textSecondary + '70'}
                            value={option.text}
                            onChangeText={(text) => updateOptionText(question.id, option.id, text)}
                            style={styles.optionInput}
                          />
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.removeQuestionAction}
                      onPress={() => handleRemoveQuestion(question.id)}
                    >
                      <Trash2 size={16} color={COLORS.error} />
                      <Text style={styles.removeActionText}>Remove Question</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addNewQuestionBtn}
            onPress={handleAddQuestion}
            disabled={loading}
          >
            <Plus size={22} color={COLORS.primary} />
            <Text style={styles.addNewQuestionText}>Add New Question</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer Fix */}
        <View style={styles.footerSticky}>
          <CustomButton
            title={loading ? "Saving..." : (isEditing ? "Update Assessment" : "Publish Assessment")}
            onPress={handleCreateOrUpdate}
            loading={loading}
            disabled={loading}
            style={styles.publishMainBtn}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Select Modals */}
      <Modal visible={classMenuVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setClassMenuVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>Select Class</Text>
            </View>
            <FlatList
              data={classes}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedClass?._id === item._id && styles.modalItemActive]}
                  onPress={() => {
                    handleClassSelect(item);
                    setClassMenuVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedClass?._id === item._id && styles.modalItemTextActive]}>
                    {item.name}
                  </Text>
                  {!!(selectedClass?._id === item._id) && <CheckCircle2 size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={subjectMenuVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSubjectMenuVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>Select Subject</Text>
            </View>
            {subjects.length > 0 ? (
              <FlatList
                data={subjects}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalItem, selectedSubject?._id === item._id && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedSubject(item);
                      setSubjectMenuVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, selectedSubject?._id === item._id && styles.modalItemTextActive]}>
                      {item.name}
                    </Text>
                    {!!(selectedSubject?._id === item._id) && <CheckCircle2 size={20} color={COLORS.primary} />}
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.centeredModal}>
                <AlertCircle size={40} color={COLORS.textSecondary} />
                <Text style={styles.emptyModalText}>Please select a class first</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 25,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    fontWeight: '500',
    marginTop: 2,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  backBtnWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  scrollContentLarge: {
    padding: 16,
    paddingBottom: 120,
  },
  quizCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quizInfoColumn: {
    flex: 1,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '10',
  },
  quizDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  viewResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '08',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1.5,
    opacity: 0.5,
    marginBottom: 16,
  },
  formCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    minHeight: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  inputLarge: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  selectorBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 54,
    justifyContent: 'center',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  selectorValueText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.textSecondary + '60',
    fontWeight: '400',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  marksBadge: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  marksText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  questionsList: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  questionCardExpanded: {
    borderColor: COLORS.primary + '40',
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  questionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  qIndex: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qIndexText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  questionBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  questionBody: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  optionsGrid: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  removeQuestionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  removeActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
  addNewQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    borderRadius: 20,
    marginTop: 24,
    backgroundColor: COLORS.primary + '05',
  },
  addNewQuestionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footerSticky: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 95 : 85,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  publishMainBtn: {
    borderRadius: 18,
    height: 58,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  modalIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalList: {
    paddingHorizontal: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  modalItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  centeredModal: {
    alignItems: 'center',
    padding: 60,
  },
  emptyModalText: {
    marginTop: 16,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  }
});
