import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../../services/supabase';
import { MembershipStatus } from '../../types/database.types';

// Interfaz para la consulta a la tabla memberships
interface MembershipQueryRow {
  status: MembershipStatus;
  end_date: string;
}

// Interfaz para el resultado del escaneo
interface ScanResult {
  memberName: string;
  status: MembershipStatus | 'none';
  endDate?: string;
  message: string;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>
          Se requiere permiso de la cámara para escanear accesos.
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={requestPermission}>
          <Text style={styles.actionButtonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Procesar la lectura del código QR
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      // 1. Buscar al socio por su qr_code_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('qr_code_id', data)
        .single<{ id: string; full_name: string }>();

      if (profileError || !profile) {
        setResult({
          memberName: 'Desconocido',
          status: 'none',
          message: 'Código QR no registrado en el sistema.',
        });
        return;
      }

      // 2. Verificar estado de membresía con retorno explícito
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('status, end_date')
        .eq('user_id', profile.id)
        .order('end_date', { ascending: false })
        .limit(1)
        .returns<MembershipQueryRow[]>();

      if (membershipError) throw membershipError;

      const latestMembership = memberships && memberships.length > 0 ? memberships[0] : null;
      const status: MembershipStatus | 'none' = latestMembership ? latestMembership.status : 'none';
      const endDate = latestMembership ? latestMembership.end_date : undefined;
      const isGranted = status === 'active';

      // 3. Registrar la asistencia en la tabla attendance con casteo explícito
      await supabase.from('attendance').insert({
        user_id: profile.id,
        access_granted: isGranted,
      } as any);

      setResult({
        memberName: profile.full_name,
        status,
        endDate,
        message: isGranted ? 'ACCESO CONCEDIDO' : 'ACCESO DENEGADO',
      });
    } catch (err: any) {
      console.error('Error al procesar acceso:', err);
      setResult({
        memberName: 'Error',
        status: 'none',
        message: 'Ocurrió un error al validar el código.',
      });
    } finally {
      setLoading(false);
    }
  };

  const closeResult = () => {
    setResult(null);
    setScanned(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Lector de Acceso 📷</Text>

      <View style={styles.cameraFrame}>
        <CameraView
          style={styles.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.overlayGuide} />
      </View>

      <Text style={styles.instructionText}>
        Apunta la cámara al código QR del carnet del socio
      </Text>

      {/* Modal de Validación de Acceso */}
      <Modal visible={!!result} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalCard,
              { borderColor: result?.status === 'active' ? '#00E676' : '#FF5252' },
            ]}
          >
            <Text
              style={[
                styles.statusTitle,
                { color: result?.status === 'active' ? '#00E676' : '#FF5252' },
              ]}
            >
              {result?.message}
            </Text>

            <Text style={styles.memberName}>{result?.memberName}</Text>

            <Text style={styles.statusDetail}>
              {result?.status === 'active'
                ? `Membresía Válida (Vence: ${result?.endDate})`
                : 'Membresía inactiva o con pago pendiente.'}
            </Text>

            <TouchableOpacity style={styles.modalButton} onPress={closeResult}>
              <Text style={styles.modalButtonText}>Escanear Siguiente</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00E676" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00E676',
    marginBottom: 20,
  },
  cameraFrame: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlayGuide: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#00E676',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: '#AAA',
    marginTop: 20,
    fontSize: 14,
    textAlign: 'center',
  },
  permissionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#00E676',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  memberName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusDetail: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});