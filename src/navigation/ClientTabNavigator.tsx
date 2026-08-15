import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import PassQRScreen from '../screens/client/PassQRScreen';
import RoutinesScreen from '../screens/client/RoutinesScreen';
import ProfileScreen from '../screens/client/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function ClientTabNavigator() {
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

          if (route.name === 'PassQR') {
            iconName = 'qr-code-outline';
          } else if (route.name === 'Routines') {
            iconName = 'fitness-outline';
          } else if (route.name === 'Profile') {
            iconName = 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="PassQR"
        component={PassQRScreen}
        options={{ tabBarLabel: 'Carnet QR' }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{ tabBarLabel: 'Rutinas' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}