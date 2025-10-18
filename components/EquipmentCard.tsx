// src/components/EquipmentCard.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Define props interface
interface EquipmentCardProps {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in_use' | 'broken';
  hasMalfunction?: boolean;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  id,
  name,
  type,
  status,
  hasMalfunction = false,
}) => {
  const router = useRouter();
  
  // Get the appropriate icon based on equipment type
  const getEquipmentIcon = () => {
    switch (type.toLowerCase()) {
      case 'cardio': return '🏃‍♀️';
      case 'strength': return '🏋️';
      case 'yoga': return '🧘';
      case 'meditation': return '🧠';
      default: return '⚙️';
    }
  };

  // Get border color based on status and malfunction
  const getBorderColor = () => {
    if (status === 'broken') return '#2c3e50'; // Dark grey
    if (hasMalfunction) return '#e74c3c'; // Red
    if (status === 'in_use') return '#f1c40f'; // Yellow
    return '#2ecc71'; // Green
  };

  // Get status text
  const getStatusText = () => {
    if (status === 'broken') return 'BROKEN';
    if (status === 'in_use') return 'IN USE';
    return 'AVAILABLE';
  };

  // Get status color
  const getStatusColor = () => {
    if (status === 'broken') return '#2c3e50';
    if (status === 'in_use') return '#f1c40f';
    return '#2ecc71';
  };
  
  // Handle card press
  const handlePress = () => {
    if (status === 'available' && !hasMalfunction) {
      // Navigate to equipment listing page
      router.push('/equipment/index' as any);
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        { 
          borderLeftColor: getBorderColor(),
          opacity: status === 'broken' ? 0.5 : (status === 'in_use' ? 0.8 : 1)
        }
      ]}
      onPress={handlePress}
      disabled={status === 'broken' || status === 'in_use'}
      activeOpacity={status === 'available' && !hasMalfunction ? 0.7 : 1}
    >
      <View style={styles.headerRow}>
        <Text style={styles.typeLabel}>{type.toUpperCase()}</Text>
        {hasMalfunction && status !== 'broken' && (
          <View style={styles.malfunctionBadge}>
            <Text style={styles.malfunctionIcon}>ℹ️</Text>
            <Text style={styles.malfunctionText}>Reported as malfunctioning</Text>
          </View>
        )}
      </View>
      <Text style={styles.name}>{name}</Text>
      
      <Text style={styles.icon}>{getEquipmentIcon()}</Text>
      
      <Text style={[
        styles.status,
        { color: getStatusColor() }
      ]}>
        {getStatusText()}
      </Text>
      
      <Text style={styles.actionText}>
        {status === 'broken' 
          ? 'Out of service' 
          : status === 'available' 
            ? (hasMalfunction ? 'Has malfunction - use with caution' : 'Tap to start session')
            : 'Available soon'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    height: 220,
    borderLeftWidth: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  malfunctionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  malfunctionIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  malfunctionText: {
    fontSize: 10,
    color: '#e74c3c',
    fontWeight: '600',
  },
  typeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    marginVertical: 8,
  },
  status: {
    fontWeight: 'bold',
    marginVertical: 8,
    fontSize: 14,
  },
  actionText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 'auto',
    textAlign: 'center',
  },
});

export default EquipmentCard;