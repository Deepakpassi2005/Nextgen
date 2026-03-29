import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInRight,
  Layout,
  FadeInLeft
} from 'react-native-reanimated';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Save, 
  LogOut, 
  Briefcase, 
  GraduationCap,
  ChevronRight,
  ArrowLeft,
  Settings,
  Bell,
  Lock,
  Home,
  CheckSquare,
  Trash2,
  Info,
  Check,
  Square,
  FileText
} from 'lucide-react-native';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { CustomButton } from '../../components/CustomButton';
import PageHeader from '../../components/PageHeader';

const { width } = Dimensions.get('window');

import { StackNavigationProp } from '@react-navigation/stack';

const ProfileScreen = ({ navigation }: { navigation: StackNavigationProp<any> }) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showNotifySettings, setShowNotifySettings] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = apiClient.defaults.baseURL?.replace('/api', '') || '';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/teacher/profile');
      setProfile(response.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!profile.name?.trim()) return Alert.alert('Error', 'Name is required');
    if (profile.phoneNumber && !/^\d{10}$/.test(profile.phoneNumber)) {
      return Alert.alert('Error', 'Phone number must be 10 digits');
    }

    setSaving(true);
    try {
      const { _id, createdAt, updatedAt, __v, ...updateData } = profile;
      await apiClient.put('/teacher/profile', updateData);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const formData = new FormData();
      
      // @ts-ignore
      formData.append('photo', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'image/jpeg',
      });

      setUploading(true);
      const response = await apiClient.post('/teacher/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProfile({ ...profile, profilePhoto: response.data.data.photoPath });
      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const toggleNotificationSetting = (key: string) => {
    const newSettings = { 
      ...profile.notificationSettings, 
      [key]: !profile.notificationSettings?.[key] 
    };
    setProfile({ ...profile, notificationSettings: newSettings });
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: logout 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderInput = (label: string, icon: any, value: string, key: string, keyboardType: any = 'default', editable = true) => (
    <View style={styles.inputGroup}>
      <Text style={styles.labelSmall}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.disabledInputWrapper]}>
        <View style={styles.iconContainer}>{icon}</View>
        <TextInput
          style={[styles.input, !editable && styles.disabledInput]}
          value={value?.toString()}
          onChangeText={(text) => setProfile({ ...profile, [key]: text })}
          keyboardType={keyboardType}
          placeholder={`Enter ${label}`}
          placeholderTextColor={COLORS.textSecondary + '60'}
          editable={editable}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <PageHeader
          title="My Profile"
          subtitle="Edit your information"
          onBack={() => navigation.goBack()}
        />

        <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header Card */}
          <Animated.View entering={FadeInDown.duration(600)}>
            <GlassCard style={styles.profileHeaderCard}>
                <View style={styles.avatarWrapper}>
                    <View style={styles.avatarBorder}>
                        {profile?.profilePhoto ? (
                            <Image 
                              source={{ 
                                uri: profile.profilePhoto.startsWith('http') 
                                  ? profile.profilePhoto 
                                  : profile.profilePhoto.startsWith('uploads/') 
                                    ? `${API_BASE_URL}/${profile.profilePhoto}`
                                    : `${API_BASE_URL}/uploads/${profile.profilePhoto}`
                              }} 
                              style={styles.avatar} 
                            />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <User size={40} color={COLORS.primary} />
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraBadge} onPress={handlePhotoUpload} disabled={uploading}>
                            {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Camera size={14} color="#FFF" />}
                        </TouchableOpacity>
                    </View>
                </View>
                
                <Text style={styles.profileName}>{profile?.name || 'Academic Professional'}</Text>
                <Text style={styles.profileEmail}>{profile?.email || 'teacher@nextgen.com'}</Text>
                
                <View style={styles.quickStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.classes?.length || 0}</Text>
                        <Text style={styles.statLabel}>Classes</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{profile?.subjects?.length || 0}</Text>
                        <Text style={styles.statLabel}>Subjects</Text>
                    </View>
                </View>
            </GlassCard>
          </Animated.View>

          {/* Details Section */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>PERSONAL INFORMATION</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300)}>
            <GlassCard style={styles.formCard}>
              {renderInput('FULL NAME', <User size={18} color={COLORS.primary} />, profile?.name, 'name')}
              {renderInput('EMAIL ADDRESS', <Mail size={18} color={COLORS.primary} />, profile?.email, 'email', 'email-address', false)}
              {renderInput('PHONE NUMBER', <Phone size={18} color={COLORS.primary} />, profile?.phoneNumber, 'phoneNumber', 'phone-pad')}
              {renderInput('ADDRESS', <MapPin size={18} color={COLORS.primary} />, profile?.address, 'address')}
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400)} style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>PROFESSIONAL DETAILS</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500)}>
            <GlassCard style={styles.formCard}>
              {renderInput('QUALIFICATION', <GraduationCap size={18} color={COLORS.primary} />, profile?.qualification, 'qualification')}
              {renderInput('EXPERIENCE (YEARS)', <Briefcase size={18} color={COLORS.primary} />, profile?.experience, 'experience', 'number-pad')}
              {renderInput('JOINING DATE', <Calendar size={18} color={COLORS.primary} />, profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '', 'joiningDate', 'default', false)}
            </GlassCard>
          </Animated.View>

          {/* Account Actions */}
          <View style={styles.accountSection}>
             <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={() => setShowNotifySettings(true)}>
                <View style={[styles.actionIconBg, { backgroundColor: '#EEF2FF' }]}>
                    <Bell size={18} color="#4F46E5" />
                </View>
                <Text style={styles.actionText}>Notification Settings</Text>
                <ChevronRight size={18} color={COLORS.textSecondary} />
             </TouchableOpacity>

             <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={() => setShowTerms(true)}>
                <View style={[styles.actionIconBg, { backgroundColor: '#F0FDF4' }]}>
                    <FileText size={18} color="#16A34A" />
                </View>
                <Text style={styles.actionText}>Terms & Conditions</Text>
                <ChevronRight size={18} color={COLORS.textSecondary} />
             </TouchableOpacity>

             <TouchableOpacity style={styles.actionRow} activeOpacity={0.7} onPress={handleLogout}>
                <View style={[styles.actionIconBg, { backgroundColor: '#FEF2F2' }]}>
                    <LogOut size={18} color={COLORS.error} />
                </View>
                <Text style={[styles.actionText, { color: COLORS.error }]}>Sign Out</Text>
                <ChevronRight size={18} color={COLORS.error + '40'} />
             </TouchableOpacity>
          </View>

          <View style={styles.footerInfo}>
             <Info size={14} color={COLORS.textSecondary} />
             <Text style={styles.versionText}>NextGen Teacher Panel v2.1.0</Text>
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.stickyFooter}>
            <CustomButton
                title={saving ? "Saving Changes..." : "Save Profile"}
                onPress={handleUpdate}
                loading={saving}
                disabled={saving || uploading}
                style={styles.saveBtn}
                icon={<Save size={20} color="#FFF" />}
            />
        </View>

        {/* Notification Settings Modal */}
        <Modal
          visible={showNotifySettings}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotifySettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notification Settings</Text>
                <TouchableOpacity onPress={() => setShowNotifySettings(false)}>
                  <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.notifyOptionList}>
                <NotifyOption 
                  label="Next Class Reminder" 
                  isEnabled={profile?.notificationSettings?.nextClass} 
                  onToggle={() => toggleNotificationSetting('nextClass')}
                />
                <NotifyOption 
                  label="Attendance Marked Notifications" 
                  isEnabled={profile?.notificationSettings?.attendanceMarked} 
                  onToggle={() => toggleNotificationSetting('attendanceMarked')}
                />
                <NotifyOption 
                  label="New Result Published" 
                  isEnabled={profile?.notificationSettings?.newResult} 
                  onToggle={() => toggleNotificationSetting('newResult')}
                />
                <NotifyOption 
                  label="New Notice Received" 
                  isEnabled={profile?.notificationSettings?.newNotice} 
                  onToggle={() => toggleNotificationSetting('newNotice')}
                />
              </View>
              
              <CustomButton 
                title="Done" 
                onPress={() => setShowNotifySettings(false)} 
                style={styles.modalDoneBtn}
              />
            </View>
          </View>
        </Modal>

        {/* Terms & Conditions Modal */}
        <Modal
          visible={showTerms}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowTerms(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Terms & Conditions</Text>
                <TouchableOpacity onPress={() => setShowTerms(false)}>
                  <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.termsScroll}>
                <Text style={styles.termsHeading}>1. App Usage Description</Text>
                <Text style={styles.termsText}>
                  This application is intended for academic and institutional management within NextGen School. Users are expected to maintain professional conduct and accuracy in data entry.
                </Text>
                
                <Text style={styles.termsHeading}>2. Privacy & Security Policies</Text>
                <Text style={styles.termsText}>
                  Your data is protected and stored securely. We do not sell your personal information to third parties.
                </Text>

                <Text style={styles.termsHeading}>3. Password Security</Text>
                <Text style={styles.termsText}>
                  It is your responsibility to maintain the confidentiality of your password. Never share your credentials with anyone. NextGen staff will never ask for your password via email or phone.
                </Text>

                <Text style={styles.termsHeading}>4. Circumstances for Non-Sharing</Text>
                <Text style={styles.termsText}>
                  Data sharing is limited to institutional requirements. Any unauthorized extraction of student or staff data is strictly prohibited and subject to legal action.
                </Text>

                <Text style={styles.termsHeading}>5. Mobile Notifications</Text>
                <Text style={styles.termsText}>
                  By enabling notifications, you agree to receive real-time alerts regarding your timetable, results, and official notices from the administration.
                </Text>
              </ScrollView>
              
              <CustomButton 
                title="I Understand" 
                onPress={() => setShowTerms(false)} 
                style={styles.modalDoneBtn}
              />
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 70,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtnWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeaderCard: {
    padding: 24,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 4,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
  },
  placeholderAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  sectionHeader: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    opacity: 0.5,
    letterSpacing: 1.5,
  },
  formCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
    opacity: 0.7,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  disabledInputWrapper: {
    backgroundColor: '#F1F5F9',
    borderColor: '#F1F5F9',
  },
  disabledInput: {
    color: COLORS.textSecondary,
  },
  accountSection: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 30,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
    opacity: 0.5,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  stickyFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 35 : 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  notifyOptionList: {
    marginBottom: 20,
  },
  notifyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notifyOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalDoneBtn: {
    marginTop: 10,
  },
  termsScroll: {
    marginBottom: 20,
  },
  termsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 15,
  },
  termsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  }
});

const NotifyOption = ({ label, isEnabled, onToggle }: any) => (
  <TouchableOpacity style={styles.notifyOption} onPress={onToggle}>
    <Text style={styles.notifyOptionLabel}>{label}</Text>
    {isEnabled ? (
      <View style={{ backgroundColor: COLORS.primary, borderRadius: 6, padding: 2 }}>
        <Check size={18} color="#FFF" />
      </View>
    ) : (
      <Square size={22} color={COLORS.textSecondary} />
    )}
  </TouchableOpacity>
);

export default ProfileScreen;
