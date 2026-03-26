import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/theme';
import apiClient from '../../api/client';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  RefreshCw,
  LocateFixed,
  History as HistoryIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  Home,
  CheckSquare,
  Bell,
  User
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { GlassCard } from '../../components/GlassCard';
import { CONFIG } from '../../config';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  FadeInRight,
  Layout,
  interpolateColor,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { CustomButton } from '../../components/CustomButton';
import PageHeader from '../../components/PageHeader';

const { width } = Dimensions.get('window');

const toRad = (deg: number) => (deg * Math.PI) / 180;
const distanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

import { StackNavigationProp } from '@react-navigation/stack';

const PunchingScreen = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);


  const [isAlreadyPunchedIn, setIsAlreadyPunchedIn] = useState(false);

  const fetchPunchHistory = async () => {
    try {
      const response = await apiClient.get('/teacher/punch-history');
      const historyData = response.data.data || [];
      setHistory(historyData);
      
      // Check if already punched in today
      if (historyData.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const hasToday = historyData.some((p: any) => {
          const punchDate = p.punchIn ? new Date(p.punchIn).toISOString().split('T')[0] : null;
          return punchDate === today;
        });
        setIsAlreadyPunchedIn(hasToday);
      }
    } catch (error) {
      console.error('Error fetching punch history', error);
    }
  };

  const updateLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
      
      const dist = distanceInMeters(
        loc.coords.latitude, 
        loc.coords.longitude, 
        CONFIG.SCHOOL_LAT, 
        CONFIG.SCHOOL_LNG
      );
      setDistance(dist);
    } catch (err) {
      setErrorMsg('Failed to determine location');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    fetchPunchHistory();
    updateLocation();
  }, []);

  const isWithinRadius = distance !== null && distance <= CONFIG.PUNCH_RADIUS;

  const handlePunchIn = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not yet available. Please wait.');
      return;
    }

    if (isAlreadyPunchedIn) {
      Alert.alert('Info', 'You have already punched in for today.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/teacher/punch-in', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      Alert.alert('Success', 'Punch-in successful!');
      fetchPunchHistory();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Punch-in failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInRight.delay(index * 100).duration(400)}
    >
      <GlassCard style={styles.historyCard}>
        <View style={styles.historyRow}>
          <View style={styles.historyIconBg}>
            <Clock size={18} color={COLORS.primary} />
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyDate}>
              {item.punchIn ? new Date(item.punchIn).toLocaleDateString() : 'Invalid Date'}
            </Text>
            <Text style={styles.historyTime}>
              {item.punchIn ? new Date(item.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <CheckCircle2 size={14} color={COLORS.success} />
            <Text style={styles.statusText}>Present</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageHeader
        title="Attendance"
        subtitle="Digital Check-in Center"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={updateLocation} style={styles.locBtn}>
            <RefreshCw size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(200)}>
          <GlassCard style={styles.actionCard}>
            <View style={styles.locationVisual}>
               <View style={[styles.pulseRing, isLocating && styles.pulseActive]} />
               <View style={styles.locationCircle}>
                  <MapPin size={40} color={isWithinRadius ? COLORS.success : COLORS.primary} />
               </View>
            </View>

            <Text style={styles.locationTitle}>
              {isLocating ? 'Determining Location...' : isWithinRadius ? 'At School Campus' : 'Outside Campus'}
            </Text>
            
            <View style={styles.distanceBadge}>
              <LocateFixed size={14} color={COLORS.textSecondary} />
              <Text style={styles.distanceText}>
                {distance !== null ? `${Math.round(distance)} meters from school` : 'Calculating...'}
              </Text>
            </View>

            {!!(errorMsg) && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <CustomButton
              title={loading ? "Verifying..." : isAlreadyPunchedIn ? "Punch Registered" : "Punch In Now"}
              onPress={handlePunchIn}
              loading={loading}
              disabled={!isWithinRadius || loading || isLocating || isAlreadyPunchedIn}
              style={[
                styles.punchBtn, 
                (!isWithinRadius || isAlreadyPunchedIn) && styles.punchBtnDisabled,
                isAlreadyPunchedIn && { backgroundColor: COLORS.success }
              ]}
              icon={isAlreadyPunchedIn ? <CheckCircle size={20} color="#FFF" /> : <Navigation size={20} color="#FFF" />}
            />
            
            {!!(!isWithinRadius && !isLocating) && (
               <Text style={styles.hintText}>You must be within {CONFIG.PUNCH_RADIUS}m of school to punch in.</Text>
            )}
          </GlassCard>
        </Animated.View>

        <View style={styles.sectionHeader}>
           <HistoryIcon size={20} color={COLORS.text} style={{ marginRight: 8 }} />
           <Text style={styles.sectionTitle}>Check-in History</Text>
        </View>

        {history.length === 0 ? (
           <View style={styles.emptyHistory}>
              <Activity size={40} color={COLORS.textSecondary + '40'} />
              <Text style={styles.emptyText}>No recent activities found</Text>
           </View>
        ) : (
          <FlatList
            data={history}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
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
    paddingBottom: 20,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  locBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  actionCard: {
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
    marginBottom: 30,
  },
  locationVisual: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  pulseActive: {
    // We could add an animation here if needed
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginBottom: 25,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  punchBtn: {
    width: '100%',
    height: 56,
    borderRadius: 18,
  },
  punchBtnDisabled: {
    opacity: 0.6,
  },
  hintText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  historyCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  historyTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  }
});

export default PunchingScreen;
