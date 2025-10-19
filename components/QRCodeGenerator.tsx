// components/QRCodeGenerator.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

interface QRCodeGeneratorProps {
  onClose: () => void;
}

export default function QRCodeGenerator({ onClose }: QRCodeGeneratorProps) {
  const [equipmentId, setEquipmentId] = useState('1');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const generateQRCode = () => {
    if (!equipmentId) return;
    
    // Create the data for the QR code (equipment:123)
    const qrData = `equipment:${equipmentId}`;
    
    // Use a public QR code API to generate the QR code image
    // URL encoded for safety
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    setQrCodeUrl(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test QR Code Generator</Text>
      
      <TextInput
        style={styles.input}
        value={equipmentId}
        onChangeText={setEquipmentId}
        placeholder="Enter equipment ID (e.g. 1, 2, 3)"
        keyboardType="numeric"
      />
      
      <TouchableOpacity style={styles.generateButton} onPress={generateQRCode}>
        <Text style={styles.buttonText}>Generate QR Code</Text>
      </TouchableOpacity>
      
      {qrCodeUrl && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrText}>QR Code for: equipment:{equipmentId}</Text>
          <Text style={styles.qrSubText}>Scan this with your app</Text>
          <Image source={{ uri: qrCodeUrl }} style={styles.qrCode} />
        </View>
      )}
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  generateButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  qrText: {
    fontSize: 16,
    marginBottom: 5,
  },
  qrSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  closeText: {
    color: '#0a7ea4',
    fontSize: 16,
  },
});