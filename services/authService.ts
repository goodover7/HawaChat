// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG, LEVEL_THRESHOLDS } from '@/constants/config';

export type UserRank =
  | 'owner' | 'high_admin' | 'legend' | 'admin'
  | 'general_supervisor' | 'guardian' | 'moderator'
  | 'room_owner' | 'room_manager' | 'room_supervisor'
  | 'chat_legend' | 'vip' | 'vip_char'
  | 'star' | 'worthy' | 'distinguished'
  | 'member' | 'newbie'
  | string;

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  rank: UserRank;
  level: number;
  levelTitle: string;
  messageCount: number;
  coins: number;
  frame: string | null;
  badge: string | null;
  nameColor: string | null;
  purchases: string[];
  isOnline: boolean;
  lastSeen: string;
  isMuted: boolean;
  muteUntil: string | null;
  isBanned: boolean;
  banUntil: string | null;
  isKicked: boolean;
  kickUntil: string | null;
  violations: string[];
  isHidden: boolean;
  joinedAt: string;
  giftsReceived: number;
  giftsGiven: number;
  reportedCount: number;
  isVerified: boolean;
  country: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  assignedRoomId: string | null;
  profileGradient: string[] | null;
  profileBackground: string | null; // NEW: custom background image URI
  profileBackgroundEnabled: boolean; // NEW: toggle
}

const STORAGE_KEY = 'hawa_users_v7';
const SESSION_KEY = 'hawa_session_v7';

const DEFAULT_AVATARS = ['👩', '👨', '👩‍🦰', '👨‍🦱', '👩‍🦳', '👨‍🦲', '🧑', '👧', '👦', '🦸'];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getLevel(messageCount: number): { level: number; title: string } {
  const BASE_THRESHOLDS = LEVEL_THRESHOLDS;
  // Sort thresholds by minMessages descending to find highest match
  const sorted = [...BASE_THRESHOLDS].sort((a, b) => b.minMessages - a.minMessages);
  for (const threshold of sorted) {
    if (messageCount >= threshold.minMessages) {
      const maxDefined = BASE_THRESHOLDS[BASE_THRESHOLDS.length - 1];
      if (messageCount > maxDefined.minMessages) {
        // Unlimited levels: every 5000 messages beyond max = +1 level (no cap)
        const extraLevels = Math.floor((messageCount - maxDefined.minMessages) / 5000);
        const level = maxDefined.level + extraLevels;
        let title = maxDefined.title;
        if (level >= 500) title = '🌌 أسطورة الكون الخالدة';
        else if (level >= 200) title = '🔮 سيد الأبدية';
        else if (level >= 100) title = '⚡ خالد الدردشة';
        else if (level >= 75) title = '💎 أسطوري لا يُهزم';
        else if (level >= 50) title = '🏅 إمبراطور الدردشة';
        else if (level >= 30) title = '⚔️ أسطورة الزمن';
        else if (level >= 20) title = '🌀 عابر الكون';
        else if (level >= 15) title = '👑 ملك الأبدية';
        else if (level >= 10) title = '🚀 سيد الفضاء';
        else if (level >= 9) title = '🌌 نجم الكون';
        return { level, title };
      }
      return { level: threshold.level, title: threshold.title };
    }
  }
  return { level: 1, title: 'مبتدئ 🌱' };
}

export function canManageUser(requester: User, target: User): boolean {
  // ABSOLUTE OWNER PROTECTION — no one can ever manage owner
  if (target.rank === 'owner') return false;
  if (requester.rank === 'owner') return true;
  if (requester.rank === 'high_admin') return target.rank !== 'owner';
  if (requester.rank === 'legend') {
    const protectedRanks = ['owner', 'high_admin', 'legend'];
    return !protectedRanks.includes(target.rank);
  }
  if (requester.rank === 'admin') {
    const protectedRanks = ['owner', 'high_admin', 'legend', 'admin'];
    return !protectedRanks.includes(target.rank);
  }
  if (requester.rank === 'general_supervisor') {
    const protectedRanks = ['owner', 'high_admin', 'legend', 'admin', 'general_supervisor'];
    return !protectedRanks.includes(target.rank);
  }
  const rankOrder: Record<string, number> = {
    owner: 10, high_admin: 9, legend: 8, admin: 7,
    general_supervisor: 6, guardian: 5, moderator: 4,
    room_owner: 4, room_manager: 3, room_supervisor: 3,
    chat_legend: 3, vip: 3, vip_char: 3, star: 2,
    worthy: 2, distinguished: 2, member: 1, newbie: 0,
  };
  return (rankOrder[requester.rank] || 0) > (rankOrder[target.rank] || 0);
}

