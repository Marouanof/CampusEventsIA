import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: newStatus } = await Notifications.requestPermissionsAsync();
  return newStatus === 'granted';
}

export async function scheduleEventReminder(event) {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const eventDate = new Date(event.startDateTime);
    const reminderDate = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);

    if (reminderDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rappel événement',
        body: `${event.title} commence dans 2 heures · ${event.locationName}`,
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    return id;
  } catch {
    return null;
  }
}

export async function cancelEventReminder(notificationId) {
  try {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  } catch {
    // ignore
  }
}


