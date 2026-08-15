import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../services/supabase';
import { MembershipStatus } from '../../types/database.types';

// Definimos la interfaz estricta de la membresía para evitar errores de tipo
interface MembershipQueryRow {
  status: MembershipStatus;
  end_date: string;
  membership_type_id: string | null;
}

interface MemberData {
  full_name: string;
  qr_code_id: string;
  membership_status: MembershipStatus | 'none';
  end_date?: string;
}

export default function PassQRScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [memberData, setMemberData] = useState<MemberData | null>(null);

  // Consultar perfil y estado de la membresía activa en Supabase
  const fetchMemberPass = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Consultar el perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, qr_code_id')
        .eq('id', user.id)
        .single<{ full_name: string; qr_code_id: string }>();

      if (profileError) throw profileError;

      // 2. Consultar la membresía asignando el tipo genérico explícito
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('status, end_date, membership_type_id')
        .eq('user_id', user.id)
        .order('end_date', { ascending: false })
        .limit(1)
        .returns<MembershipQueryRow[]>(); // 👈 Esto le enseña a TS la estructura exacta

      if (membershipError) throw membershipError;

      const latestMembership = memberships && memberships.length > 0 ? memberships[0] : null;

      setMemberData({
        full_name: profile.full_name,
        qr_code_id: profile.qr_code_id,
        membership_status: latestMembership ? latestMembership.status : 'none',
        end_date: latestMembership ? latestMembership.end_date : undefined,
      });
    } catch (error: any) {
      console.error('Error al cargar carnet:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemberPass();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemberPass();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00E676" />
      </View>
    );
  }

  const isStatusActive = memberData?.membership_status === 'active';

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E676" />
      }
    >
      <Text style={styles.headerTitle}>Carnet Digital 💳</Text>

      {/* Tarjeta del Pase / Carnet */}
      <View style={styles.card}>
        <Text style={styles.memberName}>{memberData?.full_name || 'Socio GymFlow'}</Text>

        {/* Semáforo de Estado de Membresía */}
        <View
          style={[
            styles.badge,
            { backgroundColor: isStatusActive ? '#1b5e20' : '#b71c1c' },
          ]}
        >
          <Text style={[styles.badgeText, { color: isStatusActive ? '#66bb6a' : '#ef5350' }]}>
            {isStatusActive ? '● MEMBRESÍA ACTIVA' : '● MEMBRESÍA VENCIDA / INACTIVA'}
          </Text>
        </View>

        {/* Generación del Código QR */}
        <View style={styles.qrContainer}>
          {memberData?.qr_code_id ? (
            <QRCode
              value={memberData.qr_code_id}
              size={200}
              color="#000000"
              backgroundColor="#FFFFFF"
            />
          ) : (
            <Text style={{ color: '#888' }}>Código QR no asignado</Text>
          )}
        </View>

        {/* Detalle de Vencimiento */}
        <Text style={styles.dateLabel}>
          {isStatusActive
            ? `Vence el: ${memberData?.end_date || 'N/A'}`
            : 'Por favor, acércate a recepción a renovar tu pago.'}
        </Text>
      </View>

      {/* Botón de Cierre de Sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
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
    flexGrow: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1E1E1E',
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  memberName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  dateLabel: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff5252',
  },
  logoutText: {
    color: '#ff5252',
    fontSize: 14,
    fontWeight: 'bold',
  },
});