async function getUsers(): Promise<User[]> {
  try {
    // Try v7 first
    let data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Migrate from v6
      const oldData = await AsyncStorage.getItem('hawa_users_v6');
      if (oldData) {
        const parsed: User[] = JSON.parse(oldData);
        const migrated = parsed.map(u => ({
          profileBackground: null,
          profileBackgroundEnabled: false,
          ...u,
        }));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        await AsyncStorage.setItem('hawa_session_v7', await AsyncStorage.getItem('hawa_session_v6') || '{}');
        return migrated;
      }
      // Migrate from v5
      const v5Data = await AsyncStorage.getItem('hawa_users_v5');
      if (v5Data) {
        const parsed: User[] = JSON.parse(v5Data);
        const migrated = parsed.map(u => ({
          banUntil: null, isKicked: false, kickUntil: null, profileGradient: null,
          profileBackground: null, profileBackgroundEnabled: false,
          ...u,
        }));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      const ownerUser: User = {
        id: 'owner_001',
        username: APP_CONFIG.ownerUsername,
        displayName: '👑 المالك',
        bio: 'مالك التطبيق وصاحب الصلاحيات المطلقة',
        avatar: '👑',
        rank: 'owner',
        level: 99,
        levelTitle: 'إله الدردشة 🔥',
        messageCount: 9999,
        coins: 999999,
        frame: 'frame_owner',
        badge: '👑',
        nameColor: '#FFD700',
        purchases: ['frame1','frame2','frame3','frame4','frame5','frame6','frame7','frame8','frame9','frame10','frame11','frame12','frame_vip','frame_owner','badge3','badge5','badge11','color1','color4'],
        isOnline: false,
        lastSeen: new Date().toISOString(),
        isMuted: false, muteUntil: null,
        isBanned: false, banUntil: null,
        isKicked: false, kickUntil: null,
        violations: [],
        isHidden: false,
        joinedAt: new Date().toISOString(),
        giftsReceived: 0, giftsGiven: 0, reportedCount: 0,
        isVerified: true,
        country: '🌍', gender: 'male', age: 25,
        assignedRoomId: null,
        profileGradient: null,
        profileBackground: null,
        profileBackgroundEnabled: false,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([ownerUser]));
      return [ownerUser];
    }
    const parsed: User[] = JSON.parse(data);
    return parsed.map(u => ({
      isVerified: false, country: '🌍', gender: 'male' as const, age: 18,
      muteUntil: null, banUntil: null, isKicked: false, kickUntil: null,
      assignedRoomId: null, profileGradient: null,
      profileBackground: null, profileBackgroundEnabled: false,
      ...u,
    }));
  } catch { return []; }
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

async function autoLiftExpired(users: User[]): Promise<{ users: User[]; changed: string[] }> {
  const now = new Date();
  let changed: string[] = [];
  const updated = users.map(u => {
    let newU = { ...u };
    if (u.isMuted && u.muteUntil !== null && u.muteUntil !== undefined) {
      if (new Date(u.muteUntil) <= now) { newU.isMuted = false; newU.muteUntil = null; changed.push(`mute:${u.id}`); }
    }
    if (u.isBanned && u.banUntil !== null && u.banUntil !== undefined) {
      if (new Date(u.banUntil) <= now) { newU.isBanned = false; newU.banUntil = null; changed.push(`ban:${u.id}`); }
    }
    if (u.isKicked && u.kickUntil !== null && u.kickUntil !== undefined) {
      if (new Date(u.kickUntil) <= now) { newU.isKicked = false; newU.kickUntil = null; changed.push(`kick:${u.id}`); }
    }
    return newU;
  });
  if (changed.length > 0) await saveUsers(updated);
  return { users: updated, changed };
}

export async function registerUser(
  username: string, password: string, displayName: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (username.toLowerCase() === APP_CONFIG.ownerUsername.toLowerCase()) {
    return { success: false, error: 'اسم المستخدم هذا محجوز' };
  }
  const users = await getUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'اسم المستخدم مستخدم بالفعل' };
  }
  const avatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
  const newUser: User = {
    id: generateId(), username, displayName,
    bio: 'مرحباً بالجميع! 👋', avatar, rank: 'newbie',
    level: 1, levelTitle: 'مبتدئ 🌱', messageCount: 0, coins: 200,
    frame: null, badge: null, nameColor: null, purchases: [],
    isOnline: true, lastSeen: new Date().toISOString(),
    isMuted: false, muteUntil: null, isBanned: false, banUntil: null,
    isKicked: false, kickUntil: null, violations: [], isHidden: false,
    joinedAt: new Date().toISOString(), giftsReceived: 0, giftsGiven: 0,
    reportedCount: 0, isVerified: false, country: '🌍', gender: 'male', age: 18,
    assignedRoomId: null, profileGradient: null,
    profileBackground: null, profileBackgroundEnabled: false,
  };
  await saveUsers([...users, newUser]);
  await AsyncStorage.setItem(`pass_${newUser.id}`, password);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: newUser.id }));
  return { success: true, user: newUser };
}

