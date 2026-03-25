import { Tabs } from 'expo-router'
import React from 'react'
import { Text } from 'react-native'

function TabIcon({ label, emoji }: { label: string; emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111111',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#D97706',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Explorar" emoji={focused ? '🔍' : '🔎'} />
          ),
        }}
      />
      <Tabs.Screen
        name="turnos"
        options={{
          title: 'Mis Turnos',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Mis Turnos" emoji={focused ? '📋' : '📄'} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Perfil" emoji={focused ? '👤' : '🧑'} />
          ),
        }}
      />
    </Tabs>
  )
}
