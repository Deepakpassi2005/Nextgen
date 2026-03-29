import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Alert,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper'; // Keeping Text for base typography if needed, but transitioning to custom
import { useNoticeStore, type Notice } from '../../store/noticeStore';
import { 
  Bell, 
  Clock, 
  Trash2, 
  Edit3, 
  Plus, 
  ChevronRight, 
  Paperclip,
  ArrowLeft,
  Layout,
  Info,
  Home,
  CheckSquare,
  User,
  Send
} from 'lucide-react-native';
import { COLORS, SPACING } from '../../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PageHeader from '../../components/PageHeader';
import BottomTabBar from '../../components/BottomTabBar';

const GlassCard = ({ children, style }: any) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

import { StackNavigationProp } from '@react-navigation/stack';

export default function NoticeHistory({ navigation }: { navigation: StackNavigationProp<any> }) {
  const { notices, loadNotices, deleteNotice, isLoading } = useNoticeStore();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'received' | 'sent'>('received');


  useEffect(() => {
    const init = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const u = JSON.parse(userData);
        setUser(u);
        setUserRole(u.role || 'student');
      }
      await loadNotices();
    };
    init();
  }, [loadNotices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotices();
    setRefreshing(false);
  }, [loadNotices]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Notice',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNotice(id);
            } catch {
              Alert.alert('Error', 'Failed to delete notice');
            }
          },
        },
      ]
    );
  };

  const canEdit = userRole === 'teacher' || userRole === 'admin';

  const filteredNotices = notices.filter(notice => {
    if (userRole === 'student') return true; 
    if (userRole === 'admin') return true; 
    
    const isMyNotice = notice.authorId === user?._id || notice.authorId === user?.id || (notice.author === user?.name && !notice.authorId);

    if (selectedTab === 'sent') {
      return isMyNotice;
    } else {
      // Received: Admin notices OR notices from others
      return !isMyNotice || notice.createdByRole === 'admin';
    }
  });

  const renderNoticeCard = ({ item: notice, index }: { item: Notice, index: number }) => {
    const priorityColors = {
      high: COLORS.error,
      medium: COLORS.warning,
      low: COLORS.success,
    };
    const pColor = priorityColors[notice.priority] || COLORS.textSecondary;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => navigation.navigate('NoticeDetail', { notice })}
        >
          <GlassCard style={styles.noticeCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: pColor + '15' }]}>
                <Text style={[styles.priorityText, { color: pColor }]}>{notice.priority.toUpperCase()}</Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(notice.timestamp).toLocaleDateString()}
              </Text>
            </View>

            <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
            <Text style={styles.noticeMessage} numberOfLines={2}>{notice.message}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.authorRow}>
                <Bell size={12} color={COLORS.textSecondary} />
                <Text style={styles.authorText}>
                  {notice.recipient === 'class' ? 'Students' : notice.recipient === 'admin' ? 'Teachers' : 'General'}
                </Text>
              </View>

              <View style={styles.footerActions}>
                {notice.attachments && notice.attachments.length > 0 && (
                  <View style={styles.attachmentBadge}>
                    <Paperclip size={12} color={COLORS.primary} />
                    <Text style={styles.attachmentCount}>{notice.attachments.length}</Text>
                  </View>
                )}
                {((userRole === 'admin') || (userRole === 'teacher' && notice.createdByRole === 'teacher')) && (
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={() => navigation.navigate('SendNotice', { editNotice: notice })}>
                      <Edit3 size={18} color={COLORS.primary} style={styles.actionIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(notice.id)}>
                      <Trash2 size={18} color={COLORS.error} style={styles.actionIcon} />
                    </TouchableOpacity>
                  </View>
                )}
                <ChevronRight size={18} color={COLORS.textSecondary} />
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTabs = () => {
    if (userRole !== 'teacher') return null;
    return (
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, selectedTab === 'received' && styles.activeTabItem]}
          onPress={() => setSelectedTab('received')}
        >
          <Bell size={18} color={selectedTab === 'received' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabText, selectedTab === 'received' && styles.activeTabText]}>Received</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, selectedTab === 'sent' && styles.activeTabItem]}
          onPress={() => setSelectedTab('sent')}
        >
          <Send size={18} color={selectedTab === 'sent' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.tabText, selectedTab === 'sent' && styles.activeTabText]}>Sent</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      <PageHeader
        title="Notice Board"
        subtitle={selectedTab === 'sent' ? "Your Announcements" : "Official Announcements"}
        onBack={() => navigation.goBack()}
        rightElement={canEdit ? (
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('SendNotice')}>
            <Plus size={24} color="#FFF" />
          </TouchableOpacity>
        ) : undefined}
      />

      {renderTabs()}

      <FlatList
        data={filteredNotices}
        keyExtractor={(item) => item.id}
        renderItem={renderNoticeCard}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary} 
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Layout size={64} color={COLORS.textSecondary + '40'} />
              <Text style={styles.emptyText}>No notices found</Text>
              <Text style={styles.emptySubtext}>You will see official communications here.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  addButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  noticeCard: {
    marginBottom: SPACING.lg,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 6,
  },
  noticeMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '30',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  attachmentCount: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  editActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionIcon: {
    opacity: 0.8,
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabItem: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary + '30',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
  },
});