export async function loginUser(
  username: string, password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  let users = await getUsers();
  const result = await autoLiftExpired(users);
  users = result.users;
  if (username.toLowerCase() === APP_CONFIG.ownerUsername.toLowerCase() && password === APP_CONFIG.ownerPassword) {
    const owner = users.find(u => u.username === APP_CONFIG.ownerUsername);
    if (owner) {
      owner.isOnline = true; owner.lastSeen = new Date().toISOString();
      await saveUsers(users);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: owner.id }));
      return { success: true, user: owner };
    }
  }
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return { success: false, error: 'اسم المستخدم غير موجود' };
  if (user.isBanned) return { success: false, error: 'تم حظر حسابك من قِبل الإدارة' };
  const savedPass = await AsyncStorage.getItem(`pass_${user.id}`);
  if (savedPass && savedPass !== password) return { success: false, error: 'كلمة المرور غير صحيحة' };
  if (!savedPass) await AsyncStorage.setItem(`pass_${user.id}`, password);
  user.isOnline = true; user.lastSeen = new Date().toISOString();
  await saveUsers(users);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
  return { success: true, user };
}

export async function getSession(): Promise<User | null> {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    const session = JSON.parse(sessionData);
    let users = await getUsers();
    const result = await autoLiftExpired(users);
    users = result.users;
    return users.find(u => u.id === session.userId) || null;
  } catch { return null; }
}

export async function logoutUser(userId: string): Promise<void> {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (user) { user.isOnline = false; user.lastSeen = new Date().toISOString(); await saveUsers(users); }
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;
  // Prevent changing owner rank by anyone
  if (users[index].rank === 'owner' && 'rank' in updates && updates.rank !== 'owner') {
    delete updates.rank; // silently ignore rank change for owner
  }
  users[index] = { ...users[index], ...updates };
  // Only auto-recalculate level if messageCount changed (not when level is explicitly set)
  if ('messageCount' in updates && !('level' in updates)) {
    const lvl = getLevel(users[index].messageCount);
    users[index].level = lvl.level;
    users[index].levelTitle = lvl.title;
  }
  await saveUsers(users);
  return users[index];
}

export async function verifyUser(
  targetId: string, requesterId: string
): Promise<{ success: boolean; isVerified?: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  if (!requester || requester.rank !== 'owner') return { success: false, error: 'فقط المالك يمكنه توثيق الحسابات' };
  const idx = users.findIndex(u => u.id === targetId);
  if (idx === -1) return { success: false, error: 'المستخدم غير موجود' };
  users[idx].isVerified = !users[idx].isVerified;
  await saveUsers(users);
  return { success: true, isVerified: users[idx].isVerified };
}

