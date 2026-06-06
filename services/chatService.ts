// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_ROOMS, BANNED_WORDS } from '@/constants/config';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRank: string;
  senderLevel: number;
  senderBadge: string | null;
  senderNameColor: string | null;
  senderFrame: string | null;
  senderCountry?: string;
  text: string;
  timestamp: string;
  replyTo: ChatMessage | null;
  isDeleted: boolean;
  isEdited: boolean;
  reactions: Record<string, string[]>;
  gift: string | null;
  violationFlag: boolean;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  replyTo: PrivateMessage | null;
  gift: string | null;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  moderators: string[];
  createdBy: string;
  isLocked: boolean;
  password: string | null;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  messageText: string;
  reason: string;
  timestamp: string;
  isResolved: boolean;
}

const MESSAGES_KEY = 'hawa_messages';
const PRIVATE_KEY = 'hawa_private';
const ROOMS_KEY = 'hawa_rooms';
const REPORTS_KEY = 'hawa_reports';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function checkBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

export async function getRooms(): Promise<ChatRoom[]> {
  try {
    const data = await AsyncStorage.getItem(ROOMS_KEY);
    if (!data) {
      const rooms: ChatRoom[] = DEFAULT_ROOMS.map(r => ({
        ...r,
        isDefault: r.isDefault || false,
        moderators: [],
        createdBy: 'owner_001',
        isLocked: false,
        password: null,
      }));
      await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
      return rooms;
    }
    const parsed: ChatRoom[] = JSON.parse(data);
    const migrated = parsed.map(r => ({
      ...r,
      isLocked: r.isLocked ?? false,
      password: r.password ?? null,
    }));
    return migrated;
  } catch {
    return [];
  }
}

export async function createRoom(name: string, description: string, createdBy: string): Promise<ChatRoom> {
  const rooms = await getRooms();
  const newRoom: ChatRoom = {
    id: generateId(),
    name,
    description,
    isDefault: false,
    moderators: [],
    createdBy,
    isLocked: false,
    password: null,
  };
  await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify([...rooms, newRoom]));
  return newRoom;
}

export async function updateRoom(roomId: string, updates: Partial<ChatRoom>): Promise<void> {
  const rooms = await getRooms();
  const idx = rooms.findIndex(r => r.id === roomId);
  if (idx !== -1) {
    rooms[idx] = { ...rooms[idx], ...updates };
    await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  }
}

export async function deleteRoom(roomId: string, requesterId: string, requesterRank: string): Promise<{ success: boolean; error?: string }> {
  if (requesterRank !== 'owner') {
    return { success: false, error: 'فقط المالك يمكنه حذف الغرف' };
  }
  const rooms = await getRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return { success: false, error: 'الغرفة غير موجودة' };
  if (room.isDefault) return { success: false, error: 'لا يمكن حذف الغرف الافتراضية' };
  const updated = rooms.filter(r => r.id !== roomId);
  await AsyncStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
  await AsyncStorage.removeItem(`${MESSAGES_KEY}_${roomId}`);
  return { success: true };
}

export async function lockRoom(
  roomId: string,
  requesterId: string,
  requesterRank: string,
  password: string | null
): Promise<{ success: boolean; error?: string }> {
  const canLock = ['owner', 'legend', 'admin', 'guardian', 'moderator'].includes(requesterRank);
  if (!canLock) return { success: false, error: 'لا تملك صلاحية قفل الغرف' };
  await updateRoom(roomId, { isLocked: true, password });
  return { success: true };
}

export async function unlockRoom(
  roomId: string,
  requesterId: string,
  requesterRank: string
): Promise<{ success: boolean; error?: string }> {
  const canUnlock = ['owner', 'legend', 'admin', 'guardian', 'moderator'].includes(requesterRank);
  if (!canUnlock) return { success: false, error: 'لا تملك صلاحية فتح الغرف' };
  await updateRoom(roomId, { isLocked: false, password: null });
  return { success: true };
}

export async function verifyRoomPassword(roomId: string, inputPassword: string): Promise<boolean> {
  const rooms = await getRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room || !room.isLocked) return true;
  if (!room.password) return true;
  return room.password === inputPassword;
}

