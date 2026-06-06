// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ScrollView,
  TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge, VerifiedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  User, updateUser, getAllUsers, deleteUserAvatar,
  changeDisplayName, setUserLevel, verifyUser,
  canManageUser, muteUserTimed, unmuteUser, changePassword,
  assignRoomToUser,
} from '@/services/authService';
import { getReports, resolveReport, Report, getRooms } from '@/services/chatService';
import { getEffectiveStoreItems, updateStoreItemPrice, resetStoreItemPrice, toggleStoreLock } from '@/services/storeService';
import { BorderRadius, FontSize, Spacing, RankLabels, RankColors } from '@/constants/theme';
import { RANK_LIST, BANNED_WORDS, MUTE_DURATIONS } from '@/constants/config';
import {
  getReportNotifications, resolveReportNotification, markAllReportNotifsRead,
  getUnreadReportNotifCount, ReportNotification,
} from '@/services/reportNotifService';
import {
  getNews, createNewsPost, togglePinPost, deleteNewsPost, likeNewsPost,
  NewsPost, NEWS_TYPE_CONFIG, NEWS_PRIORITY_CONFIG,
} from '@/services/newsService';
import { notifyNewsPublished } from '@/services/notificationService';
import { getAllRanks, CustomRank } from '@/services/rankService';
import { useAlert } from '@/template';

const ADMIN_TABS = ['الأعضاء', 'البلاغات', 'المتجر', 'الأخبار', 'الغرف', 'إحصائيات'];

// Helper: render rank emoji or image URI
function RankIcon({ emoji, size = 14 }: { emoji: string; size?: number }) {
  if (emoji && (emoji.startsWith('file://') || emoji.startsWith('http') || emoji.startsWith('/'))) {
    return <Image source={{ uri: emoji }} style={{ width: size + 4, height: size + 4, borderRadius: 4 }} contentFit="contain" />;
  }
  return <Text style={{ fontSize: size }}>{emoji || '🎖️'}</Text>;
}
const NEWS_TYPES: NewsPost['type'][] = ['announcement', 'event', 'warning', 'celebration', 'news'];
const NEWS_PRIORITIES: NewsPost['priority'][] = ['normal', 'high', 'urgent'];

