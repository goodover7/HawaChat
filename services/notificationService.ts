// Powered by OnSpace.AI
// Comprehensive notification service with sound support
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playMessageSound, playFriendRequestSound, playReportAlertSound } from '@/services/soundService';

export interface AppNotification {
  id: string;
  userId: string;
  type:
    | 'friend_request'
    | 'friend_accepted'
    | 'friend_rejected'
    | 'private_message'
    | 'report_received'
    | 'report_resolved'
    | 'mute_lifted'
    | 'ban_lifted'
    | 'news_published'
    | 'gift_received'
    | 'warning'
    | 'rank_changed'
    | 'level_changed';
  title: string;
  body: string;
  emoji: string;
  isRead: boolean;
  timestamp: string;
  meta?: {
    targetUserId?: string;
    reportId?: string;
    messageText?: string;
    reportedUserId?: string;
    newsId?: string;
    fromUserId?: string;
  };
}

const NOTIF_KEY = 'hawa_notifications_v2';

async function getAllNotifications(): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveAll(notifs: AppNotification[]): Promise<void> {
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, 300)));
}

async function addNotification(
  notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>,
  playSound?: boolean
): Promise<void> {
  const all = await getAllNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  await saveAll([newNotif, ...all]);

  // Play sound for specific types
  if (playSound !== false) {
    try {
      if (notif.type === 'report_received' || notif.type === 'warning') {
        await playReportAlertSound();
      } else if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
        await playFriendRequestSound();
      } else if (notif.type === 'private_message') {
        await playMessageSound();
      } else if (notif.type === 'gift_received' || notif.type === 'rank_changed' || notif.type === 'mute_lifted' || notif.type === 'ban_lifted') {
        await playMessageSound();
      } else if (notif.type === 'news_published') {
        await playMessageSound();
      }
    } catch {
      // Sound failure is non-critical
    }
  }
}

export async function getNotificationsForUser(userId: string): Promise<AppNotification[]> {
  const all = await getAllNotifications();
  return all.filter(n => n.userId === userId).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function getUnreadCount(userId: string): Promise<number> {
  const all = await getAllNotifications();
  return all.filter(n => n.userId === userId && !n.isRead).length;
}

export async function markAsRead(notifId: string): Promise<void> {
  const all = await getAllNotifications();
  const idx = all.findIndex(n => n.id === notifId);
  if (idx !== -1) { all[idx].isRead = true; await saveAll(all); }
}

export async function markAllRead(userId: string): Promise<void> {
  const all = await getAllNotifications();
  const updated = all.map(n => n.userId === userId ? { ...n, isRead: true } : n);
  await saveAll(updated);
}

export async function deleteNotification(notifId: string): Promise<void> {
  const all = await getAllNotifications();
  await saveAll(all.filter(n => n.id !== notifId));
}

export async function clearAllForUser(userId: string): Promise<void> {
  const all = await getAllNotifications();
  await saveAll(all.filter(n => n.userId !== userId));
}

// ─── Typed helpers ─────────────────────────────────────────────────────────

export async function notifyMuteLifted(userId: string): Promise<void> {
  await addNotification({
    userId, type: 'mute_lifted',
    title: 'تم رفع الكتم 🔊',
    body: 'يمكنك الآن إرسال الرسائل في الدردشة',
    emoji: '🔊',
  });
}

export async function notifyBanLifted(userId: string): Promise<void> {
  await addNotification({
    userId, type: 'ban_lifted',
    title: 'تم رفع الحظر ✅',
    body: 'تم رفع الحظر عن حسابك، يمكنك تسجيل الدخول الآن',
    emoji: '✅',
  });
}

export async function notifyWarning(userId: string, message: string): Promise<void> {
  await addNotification({
    userId, type: 'warning',
    title: '⚠️ تحذير من الإدارة',
    body: message,
    emoji: '⚠️',
  });
}

export async function notifyRankChanged(userId: string, newRank: string, changedBy: string): Promise<void> {
  await addNotification({
    userId, type: 'rank_changed',
    title: '🎖️ تغيرت رتبتك',
    body: `تم تغيير رتبتك إلى "${newRank}" بواسطة ${changedBy}`,
    emoji: '🎖️',
  });
}

export async function notifyGiftReceived(userId: string, fromName: string, giftName: string, giftEmoji: string): Promise<void> {
  await addNotification({
    userId, type: 'gift_received',
    title: `${giftEmoji} هدية من ${fromName}`,
    body: `أرسل لك ${fromName} هدية: ${giftName}`,
    emoji: giftEmoji,
  });
}

export async function notifyFriendRequest(userId: string, fromName: string, fromUserId: string): Promise<void> {
  await addNotification({
    userId, type: 'friend_request',
    title: '👥 طلب صداقة جديد',
    body: `${fromName} يريد إضافتك كصديق`,
    emoji: '👥',
    meta: { fromUserId },
  });
}

export async function notifyFriendAccepted(userId: string, fromName: string, fromUserId: string): Promise<void> {
  await addNotification({
    userId, type: 'friend_accepted',
    title: '🎉 قبول طلب الصداقة',
    body: `${fromName} قبل طلب صداقتك! أنتما الآن أصدقاء`,
    emoji: '🎉',
    meta: { fromUserId },
  });
}

export async function notifyPrivateMessage(
  userId: string,
  fromName: string,
  fromUserId: string,
  messagePreview: string
): Promise<void> {
  await addNotification({
    userId, type: 'private_message',
    title: `💬 رسالة من ${fromName}`,
    body: messagePreview.length > 60 ? messagePreview.substring(0, 60) + '...' : messagePreview,
    emoji: '💬',
    meta: { fromUserId },
  });
}

export async function notifyNewsPublished(
  allUserIds: string[],
  authorName: string,
  newsTitle: string,
  newsEmoji: string,
  newsId: string
): Promise<void> {
  const all = await getAllNotifications();
  const newNotifs: AppNotification[] = allUserIds.map(userId => ({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2) + userId,
    userId,
    type: 'news_published' as const,
    title: `${newsEmoji} خبر جديد من ${authorName}`,
    body: newsTitle,
    emoji: newsEmoji,
    isRead: false,
    timestamp: new Date().toISOString(),
    meta: { newsId },
  }));
  await saveAll([...newNotifs, ...all]);
  // Play sound once (not per user)
  try { await playMessageSound(); } catch {}
}

export async function notifyReportReceived(
  modUserIds: string[],
  reporterName: string,
  reportedUserName: string,
  reportedUserId: string,
  messageText: string,
  reportId: string
): Promise<void> {
  const all = await getAllNotifications();
  const newNotifs: AppNotification[] = modUserIds.map(userId => ({
    id: Date.now().toString(36) + Math.random().toString(36).substr(2) + userId,
    userId,
    type: 'report_received' as const,
    title: `🚨 بلاغ جديد ضد ${reportedUserName}`,
    body: `${reporterName} أبلغ عن: "${messageText.substring(0, 50)}"`,
    emoji: '🚨',
    isRead: false,
    timestamp: new Date().toISOString(),
    meta: { reportedUserId, messageText, reportId },
  }));
  await saveAll([...newNotifs, ...all]);
  try { await playReportAlertSound(); } catch {}
}
