export interface FriendsScreenProps {
  privacySheetOpen: boolean;
  onPrivacySheetOpenChange: (open: boolean) => void;
  onOpenChurchesMap: () => void;
  onOpenHymn: (hymnId: string) => void;
  onOpenMember: (memberId: string) => void;
}

export default function FriendsScreen(_props: FriendsScreenProps) {
  return null;
}
