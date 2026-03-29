import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  User, 
  Send, 
  ChevronRight, 
  Search, 
  Users, 
  CheckCircle, 
  ArrowLeft,
  ShieldCheck,
  MessageSquare,
  X,
  PlusCircle,
  Users2,
  CheckCircle2,
  Trash2,
  Info
} from 'lucide-react-native';
import { GlassCard } from '../../components/GlassCard';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInRight,
  Layout,
  FadeInLeft
} from 'react-native-reanimated';
import { CustomButton } from '../../components/CustomButton';

const { width } = Dimensions.get('window');

const MessagingScreen = () => {
  const [targetType, setTargetType] = useState<'admin' | 'class'>('admin');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSelectingStudents, setIsSelectingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/teacher/dashboard');
      setClasses(response.data.data.classes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      setLoading(true);
      // Fallback for student listing by class
      const response = await apiClient.get(`/students/class/${classId}`);
      setStudents(response.data.data || []);
      setIsSelectingStudents(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch students for this class');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      if (targetType === 'admin') {
        await apiClient.post('/chat/personal/send', { 
          receiverId: 'admin_id_placeholder', 
          content: message 
        });
      } else {
        await apiClient.post('/chat/class/send', {
          classId: selectedClass._id,
          content: message,
          recipientIds: selectedStudents.length > 0 ? selectedStudents : undefined
        });
      }
      Alert.alert('Success', 'Your announcement has been broadcasted successfully.');
      setMessage('');
      setSelectedStudents([]);
      setIsSelectingStudents(false);
      setSelectedClass(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to deliver message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(s => s !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const filteredStudents = students.filter(s => {
    const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (isSelectingStudents) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsSelectingStudents(false)} style={styles.backBtnWrapper}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Select Recipients</Text>
            <Text style={styles.headerSubtitle}>{selectedClass?.name} • {selectedStudents.length || 'All'} Selected</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsSelectingStudents(false)}
            style={styles.doneBtn}
          >
            <CheckCircle2 size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Search students..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {!!(searchQuery !== '') && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
        </View>

        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.studentList}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.delay(index * 50)}>
                <TouchableOpacity 
                    activeOpacity={0.7}
                    onPress={() => toggleStudent(item._id)}
                    style={[
                        styles.studentCard,
                        selectedStudents.includes(item._id) && styles.studentCardActive
                    ]}
                >
                    <View style={styles.studentAvatar}>
                        <User size={20} color={selectedStudents.includes(item._id) ? COLORS.primary : COLORS.textSecondary} />
                    </View>
                    <View style={styles.studentInfoArea}>
                        <Text style={[styles.studentNameText, selectedStudents.includes(item._id) && styles.studentNameActive]}>
                            {item.firstName} {item.lastName}
                        </Text>
                        <Text style={styles.rollText}>Roll: {item.rollNo || 'N/A'}</Text>
                    </View>
                    <View style={[styles.checkCircle, selectedStudents.includes(item._id) && styles.checkCircleActive]}>
                        {!!(selectedStudents.includes(item._id)) && <CheckCircle size={14} color="#FFF" />}
                    </View>
                </TouchableOpacity>
            </Animated.View>
          )}
        />
        
        <View style={styles.selectionFooter}>
            <CustomButton 
                title={selectedStudents.length > 0 ? `Confirm ${selectedStudents.length} Students` : "Send to All Students"}
                onPress={() => setIsSelectingStudents(false)}
                style={styles.confirmBtn}
            />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>Communications</Text>
                <Text style={styles.headerSubtitle}>Broadcast updates & announcements</Text>
            </View>
            <View style={styles.headerIcon}>
                <MessageSquare size={28} color={COLORS.primary} />
            </View>
        </Animated.View>

        <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            {/* Target Selector */}
            <View style={styles.targetSwitcher}>
                <TouchableOpacity 
                    style={[styles.switchTab, targetType === 'admin' && styles.switchTabActive]}
                    onPress={() => setTargetType('admin')}
                >
                    <ShieldCheck size={18} color={targetType === 'admin' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.switchText, targetType === 'admin' && styles.switchTextActive]}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.switchTab, targetType === 'class' && styles.switchTabActive]}
                    onPress={() => setTargetType('class')}
                >
                    <Users2 size={18} color={targetType === 'class' ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={[styles.switchText, targetType === 'class' && styles.switchTextActive]}>Classes</Text>
                </TouchableOpacity>
            </View>

            {targetType === 'admin' ? (
                <Animated.View entering={FadeInUp.delay(200)}>
                     <GlassCard style={styles.broadcastCard}>
                        <View style={styles.adminStatus}>
                            <View style={styles.statusInner}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.statusLabel}>ADMINISTRATOR PORTAL</Text>
                            </View>
                        </View>
                        <Text style={styles.broadcastTitle}>Send message to Administration</Text>
                        <Text style={styles.broadcastDesc}>Use this for official reports, leave requests, or general queries to the school office.</Text>
                     </GlassCard>
                </Animated.View>
            ) : (
                <Animated.View entering={FadeInUp.delay(200)}>
                    <Text style={styles.sectionTitle}>SELECT TARGET CLASS</Text>
                    <View style={styles.classGrid}>
                        {classes.map((cls, index) => (
                            <TouchableOpacity 
                                key={cls._id}
                                activeOpacity={0.7}
                                onPress={() => {
                                    setSelectedClass(cls);
                                    fetchStudents(cls._id);
                                }}
                                style={[
                                    styles.classItem,
                                    selectedClass?._id === cls._id && styles.classItemActive
                                ]}
                            >
                                <GlassCard style={styles.classGlass}>
                                    <Users size={20} color={selectedClass?._id === cls._id ? COLORS.primary : COLORS.textSecondary} />
                                    <Text style={[styles.classLabel, selectedClass?._id === cls._id && styles.classLabelActive]}>
                                        {cls.name}
                                    </Text>
                                    {!!(selectedClass?._id === cls._id) && <CheckCircle2 size={16} color={COLORS.primary} />}
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    {!!(selectedClass) && (
                        <Animated.View entering={FadeInDown} style={styles.selectionInfo}>
                            <Info size={16} color={COLORS.primary} />
                            <Text style={styles.selectionInfoText}>
                                {selectedStudents.length > 0 
                                    ? `Direct message to ${selectedStudents.length} selected students.` 
                                    : `Broadcasting to all students in ${selectedClass.name}.`
                                }
                            </Text>
                        </Animated.View>
                    )}
                </Animated.View>
            )}

            <View style={styles.messageGroup}>
                <Text style={styles.sectionTitle}>YOUR ANNOUNCEMENT</Text>
                <GlassCard style={styles.inputCard}>
                    <TextInput
                        placeholder="Type your message here..."
                        placeholderTextColor={COLORS.textSecondary + '60'}
                        value={message}
                        onChangeText={setMessage}
                        style={styles.mainInput}
                        multiline
                        numberOfLines={6}
                    />
                </GlassCard>
            </View>
            
            <View style={styles.guidelines}>
                <Text style={styles.guideTitle}>Channel Guidelines:</Text>
                <Text style={styles.guideItem}>• Announcements are visible to both students and parents.</Text>
                <Text style={styles.guideItem}>• Keep messages professional and subject-related.</Text>
            </View>
        </ScrollView>

        <View style={styles.actionFooter}>
            <CustomButton
                title={loading ? "Delivering..." : "Send Announcement"}
                onPress={handleSendMessage}
                loading={loading}
                disabled={loading || !message.trim() || (targetType === 'class' && !selectedClass)}
                style={styles.sendBtn}
                icon={<Send size={20} color="#FFF" />}
            />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
  backBtnWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  targetSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 16,
    marginBottom: 25,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  switchTabActive: {
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  switchText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  switchTextActive: {
    color: COLORS.primary,
  },
  broadcastCard: {
    padding: 24,
    borderRadius: 28,
  },
  adminStatus: {
    marginBottom: 16,
  },
  statusInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  broadcastTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  broadcastDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    opacity: 0.5,
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  classItem: {
    width: (width - 52) / 2,
  },
  classGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    gap: 10,
  },
  classItemActive: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 18,
  },
  classLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  classLabelActive: {
    color: COLORS.primary,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 25,
  },
  selectionInfoText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  messageGroup: {
    marginTop: 10,
  },
  inputCard: {
    padding: 16,
    borderRadius: 24,
    minHeight: 180,
  },
  mainInput: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  guidelines: {
    marginTop: 25,
    paddingHorizontal: 4,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  guideItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  actionFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sendBtn: {
    height: 58,
    borderRadius: 18,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 15,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  studentList: {
    padding: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  studentCardActive: {
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '05',
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  studentInfoArea: {
    flex: 1,
  },
  studentNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentNameActive: {
    color: COLORS.primary,
  },
  rollText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectionFooter: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmBtn: {
    height: 54,
    borderRadius: 16,
  }
});

export default MessagingScreen;
