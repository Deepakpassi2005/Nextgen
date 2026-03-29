import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, CheckSquare, Bell, User } from 'lucide-react-native';

import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import MarkAttendanceScreen from '../screens/teacher/MarkAttendanceScreen';
import PunchingScreen from '../screens/teacher/PunchingScreen';
import QuizManagementScreen from '../screens/teacher/QuizManagementScreen';
import ResultManagementScreen from '../screens/teacher/ResultManagementScreen';
import ProfileScreen from '../screens/teacher/ProfileScreen';
import StudyMaterialUpload from '../screens/teacher/StudyMaterialUpload';
import StudyMaterialManagement from '../screens/teacher/StudyMaterialManagement';
import MessagingScreen from '../screens/teacher/MessagingScreen';
import NoticeHistory from '../screens/notice/NoticeHistory';
import SendNotice from '../screens/notice/SendNotice';
import NoticeDetail from '../screens/notice/NoticeDetail';
import AssignmentManagementScreen from '../screens/teacher/AssignmentManagementScreen';

import BottomTabBar from '../components/BottomTabBar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack for the Home/Dashboard tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TeacherHome" component={TeacherDashboard} />
    <Stack.Screen name="Punching" component={PunchingScreen} />
    <Stack.Screen name="QuizManagement" component={QuizManagementScreen} />
    <Stack.Screen name="StudyMaterial" component={StudyMaterialManagement} />
    <Stack.Screen name="StudyMaterialUpload" component={StudyMaterialUpload} />
    <Stack.Screen name="AssignmentManagement" component={AssignmentManagementScreen} />
    <Stack.Screen name="Messaging" component={MessagingScreen} />
    <Stack.Screen name="ResultManagement" component={ResultManagementScreen} />
  </Stack.Navigator>
);

// Stack for the Attendance tab
const AttendanceStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MarkAttendanceMain" component={MarkAttendanceScreen} />
  </Stack.Navigator>
);

// Stack for the Notices tab
const NoticeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NoticeHistoryMain" component={NoticeHistory} />
    <Stack.Screen name="SendNotice" component={SendNotice} />
    <Stack.Screen name="NoticeDetail" component={NoticeDetail} />
  </Stack.Navigator>
);

// Stack for the Profile tab
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
  </Stack.Navigator>
);

export const TeacherNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen 
        name="TeacherDashboard" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: (props) => <Home {...props} />,
        }}
      />
      <Tab.Screen 
        name="MarkAttendance" 
        component={AttendanceStack}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: (props) => <CheckSquare {...props} />,
        }}
      />
      <Tab.Screen 
        name="NoticeHistory" 
        component={NoticeStack}
        options={{
          tabBarLabel: 'Notices',
          tabBarIcon: (props) => <Bell {...props} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: (props) => <User {...props} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TeacherNavigator;
