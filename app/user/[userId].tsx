// Powered by OnSpace.AI
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BorderRadius, FontSize, Spacing, RankColors, RankPermissions, RankLabels } from '@/constants/theme';
import {
  changePassword, canManageUser, muteUserTimed, unmuteUser,
  banUserTimed, unbanUser, kickUserTimed, unkickUser,
  giftFrameToUser, updateUser, assignRoomToUser,
} from '@/services/authService';
import { submitReport } from '@/services/chatService';
import { addReportNotification } from '@/services/reportNotifService';
import {
  notifyMuteLifted, notifyBanLifted, notifyWarning, notifyRankChanged,
  notifyGiftReceived,
} from '@/services/notificationService';
import { MUTE_DURATIONS, RANK_LIST } from '@/constants/config';
import { useAlert } from '@/template';
import { GIFT_FRAMES_DATA, GLOWING_NAME_COLORS } from '@/components/ui/AnimatedFrame';
import { getAllRanks } from '@/services/rankService';

const BAN_KICK_DURATIONS = [
  { label: '1 ساعة', minutes: 60 },
  { label: '6 ساعات', minutes: 360 },
  { label: '12 ساعة', minutes: 720 },
  { label: 'يوم', minutes: 1440 },
  { label: '3 أيام', minutes: 4320 },
  { label: 'أسبوع', minutes: 10080 },
  { label: 'شهر', minutes: 43200 },
  { label: 'دائم', minutes: -1 },
];

function isImageUri(avatar: string): boolean {
  return avatar.startsWith('file://') || avatar.startsWith('content://') ||
    avatar.startsWith('http') || avatar.startsWith('ph://');
}

