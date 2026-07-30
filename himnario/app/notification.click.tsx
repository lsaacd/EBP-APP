import { Redirect } from 'expo-router';

/**
 * When the user taps the Android media notification while the app is closed,
 * react-native-track-player automatically fires the deep link:
 * el-buen-pastor-himnario://notification.click
 * 
 * Expo Router immediately tries to route to `/notification.click`. 
 * This file catches that specific route and redirects to the home tab,
 * NOT the index (splash) screen.
 */
export default function NotificationClick() {
  return <Redirect href="/(tabs)/home" />;
}
