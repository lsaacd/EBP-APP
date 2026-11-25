import type { NotificationDestination } from '../../utils/notifications';

export interface NotificationsScreenProps {
  prefsSheetOpen: boolean;
  onPrefsSheetOpenChange: (open: boolean) => void;
  onNavigate?: (destination: NotificationDestination) => void;
}

export default function NotificationsScreen(_props: NotificationsScreenProps) {
  return null;
}