function RankIcon({ emoji, size = 16 }: { emoji: string; size?: number }) {
  if (emoji && (emoji.startsWith('file://') || emoji.startsWith('http') || emoji.startsWith('/'))) {
    return <Image source={{ uri: emoji }} style={{ width: size + 4, height: size + 4, borderRadius: 4 }} contentFit="contain" />;
  }
  return <Text style={{ fontSize: size }}>{emoji || '🎖️'}</Text>;
}

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { currentUser, allUsers, deleteAvatar, renameUser, refreshAllUsers } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'info' | 'friends' | 'details'>('info');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showCommandsModal, setShowCommandsModal] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showKickModal, setShowKickModal] = useState(false);
  const [showGiftFrameModal, setShowGiftFrameModal] = useState(false);
  const [showGiftNameColorModal, setShowGiftNameColorModal] = useState(false);
  const [showChangeRankModal, setShowChangeRankModal] = useState(false);
  const [muteDuration, setMuteDuration] = useState(60);
  const [banDuration, setBanDuration] = useState(1440);
  const [kickDuration, setKickDuration] = useState(60);
  const [allRanks, setAllRanks] = useState<any[]>([]);

  const user = allUsers.find(u => u.id === userId);

  useEffect(() => { loadRanks(); }, []);

  async function loadRanks() {
    const ranks = await getAllRanks();
    setAllRanks(ranks);
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: FontSize.lg }}>المستخدم غير موجود</Text>
        <Button title="رجوع" onPress={() => router.back()} variant="outline" style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  const isOwner = currentUser?.rank === 'owner';
  const isMod = ['owner', 'high_admin', 'legend', 'admin', 'general_supervisor', 'guardian', 'moderator'].includes(currentUser?.rank || '');
  const canExecuteCommands = isMod && currentUser ? canManageUser(currentUser, user) : false;
  const canChangeRanksCheck = ['owner', 'high_admin', 'legend', 'admin'].includes(currentUser?.rank || '') && currentUser ? canManageUser(currentUser, user) : false;

  const canDeletePhoto = () => {
    if (!currentUser) return false;
    if (user.rank === 'owner') return false;
    return isMod;
  };

  const canRename = () => {
    if (!currentUser) return false;
    if (user.rank === 'owner' && currentUser.id !== user.id) return false;
    return ['owner', 'high_admin', 'legend', 'admin'].includes(currentUser.rank) && canManageUser(currentUser, user);
  };

  const canChangePassword = () => {
    if (!currentUser) return false;
    if (user.rank === 'owner') return false;
    return ['owner', 'high_admin', 'admin'].includes(currentUser.rank) && canManageUser(currentUser, user);
  };

  const handleDeletePhoto = () => {
    showAlert('🗑️ حذف الصورة', `هل تريد حذف صورة ${user.displayName}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        const result = await deleteAvatar(user.id);
        if (result.success) showAlert('تم ✅', 'تم حذف الصورة');
        else showAlert('خطأ', result.error || 'فشل الحذف');
      }},
    ]);
  };

  const handleRenameSubmit = async () => {
    if (!newName.trim()) return;
    const result = await renameUser(user.id, newName.trim());
    if (result.success) { setShowRenameModal(false); setNewName(''); showAlert('تم ✅', 'تم تغيير الاسم'); }
    else showAlert('خطأ', result.error || 'فشل');
  };

  const handleChangePasswordSubmit = async () => {
    if (!newPassword.trim() || newPassword.length < 4) { showAlert('خطأ', 'كلمة المرور يجب 4 أحرف على الأقل'); return; }
    if (!currentUser) return;
    const result = await changePassword(user.id, currentUser.id, newPassword);
    if (result.success) { setShowPasswordModal(false); setNewPassword(''); showAlert('تم ✅', `تم تغيير كلمة مرور ${user.displayName}`); }
    else showAlert('خطأ', result.error || 'فشل');
  };

  const handleMute = async () => {
    if (!currentUser) return;
    const result = await muteUserTimed(user.id, currentUser.id, muteDuration);
    if (result.success) {
      await refreshAllUsers();
      const durLabel = muteDuration === -1 ? 'دائم' : MUTE_DURATIONS.find(d => d.minutes === muteDuration)?.label || `${muteDuration} د`;
      showAlert('تم الكتم 🔇', `${user.displayName} مكتوم لمدة: ${durLabel}`);
      setShowMuteModal(false); setShowCommandsModal(false);
    } else showAlert('خطأ', result.error || 'فشل الكتم');
  };

  const handleUnmute = async () => {
    if (!currentUser) return;
    const result = await unmuteUser(user.id, currentUser.id);
    if (result.success) { await refreshAllUsers(); await notifyMuteLifted(user.id); showAlert('تم ✅', `رُفع الكتم عن ${user.displayName}`); setShowCommandsModal(false); }
    else showAlert('خطأ', result.error || 'فشل');
  };

  const handleBan = async () => {
    if (!currentUser) return;
    const result = await banUserTimed(user.id, currentUser.id, banDuration);
    if (result.success) {
      await refreshAllUsers();
      const durLabel = banDuration === -1 ? 'دائم' : BAN_KICK_DURATIONS.find(d => d.minutes === banDuration)?.label;
      showAlert('تم الحظر 🚫', `${user.displayName} محظور لمدة: ${durLabel}`);
      setShowBanModal(false); setShowCommandsModal(false);
    } else showAlert('خطأ', result.error || 'فشل');
  };

  const handleUnban = async () => {
    if (!currentUser) return;
    const result = await unbanUser(user.id, currentUser.id);
    if (result.success) { await refreshAllUsers(); await notifyBanLifted(user.id); showAlert('تم ✅', `رُفع الحظر عن ${user.displayName}`); setShowCommandsModal(false); }
    else showAlert('خطأ', result.error || 'فشل');
  };

  const handleKick = async () => {
    if (!currentUser) return;
    const result = await kickUserTimed(user.id, currentUser.id, kickDuration);
    if (result.success) {
      await refreshAllUsers();
      const durLabel = kickDuration === -1 ? 'دائم' : BAN_KICK_DURATIONS.find(d => d.minutes === kickDuration)?.label;
      showAlert('تم الطرد 👢', `${user.displayName} مطرود لمدة: ${durLabel}`);
      setShowKickModal(false); setShowCommandsModal(false);
    } else showAlert('خطأ', result.error || 'فشل');
  };

  const handleUnkick = async () => {
    if (!currentUser) return;
    const result = await unkickUser(user.id, currentUser.id);
    if (result.success) { await refreshAllUsers(); showAlert('تم ✅', `رُفع الطرد عن ${user.displayName}`); setShowCommandsModal(false); }
    else showAlert('خطأ', result.error || 'فشل');
  };

  const handleWarn = async () => {
    if (!currentUser) return;
    await notifyWarning(user.id, `تحذير من الإدارة (${currentUser.displayName}): يرجى الالتزام بقواعد المجتمع`);
    showAlert('تم إرسال التحذير ⚠️', `وصل تحذير إلى ${user.displayName}`);
    setShowCommandsModal(false);
  };

  const ALL_GIFT_FRAMES = GIFT_FRAMES_DATA;

  const handleGiftFrame = async (frameId: string) => {
    if (!currentUser || currentUser.rank !== 'owner') return;
    const result = await giftFrameToUser(user.id, currentUser.id, frameId);
    if (result.success) {
      await refreshAllUsers();
      const frame = ALL_GIFT_FRAMES.find(f => f.id === frameId);
      await notifyGiftReceived(user.id, currentUser.displayName, `إطار ${frame?.name || ''}`, frame?.emoji || '🎁');
      showAlert('تم 🎁', `تم إهداء "${frame?.name}" إلى ${user.displayName}`);
      setShowGiftFrameModal(false); setShowCommandsModal(false);
    } else showAlert('خطأ', result.error || 'فشل إهداء الإطار');
  };

  const handleGiftNameColor = async (colorId: string) => {
    if (!currentUser || currentUser.rank !== 'owner') return;
    const colorItem = GLOWING_NAME_COLORS.find(c => c.id === colorId);
    if (!colorItem) return;
    const result = await updateUser(user.id, { nameColor: colorItem.color });
    if (result) {
      await refreshAllUsers();
      await notifyGiftReceived(user.id, currentUser.displayName, `لون اسم مميز: ${colorItem.name}`, colorItem.emoji);
      showAlert('تم 🎨', `تم إهداء "${colorItem.name}" إلى ${user.displayName}`);
      setShowGiftNameColorModal(false); setShowCommandsModal(false);
    }
  };

  const handleChangeRank = async (rankId: string) => {
    if (!currentUser || !canChangeRanksCheck) return;
    await updateUser(user.id, { rank: rankId as any });
    await refreshAllUsers();
    const rankInfo = allRanks.find(r => r.id === rankId);
    await notifyRankChanged(user.id, rankInfo?.name || rankId, currentUser.displayName);
    showAlert('تم ✅', `تم تغيير رتبة ${user.displayName} إلى "${rankInfo?.name || rankId}"`);
    setShowChangeRankModal(false); setShowCommandsModal(false);
  };

  const handleReport = async () => {
    showAlert('الإبلاغ عن المستخدم', `هل تريد الإبلاغ عن ${user.displayName}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'إبلاغ', style: 'destructive', onPress: async () => {
        if (!currentUser) return;
        await submitReport(currentUser.id, currentUser.displayName, user.id, user.displayName, 'بلاغ من الملف الشخصي', 'سلوك مخالف');
        await addReportNotification('', user.displayName, currentUser.displayName, 'بلاغ من الملف الشخصي');
        showAlert('تم ✅', 'تم إرسال البلاغ — سيتم مراجعته');
      }},
    ]);
  };

  const genderLabel = user.gender === 'male' ? 'ذكر' : user.gender === 'female' ? 'أنثى' : 'آخر';
  const genderIcon = user.gender === 'male' ? '♂️' : user.gender === 'female' ? '♀️' : '⚧️';
  const genderColor = user.gender === 'male' ? '#2196F3' : user.gender === 'female' ? '#E91E8C' : '#9C27B0';

  const dynamicRankInfo = allRanks.find(r => r.id === user.rank);
  const rankPerms = dynamicRankInfo?.permissions || RankPermissions[user.rank] || [];
  const rankLabel = dynamicRankInfo?.name || RankLabels[user.rank] || user.rank;
  const rankColor = dynamicRankInfo?.color || RankColors[user.rank] || colors.primary;
  const rankEmoji = dynamicRankInfo?.emoji || '';

  const lastSeenLabel = user.isOnline ? 'متصل الآن' : `آخر ظهور: ${new Date(user.lastSeen).toLocaleDateString('ar')}`;
  const joinDate = new Date(user.joinedAt).toLocaleDateString('ar', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const DurationSelector = ({ selected, setSelected, durations }: { selected: number; setSelected: (m: number) => void; durations: { label: string; minutes: number }[] }) => (
    <ScrollView style={{ maxHeight: 250 }}>
      {durations.map(d => (
        <Pressable key={d.minutes} onPress={() => setSelected(d.minutes)} style={[styles.durRow, { backgroundColor: selected === d.minutes ? colors.warning + '22' : colors.surfaceElevated, borderColor: selected === d.minutes ? colors.warning : colors.border }]}>
          <Ionicons name={selected === d.minutes ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected === d.minutes ? colors.warning : colors.textMuted} />
          <Text style={[{ flex: 1, color: selected === d.minutes ? colors.warning : colors.text, fontWeight: selected === d.minutes ? '700' : '400', fontSize: FontSize.body, textAlign: 'right' }]}>{d.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const TABS = [
    { key: 'info', label: 'معلوماتي' },
    { key: 'friends', label: 'الأصدقاء' },
    { key: 'details', label: 'معلومات' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* ── Cover Header ── */}
        <View>
          <LinearGradient
            colors={user.profileGradient || ['#E91E8C', '#FF69B4', '#9C27B0']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.coverGradient, { paddingTop: insets.top + 4 }]}
          >
            {/* Header action buttons */}
            <View style={styles.headerTop}>
              <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
              <View style={styles.headerBtns}>
                {canExecuteCommands ? (
                  <Pressable onPress={() => setShowCommandsModal(true)} hitSlop={8} style={styles.hBtn}>
                    <Ionicons name="settings" size={18} color="#FFD700" />
                  </Pressable>
                ) : null}
                {canChangePassword() ? (
                  <Pressable onPress={() => setShowPasswordModal(true)} hitSlop={8} style={styles.hBtn}>
                    <Ionicons name="key-outline" size={18} color="#FFD700" />
                  </Pressable>
                ) : null}
                {canDeletePhoto() && isImageUri(user.avatar) ? (
                  <Pressable onPress={handleDeletePhoto} hitSlop={8} style={styles.hBtn}>
                    <Ionicons name="trash" size={18} color="#FF6B6B" />
                  </Pressable>
                ) : null}
                {canRename() ? (
                  <Pressable onPress={() => { setNewName(user.displayName); setShowRenameModal(true); }} hitSlop={8} style={styles.hBtn}>
                    <Ionicons name="pencil" size={18} color="#fff" />
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Rank label at top */}
            <View style={styles.rankTopRow}>
              <View style={[styles.rankTopChip, { backgroundColor: rankColor + '33', borderColor: rankColor }]}>
                <RankIcon emoji={rankEmoji} size={14} />
                <Text style={[styles.rankTopText, { color: rankColor }]}>{rankLabel}</Text>
              </View>
            </View>

            {/* Avatar and name side by side */}
            <View style={styles.profileRow}>
              <View style={styles.avatarWrapper}>
                <Avatar avatar={user.avatar} size={90} rank={user.rank} frame={user.frame} isOnline={user.isOnline} />
                {user.isOnline ? <View style={styles.onlineDot} /> : null}
              </View>
              <View style={styles.profileTextCol}>
                {/* Verified + Name */}
                <View style={styles.nameRowInline}>
                  <Text style={[styles.userName, { color: user.nameColor || '#FFFFFF' }]} numberOfLines={2}>
                    {user.badge || ''} {user.displayName}
                  </Text>
                  {user.isVerified ? <VerifiedBadge size={20} /> : null}
                </View>
                {/* Verified status text */}
                {user.isVerified ? (
                  <View style={styles.verifiedChip}>
                    <Ionicons name="checkmark-circle" size={13} color="#1DA1F2" />
                    <Text style={styles.verifiedText}>حساب مؤكد</Text>
                  </View>
                ) : null}
                {/* Bio preview */}
                <Text style={styles.bioPreview} numberOfLines={2}>
                  {user.bio || ''}
                </Text>
              </View>
            </View>

            {/* Status chips */}
            <View style={styles.statusRow}>
              {user.isMuted ? (
                <View style={[styles.statusChip, { backgroundColor: 'rgba(255,152,0,0.3)', borderColor: '#FF9800' }]}>
                  <Text style={{ color: '#FF9800', fontSize: 10, fontWeight: '700' }}>🔇 مكتوم</Text>
                </View>
              ) : null}
              {user.isBanned ? (
                <View style={[styles.statusChip, { backgroundColor: 'rgba(244,67,54,0.3)', borderColor: '#F44336' }]}>
                  <Text style={{ color: '#F44336', fontSize: 10, fontWeight: '700' }}>🚫 محظور</Text>
                </View>
              ) : null}
              {user.isKicked ? (
                <View style={[styles.statusChip, { backgroundColor: 'rgba(255,87,34,0.3)', borderColor: '#FF5722' }]}>
                  <Text style={{ color: '#FF5722', fontSize: 10, fontWeight: '700' }}>👢 مطرود</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>

          {/* ── Tabs ── */}
          <View style={[styles.tabsBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {TABS.map(t => (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key as any)}
                style={[styles.tabItem, activeTab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}
              >
                <Text style={[styles.tabLabel, { color: activeTab === t.key ? colors.primary : colors.textSecondary, fontWeight: activeTab === t.key ? '800' : '500' }]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sticky header end marker */}
        <View />

        {/* ── معلوماتي Tab ── */}
        {activeTab === 'info' ? (
          <View style={styles.tabContent}>
            {/* Level card */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={styles.highlightEmoji}>👑</Text>
              <Text style={[styles.highlightLabel, { color: colors.textSecondary }]}>المستوى الحالي : →</Text>
              <View style={styles.highlightBadge}>
                <Text style={[styles.highlightBadgeText, { color: '#fff' }]}>{user.level}</Text>
              </View>
            </View>

            {/* Coins card */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={styles.highlightEmoji}>💛</Text>
              <Text style={[styles.highlightLabel, { color: colors.textSecondary }]}>النقود الذهبية : →</Text>
              <View style={[styles.highlightBadge, { backgroundColor: '#FFD700' }]}>
                <Text style={[styles.highlightBadgeText, { color: '#000' }]}>{user.coins.toLocaleString()}</Text>
              </View>
            </View>

            {/* Info rows */}
            {[
              { icon: '📋', label: 'النـ ـوع', value: `${genderIcon} ${genderLabel}`, valueColor: genderColor },
              { icon: '💳', label: 'الـجوائـ ـز', value: String(user.giftsReceived || 0) },
              { icon: '📊', label: 'النـقـ ـاط', value: String(user.messageCount) },
              { icon: '✅', label: 'حالة الحساب', value: user.isVerified ? 'مؤكد' : 'عادي', valueColor: user.isVerified ? '#1DA1F2' : colors.textSecondary },
              { icon: '🌍', label: 'الـدولـ ـة', value: user.country || '🌍' },
              { icon: '📅', label: 'تاريخ الاشتراك', value: joinDate },
              { icon: '📨', label: 'الرومـ الحالي', value: user.assignedRoomId ? '🌐 الغرفة العامة' : '—' },
            ].map((row, i) => (
              <View key={i} style={[styles.infoRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Text style={[styles.infoValue, { color: row.valueColor || colors.text }]}>{row.value}</Text>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{row.label} {row.icon}</Text>
              </View>
            ))}

            {/* Bio / Status card */}
            <View style={[styles.bioCard, { backgroundColor: colors.surfaceCard, borderColor: colors.primary + '44', borderLeftColor: colors.primary }]}>
              <Text style={[styles.bioCardTitle, { color: colors.primary }]}>📩 الحالة</Text>
              <Text style={[styles.bioCardText, { color: colors.textSecondary }]}>{user.bio || 'لا يوجد وصف'}</Text>
            </View>

            {/* Private message button */}
            {currentUser?.id !== user.id ? (
              <Pressable
                onPress={() => router.push(`/private/${user.id}`)}
                style={[styles.dmBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="chatbubble" size={18} color="#fff" />
                <Text style={styles.dmBtnText}>💬 رسالة خاصة</Text>
              </Pressable>
            ) : null}

            {/* Report button */}
            {currentUser?.id !== user.id ? (
              <Pressable onPress={handleReport} style={[styles.reportBtn, { borderColor: colors.error + '66' }]}>
                <Ionicons name="flag-outline" size={16} color={colors.error} />
                <Text style={[styles.reportBtnText, { color: colors.error }]}>إبلاغ عن المستخدم</Text>
              </Pressable>
            ) : null}
          </View>
        ) : activeTab === 'friends' ? (
          <View style={styles.tabContent}>
            <View style={[styles.emptyState, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>لا يوجد أصدقاء بعد</Text>
            </View>
          </View>
        ) : (
          /* ── معلومات Tab ── */
          <View style={styles.tabContent}>
            {/* Stats */}
            <View style={[styles.statsGrid, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              {[
                { label: 'رسائل', value: user.messageCount.toLocaleString(), color: colors.primary, emoji: '💬' },
                { label: 'عملات', value: user.coins.toLocaleString(), color: '#FFD700', emoji: '💰' },
                { label: 'المستوى', value: `Lv.${user.level}`, color: colors.secondary, emoji: '📊' },
                { label: 'هدايا', value: String(user.giftsReceived || 0), color: '#E91E8C', emoji: '🎁' },
              ].map(s => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={{ fontSize: 20 }}>{s.emoji}</Text>
                  <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Rank & Permissions */}
            <View style={[styles.rankCard, { backgroundColor: colors.surfaceCard, borderColor: rankColor + '44' }]}>
              <View style={styles.rankCardHeader}>
                <RankIcon emoji={rankEmoji} size={24} />
                <Text style={[styles.rankCardTitle, { color: rankColor }]}>{rankLabel}</Text>
              </View>
              {rankPerms.length > 0 ? (
                <View style={styles.permsRow}>
                  {rankPerms.map((perm: string) => (
                    <View key={perm} style={[styles.permChip, { backgroundColor: rankColor + '22', borderColor: rankColor }]}>
                      <Text style={[styles.permText, { color: rankColor }]}>{perm}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Last seen */}
            <View style={[styles.infoRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={[styles.infoValue, { color: user.isOnline ? colors.success : colors.textSecondary }]}>{lastSeenLabel}</Text>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>الحالة 🔵</Text>
            </View>

            {/* Assigned room */}
            {user.assignedRoomId ? (
              <View style={[styles.infoRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Text style={[styles.infoValue, { color: colors.text }]}>🌐 {user.assignedRoomId}</Text>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>الغرفة المُكلَّف بها 🏠</Text>
              </View>
            ) : null}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── COMMANDS MODAL ── */}
      <Modal visible={showCommandsModal} transparent animationType="slide" onRequestClose={() => setShowCommandsModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowCommandsModal(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 50 }}>
              <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>⚡ أوامر: {user.displayName}</Text>

              {canChangeRanksCheck ? (
                <Pressable onPress={() => setShowChangeRankModal(true)} style={[styles.cmdBtn, { backgroundColor: '#9C27B022', borderColor: '#9C27B0' }]}>
                  <Ionicons name="ribbon" size={20} color="#9C27B0" />
                  <Text style={[styles.cmdText, { color: '#9C27B0' }]}>🎖️ تغيير الرتبة</Text>
                </Pressable>
              ) : null}

              {!user.isMuted ? (
                <Pressable onPress={() => setShowMuteModal(true)} style={[styles.cmdBtn, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
                  <Ionicons name="volume-mute" size={20} color={colors.warning} />
                  <Text style={[styles.cmdText, { color: colors.warning }]}>🔇 كتم مؤقت</Text>
                </Pressable>
              ) : (
                <Pressable onPress={handleUnmute} style={[styles.cmdBtn, { backgroundColor: colors.success + '22', borderColor: colors.success }]}>
                  <Ionicons name="volume-high" size={20} color={colors.success} />
                  <Text style={[styles.cmdText, { color: colors.success }]}>🔊 رفع الكتم</Text>
                </Pressable>
              )}

              {!user.isKicked ? (
                <Pressable onPress={() => setShowKickModal(true)} style={[styles.cmdBtn, { backgroundColor: '#FF572222', borderColor: '#FF5722' }]}>
                  <Ionicons name="exit-outline" size={20} color="#FF5722" />
                  <Text style={[styles.cmdText, { color: '#FF5722' }]}>👢 طرد مؤقت</Text>
                </Pressable>
              ) : (
                <Pressable onPress={handleUnkick} style={[styles.cmdBtn, { backgroundColor: colors.success + '22', borderColor: colors.success }]}>
                  <Ionicons name="enter-outline" size={20} color={colors.success} />
                  <Text style={[styles.cmdText, { color: colors.success }]}>✅ رفع الطرد</Text>
                </Pressable>
              )}

              {!user.isBanned ? (
                <Pressable onPress={() => setShowBanModal(true)} style={[styles.cmdBtn, { backgroundColor: colors.error + '22', borderColor: colors.error }]}>
                  <Ionicons name="ban" size={20} color={colors.error} />
                  <Text style={[styles.cmdText, { color: colors.error }]}>🚫 حظر</Text>
                </Pressable>
              ) : (
                <Pressable onPress={handleUnban} style={[styles.cmdBtn, { backgroundColor: colors.success + '22', borderColor: colors.success }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.cmdText, { color: colors.success }]}>✅ رفع الحظر</Text>
                </Pressable>
              )}

              <Pressable onPress={handleWarn} style={[styles.cmdBtn, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text style={[styles.cmdText, { color: colors.warning }]}>⚠️ إرسال تحذير</Text>
              </Pressable>

              {isOwner ? (
                <Pressable onPress={() => setShowGiftFrameModal(true)} style={[styles.cmdBtn, { backgroundColor: '#FFD70022', borderColor: '#FFD700' }]}>
                  <Ionicons name="gift" size={20} color="#FFD700" />
                  <Text style={[styles.cmdText, { color: '#FFD700' }]}>🎁 إهداء إطار VIP</Text>
                </Pressable>
              ) : null}

              {isOwner ? (
                <Pressable onPress={() => setShowGiftNameColorModal(true)} style={[styles.cmdBtn, { backgroundColor: '#E91E8C22', borderColor: '#E91E8C' }]}>
                  <Ionicons name="color-palette" size={20} color="#E91E8C" />
                  <Text style={[styles.cmdText, { color: '#E91E8C' }]}>🎨 إهداء اسم مضيء</Text>
                </Pressable>
              ) : null}

              <Button title="إغلاق" onPress={() => setShowCommandsModal(false)} variant="ghost" />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── CHANGE RANK MODAL ── */}
      <Modal visible={showChangeRankModal} transparent animationType="slide" onRequestClose={() => setShowChangeRankModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowChangeRankModal(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={{ padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 50 }}>
              <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>🎖️ تغيير رتبة {user.displayName}</Text>
              <ScrollView style={{ maxHeight: 320 }}>
                {allRanks.filter(r => r.id !== 'owner').map(rank => (
                  <Pressable key={rank.id} onPress={() => handleChangeRank(rank.id)} style={[styles.rankRow, { backgroundColor: user.rank === rank.id ? rank.color + '22' : colors.surfaceElevated, borderColor: user.rank === rank.id ? rank.color : colors.border }]}>
                    <RankIcon emoji={rank.emoji} size={18} />
                    <Text style={[{ flex: 1, color: user.rank === rank.id ? rank.color : colors.text, fontWeight: user.rank === rank.id ? '800' : '500', fontSize: FontSize.body, textAlign: 'right' }]}>{rank.name}</Text>
                    {user.rank === rank.id ? <Ionicons name="checkmark-circle" size={18} color={rank.color} /> : null}
                  </Pressable>
                ))}
              </ScrollView>
              <Button title="إغلاق" onPress={() => setShowChangeRankModal(false)} variant="outline" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MUTE DURATION ── */}
      <Modal visible={showMuteModal} transparent animationType="fade" onRequestClose={() => setShowMuteModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>🔇 مدة الكتم</Text>
            <DurationSelector selected={muteDuration} setSelected={setMuteDuration} durations={MUTE_DURATIONS} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button title="كتم" onPress={handleMute} style={{ flex: 1 }} />
              <Button title="إلغاء" onPress={() => setShowMuteModal(false)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── BAN DURATION ── */}
      <Modal visible={showBanModal} transparent animationType="fade" onRequestClose={() => setShowBanModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>🚫 مدة الحظر</Text>
            <DurationSelector selected={banDuration} setSelected={setBanDuration} durations={BAN_KICK_DURATIONS} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button title="حظر" onPress={handleBan} style={{ flex: 1 }} />
              <Button title="إلغاء" onPress={() => setShowBanModal(false)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── KICK DURATION ── */}
      <Modal visible={showKickModal} transparent animationType="fade" onRequestClose={() => setShowKickModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>👢 مدة الطرد</Text>
            <DurationSelector selected={kickDuration} setSelected={setKickDuration} durations={BAN_KICK_DURATIONS} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Button title="طرد" onPress={handleKick} style={{ flex: 1 }} />
              <Button title="إلغاء" onPress={() => setShowKickModal(false)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── GIFT FRAME MODAL ── */}
      <Modal visible={showGiftFrameModal} transparent animationType="fade" onRequestClose={() => setShowGiftFrameModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>🎁 إهداء إطار ({ALL_GIFT_FRAMES.length})</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {ALL_GIFT_FRAMES.map(f => (
                <Pressable key={f.id} onPress={() => handleGiftFrame(f.id)} style={[styles.frameGiftRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.frameColorPreview, { backgroundColor: f.colors[0] + '33', borderColor: f.colors[0] }]}>
                    <Text style={{ fontSize: 16 }}>{f.emoji}</Text>
                  </View>
                  <Text style={[{ flex: 1, color: colors.text, fontWeight: '600', textAlign: 'right', fontSize: FontSize.sm }]}>{f.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {f.colors.slice(0, 3).map((c, i) => (
                      <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c }} />
                    ))}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <Button title="إلغاء" onPress={() => setShowGiftFrameModal(false)} variant="outline" />
          </View>
        </View>
      </Modal>

      {/* ── GIFT NAME COLOR MODAL ── */}
      <Modal visible={showGiftNameColorModal} transparent animationType="fade" onRequestClose={() => setShowGiftNameColorModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>🎨 إهداء اسم مضيء</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {GLOWING_NAME_COLORS.map(c => (
                <Pressable key={c.id} onPress={() => handleGiftNameColor(c.id)} style={[styles.frameGiftRow, { backgroundColor: colors.surfaceElevated, borderColor: c.color + '44' }]}>
                  <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
                  <Text style={[{ flex: 1, fontWeight: '700', textAlign: 'right', fontSize: FontSize.sm, color: c.color }]}>{c.name}</Text>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.color }} />
                </Pressable>
              ))}
            </ScrollView>
            <Button title="إلغاء" onPress={() => setShowGiftNameColorModal(false)} variant="outline" />
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' }]}>✏️ تغيير اسم {user.displayName}</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]} value={newName} onChangeText={setNewName} placeholder="الاسم الجديد" placeholderTextColor={colors.textMuted} textAlign="right" autoFocus />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button title="تغيير" onPress={handleRenameSubmit} style={{ flex: 1 }} />
              <Button title="إلغاء" onPress={() => setShowRenameModal(false)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' }]}>🔐 تغيير كلمة سر {user.displayName}</Text>
            <View style={[styles.passRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TextInput style={[{ flex: 1, color: colors.text, fontSize: FontSize.body }]} value={newPassword} onChangeText={setNewPassword} placeholder="كلمة المرور الجديدة" placeholderTextColor={colors.textMuted} secureTextEntry={!showNewPass} textAlign="right" autoFocus />
              <Pressable onPress={() => setShowNewPass(s => !s)} hitSlop={8}>
                <Ionicons name={showNewPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button title="تغيير" onPress={handleChangePasswordSubmit} style={{ flex: 1 }} />
              <Button title="إلغاء" onPress={() => { setShowPasswordModal(false); setNewPassword(''); }} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverGradient: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.xs,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtns: { flexDirection: 'row', gap: Spacing.xs },
  hBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankTopRow: { alignItems: 'center', marginBottom: Spacing.xs },
  rankTopChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  rankTopText: { fontSize: FontSize.sm, fontWeight: '700' },
  profileRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  avatarWrapper: { position: 'relative' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#fff',
  },
  profileTextCol: { flex: 1, gap: 5 },
  nameRowInline: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: {
    fontSize: 22, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(29,161,242,0.2)',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.full, alignSelf: 'flex-start',
  },
  verifiedText: { color: '#1DA1F2', fontSize: 11, fontWeight: '700' },
  bioPreview: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.xs, lineHeight: 18 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  statusChip: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13,
  },
  tabLabel: { fontSize: FontSize.sm },
  tabContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },
  highlightCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    borderWidth: 1, gap: Spacing.sm,
  },
  highlightEmoji: { fontSize: 22 },
  highlightLabel: { flex: 1, fontSize: FontSize.body, textAlign: 'right' },
  highlightBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    minWidth: 60, alignItems: 'center',
  },
  highlightBadgeText: { fontSize: FontSize.body, fontWeight: '800' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 13,
    borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  infoLabel: { fontSize: FontSize.body, fontWeight: '600' },
  infoValue: { fontSize: FontSize.body, fontWeight: '600' },
  bioCard: {
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderLeftWidth: 4, gap: 8,
  },
  bioCardTitle: { fontSize: FontSize.body, fontWeight: '800', textAlign: 'right' },
  bioCardText: { fontSize: FontSize.body, lineHeight: 26, textAlign: 'right' },
  dmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  dmBtnText: { color: '#fff', fontSize: FontSize.body, fontWeight: '700' },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg,
    borderWidth: 1, marginBottom: Spacing.md,
  },
  reportBtnText: { fontSize: FontSize.sm, fontWeight: '700' },
  emptyState: {
    alignItems: 'center', padding: Spacing.xl * 2,
    borderRadius: BorderRadius.lg, borderWidth: 1, marginTop: Spacing.md,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.body },
  statsGrid: {
    flexDirection: 'row', borderRadius: BorderRadius.lg, borderWidth: 1,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    gap: 3, borderRightWidth: 1, borderRightColor: 'rgba(128,128,128,0.2)',
  },
  statNum: { fontSize: FontSize.sm, fontWeight: '800' },
  statLbl: { fontSize: 10 },
  rankCard: {
    padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm,
  },
  rankCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rankCardTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  permsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  permChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  permText: { fontSize: FontSize.xs, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '85%', paddingTop: Spacing.md },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  centeredOverlay: { flex: 1, backgroundColor: '#00000090', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  centeredCard: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  input: { borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md, fontSize: FontSize.body },
  passRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, height: 48 },
  cmdBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  cmdText: { fontSize: FontSize.body, fontWeight: '700', flex: 1, textAlign: 'right' },
  durRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 4 },
  frameGiftRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 4 },
  frameColorPreview: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 4 },
});