export async function getMessages(roomId: string): Promise<ChatMessage[]> {
  try {
    const data = await AsyncStorage.getItem(`${MESSAGES_KEY}_${roomId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function sendMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  senderRank: string,
  senderLevel: number,
  senderBadge: string | null,
  senderNameColor: string | null,
  text: string,
  replyTo: ChatMessage | null = null,
  gift: string | null = null,
  senderFrame: string | null = null,
  senderCountry?: string
): Promise<{ message: ChatMessage; flagged: boolean }> {
  const messages = await getMessages(roomId);
  const flagged = checkBannedWords(text);
  const msg: ChatMessage = {
    id: generateId(),
    roomId,
    senderId,
    senderName,
    senderAvatar,
    senderRank,
    senderLevel,
    senderBadge,
    senderNameColor,
    senderFrame,
    senderCountry,
    text,
    timestamp: new Date().toISOString(),
    replyTo,
    isDeleted: false,
    isEdited: false,
    reactions: {},
    gift,
    violationFlag: flagged,
  };
  await AsyncStorage.setItem(`${MESSAGES_KEY}_${roomId}`, JSON.stringify([...messages, msg]));
  return { message: msg, flagged };
}

export async function deleteMessage(roomId: string, messageId: string): Promise<void> {
  const messages = await getMessages(roomId);
  const idx = messages.findIndex(m => m.id === messageId);
  if (idx !== -1) {
    messages[idx].isDeleted = true;
    messages[idx].text = 'تم حذف هذه الرسالة';
    await AsyncStorage.setItem(`${MESSAGES_KEY}_${roomId}`, JSON.stringify(messages));
  }
}

export async function editMessage(roomId: string, messageId: string, newText: string): Promise<void> {
  const messages = await getMessages(roomId);
  const idx = messages.findIndex(m => m.id === messageId);
  if (idx !== -1) {
    messages[idx].text = newText;
    messages[idx].isEdited = true;
    await AsyncStorage.setItem(`${MESSAGES_KEY}_${roomId}`, JSON.stringify(messages));
  }
}

// ── Reactions ──
export async function toggleReaction(
  roomId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  const messages = await getMessages(roomId);
  const idx = messages.findIndex(m => m.id === messageId);
  if (idx === -1) return;
  const msg = messages[idx];
  if (!msg.reactions) msg.reactions = {};
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
  const userIdx = msg.reactions[emoji].indexOf(userId);
  if (userIdx !== -1) {
    msg.reactions[emoji].splice(userIdx, 1);
    if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
  } else {
    // Remove user from any other reaction first (one reaction per user)
    for (const e of Object.keys(msg.reactions)) {
      const ui = msg.reactions[e].indexOf(userId);
      if (ui !== -1) {
        msg.reactions[e].splice(ui, 1);
        if (msg.reactions[e].length === 0) delete msg.reactions[e];
      }
    }
    msg.reactions[emoji] = [...(msg.reactions[emoji] || []), userId];
  }
  messages[idx] = msg;
  await AsyncStorage.setItem(`${MESSAGES_KEY}_${roomId}`, JSON.stringify(messages));
}

export async function getPrivateMessages(userId1: string, userId2: string): Promise<PrivateMessage[]> {
  try {
    const key = [userId1, userId2].sort().join('_');
    const data = await AsyncStorage.getItem(`${PRIVATE_KEY}_${key}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function sendPrivateMessage(
  senderId: string,
  receiverId: string,
  senderName: string,
  senderAvatar: string,
  text: string,
  replyTo: PrivateMessage | null = null,
  gift: string | null = null
): Promise<PrivateMessage> {
  const key = [senderId, receiverId].sort().join('_');
  const messages = await getPrivateMessages(senderId, receiverId);
  const msg: PrivateMessage = {
    id: generateId(),
    senderId,
    receiverId,
    senderName,
    senderAvatar,
    text,
    timestamp: new Date().toISOString(),
    isRead: false,
    replyTo,
    gift,
  };
  await AsyncStorage.setItem(`${PRIVATE_KEY}_${key}`, JSON.stringify([...messages, msg]));
  return msg;
}

export async function getReports(): Promise<Report[]> {
  try {
    const data = await AsyncStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function submitReport(
  reporterId: string,
  reporterName: string,
  reportedUserId: string,
  reportedUserName: string,
  messageText: string,
  reason: string
): Promise<void> {
  const reports = await getReports();
  const report: Report = {
    id: generateId(),
    reporterId,
    reporterName,
    reportedUserId,
    reportedUserName,
    messageText,
    reason,
    timestamp: new Date().toISOString(),
    isResolved: false,
  };
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify([...reports, report]));
}

export async function resolveReport(reportId: string): Promise<void> {
  const reports = await getReports();
  const idx = reports.findIndex(r => r.id === reportId);
  if (idx !== -1) {
    reports[idx].isResolved = true;
    await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  }
}
