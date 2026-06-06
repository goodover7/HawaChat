// Powered by OnSpace.AI
// Custom rank management - Owner only
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RankPermission =
  | 'all'
  | 'delete_messages'
  | 'mute_timed'
  | 'kick'
  | 'ban'
  | 'delete_photos'
  | 'manage_reports'
  | 'change_names'
  | 'change_ranks'
  | 'change_password'
  | 'change_password_members'
  | 'send_gifts'
  | 'private_chat'
  | 'change_avatar'
  | 'custom_frame'
  | 'send_messages'
  | 'room_ban'
  | 'room_mute'
  | 'room_kick'
  | 'room_lock'
  | 'verify_accounts'
  | 'post_news';

export const ALL_PERMISSIONS: { key: RankPermission; label: string; emoji: string }[] = [
  { key: 'all', label: 'صلاحيات مطلقة', emoji: '⚡' },
  { key: 'delete_messages', label: 'حذف رسائل', emoji: '🗑️' },
  { key: 'mute_timed', label: 'كتم مؤقت', emoji: '🔇' },
  { key: 'kick', label: 'طرد أعضاء', emoji: '👢' },
  { key: 'ban', label: 'حظر أعضاء', emoji: '🚫' },
  { key: 'delete_photos', label: 'حذف صور', emoji: '🖼️' },
  { key: 'manage_reports', label: 'إدارة بلاغات', emoji: '📋' },
  { key: 'change_names', label: 'تغيير أسماء', emoji: '✏️' },
  { key: 'change_ranks', label: 'تغيير رتب', emoji: '🎖️' },
  { key: 'change_password', label: 'تغيير كلمات سر', emoji: '🔐' },
  { key: 'change_password_members', label: 'تغيير سر الأعضاء', emoji: '🔑' },
  { key: 'verify_accounts', label: 'توثيق حسابات', emoji: '✅' },
  { key: 'post_news', label: 'نشر أخبار', emoji: '📢' },
  { key: 'room_ban', label: 'حظر في الغرفة', emoji: '🚪' },
  { key: 'room_mute', label: 'كتم في الغرفة', emoji: '🔕' },
  { key: 'room_kick', label: 'طرد من الغرفة', emoji: '🚶' },
  { key: 'room_lock', label: 'قفل الغرفة', emoji: '🔒' },
  { key: 'send_gifts', label: 'إرسال هدايا', emoji: '🎁' },
  { key: 'private_chat', label: 'رسائل خاصة', emoji: '💬' },
  { key: 'change_avatar', label: 'تغيير صورة', emoji: '📷' },
  { key: 'custom_frame', label: 'إطار مخصص', emoji: '🖼️' },
  { key: 'send_messages', label: 'إرسال رسائل', emoji: '✉️' },
];

export interface CustomRank {
  id: string;
  name: string;
  emoji: string;
  color: string;
  order: number;
  permissions: RankPermission[];
  isSystem: boolean;
  createdAt: string;
}

const RANKS_KEY = 'hawa_custom_ranks_v3';

