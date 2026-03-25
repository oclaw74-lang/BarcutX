import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(barber)" />
      <Stack.Screen name="barberia/[slug]" />
      <Stack.Screen name="cola/[barberCode]" />
    </Stack>
  )
}
