// app/test-qr.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import QRCodeGenerator from '@/components/QRCodeGenerator';

export default function TestQRScreen() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <QRCodeGenerator onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});