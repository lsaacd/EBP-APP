import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function HymnsLayout() {
  const { isDarkMode } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDarkMode ? '#1a1a16' : '#fcf9f2',
        },
      }}
    >
      {/* Hymn detail — uses a subtle fade for the initial open.
          The 3D page-flip transition handles the between-hymn navigation.
          Gestures are disabled so that only the × button closes the modal;
          swiping left/down will NOT navigate back. */}
      <Stack.Screen
        name="[id]"
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
