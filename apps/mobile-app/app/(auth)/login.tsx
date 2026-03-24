import { View, Text } from 'react-native'

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F1115', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#E56A2E', fontSize: 32, fontWeight: 'bold' }}>BarcutX</Text>
      <Text style={{ color: '#9CA3AF', marginTop: 8 }}>Tu fade, sin fila.</Text>
    </View>
  )
}
