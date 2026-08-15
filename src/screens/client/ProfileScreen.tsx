import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';

interface ProfileData {
  full_name: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Indicamos el tipo genérico explícito en .single<ProfileData>()
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single<ProfileData>();

        if (error) {
          console.error('Error al consultar perfil:', error.message);
        }

        setProfile({
          full_name: data?.full_name || 'Socio GymFlow',
          email: user.email || '',
        });
      } catch (err: any) {
        console.error('Error al cargar perfil:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil 👤</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre Completo:</Text>
        <Text style={styles.value}>{profile?.full_name}</Text>

        <Text style={styles.label}>Correo Electrónico:</Text>
        <Text style={styles.value}>{profile?.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  label: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
  },
  value: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#ff5252',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});