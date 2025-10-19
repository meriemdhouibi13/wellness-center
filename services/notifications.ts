// services/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the push token for the device
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Send a local notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
  }
}

/**
 * Schedule a notification for later
 */
export async function scheduleNotification(
  title: string,
  body: string,
  secondsFromNow: number,
  data?: any
): Promise<string> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
      },
    });
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Set up notification categories for interactive notifications
 */
export async function setupNotificationCategories(): Promise<void> {
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('waitlist', [
      {
        identifier: 'claim',
        buttonTitle: 'Claim Now',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Later',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  }
}