export async function deleteUserAvatar(userId: string, requesterId: string): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === userId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (target.rank === 'owner') return { success: false, error: 'لا يمكن حذف صورة المالك' };
  const canDelete = ['owner', 'high_admin', 'legend', 'admin', 'general_supervisor', 'guardian', 'moderator'].includes(requester.rank);
  if (!canDelete) return { success: false, error: 'لا تملك صلاحية حذف الصور' };
  const idx = users.findIndex(u => u.id === userId);
  const defaultAvatars = ['👩', '👨', '🧑', '👧', '👦'];
  users[idx].avatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
  await saveUsers(users);
  return { success: true };
}

export async function changeDisplayName(
  targetId: string, requesterId: string, newName: string
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === targetId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (target.rank === 'owner' && requesterId !== targetId) return { success: false, error: 'لا يمكن تغيير اسم المالك' };
  if (['owner', 'high_admin', 'legend'].includes(requester.rank)) {
    const idx = users.findIndex(u => u.id === targetId);
    users[idx].displayName = newName.trim();
    await saveUsers(users);
    return { success: true };
  }
  if (requester.rank === 'admin') {
    const protectedFromAdmin = ['owner', 'high_admin', 'legend', 'admin', 'general_supervisor'];
    if (protectedFromAdmin.includes(target.rank)) return { success: false, error: 'لا يمكن تغيير اسم هذا المستخدم' };
    const idx = users.findIndex(u => u.id === targetId);
    users[idx].displayName = newName.trim();
    await saveUsers(users);
    return { success: true };
  }
  if (requesterId !== targetId) return { success: false, error: 'لا تملك صلاحية تغيير هذا الاسم' };
  const idx = users.findIndex(u => u.id === targetId);
  users[idx].displayName = newName.trim();
  await saveUsers(users);
  return { success: true };
}

export async function changePassword(
  targetId: string, requesterId: string, newPassword: string, oldPassword?: string
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === targetId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (!newPassword.trim() || newPassword.length < 4) return { success: false, error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' };
  if (target.rank === 'owner') {
    if (requesterId !== targetId) return { success: false, error: 'لا يمكن لأحد تغيير كلمة سر المالك إلا هو' };
    const currentPass = await AsyncStorage.getItem(`pass_${targetId}`);
    if (currentPass && oldPassword !== currentPass && oldPassword !== APP_CONFIG.ownerPassword) return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    await AsyncStorage.setItem(`pass_${targetId}`, newPassword);
    return { success: true };
  }
  if (['owner', 'high_admin'].includes(requester.rank)) {
    await AsyncStorage.setItem(`pass_${targetId}`, newPassword);
    return { success: true };
  }
  if (requester.rank === 'admin') {
    const protectedFromAdmin = ['owner', 'high_admin', 'legend', 'admin', 'general_supervisor'];
    if (protectedFromAdmin.includes(target.rank)) return { success: false, error: 'لا يمكن تغيير كلمة سر هذا المستخدم' };
    await AsyncStorage.setItem(`pass_${targetId}`, newPassword);
    return { success: true };
  }
  if (requesterId === targetId) {
    const currentPass = await AsyncStorage.getItem(`pass_${targetId}`);
    if (currentPass && oldPassword !== currentPass) return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    await AsyncStorage.setItem(`pass_${targetId}`, newPassword);
    return { success: true };
  }
  return { success: false, error: 'لا تملك صلاحية تغيير كلمة السر' };
}

export async function muteUserTimed(
  targetId: string, requesterId: string, durationMinutes: number
): Promise<{ success: boolean; error?: string; muteUntil?: string | null }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === targetId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (target.rank === 'owner') return { success: false, error: 'لا يمكن كتم المالك' };
  if (!canManageUser(requester, target)) return { success: false, error: 'لا تملك صلاحية كتم هذا العضو' };
  const idx = users.findIndex(u => u.id === targetId);
  let muteUntil: string | null = null;
  if (durationMinutes !== -1) {
    const until = new Date();
    until.setMinutes(until.getMinutes() + durationMinutes);
    muteUntil = until.toISOString();
  }
  users[idx].isMuted = true; users[idx].muteUntil = muteUntil;
  await saveUsers(users);
  return { success: true, muteUntil };
}

