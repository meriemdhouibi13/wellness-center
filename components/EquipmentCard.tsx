// src/components/EquipmentCard.tsx
import { useAuth } from '@/contexts/AuthContext';
import type { WaitlistEntry } from '@/services/types';
import { getUserWaitlistEntry, joinWaitlist, leaveWaitlist } from '@/services/waitlist';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Define props interface
interface EquipmentCardProps {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in_use' | 'broken';
  hasMalfunction?: boolean;
  waitlistCount?: number;
  onWaitlistChange?: () => void;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  id,
  name,
  type,
  status,
  hasMalfunction = false,
  waitlistCount = 0,
  onWaitlistChange,
}) => {
  const router = useRouter();
  
  // Try to get user, but don't fail if AuthProvider isn't available
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    // Auth not available, user features will be disabled
  }
  
  const [myWaitlistEntry, setMyWaitlistEntry] = useState<WaitlistEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user is on waitlist for this equipment
  useEffect(() => {
    if (user?.uid && status === 'in_use') {
      getUserWaitlistEntry(id, user.uid)
        .then(setMyWaitlistEntry)
        .catch(console.error);
    }
  }, [id, user?.uid, status]);
  
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
  
  // Handle joining waitlist
  const handleJoinWaitlist = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to join the waitlist');
      return;
    }
    
    setIsLoading(true);
    try {
      const entry = await joinWaitlist(id, user.uid, user.displayName || 'User');
      setMyWaitlistEntry(entry);
      Alert.alert(
        'Joined Waitlist!',
        `You're #${entry.position} in line for ${name}`
      );
      onWaitlistChange?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join waitlist');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle leaving waitlist
  const handleLeaveWaitlist = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await leaveWaitlist(id, user.uid);
      setMyWaitlistEntry(null);
      Alert.alert('Left Waitlist', 'You have been removed from the waitlist');
      onWaitlistChange?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to leave waitlist');
    } finally {
      setIsLoading(false);
    }
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
      
      {/* Waitlist Info */}
      {status === 'in_use' && waitlistCount > 0 && (
        <View style={styles.waitlistInfo}>
          <Text style={styles.waitlistIcon}>👥</Text>
          <Text style={styles.waitlistText}>
            {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} waiting
          </Text>
        </View>
      )}
      
      {/* Show user's position if on waitlist */}
      {myWaitlistEntry && (
        <View style={styles.myPositionBadge}>
          <Text style={styles.myPositionText}>
            You&apos;re #{myWaitlistEntry.position} in line
          </Text>
        </View>
      )}
      
      {/* Waitlist Button */}
      {status === 'in_use' && user && (
        <TouchableOpacity
          style={[
            styles.waitlistButton,
            myWaitlistEntry && styles.waitlistButtonLeave,
            isLoading && styles.waitlistButtonDisabled
          ]}
          onPress={myWaitlistEntry ? handleLeaveWaitlist : handleJoinWaitlist}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.waitlistButtonText}>
              {myWaitlistEntry ? 'Leave Waitlist' : 'Join Waitlist'}
            </Text>
          )}
        </TouchableOpacity>
      )}
      
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
  waitlistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  waitlistIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  waitlistText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  myPositionBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  myPositionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  waitlistButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  waitlistButtonLeave: {
    backgroundColor: '#e74c3c',
  },
  waitlistButtonDisabled: {
    opacity: 0.6,
  },
  waitlistButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default EquipmentCard;