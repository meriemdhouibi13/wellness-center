// src/components/EquipmentCard.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

// Define props interface
interface EquipmentCardProps {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in_use';
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  id,
  name,
  type,
  status,
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
  
  // Handle card press
  const handlePress = () => {
    // Navigate to equipment detail page
    router.push(`/equipment/${id}`);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        status === 'available' ? styles.availableCard : styles.inUseCard
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text style={styles.typeLabel}>{type.toUpperCase()}</Text>
      <Text style={styles.name}>{name}</Text>
      
      <Text style={styles.icon}>{getEquipmentIcon()}</Text>
      
      <Text style={[
        styles.status,
        status === 'available' ? styles.availableStatus : styles.inUseStatus
      ]}>
        {status === 'available' ? 'AVAILABLE' : 'IN USE'}
      </Text>
      
      <Text style={styles.actionText}>
        Tap for details
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
    height: 200,
  },
  availableCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  inUseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f1c40f',
    opacity: 0.8,
  },
  typeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textTransform: 'uppercase',
    marginBottom: 4,
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
  availableStatus: {
    color: '#2ecc71',
  },
  inUseStatus: {
    color: '#f1c40f',
  },
  actionText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 'auto',
  },
});

export default EquipmentCard;