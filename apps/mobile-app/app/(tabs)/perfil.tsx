import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/lib/useAuth'
import { supabase } from '../../src/lib/supabase'

export default function PerfilScreen() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const handleSignOut = async () => {
    Alert.alert('Cerrar sesion', '¿Seguro que quieres cerrar sesion?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesion',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut()
          if (error) {
            Alert.alert('Error', 'No se pudo cerrar la sesion. Intenta de nuevo.')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D97706" />
        </View>
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthContainer}>
          <Text style={styles.logoText}>BarcutX</Text>
          <Text style={styles.unauthTitle}>Tu cuenta</Text>
          <Text style={styles.unauthSubtitle}>
            Inicia sesion para gestionar tus turnos y preferencias
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Iniciar sesion</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const displayName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Usuario'
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proximas citas</Text>
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No tienes citas proximas</Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
            <Text style={styles.dangerButtonText}>Cerrar sesion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unauthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  logoText: {
    color: '#D97706',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  unauthTitle: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '600',
  },
  unauthSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#111111',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  secondaryButtonText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 4,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInitial: {
    color: '#111111',
    fontSize: 32,
    fontWeight: '700',
  },
  displayName: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '600',
  },
  email: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptySection: {
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  emptySectionText: {
    color: '#6B7280',
    fontSize: 13,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginTop: 32,
  },
  dangerButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#3B1212',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  dangerButtonText: {
    color: '#FCA5A5',
    fontWeight: '600',
    fontSize: 15,
  },
})
