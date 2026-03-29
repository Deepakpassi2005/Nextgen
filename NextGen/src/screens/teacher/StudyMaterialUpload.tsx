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
  Modal,
  FlatList,
  Platform,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  ChevronDown, 
  X, 
  Info, 
  FilePlus, 
  ArrowLeft, 
  Layers, 
  BookOpen, 
  File, 
  Type, 
  AlignLeft,
  Trash2,
  Plus,
  ChevronRight
} from 'lucide-react-native';
import { GlassCard } from '../../components/GlassCard';
import { CustomButton } from '../../components/CustomButton';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeInDown, FadeInUp, FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const StudyMaterialUpload = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setFetchingData(true);
      const res = await apiClient.get('/classes');
      setClasses(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      Alert.alert('Error', 'Failed to fetch initial data');
    } finally {
      setFetchingData(false);
    }
  };

  const fetchSubjects = async (classId: string) => {
    try {
      const res = await apiClient.get(`/subjects?classId=${classId}`);
      setSubjects(res.data.data || res.data || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleClassSelect = (item: any) => {
    setSelectedClass(item);
    setSelectedSubject(null);
    setSubjects([]);
    setShowClassModal(false);
    fetchSubjects(item._id);
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFiles(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!title || !selectedClass || !selectedSubject || files.length === 0) {
      Alert.alert('Required', 'Please fill all fields and pick at least one file.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('classId', selectedClass._id);
      formData.append('subjectId', selectedSubject._id);
      
      files.forEach((file) => {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as any);
      });

      await apiClient.post('/materials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Essential for some RN Axios versions
      });


      Alert.alert('Success', `${files.length} study material(s) uploaded successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Something went wrong during upload.');
    } finally {
      setLoading(false);
    }
  };

  const renderSelector = (label: string, value: string | null, onPress: () => void, disabled = false) => (
    <View style={styles.selectorWrapper}>
      <Text style={styles.labelSmall}>{label}</Text>
      <TouchableOpacity 
        activeOpacity={0.7}
        style={[styles.selectorBtn, disabled && styles.selectorDisabled]} 
        onPress={onPress}
        disabled={disabled}
      >
        <GlassCard style={styles.selectorGlass}>
          <Text style={[styles.selectorValue, !value && styles.placeholderText]} numberOfLines={1}>
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
        <Text style={styles.loadingText}>Preparing uploader...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Upload Material</Text>
          <Text style={styles.headerSubtitle}>Share resources with your students</Text>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          {/* General Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Information</Text>
            <GlassCard style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Material Title</Text>
                <View style={styles.inputWrapper}>
                  <Type size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Chapter 1: Introduction to Algebra"
                    placeholderTextColor={COLORS.textSecondary + '70'}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 12 }]}>
                  <AlignLeft size={18} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    placeholder="Provide context about this material..."
                    placeholderTextColor={COLORS.textSecondary + '70'}
                    multiline
                    numberOfLines={4}
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Course Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course Details</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {renderSelector('CLASS', selectedClass?.name, () => setShowClassModal(true))}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                {renderSelector(
                  'SUBJECT', 
                  selectedSubject?.name, 
                  () => setShowSubjectModal(true),
                  !selectedClass
                )}
              </View>
            </View>
          </View>

          {/* Attachments Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Attachments</Text>
              <Text style={styles.fileCountBadge}>{files.length} Files Selected</Text>
            </View>
            
            {files.length === 0 ? (
              <TouchableOpacity 
                style={styles.dropZone} 
                onPress={handlePickFile}
                activeOpacity={0.6}
              >
                <View style={styles.dropZoneDashed}>
                  <View style={styles.dropZoneIconBg}>
                    <Upload color={COLORS.primary} size={32} />
                  </View>
                  <Text style={styles.dropZoneTitle}>Tap to choose files</Text>
                  <Text style={styles.dropZoneSubtitle}>PDF, Images, or Documents</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.fileList}>
                {files.map((file, index) => (
                  <Animated.View 
                    key={index} 
                    entering={FadeInRight.delay(index * 100)}
                    style={styles.fileItem}
                  >
                    <View style={styles.fileIconBox}>
                      <FileText color={COLORS.primary} size={20} />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                      <Text style={styles.fileSize}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => removeFile(index)}
                      style={styles.removeFileBtn}
                    >
                      <Trash2 color={COLORS.error} size={18} />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
                
                <TouchableOpacity 
                  style={styles.addMoreBtn} 
                  onPress={handlePickFile}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color={COLORS.primary} />
                  <Text style={styles.addMoreText}>Add more files</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoNote}>
            <Info size={18} color={COLORS.primary} />
            <Text style={styles.infoNoteText}>
              Materials will be instantly visible to students in the selected class.
            </Text>
          </View>
          
          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Footer Publishing Button */}
      <View style={styles.footer}>
        <CustomButton
          title={loading ? "Publishing..." : "Publish Material"}
          onPress={handleUpload}
          loading={loading}
          disabled={loading || !title || !selectedClass || !selectedSubject || files.length === 0}
          icon={loading ? undefined : <CheckCircle size={20} color="#FFF" />}
          style={styles.submitBtn}
        />
      </View>

      {/* Class Selector Modal */}
      <Modal
        visible={showClassModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowClassModal(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <View style={styles.pickerIndicator} />
              <Text style={styles.pickerTitle}>Select Class</Text>
            </View>
            <FlatList
              data={classes}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedClass?._id === item._id && styles.pickerItemActive]}
                  onPress={() => handleClassSelect(item)}
                >
                  <Text style={[styles.pickerItemText, selectedClass?._id === item._id && styles.pickerItemTextActive]}>
                    {item.name}
                  </Text>
                  {!!(selectedClass?._id === item._id) && <CheckCircle size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Subject Selector Modal */}
      <Modal
        visible={showSubjectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowSubjectModal(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <View style={styles.pickerIndicator} />
              <Text style={styles.pickerTitle}>Select Subject</Text>
            </View>
            <FlatList
              data={subjects}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedSubject?._id === item._id && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedSubject(item);
                    setShowSubjectModal(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedSubject?._id === item._id && styles.pickerItemTextActive]}>
                    {item.name}
                  </Text>
                  {!!(selectedSubject?._id === item._id) && <CheckCircle size={20} color={COLORS.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  backBtn: {
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
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    opacity: 0.6,
  },
  formCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 4,
    opacity: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  selectorWrapper: {
    flex: 1,
  },
  selectorBtn: {
    width: '100%',
  },
  selectorGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectorValue: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    marginRight: 8,
  },
  placeholderText: {
    color: COLORS.textSecondary + '70',
    fontWeight: '400',
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  fileCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
  },
  dropZone: {
    width: '100%',
  },
  dropZoneDashed: {
    height: 160,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    backgroundColor: COLORS.primary + '05',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropZoneIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropZoneTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dropZoneSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  fileList: {
    width: '100%',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  fileSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  removeFileBtn: {
    padding: 8,
    backgroundColor: COLORS.error + '10',
    borderRadius: 10,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    marginLeft: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitBtn: {
    borderRadius: 16,
    height: 58,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 15,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  pickerHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
  },
  pickerIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  pickerList: {
    paddingHorizontal: 16,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerItemActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '20',
  },
  pickerItemText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default StudyMaterialUpload;
