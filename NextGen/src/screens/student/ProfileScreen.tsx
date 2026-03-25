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
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import * as DocumentPicker from 'expo-document-picker';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Camera, 
  Save, 
  LogOut,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Hash,
  Bell,
  Settings,
  Info,
  Check,
  Square,
  FileText
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CustomButton } from '../../components/CustomButton';

const { width } = Dimensions.get('window');

const GlassCard = ({ children, style }: any) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

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

const ProfileScreen = ({ navigation }: any) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showNotifySettings, setShowNotifySettings] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const API_BASE_URL = apiClient.defaults.baseURL?.replace('/api', '') || '';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/student/profile');
      setProfile(response.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
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
      const response = await apiClient.post('/student/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProfile({ ...profile, studentPhoto: response.data.data.photoPath });
      Alert.alert('Success', 'Photo uploaded successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const toggleNotificationSetting = (key: string) => {
    const currentSettings = profile.notificationSettings || {
        newNotice: true,
        newResult: true,
        newAssignment: true
    };
    const newSettings = { 
      ...currentSettings, 
      [key]: !currentSettings?.[key as keyof typeof currentSettings] 
    };
    setProfile({ ...profile, notificationSettings: newSettings });
  };

  const handleUpdate = async () => {
    if (!profile.firstName?.trim()) return Alert.alert('Error', 'First Name is required');
    if (!profile.lastName?.trim()) return Alert.alert('Error', 'Last Name is required');
    if (profile.studentMobileNumber && !/^\d{10}$/.test(profile.studentMobileNumber)) {
      return Alert.alert('Error', 'Mobile number must be 10 digits');
    }

    setSaving(true);
    try {
      const { _id, createdAt, updatedAt, __v, ...updateData } = profile;
      await apiClient.put('/student/profile', updateData);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
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
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.disabledInputWrapper]}>
        <View style={styles.iconContainer}>{icon}</View>
        <TextInput
          style={[styles.input, !editable && styles.disabledInput]}
          value={value}
          onChangeText={(text) => setProfile({ ...profile, [key]: text })}
          keyboardType={keyboardType}
          placeholder={`Enter ${label}`}
          placeholderTextColor={COLORS.textSecondary}
          editable={editable}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Student Information</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setShowNotifySettings(true)}>
          <Settings size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(600)} style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              {profile?.studentPhoto ? (
                <Image 
                  source={{ uri: profile.studentPhoto.startsWith('http') ? profile.studentPhoto : `${API_BASE_URL}/${profile.studentPhoto}` }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <User size={50} color={COLORS.primary} />
                </View>
              )}
              <TouchableOpacity 
                style={styles.editBadge} 
                onPress={handlePhotoUpload}
                disabled={uploading}
              >
                <Camera size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.userName}>{profile?.firstName} {profile?.lastName}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <ShieldCheck size={12} color={COLORS.primary} />
              <Text style={styles.roleText}>Official Student Profile</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
                <CreditCard size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Academic Records</Text>
            </View>
            <View style={styles.academicRow}>
                <View style={styles.academicBox}>
                    <Text style={styles.academicLabel}>Admission ID</Text>
                    <Text style={styles.academicValue}>{profile?.admissionNumber || 'N/A'}</Text>
                </View>
                <View style={styles.academicBox}>
                    <Text style={styles.academicLabel}>Roll No.</Text>
                    <Text style={styles.academicValue}>{profile?.rollNumber || 'N/A'}</Text>
                </View>
                <View style={styles.academicBox}>
                    <Text style={styles.academicLabel}>Class ID</Text>
                    <Text style={styles.academicValue}>
                        {typeof profile?.classId === 'string' 
                            ? `#${profile.classId.substring(0, 6)}` 
                            : (profile?.classId?.name || 'STD')}
                    </Text>
                </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
                <User size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderInput('First Name', <User size={18} color={COLORS.primary} />, profile.firstName, 'firstName')}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput('Last Name', <User size={18} color={COLORS.primary} />, profile.lastName, 'lastName')}
              </View>
            </View>
            {renderInput('Email Address', <Mail size={18} color={COLORS.primary} />, profile.email, 'email', 'email-address', false)}
            {renderInput('Mobile Number', <Phone size={18} color={COLORS.primary} />, profile.studentMobileNumber, 'studentMobileNumber', 'phone-pad')}
            {renderInput('Date of Birth', <Calendar size={18} color={COLORS.primary} />, profile.dateOfBirth?.split('T')[0], 'dateOfBirth')}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600)}>
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
                <MapPin size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Address & Location</Text>
            </View>
            {renderInput('Residential Address', <MapPin size={18} color={COLORS.primary} />, profile.residentialAddress, 'residentialAddress')}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderInput('City', <MapPin size={18} color={COLORS.primary} />, profile.city, 'city')}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput('State', <MapPin size={18} color={COLORS.primary} />, profile.state, 'state')}
              </View>
            </View>
            {renderInput('Pin Code', <Hash size={18} color={COLORS.primary} />, profile.pinCode, 'pinCode', 'numeric')}
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700)}>
          <GlassCard style={styles.section}>
            <View style={styles.sectionHeader}>
                <Settings size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Account & Settings</Text>
            </View>
            
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowNotifySettings(true)}>
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.primary + '10' }]}>
                <Bell size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Notification Settings</Text>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={() => setShowTerms(true)}>
              <View style={[styles.actionIconBg, { backgroundColor: '#FF980010' }]}>
                <FileText size={20} color="#FF9800" />
              </View>
              <Text style={styles.actionText}>Terms & Conditions</Text>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={() => Alert.alert('Privacy Policy', 'Your data is encrypted and secure.')}>
              <View style={[styles.actionIconBg, { backgroundColor: '#4CAF5010' }]}>
                <ShieldCheck size={20} color="#4CAF50" />
              </View>
              <Text style={styles.actionText}>Privacy Policy</Text>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
          onPress={handleUpdate}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Save size={20} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.saveBtnText}>Update Profile</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={20} color={COLORS.error} style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Sign out from Device</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

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
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setShowNotifySettings(false)}>
                  <ArrowLeft size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.notifyOptionList}>
                <NotifyOption 
                  label="New Notices" 
                  isEnabled={profile?.notificationSettings?.newNotice !== false} 
                  onToggle={() => toggleNotificationSetting('newNotice')} 
                />
                <NotifyOption 
                  label="Exam Results" 
                  isEnabled={profile?.notificationSettings?.newResult !== false} 
                  onToggle={() => toggleNotificationSetting('newResult')} 
                />
                <NotifyOption 
                  label="New Assignments" 
                  isEnabled={profile?.notificationSettings?.newAssignment !== false} 
                  onToggle={() => toggleNotificationSetting('newAssignment')} 
                />
              </View>
              
              <CustomButton 
                title="Save Settings" 
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

    </View>
  );
};

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
  settingsButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  avatarWrapper: {
    padding: 6,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  section: {
    padding: 20,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  academicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  academicBox: {
    alignItems: 'center',
    flex: 1,
  },
  academicLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  academicValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '700',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border + '50',
    height: 54,
  },
  iconContainer: {
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: COLORS.border + '50',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  disabledInputWrapper: {
    backgroundColor: COLORS.border + '20',
    opacity: 0.8,
  },
  disabledInput: {
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    padding: 15,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: '800',
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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

export default ProfileScreen;