export default function AdminScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentUser, allUsers, refreshAllUsers } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState(tab ? parseInt(tab) : 0);

  useEffect(() => {
    if (tab !== undefined) setActiveTab(parseInt(tab));
  }, [tab]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportNotifs, setReportNotifs] = useState<ReportNotification[]>([]);
  const [unreadReportCount, setUnreadReportCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [levelInput, setLevelInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [editPriceModal, setEditPriceModal] = useState<{ visible: boolean; item: any | null }>({ visible: false, item: null });
  const [newPrice, setNewPrice] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showNewPassAdmin, setShowNewPassAdmin] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [muteDuration, setMuteDuration] = useState<number>(60);
  const [allRanks, setAllRanks] = useState<CustomRank[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [showAssignRoomModal, setShowAssignRoomModal] = useState(false);

  // News
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [showNewsCreate, setShowNewsCreate] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsEmoji, setNewsEmoji] = useState('📢');
  const [newsType, setNewsType] = useState<NewsPost['type']>('announcement');
  const [newsPriority, setNewsPriority] = useState<NewsPost['priority']>('normal');

  // Report detail modal
  const [showReportDetail, setShowReportDetail] = useState<ReportNotification | null>(null);

  const isOwner = currentUser?.rank === 'owner';
  const isHighAdmin = ['owner', 'high_admin'].includes(currentUser?.rank || '');
  const isAdmin = ['owner', 'high_admin', 'legend', 'admin'].includes(currentUser?.rank || '');
  const canChangeRanks = ['owner', 'high_admin', 'legend', 'admin'].includes(currentUser?.rank || '');
  const canDeletePhotos = ['owner', 'high_admin', 'legend', 'admin', 'general_supervisor', 'guardian', 'moderator'].includes(currentUser?.rank || '');
  const canEditPrices = ['owner', 'high_admin', 'legend', 'admin'].includes(currentUser?.rank || '');
  const canPostNews = ['owner', 'high_admin', 'legend', 'admin'].includes(currentUser?.rank || '');
  const canMute = ['owner', 'high_admin', 'legend', 'admin', 'general_supervisor', 'guardian', 'moderator'].includes(currentUser?.rank || '');

  useEffect(() => {
    loadReports(); loadStoreItems(); loadNews(); loadReportNotifs(); loadAllRanks(); loadRooms();
  }, []);

  async function loadAllRanks() {
    const ranks = await getAllRanks();
    setAllRanks(ranks);
  }

  async function loadRooms() {
    const r = await getRooms();
    setRooms(r);
  }

  async function loadReports() { const r = await getReports(); setReports(r); }
  async function loadReportNotifs() {
    const notifs = await getReportNotifications();
    setReportNotifs(notifs);
    const count = await getUnreadReportNotifCount();
    setUnreadReportCount(count);
    await markAllReportNotifsRead();
  }
  async function loadStoreItems() { const items = await getEffectiveStoreItems(); setStoreItems(items); }
  async function loadNews() { const posts = await getNews(); setNewsPosts(posts); }

  async function handleDeletePhoto(user: User) {
    if (!currentUser) return;
    if (user.rank === 'owner') { showAlert('محظور', 'لا يمكن حذف صورة المالك'); return; }
    showAlert('حذف الصورة', `حذف صورة ${user.displayName}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        const result = await deleteUserAvatar(user.id, currentUser.id);
        if (result.success) { await refreshAllUsers(); showAlert('تم ✅', 'تم حذف الصورة'); setShowUserModal(false); }
        else showAlert('خطأ', result.error || 'فشل');
      }},
    ]);
  }

  async function handleVerify(user: User) {
    if (!isOwner) { showAlert('محظور', 'فقط المالك يمكنه توثيق الحسابات'); return; }
    const result = await verifyUser(user.id, currentUser!.id);
    if (result.success) { await refreshAllUsers(); showAlert(result.isVerified ? 'تم التوثيق ✅' : 'إلغاء التوثيق', `${user.displayName}`); setShowUserModal(false); }
  }

  async function handleMuteTimed() {
    if (!currentUser || !selectedUser) return;
    const result = await muteUserTimed(selectedUser.id, currentUser.id, muteDuration);
    if (result.success) {
      await refreshAllUsers();
      const durLabel = muteDuration === -1 ? 'دائم' : MUTE_DURATIONS.find(d => d.minutes === muteDuration)?.label || `${muteDuration} دقيقة`;
      showAlert('تم الكتم 🔇', `${selectedUser.displayName} مكتوم لمدة: ${durLabel}`);
      setShowMuteModal(false); setShowUserModal(false);
    } else showAlert('خطأ', result.error || 'فشل الكتم');
  }

  async function handleUnmute(user: User) {
    if (!currentUser) return;
    const result = await unmuteUser(user.id, currentUser.id);
    if (result.success) { await refreshAllUsers(); showAlert('تم ✅', `رُفع الكتم عن ${user.displayName}`); setShowUserModal(false); }
    else showAlert('خطأ', result.error || 'فشل');
  }

  async function handleAction(action: string, user: User) {
    if (!currentUser || !canManageUser(currentUser, user)) { showAlert('محظور', 'لا تملك صلاحية تعديل هذا العضو'); return; }
    if (action === 'ban') await updateUser(user.id, { isBanned: !user.isBanned });
    if (action === 'kick') await updateUser(user.id, { isOnline: false });
    await refreshAllUsers();
    showAlert('تم ✅', action === 'ban' ? (user.isBanned ? 'رُفع الحظر' : 'حُظر') : 'طُرد');
    setShowUserModal(false);
  }

  async function handleRankChange(user: User, rankId: string) {
    if (!canChangeRanks || !currentUser || !canManageUser(currentUser, user)) return;
    await updateUser(user.id, { rank: rankId as User['rank'] });
    await refreshAllUsers();
    const rankInfo = allRanks.find(r => r.id === rankId);
    showAlert('تم ✅', `رتبة ${user.displayName} → ${rankInfo?.name || rankId}`);
    setShowUserModal(false);
  }

  async function handleChangeUsername() {
    if (!selectedUser || !newUsername.trim() || !currentUser) return;
    const result = await changeDisplayName(selectedUser.id, currentUser.id, newUsername.trim());
    if (result.success) { await refreshAllUsers(); setNewUsername(''); showAlert('تم ✅', 'تم تغيير الاسم'); setShowUserModal(false); }
    else showAlert('خطأ', result.error || 'فشل');
  }

  async function handleCoinsAction(add: boolean) {
    if (!selectedUser || !coinsAmount || !isOwner) return;
    const amount = parseInt(coinsAmount);
    if (isNaN(amount) || amount <= 0) return;
    const newCoins = add ? selectedUser.coins + amount : Math.max(0, selectedUser.coins - amount);
    await updateUser(selectedUser.id, { coins: newCoins });
    await refreshAllUsers(); setCoinsAmount('');
    showAlert('تم ✅', `${add ? 'أُضيف' : 'خُصم'} ${amount} عملة`); setShowUserModal(false);
  }

  async function handleLevelSet() {
    if (!selectedUser || !levelInput || !currentUser) return;
    const lvl = parseInt(levelInput);
    if (isNaN(lvl) || lvl < 1 || lvl > 99999) { showAlert('خطأ', 'أدخل مستوى بين 1 و 99999'); return; }
    const result = await setUserLevel(selectedUser.id, currentUser.id, lvl);
    if (result.success) { await refreshAllUsers(); setLevelInput(''); showAlert('تم ✅', `مستوى ${selectedUser.displayName} → ${lvl}`); setShowUserModal(false); }
    else showAlert('خطأ', result.error || 'فشل');
  }

  async function handleAdminPasswordChange() {
    if (!selectedUser || !newAdminPassword.trim() || !currentUser) return;
    const result = await changePassword(selectedUser.id, currentUser.id, newAdminPassword.trim());
    if (result.success) {
      await refreshAllUsers(); setNewAdminPassword(''); setShowPasswordSection(false);
      showAlert('تم ✅', `تم تغيير كلمة سر ${selectedUser.displayName}`); setShowUserModal(false);
    } else showAlert('خطأ', result.error || 'فشل');
  }

  async function handleEditPrice() {
    if (!editPriceModal.item || !newPrice || !currentUser) return;
    const price = parseInt(newPrice);
    if (isNaN(price) || price < 0) { showAlert('خطأ', 'سعر غير صحيح'); return; }
    const result = await updateStoreItemPrice(editPriceModal.item.id, price, currentUser.id, currentUser.rank);
    if (result.success) { await loadStoreItems(); setEditPriceModal({ visible: false, item: null }); setNewPrice(''); showAlert('تم ✅', `تم تحديث سعر "${editPriceModal.item.name}"`); }
    else showAlert('خطأ', result.error);
  }

  async function handleResetPrice(item: any) { await resetStoreItemPrice(item.id); await loadStoreItems(); }

  async function handleResolveReportNotif(notif: ReportNotification, action: ReportNotification['action']) {
    await resolveReportNotification(notif.id, currentUser!.displayName, action);
    await loadReportNotifs();
    setShowReportDetail(null);
    showAlert('تم ✅', `تم التعامل مع البلاغ`);
  }

  async function handleCreateNews() {
    if (!newsTitle.trim() || !newsContent.trim()) { showAlert('خطأ', 'أدخل العنوان والمحتوى'); return; }
    if (!currentUser) return;
    const result = await createNewsPost(
      currentUser.id, currentUser.displayName, currentUser.avatar, currentUser.rank,
      newsTitle, newsContent, newsEmoji, newsType, newsPriority
    );
    if (result.success) {
      // Notify all users about new news
      const allUsersData = await getAllUsers();
      const userIds = allUsersData.map(u => u.id);
      await notifyNewsPublished(userIds, currentUser.displayName, newsTitle, newsEmoji, result.post?.id || '');

      await loadNews();
      setShowNewsCreate(false);
      setNewsTitle(''); setNewsContent(''); setNewsEmoji('📢'); setNewsType('announcement'); setNewsPriority('normal');
      showAlert('تم النشر! 📢', 'تم نشر الخبر وإرسال إشعارات لجميع الأعضاء');
    } else showAlert('خطأ', result.error || 'فشل');
  }

  async function handleAssignRoom(targetUserId: string, roomId: string | null) {
    if (!currentUser) return;
    const result = await assignRoomToUser(targetUserId, currentUser.id, roomId);
    if (result.success) {
      await refreshAllUsers();
      const room = rooms.find(r => r.id === roomId);
      showAlert('تم ✅', roomId ? `تم تعيين غرفة "${room?.name || roomId}"` : 'تم إلغاء تعيين الغرفة');
      setShowAssignRoomModal(false); setShowUserModal(false);
    } else showAlert('خطأ', result.error || 'فشل');
  }

  const filteredUsers = allUsers.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingReports = reports.filter(r => !r.isResolved).length;
  const unresolvedNotifs = reportNotifs.filter(n => !n.isResolved).length;

  const renderMember = ({ item }: { item: User }) => {
    const rankInfo = allRanks.find(r => r.id === item.rank);
    return (
      <Pressable
        onPress={() => { setSelectedUser(item); setNewUsername(''); setCoinsAmount(''); setLevelInput(''); setNewAdminPassword(''); setShowPasswordSection(false); setShowUserModal(true); }}
        style={[styles.memberCard, {
          backgroundColor: colors.surfaceCard,
          borderColor: item.isBanned ? colors.error : item.isMuted ? colors.warning : item.isVerified ? colors.success + '55' : colors.border,
        }]}
      >
        <Avatar avatar={item.avatar} size={44} rank={item.rank} frame={item.frame} isOnline={item.isOnline} />
        <View style={styles.memberInfo}>
          <View style={styles.memberTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <Text style={[styles.memberName, { color: item.nameColor || colors.text }]} numberOfLines={1}>
                {item.badge || ''} {item.displayName}
              </Text>
              {item.isVerified ? <VerifiedBadge size={14} /> : null}
            </View>
            {/* Dynamic rank badge - supports image URIs */}
            <View style={[styles.rankChip, { backgroundColor: (rankInfo?.color || '#9C27B0') + '22', borderColor: rankInfo?.color || '#9C27B0' }]}>
              <RankIcon emoji={rankInfo?.emoji || '👤'} size={11} />
              <Text style={[{ color: rankInfo?.color || '#9C27B0', fontSize: 10, fontWeight: '700' }]}>
                {rankInfo?.name || item.rank}
              </Text>
            </View>
          </View>
          <Text style={[styles.memberSub, { color: colors.textMuted }]}>
            @{item.username} · Lv.{item.level} · {item.messageCount} رسالة · {item.coins} 💰
          </Text>
          {(item.isMuted || item.isBanned) ? (
            <Text style={[{ color: item.isBanned ? colors.error : colors.warning, fontSize: FontSize.xs, fontWeight: '600' }]}>
              {item.isBanned ? '🚫 محظور' : `🔇 مكتوم${item.muteUntil ? ` حتى ${new Date(item.muteUntil).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}` : ' دائم'}`}
            </Text>
          ) : null}
          {item.assignedRoomId ? (
            <Text style={[{ color: colors.accent, fontSize: FontSize.xs }]}>
              🏠 {rooms.find(r => r.id === item.assignedRoomId)?.name || item.assignedRoomId}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
    );
  };

  const renderReportNotif = ({ item }: { item: ReportNotification }) => (
    <Pressable
      onPress={() => setShowReportDetail(item)}
      style={[styles.reportCard, { backgroundColor: colors.surfaceCard, borderColor: item.isResolved ? colors.success : colors.error }]}
    >
      <View style={styles.reportHeader}>
        <Text style={[styles.reportTitle, { color: colors.text }]}>🚨 {item.reportedUserName}</Text>
        <Text style={[{ color: item.isResolved ? colors.success : colors.error, fontSize: FontSize.xs, fontWeight: '700' }]}>
          {item.isResolved ? `✓ ${item.action}` : '⚠️ معلق — اضغط للتفاصيل'}
        </Text>
      </View>
      <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontStyle: 'italic' }]} numberOfLines={2}>
        "{item.messageText.substring(0, 80)}"
      </Text>
      <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>
        مُبلِّغ: {item.reporterName} · {new Date(item.timestamp).toLocaleDateString('ar')}
      </Text>
    </Pressable>
  );

  const renderNewsPost = ({ item }: { item: NewsPost }) => {
    const typeConfig = NEWS_TYPE_CONFIG[item.type];
    return (
      <View style={[styles.newsCard, { backgroundColor: colors.surfaceCard, borderColor: item.isPinned ? colors.accent : typeConfig.color + '55', borderLeftWidth: item.isPinned ? 4 : 1 }]}>
        <View style={styles.newsHeader}>
          <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.newsTitle, { color: colors.text }]}>{item.title}</Text>
              {item.isPinned ? <Ionicons name="pin" size={12} color={colors.accent} /> : null}
            </View>
            <View style={[styles.newsBadge, { backgroundColor: typeConfig.color + '22', borderColor: typeConfig.color, alignSelf: 'flex-start', marginTop: 2 }]}>
              <Text style={[styles.newsBadgeText, { color: typeConfig.color }]}>{typeConfig.emoji} {typeConfig.label}</Text>
            </View>
          </View>
          {canPostNews ? (
            <View style={{ gap: 4 }}>
              <Pressable onPress={() => togglePinPost(item.id, currentUser!.id, currentUser!.rank).then(loadNews)} hitSlop={6}>
                <Ionicons name={item.isPinned ? 'pin' : 'pin-outline'} size={16} color={colors.accent} />
              </Pressable>
              <Pressable onPress={() => deleteNewsPost(item.id, currentUser!.id, currentUser!.rank).then(loadNews)} hitSlop={6}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </Pressable>
            </View>
          ) : null}
        </View>
        <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22, textAlign: 'right' }]}>{item.content}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{item.authorName} · {new Date(item.timestamp).toLocaleDateString('ar')}</Text>
          <Pressable onPress={() => likeNewsPost(item.id, currentUser!.id).then(loadNews)} style={styles.likeBtn}>
            <Ionicons name={item.likes?.includes(currentUser?.id || '') ? 'heart' : 'heart-outline'} size={16} color={item.likes?.includes(currentUser?.id || '') ? '#E91E8C' : colors.textMuted} />
            <Text style={[{ fontSize: FontSize.xs, color: colors.textMuted }]}>{item.likes?.length || 0}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const handleToggleLock = async (item: any) => {
    if (!currentUser || !isOwner) return;
    const result = await toggleStoreLock(item.id, currentUser.id, currentUser.rank);
    if (result.success) {
      await loadStoreItems();
      showAlert(result.isLocked ? '🔒 تم القفل' : '🔓 تم الفتح', `"${item.name}" ${result.isLocked ? 'لا يمكن للأعضاء شراؤه الآن' : 'متاح للشراء مجدداً'}`);
    } else showAlert('خطأ', result.error || 'فشل');
  };

  const renderRoom = ({ item }: { item: any }) => {
    const assignedUsers = allUsers.filter(u => u.assignedRoomId === item.id);
    return (
      <View style={[styles.roomCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 }}>
          <View style={[styles.roomIcon, { backgroundColor: colors.primary + '22' }]}>
            <Text style={{ fontSize: 22 }}>{item.isLocked ? '🔒' : '💬'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[{ color: colors.text, fontWeight: '700', fontSize: FontSize.body }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>
              {assignedUsers.length > 0 ? `${assignedUsers.length} مُعيَّن` : 'لا يوجد مُعيَّن'}
              {item.isLocked ? ' · مقفلة' : ''}
            </Text>
            {assignedUsers.length > 0 ? (
              <Text style={[{ color: colors.accent, fontSize: FontSize.xs }]}>
                {assignedUsers.map(u => u.displayName).join('، ')}
              </Text>
            ) : null}
          </View>
        </View>
        {isAdmin ? (
          <Pressable
            onPress={() => { setSelectedUser(null); setShowAssignRoomModal(true); router.push(`/chat/${item.id}`); }}
            style={[styles.iconBtn, { backgroundColor: colors.primary + '22' }]}
          >
            <Ionicons name="person-add" size={16} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    );
  };

  const onlineCount = allUsers.filter(u => u.isOnline).length;
  const totalMessages = allUsers.reduce((s, u) => s + u.messageCount, 0);
  const bannedCount = allUsers.filter(u => u.isBanned).length;
  const mutedCount = allUsers.filter(u => u.isMuted).length;
  const verifiedCount = allUsers.filter(u => u.isVerified).length;
  const vipCount = allUsers.filter(u => ['vip', 'legend', 'star', 'vip_char', 'chat_legend', 'high_admin'].includes(u.rank)).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#AD1457', '#E91E8C', '#9C27B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>🛡️ لوحة التحكم</Text>
          <Text style={styles.headerSub}>{isOwner ? '👑 المالك — صلاحيات مطلقة' : allRanks.find(r => r.id === currentUser?.rank)?.name || ''}</Text>
        </View>
        {unresolvedNotifs > 0 ? (
          <View style={styles.notifBadge}>
            <Ionicons name="alert-circle" size={16} color="#fff" />
            <Text style={styles.notifBadgeText}>{unresolvedNotifs}</Text>
          </View>
        ) : null}
        <Pressable onPress={() => { refreshAllUsers(); loadAllRanks(); loadRooms(); }} hitSlop={8}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </Pressable>
      </LinearGradient>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsScroll, { backgroundColor: colors.surface, borderBottomColor: colors.border }]} contentContainerStyle={styles.tabsContent}>
        {ADMIN_TABS.map((tab, i) => (
          <Pressable key={tab} onPress={() => setActiveTab(i)} style={[styles.tab, activeTab === i && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: activeTab === i ? colors.primary : colors.textMuted }]}>
              {tab}{i === 1 && unresolvedNotifs > 0 ? ` (${unresolvedNotifs})` : ''}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Members ── */}
      {activeTab === 0 ? (
        <>
          <View style={[styles.searchWrap, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder="بحث عن عضو..." placeholderTextColor={colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} textAlign="right" />
          </View>
          <FlatList data={filteredUsers} keyExtractor={item => item.id} renderItem={renderMember} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }} showsVerticalScrollIndicator={false} />
        </>
      ) : activeTab === 1 ? (
        <FlatList
          data={reportNotifs} keyExtractor={item => item.id} renderItem={renderReportNotif}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyEmoji}>✅</Text><Text style={[{ color: colors.textSecondary, fontSize: FontSize.body }]}>لا توجد بلاغات</Text></View>}
        />
      ) : activeTab === 2 ? (
        <FlatList
          data={storeItems} keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.storeRow, { backgroundColor: colors.surfaceCard, borderColor: item.isModified ? colors.accent : colors.border }]}>
              <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[{ color: colors.text, fontWeight: '700', fontSize: FontSize.sm }]} numberOfLines={1}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[{ color: colors.accent, fontWeight: '800' }]}>{item.cost} 💰</Text>
                    {item.isModified ? <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs, textDecorationLine: 'line-through' }]}>{item.originalCost}</Text> : null}
                    {item.isLocked ? <View style={[{ backgroundColor: '#F4433622', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 }]}><Text style={{ color: colors.error, fontSize: 9, fontWeight: '800' }}>🔒 مقفل</Text></View> : null}
                  </View>
                </View>
              </View>
              {canEditPrices ? (
                <View style={styles.storeBtns}>
                  {/* Lock toggle - owner only */}
                  {isOwner ? (
                    <Pressable onPress={() => handleToggleLock(item)} style={[styles.storeActionBtn, { backgroundColor: item.isLocked ? '#F4433622' : '#4CAF5022' }]}>
                      <Ionicons name={item.isLocked ? 'lock-closed' : 'lock-open-outline'} size={14} color={item.isLocked ? colors.error : colors.success} />
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => { setEditPriceModal({ visible: true, item }); setNewPrice(String(item.cost)); }} style={[styles.storeActionBtn, { backgroundColor: colors.primary + '22' }]}>
                    <Ionicons name="pencil" size={14} color={colors.primary} />
                  </Pressable>
                  {item.isModified ? (
                    <Pressable onPress={() => handleResetPrice(item)} style={[styles.storeActionBtn, { backgroundColor: colors.error + '22' }]}>
                      <Ionicons name="refresh" size={14} color={colors.error} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      ) : activeTab === 3 ? (
        <FlatList
          data={newsPosts} keyExtractor={item => item.id} renderItem={renderNewsPost}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={canPostNews ? (
            <Pressable onPress={() => setShowNewsCreate(true)} style={[styles.createNewsBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createNewsBtnText}>نشر خبر جديد (+ إشعار للكل)</Text>
            </Pressable>
          ) : null}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyEmoji}>📰</Text><Text style={[{ color: colors.textSecondary, fontSize: FontSize.body }]}>لا توجد أخبار</Text></View>}
        />
      ) : activeTab === 4 ? (
        // ── Rooms tab ──
        <FlatList
          data={rooms} keyExtractor={item => item.id} renderItem={renderRoom}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.infoBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={[{ color: colors.textSecondary, fontSize: FontSize.xs, flex: 1, textAlign: 'right' }]}>
                لتعيين مالك أو مدير غرفة: افتح ملف العضو → أوامر → تغيير الرتبة
              </Text>
            </View>
          }
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyEmoji}>🏠</Text><Text style={[{ color: colors.textSecondary, fontSize: FontSize.body }]}>لا توجد غرف</Text></View>}
        />
      ) : (
        // ── Stats ──
        <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}>
          {[
            { label: 'إجمالي الأعضاء', value: allUsers.length, emoji: '👥', color: colors.primary },
            { label: 'متصل الآن', value: onlineCount, emoji: '🟢', color: colors.success },
            { label: 'إجمالي الرسائل', value: totalMessages.toLocaleString(), emoji: '💬', color: colors.secondary },
            { label: 'حسابات موثَّقة', value: verifiedCount, emoji: '✅', color: '#1D9BF0' },
            { label: 'VIP ونجوم', value: vipCount, emoji: '⭐', color: '#FFD700' },
            { label: 'مكتومون', value: mutedCount, emoji: '🔇', color: colors.warning },
            { label: 'محظورون', value: bannedCount, emoji: '🚫', color: colors.error },
            { label: 'بلاغات معلقة', value: unresolvedNotifs, emoji: '⚠️', color: colors.warning },
            { label: 'عناصر المتجر', value: storeItems.length, emoji: '🛍️', color: '#9C27B0' },
            { label: 'الرتب المخصصة', value: allRanks.filter(r => !r.isSystem).length, emoji: '🎖️', color: '#FF9800' },
          ].map(stat => (
            <View key={stat.label} style={[styles.statRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[{ flex: 1, fontSize: FontSize.body, color: colors.textSecondary }]}>{stat.label}</Text>
              <Text style={[{ fontSize: FontSize.xl, fontWeight: '800', color: stat.color }]}>{stat.value}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── User Action Modal ── */}
      <Modal visible={showUserModal} transparent animationType="slide" onRequestClose={() => setShowUserModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowUserModal(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            {selectedUser ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                <View style={styles.modalUser}>
                  <Avatar avatar={selectedUser.avatar} size={64} rank={selectedUser.rank} frame={selectedUser.frame} isOnline={selectedUser.isOnline} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[{ fontSize: FontSize.xl, fontWeight: '800', color: selectedUser.nameColor || colors.text }]}>
                      {selectedUser.badge || ''} {selectedUser.displayName}
                    </Text>
                    {selectedUser.isVerified ? <VerifiedBadge size={20} /> : null}
                  </View>
                  {/* Dynamic rank display - supports image URIs */}
                  {(() => {
                    const rankInfo = allRanks.find(r => r.id === selectedUser.rank);
                    return rankInfo ? (
                      <View style={[styles.rankChip, { backgroundColor: rankInfo.color + '22', borderColor: rankInfo.color }]}>
                        <RankIcon emoji={rankInfo.emoji} size={16} />
                        <Text style={[{ color: rankInfo.color, fontWeight: '700', fontSize: FontSize.sm }]}>{rankInfo.name}</Text>
                      </View>
                    ) : null;
                  })()}
                  <Text style={[{ color: colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' }]}>
                    @{selectedUser.username} · Lv.{selectedUser.level} · {selectedUser.coins.toLocaleString()} 💰 · {selectedUser.messageCount} رسالة
                  </Text>
                  {/* View full profile link */}
                  <Pressable
                    onPress={() => { setShowUserModal(false); router.push(`/user/${selectedUser.id}`); }}
                    style={[styles.viewProfileBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
                  >
                    <Ionicons name="person" size={14} color={colors.primary} />
                    <Text style={[{ color: colors.primary, fontSize: FontSize.sm, fontWeight: '700' }]}>عرض الملف الشخصي الكامل</Text>
                  </Pressable>
                </View>

                {/* Mute */}
                {canMute && selectedUser.rank !== 'owner' && currentUser && canManageUser(currentUser, selectedUser) ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>🔇 إدارة الكتم</Text>
                    <View style={styles.actionBtns}>
                      {selectedUser.isMuted ? (
                        <Button title="🔊 رفع الكتم" onPress={() => handleUnmute(selectedUser)} variant="outline" size="sm" style={{ flex: 1 }} />
                      ) : (
                        <Pressable onPress={() => setShowMuteModal(true)} style={[styles.muteBtn, { backgroundColor: colors.warning + '22', borderColor: colors.warning }]}>
                          <Ionicons name="volume-mute-outline" size={16} color={colors.warning} />
                          <Text style={[{ color: colors.warning, fontWeight: '700', fontSize: FontSize.sm }]}>🔇 كتم مؤقت</Text>
                        </Pressable>
                      )}
                      <Button title="👢 طرد" onPress={() => handleAction('kick', selectedUser)} variant="outline" size="sm" style={{ flex: 1 }} />
                      <Button title={selectedUser.isBanned ? '✅ رفع حظر' : '🚫 حظر'} onPress={() => handleAction('ban', selectedUser)} variant="danger" size="sm" style={{ flex: 1 }} />
                    </View>
                  </View>
                ) : null}

                {/* Verify */}
                {isOwner && selectedUser.rank !== 'owner' ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>✅ توثيق الحساب</Text>
                    <Button title={selectedUser.isVerified ? '❌ إلغاء التوثيق' : '✅ توثيق الحساب'} onPress={() => handleVerify(selectedUser)} variant={selectedUser.isVerified ? 'outline' : 'primary'} size="sm" />
                  </View>
                ) : null}

                {/* Delete Photo */}
                {canDeletePhotos && selectedUser.rank !== 'owner' ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>🖼️ إدارة الصورة</Text>
                    <Button title="🗑️ حذف الصورة المخالفة" onPress={() => handleDeletePhoto(selectedUser)} variant="danger" size="sm" />
                  </View>
                ) : null}

                {/* Change Name */}
                {canChangeRanks && currentUser && canManageUser(currentUser, selectedUser) ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>✏️ تغيير الاسم</Text>
                    <View style={styles.inputRow}>
                      <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, flex: 1 }]} placeholder={`الحالي: ${selectedUser.displayName}`} placeholderTextColor={colors.textMuted} value={newUsername} onChangeText={setNewUsername} textAlign="right" />
                      <Button title="تغيير" onPress={handleChangeUsername} size="sm" style={{ width: 80 }} />
                    </View>
                  </View>
                ) : null}

                {/* Change Password */}
                {isHighAdmin && selectedUser.rank !== 'owner' && currentUser && canManageUser(currentUser, selectedUser) ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Pressable onPress={() => setShowPasswordSection(s => !s)} style={styles.sectionLabelRow}>
                      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>🔐 تغيير كلمة السر</Text>
                      <Ionicons name={showPasswordSection ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
                    </Pressable>
                    {showPasswordSection ? (
                      <View style={styles.inputRow}>
                        <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.md, paddingHorizontal: 8, height: 44 }]}>
                          <TextInput style={[{ flex: 1, color: colors.text, fontSize: FontSize.body }]} placeholder="كلمة المرور الجديدة" placeholderTextColor={colors.textMuted} value={newAdminPassword} onChangeText={setNewAdminPassword} secureTextEntry={!showNewPassAdmin} textAlign="right" />
                          <Pressable onPress={() => setShowNewPassAdmin(s => !s)} hitSlop={8}>
                            <Ionicons name={showNewPassAdmin ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textMuted} />
                          </Pressable>
                        </View>
                        <Button title="حفظ" onPress={handleAdminPasswordChange} size="sm" style={{ width: 80 }} />
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Rank Change using dynamic ranks */}
                {canChangeRanks && currentUser && canManageUser(currentUser, selectedUser) && selectedUser.rank !== 'owner' ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>🎖️ تغيير الرتبة</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs }}>
                      {allRanks.filter(r => r.id !== 'owner').map(rank => (
                        <Pressable
                          key={rank.id}
                          onPress={() => handleRankChange(selectedUser, rank.id)}
                          style={[styles.rankBtn, { backgroundColor: selectedUser.rank === rank.id ? rank.color : colors.surfaceElevated, borderWidth: selectedUser.rank === rank.id ? 0 : 1, borderColor: colors.border }]}
                        >
                          <RankIcon emoji={rank.emoji} size={14} />
                          <Text style={[{ fontSize: FontSize.xs, fontWeight: '700', color: selectedUser.rank === rank.id ? '#fff' : colors.text }]}>
                            {rank.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {/* Assign Room */}
                {isAdmin && ['room_owner', 'room_manager', 'room_supervisor'].includes(selectedUser.rank) ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>🏠 تعيين الغرفة</Text>
                    <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs, textAlign: 'right' }]}>
                      الغرفة الحالية: {selectedUser.assignedRoomId ? (rooms.find(r => r.id === selectedUser.assignedRoomId)?.name || selectedUser.assignedRoomId) : 'لا يوجد'}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.xs }}>
                      {[{ id: null, name: '❌ إلغاء التعيين' }, ...rooms].map(room => (
                        <Pressable
                          key={room.id || 'none'}
                          onPress={() => handleAssignRoom(selectedUser.id, room.id)}
                          style={[styles.rankBtn, { backgroundColor: selectedUser.assignedRoomId === room.id ? colors.primary : colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
                        >
                          <Text style={[{ fontSize: FontSize.xs, fontWeight: '700', color: selectedUser.assignedRoomId === room.id ? '#fff' : colors.text }]}>
                            {room.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {/* Level */}
                {isAdmin ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>📊 تعديل المستوى (1–99999)</Text>
                    <View style={styles.inputRow}>
                      <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, flex: 1 }]} placeholder={`الحالي: ${selectedUser.level}`} placeholderTextColor={colors.textMuted} value={levelInput} onChangeText={setLevelInput} keyboardType="numeric" textAlign="right" />
                      <Button title="تعيين" onPress={handleLevelSet} size="sm" style={{ width: 80 }} />
                    </View>
                  </View>
                ) : null}

                {/* Coins */}
                {isOwner ? (
                  <View style={[styles.section, { borderTopColor: colors.border }]}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>💰 إدارة العملات ({selectedUser.coins.toLocaleString()})</Text>
                    <View style={styles.inputRow}>
                      <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, flex: 1 }]} placeholder="المبلغ" placeholderTextColor={colors.textMuted} value={coinsAmount} onChangeText={setCoinsAmount} keyboardType="numeric" textAlign="right" />
                      <Button title="➕" onPress={() => handleCoinsAction(true)} size="sm" style={{ width: 48 }} />
                      <Button title="➖" onPress={() => handleCoinsAction(false)} variant="danger" size="sm" style={{ width: 48 }} />
                    </View>
                  </View>
                ) : null}

                <Button title="إغلاق" onPress={() => setShowUserModal(false)} variant="ghost" style={{ margin: Spacing.md }} />
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Report Detail Modal ── */}
      <Modal visible={!!showReportDetail} transparent animationType="fade" onRequestClose={() => setShowReportDetail(null)}>
        <View style={styles.priceModalOverlay}>
          {showReportDetail ? (
            <View style={[styles.priceModalCard, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
              <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm }]}>
                🚨 تفاصيل البلاغ
              </Text>
              <View style={[{ backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm }]}>
                <Text style={[{ color: colors.text, fontWeight: '700' }]}>المُبلَّغ عنه: {showReportDetail.reportedUserName}</Text>
                <Text style={[{ color: colors.textSecondary }]}>المُبلِّغ: {showReportDetail.reporterName}</Text>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{new Date(showReportDetail.timestamp).toLocaleString('ar')}</Text>
              </View>
              <View style={[{ backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.md, padding: Spacing.md, borderRightWidth: 3, borderRightColor: colors.error }]}>
                <Text style={[{ color: colors.textSecondary, fontStyle: 'italic', fontSize: FontSize.body, textAlign: 'right', lineHeight: 24 }]}>
                  "{showReportDetail.messageText}"
                </Text>
              </View>
              <Pressable
                onPress={() => { setShowReportDetail(null); router.push(`/user/${showReportDetail.reportedUserName}`); }}
                style={[styles.viewProfileBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
              >
                <Ionicons name="person" size={14} color={colors.primary} />
                <Text style={[{ color: colors.primary, fontSize: FontSize.sm, fontWeight: '700' }]}>عرض ملف العضو المُبلَّغ عنه</Text>
              </Pressable>
              {!showReportDetail.isResolved ? (
                <View>
                  <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm }]}>اتخاذ إجراء:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' }}>
                    {(['muted', 'kicked', 'banned', 'warned', 'ignored'] as ReportNotification['action'][]).map(action => (
                      <Pressable key={action} onPress={() => handleResolveReportNotif(showReportDetail, action)} style={[styles.actionChip, { backgroundColor: action === 'banned' ? colors.error + '22' : action === 'muted' ? colors.warning + '22' : action === 'ignored' ? colors.surfaceElevated : colors.primary + '22', borderColor: action === 'banned' ? colors.error : action === 'muted' ? colors.warning : action === 'ignored' ? colors.border : colors.primary }]}>
                        <Text style={[styles.actionChipText, { color: action === 'banned' ? colors.error : action === 'muted' ? colors.warning : action === 'ignored' ? colors.textMuted : colors.primary }]}>
                          {action === 'muted' ? '🔇 كتم' : action === 'kicked' ? '👢 طرد' : action === 'banned' ? '🚫 حظر' : action === 'warned' ? '⚠️ تحذير' : '✓ تجاهل'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={[{ color: colors.success, textAlign: 'center', fontWeight: '700' }]}>✓ تم التعامل مع البلاغ: {showReportDetail.action}</Text>
              )}
              <Button title="إغلاق" onPress={() => setShowReportDetail(null)} variant="ghost" />
            </View>
          ) : null}
        </View>
      </Modal>

      {/* Timed Mute Modal */}
      <Modal visible={showMuteModal} transparent animationType="fade" onRequestClose={() => setShowMuteModal(false)}>
        <View style={styles.priceModalOverlay}>
          <View style={[styles.priceModalCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>🔇 كتم مؤقت: {selectedUser?.displayName}</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {MUTE_DURATIONS.map(d => (
                <Pressable key={d.minutes} onPress={() => setMuteDuration(d.minutes)} style={[styles.muteDurationRow, { backgroundColor: muteDuration === d.minutes ? colors.warning + '22' : colors.surfaceElevated, borderColor: muteDuration === d.minutes ? colors.warning : colors.border }]}>
                  <Ionicons name={muteDuration === d.minutes ? 'radio-button-on' : 'radio-button-off'} size={18} color={muteDuration === d.minutes ? colors.warning : colors.textMuted} />
                  <Text style={[{ flex: 1, color: muteDuration === d.minutes ? colors.warning : colors.text, fontWeight: muteDuration === d.minutes ? '700' : '400', fontSize: FontSize.body, textAlign: 'right' }]}>{d.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.inputRow}>
              <Button title="🔇 تطبيق الكتم" onPress={handleMuteTimed} style={{ flex: 1 }} />
              <Button title="إلغاء" onPress={() => setShowMuteModal(false)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Price Modal */}
      <Modal visible={editPriceModal.visible} transparent animationType="fade" onRequestClose={() => setEditPriceModal({ visible: false, item: null })}>
        <View style={styles.priceModalOverlay}>
          <View style={[styles.priceModalCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>✏️ تعديل سعر {editPriceModal.item?.name}</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, borderWidth: 1, textAlign: 'center' }]} value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" placeholder="السعر الجديد" placeholderTextColor={colors.textMuted} autoFocus />
            <View style={styles.inputRow}>
              <Button title="حفظ" onPress={handleEditPrice} style={{ flex: 1 }} />
              <Button title="إلغاء" onPress={() => setEditPriceModal({ visible: false, item: null })} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Create News Modal */}
      <Modal visible={showNewsCreate} transparent animationType="slide" onRequestClose={() => setShowNewsCreate(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowNewsCreate(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: 60 }}>
              <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>📢 نشر خبر جديد</Text>
              <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' }]}>سيصل إشعار لجميع الأعضاء تلقائياً</Text>
              <View>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>الأيقونة</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                  {['📢', '🎉', '⚠️', '🎊', '📰', '🚨', '💡', '🏆', '🎁', '🔔', '✅', '❤️'].map(e => (
                    <Pressable key={e} onPress={() => setNewsEmoji(e)} style={[styles.emojiBtn, newsEmoji === e && { backgroundColor: colors.primary + '33', borderColor: colors.primary }]}>
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>النوع</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                  {NEWS_TYPES.map(t => (
                    <Pressable key={t} onPress={() => setNewsType(t)} style={[styles.typeBtn, { backgroundColor: newsType === t ? NEWS_TYPE_CONFIG[t].color : colors.surfaceElevated, borderColor: NEWS_TYPE_CONFIG[t].color }]}>
                      <Text style={[styles.typeBtnText, { color: newsType === t ? '#fff' : NEWS_TYPE_CONFIG[t].color }]}>{NEWS_TYPE_CONFIG[t].emoji} {NEWS_TYPE_CONFIG[t].label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, borderWidth: 1 }]} placeholder="عنوان الخبر..." placeholderTextColor={colors.textMuted} value={newsTitle} onChangeText={setNewsTitle} textAlign="right" />
              <TextInput style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border, borderWidth: 1, minHeight: 100, textAlignVertical: 'top' }]} placeholder="محتوى الخبر..." placeholderTextColor={colors.textMuted} value={newsContent} onChangeText={setNewsContent} multiline textAlign="right" />
              <Button title="📢 نشر وإرسال إشعارات" onPress={handleCreateNews} />
              <Button title="إلغاء" onPress={() => setShowNewsCreate(false)} variant="outline" />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
  headerSub: { color: '#ffffffaa', fontSize: FontSize.xs },
  notifBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F4433680', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 4 },
  notifBadgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  tabsScroll: { borderBottomWidth: 1, flexGrow: 0 },
  tabsContent: { flexDirection: 'row' },
  tab: { alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
  tabText: { fontSize: FontSize.xs, fontWeight: '700' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, marginBottom: 0, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSize.body, height: 36 },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, gap: Spacing.sm, borderWidth: 1 },
  memberInfo: { flex: 1, gap: 3 },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  memberName: { fontSize: FontSize.body, fontWeight: '700', flex: 1 },
  memberSub: { fontSize: FontSize.xs },
  rankChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  reportCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm },
  reportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reportTitle: { fontSize: FontSize.sm, fontWeight: '700', flex: 1 },
  actionChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1 },
  actionChipText: { fontSize: FontSize.xs, fontWeight: '700' },
  newsCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm },
  newsHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  newsTitle: { fontSize: FontSize.body, fontWeight: '800', textAlign: 'right' },
  newsBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1 },
  newsBadgeText: { fontSize: 10, fontWeight: '700' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  createNewsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  createNewsBtnText: { color: '#fff', fontWeight: '800', fontSize: FontSize.body },
  roomCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm },
  roomIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  storeRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm },
  storeBtns: { flexDirection: 'row', gap: Spacing.xs },
  storeActionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji: { fontSize: 48 },
  statRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.md },
  statEmoji: { fontSize: 22 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm },
  viewProfileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '94%', paddingTop: Spacing.md },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalUser: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  section: { borderTopWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: '800', textAlign: 'right' },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionBtns: { flexDirection: 'row', gap: Spacing.sm },
  muteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1 },
  rankBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  modalInput: { borderRadius: BorderRadius.md, padding: Spacing.sm, fontSize: FontSize.body, height: 44 },
  priceModalOverlay: { flex: 1, backgroundColor: '#00000090', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  priceModalCard: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  muteDurationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, marginBottom: 4 },
  botToggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1.5 },
  botSection: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.sm },
  botChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1.5, minWidth: 70, alignItems: 'center' },
  botDurationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1 },
  botSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 52, borderRadius: BorderRadius.lg },
  emojiBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  typeBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1, alignItems: 'center' },
  typeBtnText: { fontSize: FontSize.xs, fontWeight: '700' },
});
