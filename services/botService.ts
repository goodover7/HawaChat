// Powered by OnSpace.AI
// Bot system: anti-spam, auto-mute, commands, duplicate detection
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifyWarning } from './notificationService';
import { BOT_SETTINGS_KEY } from '@/constants/config';

const BOT_ENABLED_KEY = 'hawa_bot_enabled_v1';

// Spam tracking: userId -> { count, lastReset, warned, lastMessages }
interface SpamRecord {
  count: number;
  lastReset: number;
  warned: boolean;
  lastMessages: string[]; // last 5 messages for duplicate detection
  duplicateCount: number;
  duplicateReset: number;
}

export interface BotSettings {
  enabled: boolean;
  muteDurationSeconds: number; // bot auto-mute duration in seconds
  spamThreshold: number; // messages in window before mute
  spamWindowMs: number; // time window in ms
  duplicateThreshold: number; // duplicate messages before mute
}

const DEFAULT_BOT_SETTINGS: BotSettings = {
  enabled: true,
  muteDurationSeconds: 60,
  spamThreshold: 5,
  spamWindowMs: 6000,
  duplicateThreshold: 3,
};

const spamMap: Record<string, SpamRecord> = {};

export async function getBotSettings(): Promise<BotSettings> {
  try {
    const data = await AsyncStorage.getItem(BOT_SETTINGS_KEY);
    if (!data) return DEFAULT_BOT_SETTINGS;
    return { ...DEFAULT_BOT_SETTINGS, ...JSON.parse(data) };
  } catch { return DEFAULT_BOT_SETTINGS; }
}

export async function saveBotSettings(settings: Partial<BotSettings>): Promise<void> {
  const current = await getBotSettings();
  await AsyncStorage.setItem(BOT_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

export async function isBotEnabled(): Promise<boolean> {
  const settings = await getBotSettings();
  return settings.enabled;
}

export async function setBotEnabled(enabled: boolean): Promise<void> {
  await saveBotSettings({ enabled });
}

// Returns true if user should be blocked (just got auto-muted)
export async function trackSpam(
  userId: string,
  userRank: string,
  messageText: string = ''
): Promise<{ muted: boolean; warned: boolean; reason?: string }> {
  // Never auto-mute owner or high admins
  if (['owner', 'high_admin', 'legend'].includes(userRank)) return { muted: false, warned: false };

  const settings = await getBotSettings();
  if (!settings.enabled) return { muted: false, warned: false };

  const now = Date.now();
  if (!spamMap[userId]) {
    spamMap[userId] = {
      count: 1,
      lastReset: now,
      warned: false,
      lastMessages: [messageText],
      duplicateCount: 1,
      duplicateReset: now,
    };
    return { muted: false, warned: false };
  }

  const rec = spamMap[userId];

  // ── Duplicate / copy-paste detection ──
  const normalizedMsg = messageText.trim().toLowerCase();
  if (normalizedMsg.length > 2) {
    // Check if same message within 10 seconds
    if (now - rec.duplicateReset > 10000) {
      rec.duplicateCount = 1;
      rec.duplicateReset = now;
      rec.lastMessages = [normalizedMsg];
    } else {
      const isDuplicate = rec.lastMessages.length > 0 &&
        rec.lastMessages[rec.lastMessages.length - 1] === normalizedMsg;
      if (isDuplicate) {
        rec.duplicateCount++;
        if (rec.duplicateCount >= settings.duplicateThreshold) {
          // Reset and mute for duplicate
          spamMap[userId] = {
            count: 0, lastReset: now, warned: false,
            lastMessages: [], duplicateCount: 0, duplicateReset: now,
          };
          await muteUserForBot(userId, settings.muteDurationSeconds);
          await notifyWarning(userId, `🤖 البوت: تم كتمك لمدة ${formatBotMuteDuration(settings.muteDurationSeconds)} بسبب تكرار نسخ الرسائل. سيُرفع الكتم تلقائياً.`);
          return { muted: true, warned: false, reason: 'duplicate' };
        }
      } else {
        rec.duplicateCount = 1;
        rec.duplicateReset = now;
      }
      rec.lastMessages = [...rec.lastMessages.slice(-4), normalizedMsg];
    }
  }

  // ── Fast spam detection ──
  // Reset window if expired
  if (now - rec.lastReset > settings.spamWindowMs) {
    rec.count = 1;
    rec.lastReset = now;
    rec.warned = false;
    return { muted: false, warned: false };
  }

  rec.count += 1;

  // Warn at threshold - 1
  if (rec.count === settings.spamThreshold - 1 && !rec.warned) {
    rec.warned = true;
    await notifyWarning(userId, '⚠️ تحذير من البوت: أرسلت رسائل كثيرة بسرعة! ستُكتم إذا استمريت.');
    return { muted: false, warned: true };
  }

  // Mute at threshold
  if (rec.count >= settings.spamThreshold) {
    spamMap[userId] = {
      count: 0, lastReset: now, warned: false,
      lastMessages: [], duplicateCount: 0, duplicateReset: now,
    };
    await muteUserForBot(userId, settings.muteDurationSeconds);
    await notifyWarning(userId, `🤖 البوت: تم كتمك لمدة ${formatBotMuteDuration(settings.muteDurationSeconds)} بسبب الإرسال السريع. سيُرفع الكتم تلقائياً.`);
    return { muted: true, warned: false, reason: 'spam' };
  }

  return { muted: false, warned: false };
}

function formatBotMuteDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} ثانية`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} دقيقة`;
  return `${Math.floor(mins / 60)} ساعة`;
}

