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
  Linking,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import apiClient from '../../api/client';
import {
  FileText,
  Trash2,
  Download,
  Plus,
  BookOpen,
  Layers,
  X,
  Share2,
  Eye,
  Info,
  ChevronDown,
  Paperclip,
  Upload,
  Check,
  ArrowLeft,
  Home,
  CheckSquare,
  Bell,
  User
} from 'lucide-react-native';
import { GlassCard } from '../../components/GlassCard';
import { CONFIG } from '../../config';
import * as FileSystemLegacy from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import Animated, { FadeInDown, FadeInUp, FadeInRight, Layout } from 'react-native-reanimated';
import PageHeader from '../../components/PageHeader';

const { width, height } = Dimensions.get('window');

import { StackNavigationProp } from '@react-navigation/stack';

const StudyMaterialManagement = ({ navigation }: { navigation: StackNavigationProp<any> }) => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const [previewVisible, setPreviewVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [classList, setClassList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);


  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedMaterials);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMaterials(newExpanded);
  };

  const fetchMaterials = async () => {
    try {
      const response = await apiClient.get('/materials/teacher');
      setMaterials(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      Alert.alert('Error', 'Failed to load study materials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
    if (classId === 'all') {
      setSubjectList([]);
      setFilterSubject('all');
      return;
    }
    try {
      const response = await apiClient.get(`/subjects?classId=${classId}`);
      setSubjectList(response.data.data || []);
      setFilterSubject('all');
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchClasses();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMaterials();
      fetchClasses();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchSubjects(filterClass);
  }, [filterClass]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaterials();
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Material',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await apiClient.delete(`/materials/${id}`);
              setMaterials(materials.filter(m => m._id !== id));
              Alert.alert('Success', 'Material deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete material');
            }
          }
        }
      ]
    );
  };

  const handleDownload = async (item: any) => {
    if (!item.fileUrl) return;
    
    try {
      const downloadUrl = `${CONFIG.API_BASE_URL}/public/download?fileUrl=${encodeURIComponent(item.fileUrl)}&fileName=${encodeURIComponent(item.fileName || 'file')}`;
      
      await Linking.openURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Could not open download link.');
    }
  };

  const handleDeleteAttachment = async (materialId: string, attachmentUrl: string, fileName: string) => {
    Alert.alert(
      'Remove Attachment',
      `Are you sure you want to remove "${fileName}" from this post?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const material = materials.find(m => m._id === materialId);
              if (!material) return;
              
              const updatedAttachments = material.attachments.filter((a: any) => a.fileUrl !== attachmentUrl);
              
              if (updatedAttachments.length === 0) {
                await apiClient.delete(`/materials/${materialId}`);
                setMaterials(materials.filter(m => m._id !== materialId));
              } else {
                await apiClient.put(`/materials/${materialId}`, { attachments: updatedAttachments });
                setMaterials(materials.map(m => m._id === materialId ? { ...m, attachments: updatedAttachments } : m));
              }
              Alert.alert('Success', 'Attachment removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove attachment');
            }
          }
        }
      ]
    );
  };

  const renderMaterialItem = ({ item, index }: { item: any, index: number }) => {
    const attachments = item.attachments && item.attachments.length > 0 
      ? item.attachments 
      : (item.fileUrl ? [{ fileUrl: item.fileUrl, fileName: item.fileName, fileType: item.fileType, fileSize: item.fileSize }] : []);

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 100).duration(500)}
        layout={Layout.springify()}
      >
        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.materialTitle}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity 
              style={styles.cardDeleteBtn} 
              onPress={() => handleDelete(item._id, item.title)}
            >
              <View style={styles.deleteIconBg}>
                <Trash2 size={16} color={COLORS.error} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.contentRow}>
              <View style={styles.badge}>
                <Layers size={10} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.badgeText}>{item.classId?.name || 'N/A'}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#F0FDF4' }]}>
                <BookOpen size={10} color="#166534" style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: '#166534' }]}>{item.subjectId?.name || 'N/A'}</Text>
              </View>
              <Text style={styles.dateTextSmall}>{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.attachmentToggle, expandedMaterials.has(item._id) && styles.attachmentToggleActive]} 
              onPress={() => toggleExpand(item._id)}
            >
              <View style={styles.attachmentBadge}>
                <Paperclip size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.attachmentCount}>
                  {attachments.length} {attachments.length === 1 ? 'Attachment' : 'Attachments'}
                </Text>
              </View>
              <ChevronDown 
                size={18} 
                color={COLORS.textSecondary} 
                style={{ transform: [{ rotate: expandedMaterials.has(item._id) ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {!!(expandedMaterials.has(item._id)) && (
              <Animated.View entering={FadeInUp.duration(300)} style={styles.attachmentList}>
                {attachments.map((att: any, idx: number) => (
                  <View key={idx} style={styles.attachmentRow}>
                    <View style={styles.attachmentRowLeft}>
                      <View style={styles.fileIconBox}>
                        <FileText color={COLORS.primary} size={16} />
                      </View>
                      <View style={styles.attachmentTextInfo}>
                        <Text style={styles.attachmentName} numberOfLines={1}>{att.fileName || 'Attachment'}</Text>
                        <Text style={styles.attachmentSize}>{att.fileType?.toUpperCase()} • {(att.fileSize / (1024 * 1024)).toFixed(2)} MB</Text>
                      </View>
                    </View>
                    
                    <View style={styles.attachmentActions}>
                      <TouchableOpacity 
                        style={styles.nanoActionBtn}
                        onPress={() => {
                          const fullUrl = att.fileUrl.startsWith('http') 
                            ? att.fileUrl 
                            : `${CONFIG.API_BASE_URL.replace('/api', '')}/${att.fileUrl.replace(/^\/+/, '')}`;
                          setViewerUrl(fullUrl);
                          setSelectedMaterial(item);
                          setViewerVisible(true);
                        }}
                      >
                        <Eye size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.nanoActionBtn, { backgroundColor: COLORS.success + '15' }]}
                        onPress={() => handleDownload({ ...att, title: item.title })}
                      >
                        <Download size={14} color={COLORS.success} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.nanoActionBtn, { backgroundColor: COLORS.error + '15' }]}
                        onPress={() => handleDeleteAttachment(item._id, att.fileUrl, att.fileName)}
                      >
                        <Trash2 size={14} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        title="Study Materials"
        subtitle={`${materials.length} resources`}
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.addBtnSmall}
            onPress={() => navigation.navigate('StudyMaterialUpload')}
          >
            <Plus size={18} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.tabWrapper}>
        <GlassCard style={styles.selectorCard}>
          <View style={styles.selectorRow}>
            <TouchableOpacity 
              style={styles.selectorBtn} 
              onPress={() => setClassModalVisible(true)}
            >
              <Text style={styles.selectorLabel}>CLASS</Text>
              <View style={styles.selectorValueRow}>
                <Text style={styles.selectorValue} numberOfLines={1}>
                  {filterClass === 'all' ? 'All Classes' : classList.find(c => c._id === filterClass)?.name || 'Select'}
                </Text>
                <ChevronDown size={14} color={COLORS.primary} />
              </View>
            </TouchableOpacity>

            <View style={styles.verticalDivider} />

            <TouchableOpacity 
              style={[styles.selectorBtn, filterClass === 'all' && { opacity: 0.5 }]}
              onPress={() => filterClass !== 'all' && setSubjectModalVisible(true)}
              disabled={filterClass === 'all'}
            >
              <Text style={styles.selectorLabel}>SUBJECT</Text>
              <View style={styles.selectorValueRow}>
                <Text style={styles.selectorValue} numberOfLines={1}>
                  {filterSubject === 'all' ? 'All Subjects' : subjectList.find(s => s._id === filterSubject)?.name || 'Select'}
                </Text>
                <ChevronDown size={14} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.uploadRow}>
          <Text style={styles.sectionTitle}>Recent Uploads</Text>
        </View>
      </Animated.View>

      <FlatList
        data={materials.filter(m => {
          const mClassId = m.classId?._id || m.classId;
          const mSubjectId = m.subjectId?._id || m.subjectId;
          const classMatch = filterClass === 'all' || mClassId === filterClass;
          const subjectMatch = filterSubject === 'all' || mSubjectId === filterSubject;
          return classMatch && subjectMatch;
        })}
        keyExtractor={(item) => item._id}
        renderItem={renderMaterialItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeInUp.delay(400)} style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <BookOpen color={COLORS.primary} size={48} />
            </View>
            <Text style={styles.emptyTitle}>Empty Classroom</Text>
            <Text style={styles.emptySubtitle}>Start by uploading notes, assignments, or study guides for your students.</Text>
            <TouchableOpacity 
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('StudyMaterialUpload')}
            >
              <Text style={styles.emptyBtnText}>Upload First Material</Text>
            </TouchableOpacity>
          </Animated.View>
        }
      />

      {/* MODALS REMAIN THE SAME BUT WITH THEMED STYLING BELOW */}

      {/* File Preview Modal */}
      <Modal
        visible={previewVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <FileText color={COLORS.primary} size={24} />
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedMaterial?.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPreviewVisible(false)} style={styles.closeBtn}>
                <X color={COLORS.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.fileDetailsCard}>
                <Info size={20} color={COLORS.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.detailLabel}>File Name</Text>
                <Text style={styles.detailValue}>{selectedMaterial?.fileName || 'N/A'}</Text>
                
                <View style={styles.divider} />
                
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>
                  {selectedMaterial?.description || 'No description provided.'}
                </Text>

                <View style={styles.divider} />

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Class</Text>
                    <Text style={styles.detailValue}>{selectedMaterial?.classId?.name}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Subject</Text>
                    <Text style={styles.detailValue}>{selectedMaterial?.subjectId?.name}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalActionBtn, styles.viewBtnLarge]}
                  onPress={async () => {
                    const fullUrl = selectedMaterial?.fileUrl.startsWith('http') 
                      ? selectedMaterial.fileUrl 
                      : `${CONFIG.API_BASE_URL.replace('/api', '')}/${selectedMaterial.fileUrl.replace(/^\/+/, '')}`;
                    
                    setViewerUrl(fullUrl);
                    setViewerVisible(true);
                  }}
                >
                  <Eye size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalActionText}>View Content</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionBtn, styles.downloadBtnLarge]}
                  onPress={() => handleDownload(selectedMaterial)}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Download size={20} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.modalActionText}>Download & Share</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionBtn, styles.shareBtnLarge]}
                  onPress={async () => {
                    const fullUrl = selectedMaterial?.fileUrl.startsWith('http') 
                      ? selectedMaterial.fileUrl 
                      : `${CONFIG.API_BASE_URL.replace('/api', '')}/${selectedMaterial.fileUrl.replace(/^\/+/, '')}`;
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(fullUrl);
                    }
                  }}
                >
                  <Share2 size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.modalActionText, { color: COLORS.primary }]}>Copy Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Class Selection Modal */}
      <Modal
        visible={classModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setClassModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setClassModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setClassModalVisible(false)}>
                <X color={COLORS.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetContent}>
              <TouchableOpacity 
                style={[styles.sheetItem, filterClass === 'all' && styles.sheetItemActive]}
                onPress={() => {
                  setFilterClass('all');
                  setClassModalVisible(false);
                }}
              >
                <Text style={[styles.sheetItemText, filterClass === 'all' && styles.sheetItemTextActive]}>All Classes</Text>
                {!!(filterClass === 'all') && <Check size={18} color={COLORS.primary} />}
              </TouchableOpacity>
              {classList.map((cls) => (
                <TouchableOpacity 
                  key={cls._id}
                  style={[styles.sheetItem, filterClass === cls._id && styles.sheetItemActive]}
                  onPress={() => {
                    setFilterClass(cls._id);
                    setClassModalVisible(false);
                  }}
                >
                  <Text style={[styles.sheetItemText, filterClass === cls._id && styles.sheetItemTextActive]}>{cls.name}</Text>
                  {!!(filterClass === cls._id) && <Check size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Subject Selection Modal */}
      <Modal
        visible={subjectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSubjectModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Subject</Text>
              <TouchableOpacity onPress={() => setSubjectModalVisible(false)}>
                <X color={COLORS.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetContent}>
              <TouchableOpacity 
                style={[styles.sheetItem, filterSubject === 'all' && styles.sheetItemActive]}
                onPress={() => {
                  setFilterSubject('all');
                  setSubjectModalVisible(false);
                }}
              >
                <Text style={[styles.sheetItemText, filterSubject === 'all' && styles.sheetItemTextActive]}>All Subjects</Text>
                {!!(filterSubject === 'all') && <Check size={18} color="#4CAF50" />}
              </TouchableOpacity>
              {subjectList.map((sub) => (
                <TouchableOpacity 
                  key={sub._id}
                  style={[styles.sheetItem, filterSubject === sub._id && styles.sheetItemActive]}
                  onPress={() => {
                    setFilterSubject(sub._id);
                    setSubjectModalVisible(false);
                  }}
                >
                  <Text style={[styles.sheetItemText, filterSubject === sub._id && styles.sheetItemTextActive]}>{sub.name}</Text>
                  {!!(filterSubject === sub._id) && <Check size={18} color="#4CAF50" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* In-App Content Viewer */}
      <Modal
        visible={viewerVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.viewerCloseBtn}>
              <X color={COLORS.text} size={28} />
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {selectedMaterial?.title || 'Preview'}
            </Text>
            <TouchableOpacity 
              onPress={() => handleDownload(selectedMaterial)}
              style={styles.viewerDownloadBtn}
            >
              <Download color={COLORS.primary} size={24} />
            </TouchableOpacity>
          </View>
          <WebView 
            source={{ uri: viewerUrl }} 
            style={{ flex: 1 }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            scalesPageToFit={true}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    marginBottom: SPACING.sm,
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
    flex: 1,
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
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  addBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  cardDeleteBtn: {
    marginLeft: 10,
  },
  deleteIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    padding: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dateTextSmall: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 'auto',
    fontWeight: '500',
  },
  attachmentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  attachmentToggleActive: {
    borderColor: COLORS.primary + '50',
    backgroundColor: COLORS.primary + '05',
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  attachmentList: {
    marginTop: 12,
    gap: 10,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  attachmentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentTextInfo: {
    marginLeft: 12,
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  attachmentSize: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  attachmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  nanoActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
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
    borderRadius: 12,
  },
  emptyBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 12,
  },
  closeBtn: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  fileDetailsCard: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border + '30',
    marginBottom: 16,
  },
  detailGrid: {
    flexDirection: 'row',
  },
  detailItem: {
    flex: 1,
  },
  modalActions: {
    gap: 12,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  viewBtnLarge: {
    backgroundColor: COLORS.primary,
  },
  downloadBtnLarge: {
    backgroundColor: COLORS.success,
  },
  shareBtnLarge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  modalActionText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: height * 0.7,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  sheetContent: {
    marginBottom: 20,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '30',
  },
  sheetItemActive: {
    backgroundColor: COLORS.primary + '05',
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  sheetItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  sheetItemTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  viewerHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '50',
  },
  viewerCloseBtn: {
    padding: 8,
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  viewerDownloadBtn: {
    padding: 8,
  },
});

export default StudyMaterialManagement;
