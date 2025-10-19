// app/scan.tsx
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import barcode scanner only on native platforms
let BarCodeScanner: any = null;
if (Platform.OS !== 'web') {
  try {
    // Static import instead of dynamic to avoid race conditions
    BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
  } catch (error) {
    console.error('Error loading barcode scanner:', error);
  }
}

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Request camera permissions when component mounts
  useEffect(() => {
    // Only request permissions on native platforms
    if (Platform.OS !== 'web' && BarCodeScanner) {
      const getBarCodeScannerPermissions = async () => {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
          console.error('Error requesting camera permission:', error);
          setError('Failed to request camera permissions');
          setHasPermission(false);
        }
      };
      getBarCodeScannerPermissions();
    }
  }, []);

  // Handle QR code scan
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    try {
      console.log('QR code scanned:', { type, data });
      setScanned(true);
      
      // Check if the scanned data is an equipment ID
      if (data && data.startsWith('equipment:')) {
        const equipmentId = data.replace('equipment:', '');
        // Use setTimeout to ensure state update completes before navigation
        setTimeout(() => {
          // Navigate to the equipment details screen
          router.push(`/equipment/${equipmentId}`);
        }, 100);
      } else {
        // Handle invalid QR code
        setTimeout(() => {
          alert(`Invalid QR code. Please scan a valid equipment QR code.`);
        }, 100);
      }
    } catch (error) {
      console.error('Error handling scanned code:', error);
      setTimeout(() => {
        alert('Error processing QR code. Please try again.');
      }, 100);
    }
  };

  // Web-specific rendering
  if (Platform.OS === 'web') {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText type="title">Scanner</ThemedText>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.webMessage}>
          <ThemedText type="defaultSemiBold" style={styles.webText}>
            QR/Barcode scanning is not available on web
          </ThemedText>
          <ThemedText style={styles.webSubText}>
            Please use the mobile app to scan equipment QR codes
          </ThemedText>
          
          <TouchableOpacity 
            style={styles.backToHomeButton} 
            onPress={() => router.push('/')}
          >
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              Back to Home
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Handle permissions and states for native
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false || error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <Text style={styles.permissionText}>No access to camera</Text>
        <Text style={styles.permissionSubtext}>
          {error || 'Camera permission is required to scan QR codes.'}
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => {
            if (BarCodeScanner) {
              try {
                BarCodeScanner.requestPermissionsAsync()
                  .then(({status}) => {
                    setHasPermission(status === 'granted');
                    if (status === 'granted') {
                      setError(null);
                    }
                  })
                  .catch(err => {
                    console.error('Error requesting permissions:', err);
                    setError('Failed to request camera permissions');
                  });
              } catch (err) {
                console.error('Error requesting permissions:', err);
                setError('Failed to request camera permissions');
              }
            }
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Scan QR Code</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.scannerContainer}>
        {BarCodeScanner ? (
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
          />
        ) : (
          <View style={[styles.scanner, {justifyContent: 'center', alignItems: 'center', backgroundColor: '#000'}]}>
            <Text style={{color: '#fff'}}>Camera not available</Text>
          </View>
        )}
        
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <ThemedText style={styles.scannerText}>
            Align QR code within the frame
          </ThemedText>
        </View>
      </View>

      {scanned && (
        <TouchableOpacity 
          style={styles.scanAgainButton} 
          onPress={() => setScanned(false)}
        >
          <Text style={styles.scanAgainButtonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 32, // Balance with back button
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBox: {
    width: 250,
    height: 250,
    borderRadius: 12,
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#ffffff',
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#ffffff',
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#ffffff',
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#ffffff',
    borderBottomRightRadius: 12,
  },
  scannerText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  // Web-specific styles
  webMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  webSubText: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  backToHomeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    borderRadius: 20,
  },
  scanAgainButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  scanAgainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  permissionButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});