// Default system ranks
const DEFAULT_SYSTEM_RANKS: CustomRank[] = [
  { id: 'owner', name: '👑 المالك', emoji: '👑', color: '#FF4500', order: 100, permissions: ['all'], isSystem: true, createdAt: '' },
  { id: 'high_admin', name: '⭐ إدارة عليا', emoji: '⭐', color: '#FFD700', order: 90, permissions: ['delete_messages','mute_timed','kick','ban','delete_photos','manage_reports','change_names','verify_accounts','post_news','change_ranks','change_password'], isSystem: true, createdAt: '' },
  { id: 'legend', name: '🔥 أسطورة', emoji: '🔥', color: '#FF6B35', order: 80, permissions: ['delete_messages','mute_timed','kick','ban','delete_photos','manage_reports','change_names','verify_accounts','post_news'], isSystem: true, createdAt: '' },
  { id: 'admin', name: '🛡️ أدمن', emoji: '🛡️', color: '#E91E8C', order: 70, permissions: ['delete_messages','mute_timed','kick','ban','delete_photos','manage_reports','post_news','change_password_members'], isSystem: true, createdAt: '' },
  { id: 'general_supervisor', name: '🛡️ مشرف عام', emoji: '🛡️', color: '#90A4AE', order: 60, permissions: ['delete_messages','mute_timed','kick','ban','delete_photos','manage_reports'], isSystem: true, createdAt: '' },
  { id: 'guardian', name: '⚔️ حارس', emoji: '⚔️', color: '#00BCD4', order: 50, permissions: ['delete_messages','mute_timed','kick','delete_photos','manage_reports'], isSystem: true, createdAt: '' },
  { id: 'moderator', name: '🎖️ مشرف', emoji: '🎖️', color: '#9C27B0', order: 45, permissions: ['delete_messages','mute_timed','delete_photos'], isSystem: true, createdAt: '' },
  { id: 'room_owner', name: '🏆 مالك غرفة', emoji: '🏆', color: '#F44336', order: 40, permissions: ['room_ban','room_mute','room_kick','room_lock'], isSystem: true, createdAt: '' },
  { id: 'room_manager', name: '⭐ مدير غرفة', emoji: '⭐', color: '#FF9800', order: 35, permissions: ['room_ban','room_mute','room_kick'], isSystem: true, createdAt: '' },
  { id: 'room_supervisor', name: '🛡️ مشرف غرفة', emoji: '🛡️', color: '#26C6DA', order: 30, permissions: ['room_mute','room_kick'], isSystem: true, createdAt: '' },
  { id: 'chat_legend', name: '💎 أساطير الشات', emoji: '💎', color: '#EF5350', order: 25, permissions: ['send_gifts','private_chat','change_avatar','custom_frame'], isSystem: true, createdAt: '' },
  { id: 'vip', name: '💎 VIP', emoji: '💎', color: '#FFD700', order: 22, permissions: ['send_gifts','private_chat','change_avatar','custom_frame'], isSystem: true, createdAt: '' },
  { id: 'vip_char', name: '💜 كبار الشخصيات', emoji: '💜', color: '#AB47BC', order: 20, permissions: ['send_gifts','private_chat','change_avatar','custom_frame'], isSystem: true, createdAt: '' },
  { id: 'star', name: '⭐ نجم', emoji: '⭐', color: '#FF9800', order: 18, permissions: ['send_gifts','private_chat','change_avatar'], isSystem: true, createdAt: '' },
  { id: 'worthy', name: '✨ مميز بجدارة', emoji: '✨', color: '#FDD835', order: 15, permissions: ['send_gifts','private_chat','change_avatar'], isSystem: true, createdAt: '' },
  { id: 'distinguished', name: '💠 رتبة مميز', emoji: '💠', color: '#29B6F6', order: 12, permissions: ['send_messages','private_chat','change_avatar'], isSystem: true, createdAt: '' },
  { id: 'member', name: '👤 عضو', emoji: '👤', color: '#B0B0CC', order: 8, permissions: ['send_messages','private_chat','change_avatar'], isSystem: true, createdAt: '' },
  { id: 'newbie', name: '🌱 جديد', emoji: '🌱', color: '#78909C', order: 1, permissions: ['send_messages'], isSystem: true, createdAt: '' },
];

export async function getAllRanks(): Promise<CustomRank[]> {
  try {
    const raw = await AsyncStorage.getItem(RANKS_KEY);
    if (!raw) {
      await AsyncStorage.setItem(RANKS_KEY, JSON.stringify(DEFAULT_SYSTEM_RANKS));
      return DEFAULT_SYSTEM_RANKS;
    }
    const stored: CustomRank[] = JSON.parse(raw);
    // Merge: system ranks from defaults (with any customizations) + custom ranks
    const customRanks = stored.filter(r => !r.isSystem);
    const systemRanks = DEFAULT_SYSTEM_RANKS.map(def => {
      const storedVersion = stored.find(s => s.id === def.id);
      if (storedVersion) {
        // Apply owner-saved customizations to system rank
        return {
          ...def,
          name: storedVersion.name,
          emoji: storedVersion.emoji,
          color: storedVersion.color,
          permissions: storedVersion.permissions,
        };
      }
      return def;
    });
    return [...systemRanks, ...customRanks].sort((a, b) => b.order - a.order);
  } catch {
    return DEFAULT_SYSTEM_RANKS;
  }
}

