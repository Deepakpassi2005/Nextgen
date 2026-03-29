import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import apiClient from '../../api/client';
import {
  FileText,
  Download,
  User as UserIcon,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  Paperclip,
  Home,
  CheckSquare,
  Bell,
  User
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout as AnimatedLayout,
} from 'react-native-reanimated';
import * as FileSystemLegacy from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CONFIG } from '../../config';
import PageHeader from '../../components/PageHeader';

import { StackNavigationProp } from '@react-navigation/stack';

const StudyMaterialList = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [materials, setMaterials] = useState<any[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [subjects, setSubjects] = useState<string[]>(['All']);
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());


  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedMaterials);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMaterials(newExpanded);
  };

  const fetchMaterials = useCallback(async () => {
    try {
      const response = await apiClient.get('/student/materials');
      const data = response.data.data || response.data || [];
      setMaterials(data);
      setFilteredMaterials(data);

      const uniqueSubjects = ['All', ...new Set(data.map((m: any) => m.subjectId?.name).filter(Boolean))];
      setSubjects(uniqueSubjects as string[]);
    } catch (error) {
      console.error('Error fetching materials', error);
      Alert.alert('Error', 'Failed to load study materials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaterials();
  };

  const handleFilter = (subject: string) => {
    setSelectedSubject(subject);
    if (subject === 'All') {
      setFilteredMaterials(materials);
    } else {
      setFilteredMaterials(materials.filter(m => m.subjectId?.name === subject));
    }
  };

  const handleDownloadAttachment = async (materialId: string, attachment: any) => {
    if (!attachment.fileUrl) return;

    try {
      const downloadUrl = `${CONFIG.API_BASE_URL}/public/download?fileUrl=${encodeURIComponent(attachment.fileUrl)}&fileName=${encodeURIComponent(attachment.fileName || 'file')}`;
      await Linking.openURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Could not open download link.');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.mainContainer}>
        <PageHeader title="Study Materials" subtitle="Knowledge Base" onBack={() => navigation.goBack()} />
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <PageHeader title="Study Materials" subtitle="Knowledge Base" onBack={() => navigation.goBack()} />

      {/* Subject Filter Pills */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {subjects.map((subject, index) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.filterPill,
                selectedSubject === subject && styles.activeFilterPill
              ]}
              onPress={() => handleFilter(subject)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                selectedSubject === subject && styles.activeFilterText
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredMaterials}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item, index }) => {
          const attachments = item.attachments || [];
          const isExpanded = expandedMaterials.has(item._id);

          return (
            <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
              <View style={[styles.materialCard, styles.glassCard]}>
                <View style={styles.cardMain}>
                  <View style={styles.subjectRow}>
                    <View style={styles.subjectBadge}>
                      <BookOpen size={10} color={COLORS.primary} />
                      <Text style={styles.subjectBadgeText}>{item.subjectId?.name || 'General'}</Text>
                    </View>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>

                  <Text style={styles.materialTitle}>{item.title}</Text>
                  
                  <View style={styles.teacherRow}>
                    <UserIcon size={14} color={COLORS.textSecondary} />
                    <Text style={styles.teacherName}>Uploaded by {item.teacherId?.name || 'Teacher'}</Text>
                  </View>

                  {item.description ? (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <TouchableOpacity 
                    style={[styles.attachmentToggle, isExpanded && styles.activeAttachmentToggle]} 
                    onPress={() => toggleExpand(item._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.attachmentLabel}>
                      <Paperclip size={16} color={isExpanded ? COLORS.primary : COLORS.textSecondary} />
                      <Text style={[styles.attachmentText, isExpanded && styles.activeAttachmentText]}>
                        {attachments.length} {attachments.length === 1 ? 'Attachment' : 'Attachments'}
                      </Text>
                    </View>
                    <ChevronDown size={18} color={isExpanded ? COLORS.primary : COLORS.textSecondary} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {attachments.map((att: any, idx: number) => {
                      const isDownloading = downloadingId === `${item._id}-${att.fileUrl}`;
                      return (
                        <View key={idx} style={styles.attachmentItem}>
                          <View style={styles.attachmentIconBox}>
                            <FileText size={20} color={COLORS.primary} />
                          </View>
                          <View style={styles.attachmentInfo}>
                            <Text style={styles.attachmentName} numberOfLines={1}>{att.fileName || 'Material File'}</Text>
                            <Text style={styles.attachmentSize}>
                              {att.fileType?.toUpperCase() || 'FILE'} • {(att.fileSize / (1024 * 1024)).toFixed(1)} MB
                            </Text>
                          </View>
                          <TouchableOpacity 
                            style={[styles.downloadBtn, isDownloading && styles.downloadingBtn]} 
                            onPress={() => handleDownloadAttachment(item._id, att)}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                              <Download size={18} color={COLORS.primary} />
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No materials found</Text>
            <Text style={styles.emptySubtext}>Select a different subject or check back later.</Text>
          </View>
        }
      />
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
  filterContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
  },
  activeFilterPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 }
    }),
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: '#FFF',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 50,
  },
  glassCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
    }),
  },
  materialCard: {
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  cardMain: {
    padding: SPACING.lg,
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  subjectBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  materialTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  teacherName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '400',
  },
  attachmentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  activeAttachmentToggle: {
    backgroundColor: COLORS.primary + '03',
    borderColor: COLORS.primary + '15',
  },
  attachmentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeAttachmentText: {
    color: COLORS.primary,
  },
  expandedContent: {
    padding: SPACING.lg,
    paddingTop: 0,
    backgroundColor: COLORS.surface,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border + '20',
  },
  attachmentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  attachmentSize: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  downloadingBtn: {
    borderColor: 'transparent',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: { fontSize: 44, marginBottom: 8, textAlign: 'center' },
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

export default StudyMaterialList;
