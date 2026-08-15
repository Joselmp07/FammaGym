import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Role } from '../types/database.types';

// Pantallas
import LoginScreen from '../screens/auth/LoginScreen';
import PassQRScreen from '../screens/client/PassQRScreen';
import ScannerScreen from '../screens/admin/ScannerScreen';
import ClientTabNavigator from '../navigation/ClientTabNavigator';

const Stack = createNativeStackNavigator();

// Placeholder temporal únicamente para la vista de Administrador
function AdminPlaceholder() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>🛡️ Panel de Recepción / Administración</Text>
    </View>
  );
}

export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Obtener el rol del usuario desde la tabla profiles
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single<{ role: Role }>();

      if (error) {
        console.error('Error al obtener el rol:', error.message);
        setUserRole('client');
      } else {
        setUserRole(data?.role || 'client');
      }
    } catch (err) {
      console.error('Error inesperado al consultar perfil:', err);
      setUserRole('client');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Obtener la sesión inicial al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Escuchar cambios de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          setLoading(true);
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          // RUTA PÚBLICA
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : userRole === 'admin' || userRole === 'staff' ? (
          // RUTA ADMINISTRATIVA
          <Stack.Screen name="AdminApp" component={ScannerScreen} />
        ) : (    
          // RUTA CLIENTE: Carnet Digital con QR
          <Stack.Screen name="ClientApp" component={ClientTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#00E676',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});