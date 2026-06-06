// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  fromRank: string;
  toId: string;
  toName: string;
  status: FriendRequestStatus;
  timestamp: string;
}

export interface FriendNotification {
  id: string;
  type: 'friend_request' | 'friend_accepted' | 'friend_rejected';
  fromId: string;
  fromName: string;
  fromAvatar: string;
  fromRank: string;
  toId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const FRIENDS_KEY = 'hawa_friends_v1';
const REQUESTS_KEY = 'hawa_friend_requests_v1';
const FRIEND_NOTIFS_KEY = 'hawa_friend_notifs_v1';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  try {
    const data = await AsyncStorage.getItem(REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function saveFriendRequests(requests: FriendRequest[]): Promise<void> {
  await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export async function getFriendNotifications(userId: string): Promise<FriendNotification[]> {
  try {
    const data = await AsyncStorage.getItem(`${FRIEND_NOTIFS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function addFriendNotification(userId: string, notif: FriendNotification): Promise<void> {
  const existing = await getFriendNotifications(userId);
  await AsyncStorage.setItem(`${FRIEND_NOTIFS_KEY}_${userId}`, JSON.stringify([notif, ...existing]));
}

export async function markFriendNotifsRead(userId: string): Promise<void> {
  const notifs = await getFriendNotifications(userId);
  const updated = notifs.map(n => ({ ...n, isRead: true }));
  await AsyncStorage.setItem(`${FRIEND_NOTIFS_KEY}_${userId}`, JSON.stringify(updated));
}

export async function getFriendsList(userId: string): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(`${FRIENDS_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

async function addFriend(userId1: string, userId2: string): Promise<void> {
  const list1 = await getFriendsList(userId1);
  const list2 = await getFriendsList(userId2);
  if (!list1.includes(userId2)) {
    await AsyncStorage.setItem(`${FRIENDS_KEY}_${userId1}`, JSON.stringify([...list1, userId2]));
  }
  if (!list2.includes(userId1)) {
    await AsyncStorage.setItem(`${FRIENDS_KEY}_${userId2}`, JSON.stringify([...list2, userId1]));
  }
}

async function removeFriend(userId1: string, userId2: string): Promise<void> {
  const list1 = (await getFriendsList(userId1)).filter(id => id !== userId2);
  const list2 = (await getFriendsList(userId2)).filter(id => id !== userId1);
  await AsyncStorage.setItem(`${FRIENDS_KEY}_${userId1}`, JSON.stringify(list1));
  await AsyncStorage.setItem(`${FRIENDS_KEY}_${userId2}`, JSON.stringify(list2));
}

export async function isFriend(userId1: string, userId2: string): Promise<boolean> {
  const list = await getFriendsList(userId1);
  return list.includes(userId2);
}

export async function sendFriendRequest(
  fromId: string,
  fromName: string,
  fromAvatar: string,
  fromRank: string,
  toId: string,
  toName: string
): Promise<{ success: boolean; error?: string }> {
  if (fromId === toId) return { success: false, error: 'لا يمكنك إرسال طلب لنفسك' };

  const alreadyFriends = await isFriend(fromId, toId);
  if (alreadyFriends) return { success: false, error: 'أنتما أصدقاء بالفعل' };

  const requests = await getFriendRequests();
  const existing = requests.find(r =>
    ((r.fromId === fromId && r.toId === toId) ||
     (r.fromId === toId && r.toId === fromId)) &&
    r.status === 'pending'
  );
  if (existing) return { success: false, error: 'طلب صداقة معلق بالفعل' };

  const req: FriendRequest = {
    id: generateId(),
    fromId, fromName, fromAvatar, fromRank, toId, toName,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };
  await saveFriendRequests([...requests, req]);

  // Add notification for recipient
  const notif: FriendNotification = {
    id: generateId(),
    type: 'friend_request',
    fromId, fromName, fromAvatar, fromRank, toId,
    message: `${fromName} أرسل لك طلب صداقة`,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  await addFriendNotification(toId, notif);

  return { success: true };
}

export async function respondToFriendRequest(
  requestId: string,
  accept: boolean,
  responderId: string,
  responderName: string,
  responderAvatar: string,
  responderRank: string
): Promise<{ success: boolean; error?: string }> {
  const requests = await getFriendRequests();
  const reqIdx = requests.findIndex(r => r.id === requestId);
  if (reqIdx === -1) return { success: false, error: 'الطلب غير موجود' };

  const req = requests[reqIdx];
  if (req.toId !== responderId) return { success: false, error: 'ليس طلبك' };

  requests[reqIdx].status = accept ? 'accepted' : 'rejected';
  await saveFriendRequests(requests);

  if (accept) {
    await addFriend(req.fromId, req.toId);
    // Notify requester
    const notif: FriendNotification = {
      id: generateId(),
      type: 'friend_accepted',
      fromId: responderId, fromName: responderName,
      fromAvatar: responderAvatar, fromRank: responderRank,
      toId: req.fromId,
      message: `${responderName} قبل طلب صداقتك! 🎉`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    await addFriendNotification(req.fromId, notif);
  } else {
    const notif: FriendNotification = {
      id: generateId(),
      type: 'friend_rejected',
      fromId: responderId, fromName: responderName,
      fromAvatar: responderAvatar, fromRank: responderRank,
      toId: req.fromId,
      message: `${responderName} رفض طلب صداقتك`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    await addFriendNotification(req.fromId, notif);
  }

  return { success: true };
}

export async function removeFriendship(userId1: string, userId2: string): Promise<void> {
  await removeFriend(userId1, userId2);
}

export async function getPendingRequestsForUser(userId: string): Promise<FriendRequest[]> {
  const all = await getFriendRequests();
  return all.filter(r => r.toId === userId && r.status === 'pending');
}

export async function getUnreadFriendNotifCount(userId: string): Promise<number> {
  const notifs = await getFriendNotifications(userId);
  return notifs.filter(n => !n.isRead).length;
}
