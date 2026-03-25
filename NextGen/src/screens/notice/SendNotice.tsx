import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  TouchableOpacity,
  ScrollView,
  Text as RNText,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  SegmentedButtons,
  Chip,
  Switch,
  Checkbox,
  Portal,
  Dialog,
  List,
  Searchbar,
  Menu,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useNoticeStore, type Notice } from '../../store/noticeStore';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ClassItem { _id: string; name: string; }
interface StudentItem { _id: string; firstName: string; lastName?: string; rollNumber: string; }

export default function SendNotice({ navigation, route }: any) {
  const editNotice = route?.params?.editNotice as Notice | undefined;

  const [recipient, setRecipient] = useState<'class' | 'admin' | 'all'>('all');
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [userRole, setUserRole] = useState<'teacher' | 'admin' | 'student'>('teacher');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [loading, setLoading] = useState(false);

  const { loadNotices, addNotice, updateNotice } = useNoticeStore();

  const [showClassModal, setShowClassModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [attachments, setAttachments] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  const PRIORITY_CONFIG = {
    high: { label: 'High' },
    medium: { label: 'Medium' },
    low: { label: 'Low' },
  };

  useEffect(() => {
    const init = async () => {
      await loadNotices();

      // Determine user role
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role || 'teacher');
      }

      // Fetch real classes from teacher profile
      try {
        const profileRes = await apiClient.get('/teacher/profile');
        if (profileRes.data.success && profileRes.data.data?.classes) {
          setClasses(profileRes.data.data.classes || []);
        }
      } catch (_) {
        // If teacher profile fails (e.g. admin), try the admin classes endpoint
        try {
          const classRes = await apiClient.get('/classes');
          if (classRes.data.success) setClasses(classRes.data.data || []);
        } catch (__) {}
      }
    };
    init();
  }, []);

  // Fetch students when a class is selected
  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      try {
        const res = await apiClient.get(`/students?classId=${selectedClass._id}`);
        if (res.data.success) setStudents(res.data.data || []);
      } catch (_) {
        setStudents([]);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  // Pre-populate when editing
  useEffect(() => {
    if (editNotice) {
      setRecipient(editNotice.recipient);
      setTitle(editNotice.title);
      setMessage(editNotice.message);
      if (editNotice.priority) setPriority(editNotice.priority);
    }
  }, [editNotice]);

  useEffect(() => {
    if (recipient !== 'class') {
      setSelectedClass(null);
      setShowStudentSelect(false);
      setSelectedStudents([]);
    }
  }, [recipient]);

  const handleRecipientChange = (newRecipient: string) => {
    setRecipient(newRecipient as 'class' | 'admin' | 'all');
    if (newRecipient === 'class') setShowClassModal(true);
    else {
      setSelectedClass(null);
      setShowStudentSelect(false);
      setSelectedStudents([]);
    }
  };

  const handleClassSelect = (cls: ClassItem) => {
    setSelectedClass(cls);
    setShowClassModal(false);
    setShowStudentSelect(false);
    setSelectedStudents([]);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((s) => s !== studentId) : [...prev, studentId]
    );
  };

  const filteredStudents = students.filter((s) => {
    const q = studentSearchQuery.toLowerCase();
    const name = `${s.firstName} ${s.lastName || ''}`.toLowerCase();
    return name.includes(q) || s.rollNumber.includes(q);
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
      if (!result.canceled) setAttachments((prev) => [...prev, ...result.assets]);
    } catch (err) {
      console.error('Error picking document', err);
    }
  };

  const removeAttachment = (uri: string) => {
    setAttachments((prev) => prev.filter((att) => att.uri !== uri));
  };

  const handleSendNotice = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in the title and message');
      return;
    }
    if (recipient === 'class' && !selectedClass) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    setLoading(true);
    try {
      const noticeData = {
        title,
        message,
        priority,
        recipient,
        targetClass: recipient === 'class' ? selectedClass?.name : undefined,
        targetStudents: showStudentSelect && selectedStudents.length > 0 ? selectedStudents : undefined,
        attachments: attachments.map((att) => ({ uri: att.uri, name: att.name, mimeType: att.mimeType, size: att.size })),
      };

      if (editNotice) {
        await updateNotice(editNotice.id, noticeData);
        Alert.alert('Success', 'Notice updated successfully!');
      } else {
        await addNotice({ ...noticeData, timestamp: Date.now() } as any);
        Alert.alert('Success', 'Notice sent successfully!');
      }

      // Reset form
      setTitle('');
      setMessage('');
      setPriority('medium');
      setRecipient('all');
      setSelectedClass(null);
      setShowStudentSelect(false);
      setSelectedStudents([]);
      setAttachments([]);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to send notice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Class Selection Modal */}
      <Portal>
        <Dialog visible={showClassModal} onDismiss={() => setShowClassModal(false)}>
          <Dialog.Title>Select Class</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {classes.length === 0 ? (
                <Text style={{ padding: 16, color: '#888' }}>No classes found</Text>
              ) : (
                classes.map((cls) => (
                  <List.Item
                    key={cls._id}
                    title={`Class ${cls.name}`}
                    onPress={() => handleClassSelect(cls)}
                    right={(props) =>
                      selectedClass?._id === cls._id ? <List.Icon {...props} icon="check" /> : null
                    }
                    style={selectedClass?._id === cls._id ? styles.selectedListItem : undefined}
                  />
                ))
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowClassModal(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Title row with priority dropdown */}
              <View style={styles.titleRow}>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  {editNotice ? 'Edit Notice' : 'Send Notice'}
                </Text>
                <View style={styles.prioritySelector}>
                  <RNText style={styles.headerLabel}>Priority: </RNText>
                  <Menu
                    visible={showPriorityMenu}
                    onDismiss={() => setShowPriorityMenu(false)}
                    anchor={
                      <TouchableOpacity
                        style={styles.priorityPill}
                        onPress={() => setShowPriorityMenu(true)}
                      >
                        <RNText style={styles.priorityPillText}>{PRIORITY_CONFIG[priority].label}</RNText>
                        <RNText style={styles.priorityChevron}>▾</RNText>
                      </TouchableOpacity>
                    }
                    contentStyle={styles.menuContent}
                  >
                    {(['high', 'medium', 'low'] as const).map((p) => (
                      <Menu.Item
                        key={p}
                        onPress={() => { setPriority(p); setShowPriorityMenu(false); }}
                        title={PRIORITY_CONFIG[p].label}
                        titleStyle={styles.menuItemTitle}
                      />
                    ))}
                  </Menu>
                </View>
              </View>

              <Text variant="labelMedium" style={styles.label}>Send to:</Text>
              <SegmentedButtons
                value={recipient}
                onValueChange={handleRecipientChange}
                buttons={[
                  { value: 'class', label: selectedClass ? `Class ${selectedClass.name}` : 'Class' },
                  { value: 'admin', label: 'Teachers' },
                  { value: 'all', label: 'All' },
                ]}
                style={styles.segmentedButtons}
              />

              {!!(recipient === 'class' && selectedClass) && (
                <View style={styles.classSection}>
                  <View style={styles.switchRow}>
                    <Text variant="bodyMedium">Send to specific students?</Text>
                    <Switch
                      value={showStudentSelect}
                      onValueChange={(val) => {
                        if (val) setShowStudentModal(true);
                        else { setShowStudentSelect(false); setSelectedStudents([]); }
                      }}
                    />
                  </View>
                  {!!(showStudentSelect && selectedStudents.length > 0) && (
                    <View style={styles.selectedStudentsPreview}>
                      <Text variant="bodySmall" style={styles.previewText}>
                        {selectedStudents.length} student(s) selected
                      </Text>
                      <Button mode="text" compact onPress={() => setShowStudentModal(true)}>Edit</Button>
                    </View>
                  )}
                </View>
              )}

              <TextInput
                label="Notice Title *"
                placeholder="Subject of notice"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                editable={!loading}
              />

              <TextInput
                label="Message *"
                placeholder="Enter notice message"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                style={styles.input}
                editable={!loading}
              />

              <View style={styles.attachmentSection}>
                <Button
                  mode="outlined"
                  icon="paperclip"
                  onPress={pickDocument}
                  disabled={loading}
                  style={styles.attachButton}
                >
                  Attach File(s)
                </Button>
                {!!(attachments.length > 0) && (
                  <View style={styles.attachmentsList}>
                    {attachments.map((att, idx) => (
                      <Chip
                        key={idx}
                        icon="file-document-outline"
                        onClose={() => removeAttachment(att.uri)}
                        style={styles.attachmentChip}
                        compact
                      >
                        {att.name}
                      </Chip>
                    ))}
                  </View>
                )}
              </View>

              <Button
                mode="contained"
                onPress={handleSendNotice}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                {editNotice ? 'Update Notice' : 'Send Notice'}
              </Button>
            </ScrollView>
          </Card.Content>
        </Card>
      </View>

      {/* Student Selection Modal */}
      <Portal>
        <Dialog
          visible={showStudentModal}
          onDismiss={() => {
            setShowStudentModal(false);
            if (selectedStudents.length === 0) setShowStudentSelect(false);
          }}
        >
          <Dialog.Title>Select Students</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Searchbar
              placeholder="Search by Name or Roll No"
              onChangeText={setStudentSearchQuery}
              value={studentSearchQuery}
              style={styles.searchBar}
            />
            <Dialog.ScrollArea style={styles.dialogScrollArea}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredStudents.map((student) => {
                  const label = `${student.rollNumber} - ${student.firstName} ${student.lastName || ''}`.trim();
                  return (
                    <Checkbox.Item
                      key={student._id}
                      label={label}
                      status={selectedStudents.includes(student._id) ? 'checked' : 'unchecked'}
                      onPress={() => toggleStudentSelection(student._id)}
                      mode="android"
                      style={styles.checkboxItem}
                    />
                  );
                })}
                {!!(filteredStudents.length === 0) && (
                  <Text style={styles.noResultsText}>No students found</Text>
                )}
              </ScrollView>
            </Dialog.ScrollArea>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setShowStudentModal(false); if (selectedStudents.length === 0) setShowStudentSelect(false); }}>
              Cancel
            </Button>
            <Button onPress={() => setShowStudentModal(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#fff', marginBottom: 16, flexShrink: 1 },
  cardTitle: { fontWeight: 'bold' },
  label: { fontWeight: '600', marginBottom: 8 },
  segmentedButtons: { marginBottom: 16 },
  dialogScrollArea: { paddingHorizontal: 0, maxHeight: 300 },
  selectedListItem: { backgroundColor: '#e6f2ff' },
  classSection: { marginBottom: 16, padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  selectedStudentsPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#e0e0e0' },
  previewText: { color: '#666', flex: 1 },
  dialogContent: { paddingHorizontal: 0, paddingBottom: 0 },
  searchBar: { marginHorizontal: 16, marginBottom: 8, elevation: 0, backgroundColor: '#f0f0f0' },
  noResultsText: { textAlign: 'center', color: '#888', paddingVertical: 24 },
  checkboxItem: { paddingHorizontal: 16, paddingVertical: 2 },
  input: { marginBottom: 12 },
  attachmentSection: { marginBottom: 16 },
  attachButton: { alignSelf: 'flex-start', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  prioritySelector: { flexDirection: 'row', alignItems: 'center' },
  headerLabel: { fontSize: 16, color: '#333', marginRight: 4, fontWeight: 'bold' },
  priorityPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4, borderWidth: 1.5, borderColor: '#ccc' },
  priorityPillText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  priorityChevron: { fontSize: 12, fontWeight: '700', marginLeft: 2, color: '#333' },
  menuContent: { backgroundColor: '#fff', borderRadius: 12, elevation: 6, minWidth: 140 },
  menuItemTitle: { fontSize: 16, color: '#333', fontWeight: '500' },
  attachmentsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attachmentChip: { backgroundColor: '#e6f2ff' },
  button: { marginTop: 8 },
});
