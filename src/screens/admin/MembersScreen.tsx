import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';

interface Membership {
  id: string;
  status: string;
  end_date: string;
}

interface Member {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  created_at: string;
  memberships?: Membership[];
}

export default function MembersScreen() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  // Estado del Modal para registrar nuevo socio
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [membershipType, setMembershipType] = useState<string>('Mensual');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Obtener miembros de Supabase
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          role,
          created_at,
          memberships (
            id,
            status,
            end_date
          )
        `)
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar socios:', error.message);
      } else if (data) {
        setMembers(data as unknown as Member[]);
      }
    } catch (err: any) {
      console.error('Error al obtener lista de miembros:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Filtrado por texto y por estado
  useEffect(() => {
    let result = members;

    if (searchQuery.trim() !== '') {
      result = result.filter((m) =>
        m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter((m) => {
        const activeMembership = m.memberships?.find((mem) => mem.status === 'active');
        if (statusFilter === 'ACTIVE') {
          return activeMembership && activeMembership.end_date >= today;
        } else if (statusFilter === 'EXPIRED') {
          return !activeMembership || activeMembership.end_date < today;
        }
        return true;
      });
    }

    setFilteredMembers(result);
  }, [searchQuery, statusFilter, members]);

  // Helper para determinar estado de la membresía
  const getMembershipBadge = (member: Member) => {
    const activeMembership = member.memberships?.find((m) => m.status === 'active');
    if (!activeMembership) {
      return { label: 'Sin Membresía', color: '#ff5252' };
    }

    const today = new Date();
    const endDate = new Date(activeMembership.end_date);
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { label: 'Vencida', color: '#ff5252' };
    } else if (diffDays <= 3) {
      return { label: `Vence en ${diffDays}d`, color: '#FFB300' };
    } else {
      return { label: 'Activa', color: '#00E676' };
    }
  };

  // Filtrado por texto y estado
  useEffect(() => {
    let result = members;

    if (searchQuery.trim() !== '') {
      result = result.filter((m) =>
        m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter((m) => {
        const activeMembership = m.memberships?.find((mem) => mem.status === 'active');
        if (statusFilter === 'ACTIVE') {
          return activeMembership && activeMembership.end_date >= today;
        } else if (statusFilter === 'EXPIRED') {
          return !activeMembership || activeMembership.end_date < today;
        }
        return true;
      });
    }

    setFilteredMembers(result);
  }, [searchQuery, statusFilter, members]);

  // Función para registrar nuevo socio
  const handleRegisterMember = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa al menos Nombre, Email y Contraseña.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;

      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario recién creado.');
      }

      // 2. Calcular fechas y monto a pagar según el tipo de membresía
      const startDate = new Date();
      const endDate = new Date();
      let amountPaid = 0;

      if (membershipType === 'Trimestral') {
        endDate.setMonth(endDate.getMonth() + 3);
        amountPaid = 1200; // Ajusta el precio de tu plan trimestral aquí
      } else if (membershipType === 'Anual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
        amountPaid = 4000; // Ajusta el precio de tu plan anual aquí
      } else {
        // Mensual por defecto
        endDate.setMonth(endDate.getMonth() + 1);
        amountPaid = 450;  // Ajusta el precio de tu plan mensual aquí
      }

      // Esperar 500ms para asegurar que el trigger de profiles haya corrido en la BD
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3. Insertar la membresía incluyendo "amount_paid"
      const { error: membershipError } = await supabase.from('memberships').insert({
        user_id: userId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active',
        amount_paid: amountPaid,
      } as any);

      if (membershipError) {
        console.error('Error al insertar membresía:', membershipError.message);
        Alert.alert(
          'Socio Creado',
          `El socio se creó correctamente pero falló al activar la membresía: ${membershipError.message}`
        );
      } else {
        Alert.alert('¡Éxito!', `Socio registrado con membresía ${membershipType} activa.`);
      }

      setModalVisible(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      fetchMembers();
    } catch (err: any) {
      console.error('Error general:', err);
      Alert.alert('Error al registrar socio', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Socios 👥</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={20} color="#000" />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar socio por nombre..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros por Estado */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setStatusFilter('ALL')}
        >
          <Text style={[styles.filterText, statusFilter === 'ALL' && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'ACTIVE' && styles.filterChipActive]}
          onPress={() => setStatusFilter('ACTIVE')}
        >
          <Text style={[styles.filterText, statusFilter === 'ACTIVE' && styles.filterTextActive]}>Activos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'EXPIRED' && styles.filterChipActive]}
          onPress={() => setStatusFilter('EXPIRED')}
        >
          <Text style={[styles.filterText, statusFilter === 'EXPIRED' && styles.filterTextActive]}>Vencidos</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Socios */}
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#00E676" />
        </View>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const badge = getMembershipBadge(item);
            const activeMembership = item.memberships?.find((m) => m.status === 'active');

            return (
              <View style={styles.memberCard}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.full_name || 'Sin Nombre'}</Text>
                  {item.phone && <Text style={styles.memberPhone}>📞 {item.phone}</Text>}
                  <Text style={styles.memberDate}>
                    Vence:{' '}
                    <Text style={{ fontWeight: 'bold', color: '#FFF' }}>
                      {activeMembership ? activeMembership.end_date : 'N/A'}
                    </Text>
                  </Text>
                </View>

                <View style={[styles.badge, { backgroundColor: badge.color + '22', borderColor: badge.color }]}>
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron socios.</Text>
          }
        />
      )}

      {/* Modal para Nuevo Socio */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Nuevo Socio 📝</Text>

            <Text style={styles.inputLabel}>Nombre Completo *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej. Carlos Mendoza"
              placeholderTextColor="#666"
              value={fullName}
              onChangeText={setFullName}
            />

            <Text style={styles.inputLabel}>Correo Electrónico *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="socio@ejemplo.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputLabel}>Contraseña *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="+52 555 123 4567"
              placeholderTextColor="#666"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.inputLabel}>Tipo de Membresía Inicial</Text>
            <View style={styles.typeSelector}>
              {['Mensual', 'Trimestral', 'Anual'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, membershipType === type && styles.typeOptionSelected]}
                  onPress={() => setMembershipType(type)}
                >
                  <Text
                    style={[styles.typeOptionText, membershipType === type && styles.typeOptionTextSelected]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleRegisterMember}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00E676',
  },
  addButton: {
    backgroundColor: '#00E676',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#00E676',
  },
  filterText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberPhone: {
    color: '#AAA',
    fontSize: 13,
    marginBottom: 4,
  },
  memberDate: {
    color: '#888',
    fontSize: 12,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 16,
  },
  inputLabel: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#121212',
    color: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    backgroundColor: '#121212',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  typeOptionSelected: {
    borderColor: '#00E676',
    backgroundColor: '#00E67622',
  },
  typeOptionText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  typeOptionTextSelected: {
    color: '#00E676',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#888',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#00E676',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});