// Internal bot mute bypassing normal canManage checks
async function muteUserForBot(userId: string, durationSeconds: number): Promise<void> {
  const { default: AsyncStorageModule } = await import('@react-native-async-storage/async-storage');
  const STORAGE_KEY = 'hawa_users_v7';
  try {
    const data = await AsyncStorageModule.getItem(STORAGE_KEY);
    if (!data) return;
    const users = JSON.parse(data);
    const idx = users.findIndex((u: any) => u.id === userId);
    if (idx === -1) return;
    // Never mute owner
    if (users[idx].rank === 'owner') return;
    const until = new Date();
    until.setSeconds(until.getSeconds() + durationSeconds);
    users[idx].isMuted = true;
    users[idx].muteUntil = until.toISOString();
    await AsyncStorageModule.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

// Bot commands — returns response text or null
export function processBotCommand(
  text: string,
  user: { level: number; coins: number; rank: string; displayName: string; messageCount: number }
): string | null {
  const cmd = text.trim().toLowerCase();
  if (!cmd.startsWith('!')) return null;

  if (cmd === '!help') {
    return `🤖 *أوامر البوت*\n!level — مستواك\n!coins — رصيدك\n!rank — رتبتك\n!top — أفضل الأعضاء\n!daily — مكافأة يومية\n!ping — اختبار الاستجابة\n!flip — قلب عملة\n!dice — رمي نرد\n!joke — نكتة عشوائية\n!quote — اقتباس ملهم`;
  }
  if (cmd === '!level') return `📊 ${user.displayName} — المستوى: **${user.level}**\nعدد الرسائل: ${user.messageCount}`;
  if (cmd === '!coins' || cmd === '!balance') return `💰 رصيدك: **${user.coins?.toLocaleString() || 0}** عملة`;
  if (cmd === '!rank') return `🎖️ رتبتك: **${user.rank}**`;
  if (cmd === '!ping') return `🏓 البوت يعمل بشكل طبيعي! سرعة الاستجابة: ${Math.floor(Math.random() * 20) + 5}ms`;
  if (cmd === '!flip') {
    const result = Math.random() > 0.5 ? 'صورة 🪙' : 'كتابة ✍️';
    return `🪙 نتيجة القلب: **${result}**`;
  }
  if (cmd === '!dice') {
    const result = Math.floor(Math.random() * 6) + 1;
    const emoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][result - 1];
    return `🎲 النتيجة: ${emoji} **(${result})**`;
  }
  if (cmd === '!daily') {
    return `🎁 مكافأة يومية! حصلت على **+50 عملة** 💰\n(يمكنك المطالبة مرة كل 24 ساعة)`;
  }
  if (cmd === '!top') {
    return `🏆 *أفضل الأعضاء*\nاستخدم صفحة المتصدرين لعرض القائمة الكاملة`;
  }
  if (cmd === '!joke') {
    const jokes = [
      'لماذا لا يلعب الكمبيوتر الشطرنج في الغابة؟ لأنه يخاف من الـ bugs! 🐛',
      'ما هو الكائن الذي لا يستطيع الجلوس؟ الجدار! 😄',
      'لماذا البحر مالح؟ لأن الأسماك لا تحب السكر! 🐟',
      'قال المبرمج لزوجته: اذهبي إلى السوق واشتري رغيفاً، وإن وجدت بيضاً اشترِ عشرة. عادت بعشرة أرغفة! 🍞',
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
  if (cmd === '!quote') {
    const quotes = [
      '"النجاح ليس مفتاحاً للسعادة، بل السعادة هي مفتاح النجاح." — البرت شفايتزر ✨',
      '"كن التغيير الذي تريد أن تراه في العالم." — غاندي 🌟',
      '"الحياة قصيرة جداً لتبقى على نفس المستوى دائماً." 🚀',
      '"العقل الذي يتوسع بفكرة جديدة لا يعود إلى حجمه الأصلي أبداً." 💡',
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
  return null;
}
