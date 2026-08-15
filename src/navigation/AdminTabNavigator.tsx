import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ScannerScreen from '../screens/admin/ScannerScreen';
import MembersScreen from '../screens/admin/MembersScreen';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#00E676',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          borderTopColor: '#333333',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'qr-code-outline';

          if (route.name === 'Scanner') {
            iconName = 'qr-code-outline';
          } else if (route.name === 'Members') {
            iconName = 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ tabBarLabel: 'Acceso QR' }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{ tabBarLabel: 'Socios' }}
      />
    </Tab.Navigator>
  );
}