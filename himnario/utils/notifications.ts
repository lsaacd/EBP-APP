/**
 * Notifications ("Notificaciones") — pure parsing and routing helpers.
 * No React or native dependencies so they can be tested directly in Node.
 */

export type NotificationType =
  | 'comment_like'
  | 'comment_reply'
  | 'friend_request'
  | 'friend_accepted'
  | 'shared_playlist';

export type AppNotification = {
  id: string;
  actorId: string | null;
  actorName: string;
  actorInitials: string;
  type: NotificationType;
  targetId: string;
  contextId: string | null;
  preview: string | null;
  createdAt: number;
  read: boolean;
};

export type NotificationDestination =
  | { kind: 'friends' }
  | { kind: 'hymn'; hymnId: string }
  | { kind: 'home' };

const VALID_TYPES = new Set<string>([
  'comment_like',
  'comment_reply',
  'friend_request',
  'friend_accepted',
  'shared_playlist',
]);

export function parseNotificationsPayload(payload: unknown): {
  notifications: AppNotification[];
  unreadCount: number;
} {
  const data = (payload ?? {}) as Record<string, unknown>;
  const rawList = Array.isArray(data.notifications) ? data.notifications : [];
  const notifications: AppNotification[] = [];
  for (const row of rawList) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    if (
      typeof item.id !== 'string' ||
      typeof item.type !== 'string' ||
      !VALID_TYPES.has(item.type) ||
      typeof item.targetId !== 'string'
    ) {
      continue;
    }
    notifications.push({
      id: item.id,
      actorId: typeof item.actorId === 'string' ? item.actorId : null,
      actorName: typeof item.actorName === 'string' && item.actorName ? item.actorName : 'Miembro',
      actorInitials: typeof item.actorInitials === 'string' ? item.actorInitials : '—',
      type: item.type as NotificationType,
      targetId: item.targetId,
      contextId: typeof item.contextId === 'string' ? item.contextId : null,
      preview: typeof item.preview === 'string' ? item.preview : null,
      createdAt:
        typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : 0,
      read: item.read === true,
    });
  }
  const computedUnread = notifications.reduce((acc, item) => acc + (item.read ? 0 : 1), 0);
  const unreadCount =
    typeof data.unreadCount === 'number' &&
    Number.isSafeInteger(data.unreadCount) &&
    data.unreadCount >= 0
      ? data.unreadCount
      : computedUnread;
  return { notifications, unreadCount };
}

/** Converts a discussion contextId like "hymn-315-a" or "hymn-e12" back to its hymnal ID. */
export function hymnIdFromContext(contextId: string | null | undefined): string | null {
  if (typeof contextId !== 'string' || !contextId.startsWith('hymn-')) return null;
  const slug = contextId.slice(5).trim();
  if (!slug) return null;
  const chorus = /^e(\d+)$/i.exec(slug);
  if (chorus) return `E${chorus[1]}`;
  const ab = /^(\d+)-([ab])$/i.exec(slug);
  if (ab) return `${ab[1]} ${ab[2].toUpperCase()}`;
  const num = /^(\d+)$/.exec(slug);
  if (num) return num[1];
  return slug;
}

/** Maps a notification (in-app row or push data payload) to its screen destination. */
export function parseNotificationDestination(
  input: { type?: unknown; contextId?: unknown } | null | undefined,
): NotificationDestination | null {
  if (!input || typeof input.type !== 'string' || !VALID_TYPES.has(input.type)) return null;
  if (
    input.type === 'friend_request' ||
    input.type === 'friend_accepted' ||
    input.type === 'shared_playlist'
  ) {
    return { kind: 'friends' };
  }
  const hymnId = hymnIdFromContext(
    typeof input.contextId === 'string' ? input.contextId : null,
  );
  if (hymnId) return { kind: 'hymn', hymnId };
  return { kind: 'home' };
}