export async function unmuteUser(
  targetId: string, requesterId: string
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === targetId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (!canManageUser(requester, target)) return { success: false, error: 'لا تملك هذه الصلاحية' };
  const idx = users.findIndex(u => u.id === targetId);
  users[idx].isMuted = false; users[idx].muteUntil = null;
  await saveUsers(users);
  return { success: true };
}

export async function banUserTimed(
  targetId: string, requesterId: string, durationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === targetId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (target.rank === 'owner') return { success: false, error: 'لا يمكن حظر المالك' };
  if (!canManageUser(requester, target)) return { success: false, error: 'لا تملك صلاحية حظر هذا العضو' };
  const idx = users.findIndex(u => u.id === targetId);
  let banUntil: string | null = null;
  if (durationMinutes !== -1) {
    const until = new Date(); until.setMinutes(until.getMinutes() + durationMinutes);
    banUntil = until.toISOString();
  }
  users[idx].isBanned = true; users[idx].banUntil = banUntil; users[idx].isOnline = false;
  await saveUsers(users);
  return { success: true };
}

export async function unbanUser(
  targetId: string, requesterId: string
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === targetId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (!canManageUser(requester, target)) return { success: false, error: 'لا تملك هذه الصلاحية' };
  const idx = users.findIndex(u => u.id === targetId);
  users[idx].isBanned = false; users[idx].banUntil = null;
  await saveUsers(users);
  return { success: true };
}

export async function kickUserTimed(
  targetId: string, requesterId: string, durationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === targetId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (target.rank === 'owner') return { success: false, error: 'لا يمكن طرد المالك' };
  if (!canManageUser(requester, target)) return { success: false, error: 'لا تملك صلاحية طرد هذا العضو' };
  const idx = users.findIndex(u => u.id === targetId);
  let kickUntil: string | null = null;
  if (durationMinutes !== -1) {
    const until = new Date(); until.setMinutes(until.getMinutes() + durationMinutes);
    kickUntil = until.toISOString();
  }
  users[idx].isKicked = true; users[idx].kickUntil = kickUntil; users[idx].isOnline = false;
  await saveUsers(users);
  return { success: true };
}

export async function unkickUser(
  targetId: string, requesterId: string
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  const target = users.find(u => u.id === targetId);
  if (!requester || !target) return { success: false, error: 'مستخدم غير موجود' };
  if (!canManageUser(requester, target)) return { success: false, error: 'لا تملك هذه الصلاحية' };
  const idx = users.findIndex(u => u.id === targetId);
  users[idx].isKicked = false; users[idx].kickUntil = null;
  await saveUsers(users);
  return { success: true };
}

export async function toggleHiddenStatus(userId: string): Promise<{ success: boolean; isHidden?: boolean }> {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.rank !== 'owner') return { success: false };
  user.isHidden = !user.isHidden;
  await saveUsers(users);
  return { success: true, isHidden: user.isHidden };
}

export async function getAllUsers(): Promise<User[]> {
  let users = await getUsers();
  const result = await autoLiftExpired(users);
  return result.users;
}

export async function checkAndGetLiftedActions(userId: string): Promise<{ muteLifted: boolean; banLifted: boolean; kickLifted: boolean }> {
  const users = await getUsers();
  const result = await autoLiftExpired(users);
  return {
    muteLifted: result.changed.includes(`mute:${userId}`),
    banLifted: result.changed.includes(`ban:${userId}`),
    kickLifted: result.changed.includes(`kick:${userId}`),
  };
}

export async function incrementMessageCount(userId: string): Promise<User | null> {
  const users = await getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  user.messageCount += 1;
  const lvl = getLevel(user.messageCount);
  user.level = lvl.level;
  user.levelTitle = lvl.title;
  if (user.rank === 'newbie' && user.messageCount >= 10) user.rank = 'member';
  else if (user.rank === 'member' && user.messageCount >= 100) user.rank = 'star';
  user.coins += 3;
  await saveUsers(users);
  return user;
}