export async function updateRank(
  rankId: string,
  updates: Partial<Pick<CustomRank, 'name' | 'emoji' | 'color' | 'permissions'>>,
  requesterId: string,
  requesterRank: string
): Promise<{ success: boolean; error?: string }> {
  if (requesterRank !== 'owner') return { success: false, error: 'فقط المالك يمكنه تعديل الرتب' };
  // Load stored ranks (raw) and update there
  const raw = await AsyncStorage.getItem(RANKS_KEY);
  let stored: CustomRank[] = raw ? JSON.parse(raw) : [...DEFAULT_SYSTEM_RANKS];
  const idx = stored.findIndex(r => r.id === rankId);
  if (idx !== -1) {
    stored[idx] = { ...stored[idx], ...updates };
  } else {
    // Rank not yet in storage (e.g. system rank that was never saved) — find from defaults
    const def = DEFAULT_SYSTEM_RANKS.find(d => d.id === rankId);
    if (def) {
      stored.push({ ...def, ...updates });
    } else {
      return { success: false, error: 'الرتبة غير موجودة' };
    }
  }
  await AsyncStorage.setItem(RANKS_KEY, JSON.stringify(stored));
  return { success: true };
}

export async function createCustomRank(
  name: string,
  emoji: string,
  color: string,
  permissions: RankPermission[],
  order: number,
  requesterId: string,
  requesterRank: string
): Promise<{ success: boolean; rank?: CustomRank; error?: string }> {
  if (requesterRank !== 'owner') return { success: false, error: 'فقط المالك يمكنه إضافة رتب' };
  if (!name.trim()) return { success: false, error: 'أدخل اسم الرتبة' };
  const raw = await AsyncStorage.getItem(RANKS_KEY);
  let stored: CustomRank[] = raw ? JSON.parse(raw) : [...DEFAULT_SYSTEM_RANKS];
  const id = 'custom_' + Date.now().toString(36);
  const newRank: CustomRank = {
    id, name: name.trim(), emoji, color,
    order: Math.max(1, Math.min(99, order)),
    permissions,
    isSystem: false,
    createdAt: new Date().toISOString(),
  };
  stored.push(newRank);
  stored.sort((a, b) => b.order - a.order);
  await AsyncStorage.setItem(RANKS_KEY, JSON.stringify(stored));
  return { success: true, rank: newRank };
}

export async function deleteCustomRank(
  rankId: string,
  requesterId: string,
  requesterRank: string
): Promise<{ success: boolean; error?: string }> {
  if (requesterRank !== 'owner') return { success: false, error: 'فقط المالك يمكنه حذف الرتب' };
  const raw = await AsyncStorage.getItem(RANKS_KEY);
  let stored: CustomRank[] = raw ? JSON.parse(raw) : [];
  const rank = stored.find(r => r.id === rankId);
  if (!rank) return { success: false, error: 'الرتبة غير موجودة أو هي رتبة أساسية' };
  if (rank.isSystem) return { success: false, error: 'لا يمكن حذف الرتب الأساسية' };
  await AsyncStorage.setItem(RANKS_KEY, JSON.stringify(stored.filter(r => r.id !== rankId)));
  return { success: true };
}

export async function getRankById(rankId: string): Promise<CustomRank | null> {
  const all = await getAllRanks();
  return all.find(r => r.id === rankId) || null;
}

export async function getRankLabelsMap(): Promise<Record<string, string>> {
  const all = await getAllRanks();
  const map: Record<string, string> = {};
  all.forEach(r => { map[r.id] = r.name; });
  return map;
}

export async function getRankColorsMap(): Promise<Record<string, string>> {
  const all = await getAllRanks();
  const map: Record<string, string> = {};
  all.forEach(r => { map[r.id] = r.color; });
  return map;
}
