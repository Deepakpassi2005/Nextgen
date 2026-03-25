import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { COLORS, SPACING } from '../../theme/theme';
import { useQuizStore, type Quiz, useUserStore } from '../../store';
import { 
  ArrowLeft, 
  Award, 
  Clock, 
  CheckCircle2, 
  Circle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  AlertCircle,
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

const QuizAttemptScreen = () => {
  const navigation = useNavigation();
  const { user, loadUser } = useUserStore();
  const { getQuizzesInChronologicalOrder, attempts, submitAttempt, loadData, isLoading } = useQuizStore();
  
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUser();
    loadData();
  }, []);

  const quizzes = getQuizzesInChronologicalOrder();

  const handleBack = () => {
    if (activeQuiz) {
      Alert.alert(
        'Exit Quiz?',
        'Progress will not be saved until submission.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => {
            if (timerRef.current) clearInterval(timerRef.current);
            setActiveQuiz(null);
          }}
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setAnswers({});
    const durationInSeconds = (quiz.duration || 30) * 60;
    setTimeLeft(durationInSeconds);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          autoSubmit(quiz);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const autoSubmit = async (quiz: Quiz) => {
    Alert.alert('Time Up!', 'Your quiz is being submitted automatically.');
    await submitQuizInternal(quiz);
  };

  const submitQuizInternal = async (quiz: Quiz) => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await submitAttempt({
        quizId: quiz.id,
        studentId: user?.id || (user as any)?._id,
        answers: answers,
        timestamp: Date.now(),
      });
      setActiveQuiz(null);
      setAnswers({});
      loadData(); // Refresh scores
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quiz.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const selectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  if (isLoading && !activeQuiz) {
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
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{activeQuiz ? 'Attempting' : 'Quizzes'}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {activeQuiz ? activeQuiz.title : 'Test your knowledge'}
          </Text>
        </View>
        {activeQuiz && (
            <View style={[styles.timerContainer, timeLeft < 60 && styles.timerDanger]}>
                <Clock size={16} color={timeLeft < 60 ? COLORS.error : COLORS.primary} />
                <Text style={[styles.timerText, timeLeft < 60 && styles.timerTextDanger]}>{formatTime(timeLeft)}</Text>
            </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeQuiz ? (
          <View>
            <Animated.View entering={FadeInDown} style={styles.quizInfoBox}>
              <View style={styles.quizDetailPill}>
                <HelpCircle size={16} color={COLORS.primary} />
                <Text style={styles.pillText}>{activeQuiz.questions?.length || 0} Questions</Text>
              </View>
            </Animated.View>

            {(activeQuiz.questions ?? []).map((question, index) => (
              <Animated.View key={question.id} entering={FadeInRight.delay(index * 100)}>
                <GlassCard style={styles.questionCard}>
                  <Text style={styles.questionIndex}>Question {index + 1}</Text>
                  <Text style={styles.questionText}>{question.text}</Text>

                  <View style={styles.optionsContainer}>
                    {question.options.map((option) => {
                      const isSelected = answers[question.id] === option.id;
                      return (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionItem,
                            isSelected && styles.selectedOption,
                          ]}
                          onPress={() => selectOption(question.id, option.id)}
                          activeOpacity={0.8}
                        >
                          {isSelected ? (
                            <CheckCircle2 size={20} color={COLORS.primary} />
                          ) : (
                            <Circle size={20} color={COLORS.textSecondary} />
                          )}
                          <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                            {option.text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </GlassCard>
              </Animated.View>
            ))}

            <TouchableOpacity 
              style={[
                styles.submitBtn, 
                Object.keys(answers).length < (activeQuiz.questions?.length || 0) && styles.disabledBtn
              ]} 
              onPress={() => submitQuizInternal(activeQuiz)}
              disabled={Object.keys(answers).length < (activeQuiz.questions?.length || 0)}
            >
              <Text style={styles.submitBtnText}>Submit Quiz</Text>
              <TrendingUp size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {quizzes.length > 0 ? (
              quizzes.map((item, index) => {
                const attempt = attempts.find(a => a.quizId === item.id);
                const isSubmitted = !!attempt;
                return (
                  <Animated.View key={item.id} entering={FadeInDown.delay(index * 100)}>
                    <TouchableOpacity 
                        onPress={() => isSubmitted ? Alert.alert('Already Submitted', 'You have already completed this quiz.') : startQuiz(item)} 
                        activeOpacity={0.9}
                    >
                      <GlassCard style={styles.quizItemCard}>
                        <View style={styles.quizItemIcon}>
                          <Award size={24} color={isSubmitted ? COLORS.success : COLORS.secondary} />
                        </View>
                        <View style={styles.quizItemInfo}>
                          <Text style={styles.quizItemTitle}>{item.title}</Text>
                          <View style={styles.quizMetaRow}>
                            <Clock size={12} color={COLORS.textSecondary} />
                            <Text style={styles.quizMetaText}>{item.duration || 30}m</Text>
                            <HelpCircle size={12} color={COLORS.textSecondary} style={{ marginLeft: 10 }} />
                            <Text style={styles.quizMetaText}>{item.questions?.length} Qs</Text>
                          </View>
                        </View>
                        <View style={styles.quizStatusContainer}>
                          {isSubmitted ? (
                            <View style={styles.submittedBadge}>
                              <Text style={styles.scoreText}>{attempt.score}/{attempt.totalMarks}</Text>
                              <Text style={styles.doneLabel}>DONE</Text>
                            </View>
                          ) : (
                            <ChevronRight size={20} color={COLORS.textSecondary} />
                          )}
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Award size={64} color={COLORS.textSecondary + '40'} />
                <Text style={styles.emptyText}>No quizzes available</Text>
                <Text style={styles.emptySubtext}>Your teachers haven't assigned any quizzes yet.</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
    }),
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
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  timerDanger: {
    backgroundColor: COLORS.error + '10',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timerTextDanger: {
    color: COLORS.error,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 50,
  },
  glassCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
    }),
  },
  quizInfoBox: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: 10,
  },
  quizDetailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  questionCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  questionIndex: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  selectedOption: {
    borderColor: COLORS.primary + '30',
    backgroundColor: COLORS.primary + '05',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  selectedOptionText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 }
    }),
  },
  disabledBtn: {
    backgroundColor: COLORS.textSecondary + '40',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  quizItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  quizItemIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  quizItemInfo: {
    flex: 1,
  },
  quizItemTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  quizMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  quizStatusContainer: {
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  submittedBadge: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  doneLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
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
});

export default QuizAttemptScreen;
