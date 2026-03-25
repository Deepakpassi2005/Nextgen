import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ClipboardList, Bell, User } from 'lucide-react-native';

import StudentDashboard from '../screens/student/StudentDashboard';
import TimetableScreen from '../screens/student/TimetableScreen';
import QuizAttemptScreen from '../screens/student/QuizAttemptScreen';
import StudyMaterialList from '../screens/student/StudyMaterialList';
import StudentResultScreen from '../screens/student/StudentResultScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import NoticeHistory from '../screens/notice/NoticeHistory';
import NoticeDetail from '../screens/notice/NoticeDetail';
import AssignmentListScreen from '../screens/student/AssignmentListScreen';
import AssignmentSubmitScreen from '../screens/student/AssignmentSubmitScreen';

import BottomTabBar from '../components/BottomTabBar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack for the Home tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StudentHome" component={StudentDashboard} />
    <Stack.Screen name="QuizAttempt" component={QuizAttemptScreen} />
    <Stack.Screen name="StudyMaterial" component={StudyMaterialList} />
    <Stack.Screen name="StudentResult" component={StudentResultScreen} />
    <Stack.Screen name="AssignmentSubmit" component={AssignmentSubmitScreen} />
    <Stack.Screen name="NoticeHistory" component={NoticeHistory} />
    <Stack.Screen name="NoticeDetail" component={NoticeDetail} />
  </Stack.Navigator>
);

// Stack for the Timetable tab
const TimetableStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TimetableMain" component={TimetableScreen} />
  </Stack.Navigator>
);

// Stack for the Assignments tab
const AssignmentStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AssignmentListMain" component={AssignmentListScreen} />
  </Stack.Navigator>
);

// Stack for the Profile tab
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
  </Stack.Navigator>
);

export const StudentNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <BottomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen 
      name="StudentDashboard" 
      component={HomeStack}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: (props) => <Home {...props} />,
      }}
    />
    <Tab.Screen 
      name="Timetable" 
      component={TimetableStack}
      options={{
        tabBarLabel: 'Schedule',
        tabBarIcon: (props) => <ClipboardList {...props} />,
      }}
    />
    <Tab.Screen 
      name="AssignmentList" 
      component={AssignmentStack}
      options={{
        tabBarLabel: 'Work',
        tabBarIcon: (props) => <ClipboardList {...props} />,
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

export default StudentNavigator;
