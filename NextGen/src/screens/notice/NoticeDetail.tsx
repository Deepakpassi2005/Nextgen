import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Text } from 'react-native-paper';
import apiClient from '../../api/client';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Paperclip, 
  Download, 
  Eye, 
  X,
  ShieldAlert,
  Bell,
  CheckCircle2,
  FileText
} from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/theme';
import type { Notice } from '../../store/noticeStore';
import { CONFIG } from '../../config';
import * as FileSystemLegacy from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const GlassCard = ({ children, style }: any) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

export default function NoticeDetail({ route, navigation }: any) {
  const { notice: initialNotice, id } = route.params as { notice?: Notice; id?: string };
  const [notice, setNotice] = useState<Notice | null>(initialNotice || null);
  const [loading, setLoading] = useState(!initialNotice && !!id);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!notice && id) {
      fetchNoticeById(id);
    }
  }, [id]);

  const fetchNoticeById = async (noticeId: string) => {
    try {
      const response = await apiClient.get(`/public/notices/${noticeId}`);
      if (response.data.success) {
        setNotice(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notice detail:', error);
      Alert.alert('Error', 'Failed to load notice details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url?: string) => {
    if (!url) return;
    try {
      const downloadUrl = `${CONFIG.API_BASE_URL}/public/download?fileUrl=${encodeURIComponent(url)}`;
      await Linking.openURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to open the file.');
    }
  };

  const priorityColors: any = {
    high: COLORS.error,
    medium: COLORS.warning,
    low: COLORS.success,
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!notice) {
    return (
      <View style={styles.center}>
        <Text>Notice not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.primary, marginTop: 10 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pColor = priorityColors[notice.priority] || COLORS.textSecondary;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notice Details</Text>
          <Text style={styles.headerSubtitle}>Official Communication</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.detailCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.priorityBadge, { backgroundColor: pColor + '10' }]}>
              <ShieldAlert size={14} color={pColor} />
              <Text style={[styles.priorityText, { color: pColor }]}>{notice.priority.toUpperCase()}</Text>
            </View>
            <View style={styles.dateRow}>
              <Calendar size={14} color={COLORS.textSecondary} />
              <Text style={styles.dateText}>{new Date(notice.timestamp).toLocaleDateString()}</Text>
            </View>
          </View>

          <Text style={styles.title}>{notice.title}</Text>
          
          <View style={styles.authorSection}>
            <View style={styles.authorBadge}>
              <User size={14} color={COLORS.primary} />
              <Text style={styles.authorName}>{notice.author || 'School Administration'}</Text>
            </View>
            <View style={styles.recipientBadge}>
              <Bell size={14} color={COLORS.secondary} />
              <Text style={styles.recipientName}>
                For: {notice.recipient === 'class' ? 'Students' : notice.recipient === 'admin' ? 'Teachers' : 'All'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.content}>{notice.message}</Text>

          {notice.attachments && notice.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              <View style={styles.attachmentHeader}>
                <Paperclip size={18} color={COLORS.text} />
                <Text style={styles.attachmentTitle}>Attachments ({notice.attachments.length})</Text>
              </View>
              
              {notice.attachments.map((att, index) => {
                const isDownloading = downloadingId === att.uri;
                return (
                  <View key={index} style={styles.attachmentItem}>
                    <View style={styles.attachmentIconBox}>
                      <FileText size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName} numberOfLines={1}>{att.name || att.filename || 'Attachment'}</Text>
                      <Text style={styles.attachmentSize}>
                        {att.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.downloadBtn, isDownloading && styles.downloadingBtn]} 
                    onPress={() => handleDownload(att.uri)}
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

          <View style={styles.cardFooter}>
            <CheckCircle2 size={16} color={COLORS.success} />
            <Text style={styles.footerText}>Verified Official Announcement</Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

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
  detailCard: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    lineHeight: 32,
    marginBottom: 16,
  },
  authorSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  recipientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  recipientName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border + '30',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 26,
    marginBottom: 30,
    fontWeight: '400',
  },
  attachmentsContainer: {
    marginTop: 10,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  downloadingBtn: {
    borderColor: 'transparent',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 30,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
});
