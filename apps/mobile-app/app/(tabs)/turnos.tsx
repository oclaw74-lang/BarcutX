import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'

export default function TurnosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Mis Turnos</Text>
        <Text style={styles.subtitle}>Aqui apareceran tus turnos activos</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
})
