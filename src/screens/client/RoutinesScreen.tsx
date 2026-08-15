import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function RoutinesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mis Rutinas 🏋️‍♂️</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Día 1: Pecho y Tríceps</Text>
        <Text style={styles.cardDetail}>• Press de Banca - 4x10</Text>
        <Text style={styles.cardDetail}>• Press Inclinado con Mancuernas - 3x12</Text>
        <Text style={styles.cardDetail}>• Fondos en Paralelas - 3x10</Text>
        <Text style={styles.cardDetail}>• Extensión de Tríceps en Polea - 4x12</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Día 2: Espalda y Bíceps</Text>
        <Text style={styles.cardDetail}>• Dominadas - 4x8</Text>
        <Text style={styles.cardDetail}>• Remo con Barra - 4x10</Text>
        <Text style={styles.cardDetail}>• Jalón al Pecho - 3x12</Text>
        <Text style={styles.cardDetail}>• Curl de Bíceps con Barra Z - 4x10</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  cardDetail: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 6,
  },
});