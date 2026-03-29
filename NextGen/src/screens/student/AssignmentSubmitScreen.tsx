import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { CONFIG } from '../../config';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  ArrowLeft,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { GlassCard } from '../../components/GlassCard';

const AssignmentSubmitScreen = ({ route, navigation }: any) => {
  const { assignment } = route.params;
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isSubmitted = assignment.status === 'submitted';

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachments(prev => [...prev, result.assets[0]]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const submitAssignment = async () => {
    if (!content && attachments.length === 0) {
      Alert.alert('Error', 'Please provide an answer or attach a file.');
      return;
    }
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', String(assignment._id));
      formData.append('content', content);
      
      attachments.forEach((file) => {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as any);
      });

      await apiClient.post('/student/assignments/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data,
      });
      
      Alert.alert('Success', 'Assignment submitted successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Assignment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GlassCard style={styles.infoCard}>
          <Text style={styles.title}>{assignment.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.subject}>{assignment.subjectId?.name || 'Subject'}</Text>
            <View style={styles.dueContainer}>
              <Clock size={14} color={COLORS.error} />
              <Text style={styles.dueText}>Due: {new Date(assignment.dueDate).toLocaleDateString()}</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.descTitle}>Instructions</Text>
          <Text style={styles.description}>{assignment.description || 'No specific instructions provided.'}</Text>
          
          {assignment.attachments?.length > 0 && (
            <View style={styles.teacherAttContainer}>
              <Text style={styles.attLabel}>Reference Materials:</Text>
              {assignment.attachments.map((att: any, i: number) => (
                <TouchableOpacity 
                  key={i} 
                  style={styles.teacherAttCard}
                  onPress={() => {
                    const downloadUrl = `${CONFIG.API_BASE_URL}/public/download?fileUrl=${encodeURIComponent(att.url)}&fileName=${encodeURIComponent(att.filename)}`;
                    Linking.openURL(downloadUrl).catch(err => 
                      Alert.alert('Error', 'Could not open file URL')
                    );
                  }}
                >
                  <FileText size={18} color={COLORS.primary} />
                  <Text style={styles.teacherAttText}>{att.filename}</Text>
                  <ExternalLink size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>

        {isSubmitted ? (
          <GlassCard style={styles.submittedCard}>
            <CheckCircle size={40} color={COLORS.success} />
            <Text style={styles.submittedTitle}>Already Submitted</Text>
            <Text style={styles.submittedSub}>You have successfully submitted this assignment.</Text>
            
            {assignment.grade ? (
              <View style={styles.gradeBox}>
                <Text style={styles.gradeLabel}>Your Grade</Text>
                <Text style={styles.gradeValue}>{assignment.grade}</Text>
                {assignment.feedback ? (
                  <Text style={styles.feedbackText}>"{assignment.feedback}"</Text>
                ) : null}
              </View>
            ) : null}
          </GlassCard>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Your Answer</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type your answer here..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
            />

            <Text style={styles.inputLabel}>Attachments</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
              <Upload size={20} color={COLORS.primary} />
              <Text style={styles.uploadBtnText}>Upload File</Text>
            </TouchableOpacity>

            {attachments.length > 0 && (
              <View style={styles.attList}>
                {attachments.map((att, index) => (
                  <View key={index} style={styles.attItem}>
                    <FileText size={18} color={COLORS.textSecondary} />
                    <Text style={styles.attName} numberOfLines={1}>{att.name}</Text>
                    <TouchableOpacity onPress={() => removeAttachment(index)} style={styles.removeAttBtn}>
                      <Text style={styles.removeAttText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submitAssignment}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Assignment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingTop: 50, paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  
  infoCard: { padding: SPACING.lg, marginBottom: SPACING.lg },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subject: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  dueContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.error + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dueText: { fontSize: 12, fontWeight: '700', color: COLORS.error, marginLeft: 6 },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  descTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  
  teacherAttContainer: { marginTop: 16, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 },
  attLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  teacherAttCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 10, borderRadius: 8, marginBottom: 8 },
  teacherAttText: { marginLeft: 10, fontSize: 14, color: COLORS.text, flex: 1 },
  
  formContainer: { backgroundColor: '#FFF', padding: SPACING.lg, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  inputLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  textInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, fontSize: 15, color: COLORS.text, minHeight: 120, marginBottom: 24 },
  
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.primary, borderRadius: 12, padding: 16, backgroundColor: COLORS.primary + '05', marginBottom: 16 },
  uploadBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15, marginLeft: 8 },
  
  attList: { marginBottom: 24, gap: 10 },
  attItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  attName: { flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.text },
  removeAttBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.error + '15', borderRadius: 6 },
  removeAttText: { color: COLORS.error, fontSize: 12, fontWeight: '600' },
  
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  submittedCard: { alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.success + '05' },
  submittedTitle: { fontSize: 20, fontWeight: '700', color: COLORS.success, marginTop: 12, marginBottom: 4 },
  submittedSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  
  gradeBox: { marginTop: 24, padding: 16, backgroundColor: '#FFF', borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.success + '30' },
  gradeLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
  gradeValue: { fontSize: 36, fontWeight: '900', color: COLORS.success },
  feedbackText: { marginTop: 12, fontSize: 14, color: COLORS.text, fontStyle: 'italic', textAlign: 'center' },
});

export default AssignmentSubmitScreen;