export async function setUserLevel(
  targetId: string, requesterId: string, newLevel: number
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  if (!requester) return { success: false, error: 'غير مسجل الدخول' };
  if (!['owner', 'high_admin', 'admin'].includes(requester.rank)) return { success: false, error: 'فقط المالك والأدمن يمكنهم تغيير المستويات' };
  const target = users.findIndex(u => u.id === targetId);
  if (target === -1) return { success: false, error: 'المستخدم غير موجود' };
  const clampedLevel = Math.max(1, Math.min(99999, newLevel));
  // Set level directly WITHOUT recalculating from messageCount
  users[target].level = clampedLevel;
  const lvlTitles = [
    { min: 1, title: 'مبتدئ 🌱' }, { min: 5, title: 'ناشط 🌿' }, { min: 10, title: 'نشيط ⭐' },
    { min: 20, title: 'متمرس 🔥' }, { min: 50, title: 'خبير 💎' }, { min: 100, title: 'أسطورة 🏆' },
  ];
  let title = 'مبتدئ 🌱';
  for (const t of lvlTitles) { if (clampedLevel >= t.min) title = t.title; }
  if (clampedLevel >= 9999) title = '🌌 عابر الكون';
  else if (clampedLevel >= 999) title = '⚡ ملك الأبدية';
  else if (clampedLevel >= 99) title = '🔥 إله الدردشة';
  users[target].levelTitle = title;
  await saveUsers(users);
  return { success: true };
}

export async function transferCoins(
  fromId: string, toId: string, amount: number
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const from = users.find(u => u.id === fromId);
  const to = users.find(u => u.id === toId);
  if (!from || !to) return { success: false, error: 'المستخدم غير موجود' };
  if (from.coins < amount) return { success: false, error: 'رصيد غير كافٍ' };
  from.coins -= amount; from.giftsGiven = (from.giftsGiven || 0) + 1;
  to.coins += amount; to.giftsReceived = (to.giftsReceived || 0) + 1;
  await saveUsers(users);
  return { success: true };
}

export async function getMuteRemainingMinutes(user: User): Promise<number | null> {
  if (!user.isMuted) return null;
  if (user.muteUntil === null || user.muteUntil === undefined) return -1;
  const remaining = Math.ceil((new Date(user.muteUntil).getTime() - Date.now()) / 60000);
  return Math.max(0, remaining);
}

export async function assignRoomToUser(
  targetId: string, requesterId: string, roomId: string | null
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  if (!requester || !['owner', 'high_admin', 'admin'].includes(requester.rank)) return { success: false, error: 'لا تملك صلاحية تعيين الغرف' };
  const idx = users.findIndex(u => u.id === targetId);
  if (idx === -1) return { success: false, error: 'المستخدم غير موجود' };
  users[idx].assignedRoomId = roomId;
  await saveUsers(users);
  return { success: true };
}

export async function setUserGender(
  targetId: string, requesterId: string, gender: 'male' | 'female' | 'other'
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  if (!requester) return { success: false, error: 'غير مسجل الدخول' };
  if (requesterId !== targetId && !['owner', 'high_admin'].includes(requester.rank)) return { success: false, error: 'لا تملك صلاحية تغيير جنس مستخدم آخر' };
  const idx = users.findIndex(u => u.id === targetId);
  if (idx === -1) return { success: false, error: 'المستخدم غير موجود' };
  users[idx].gender = gender;
  await saveUsers(users);
  return { success: true };
}

export async function giftFrameToUser(
  targetId: string, requesterId: string, frameId: string
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const requester = users.find(u => u.id === requesterId);
  if (!requester || requester.rank !== 'owner') return { success: false, error: 'فقط المالك يمكنه إهداء الإطارات' };
  const idx = users.findIndex(u => u.id === targetId);
  if (idx === -1) return { success: false, error: 'المستخدم غير موجود' };
  if (!users[idx].purchases.includes(frameId)) users[idx].purchases = [...users[idx].purchases, frameId];
  users[idx].frame = frameId;
  await saveUsers(users);
  return { success: true };
}

export async function setProfileBackground(
  userId: string, uri: string | null, enabled: boolean
): Promise<{ success: boolean }> {
  const users = await getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false };
  users[idx].profileBackground = uri;
  users[idx].profileBackgroundEnabled = enabled;
  await saveUsers(users);
  return { success: true };
}
