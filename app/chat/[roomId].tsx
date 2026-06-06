
// Powered by OnSpace.AI
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { ChatMessage, submitReport, verifyRoomPassword } from '@/services/chatService';
import { incrementMessageCount, transferCoins } from '@/services/authService';
import { MessageBubble } from '@/components/feature/MessageBubble';
import { MemberList } from '@/components/feature/MemberList';
import { GiftModal } from '@/components/feature/GiftModal';
import { Avatar } from '@/components/ui/Avatar';
import { GIFTS } from '@/constants/config';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useAlert } from '@/template';
import {
  playMessageSound, playReplySound, playGiftSound,
  playReportAlertSound, isSoundEnabled, setSoundEnabled,
} from '@/services/soundService';
import {
  checkAndGetLiftedActions,
} from '@/services/authService';
import { trackSpam, processBotCommand, isBotEnabled, setBotEnabled } from '@/services/botService';
import {
  notifyMuteLifted, notifyBanLifted,
} from '@/services/notificationService';
import { BannerNotification } from '@/components/ui/BannerNotification';
import {
  sendFriendRequest, isFriend, getFriendsList,
  getPendingRequestsForUser, respondToFriendRequest,
  getUnreadFriendNotifCount,
} from '@/services/friendService';
import { addReportNotification } from '@/services/reportNotifService';
import { getUnreadCount } from '@/services/notificationService';
import { getUnreadReportNotifCount } from '@/services/reportNotifService';

const BOTTOM_ACTIONS = [
  { id: 'dark', icon: 'moon-outline', label: 'داكن' },
  { id: 'refresh', icon: 'refresh-outline', label: 'تنشيط' },
  { id: 'gift', icon: 'gift-outline', label: 'هدايا' },
  { id: 'level', icon: 'trending-up-outline', label: 'مستوى' },
  { id: 'coins', icon: 'cash-outline', label: 'نقود' },
  { id: 'sound', icon: 'volume-high-outline', label: 'صوت' },
  { id: 'search', icon: 'search-outline', label: 'بحث' },
  { id: 'rooms', icon: 'home-outline', label: 'الغرف' },
  { id: 'members', icon: 'people-outline', label: 'متصلين' },
];

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const { currentUser, allUsers, refreshUser, refreshAllUsers } = useAuth();
  const { rooms, messages, loadMessages, sendChatMessage, deleteMsg, editMsg } = useChat();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [giftModal, setGiftModal] = useState<{ visible: boolean; msg: ChatMessage | null; mode: 'gift' | 'money' }>({
    visible: false, msg: null, mode: 'gift',
  });
  const [violationNotice, setViolationNotice] = useState(false);
  const [onlineMembersCount, setOnlineMembersCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [friendNotifCount, setFriendNotifCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [reportNotifCount, setReportNotifCount] = useState(0);
  const [bannerNotif, setBannerNotif] = useState<any>(null);
  const muteCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [botEnabled, setBotEnabledState] = useState(true);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [botBanner, setBotBanner] = useState<string | null>(null);

  // Room lock
  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const room = rooms.find(r => r.id === roomId);
  const isMod = ['owner', 'legend', 'admin', 'guardian', 'moderator'].includes(currentUser?.rank || '');

  useEffect(() => {
    checkRoomAccess();
  }, [roomId]);

  useEffect(() => {
    loadFriendNotifs();
    setSoundOn(isSoundEnabled()); // isSoundEnabled returns boolean directly
    isBotEnabled().then(v => setBotEnabledState(v));
  }, []);

  async function loadFriendNotifs() {
    if (!currentUser) return;
    const [friendCount, notifTotal, reportCount] = await Promise.all([
      getUnreadFriendNotifCount(currentUser.id),
      getUnreadCount(currentUser.id),
      getUnreadReportNotifCount(),
    ]);
    setFriendNotifCount(friendCount);
    setNotifCount(notifTotal);
    setReportNotifCount(reportCount);
  }

  // Auto-check mute/ban/kick expiry every 30 seconds
  useEffect(() => {
    if (!currentUser) return;
    const check = async () => {
      const { muteLifted, banLifted } = await checkAndGetLiftedActions(currentUser.id);
      if (muteLifted) {
        await notifyMuteLifted(currentUser.id);
        const notif = { id: 'mute_lifted', type: 'mute_lifted', title: 'تم رفع الكتم', body: 'يمكنك الآن إرسال الرسائل', emoji: '🔊', isRead: false, timestamp: new Date().toISOString(), userId: currentUser.id };
        setBannerNotif(notif);
        await refreshUser();
      }
      if (banLifted) {
        await notifyBanLifted(currentUser.id);
        const notif = { id: 'ban_lifted', type: 'ban_lifted', title: 'تم رفع الحظر', body: 'تم رفع الحظر عن حسابك', emoji: '✅', isRead: false, timestamp: new Date().toISOString(), userId: currentUser.id };
        setBannerNotif(notif);
        await refreshUser();
      }
    };
    check();
    muteCheckRef.current = setInterval(check, 30000);
    return () => { if (muteCheckRef.current) clearInterval(muteCheckRef.current); };
  }, [currentUser?.id]);

  async function checkRoomAccess() {
    if (!room) { setCheckingAccess(false); return; }
    if (!room.isLocked || isMod) {
      setIsUnlocked(true);
      setCheckingAccess(false);
      if (roomId) loadMessages(roomId);
      return;
    }
    setCheckingAccess(false);
  }

  const prevMsgCount = useRef(0);

  useEffect(() => {
    if (messages.length > prevMsgCount.current && prevMsgCount.current > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== currentUser?.id) {
        // Check if it's a reply to current user
        if (lastMsg.replyTo?.senderId === currentUser?.id) {
          playReplySound();
        } else {
          playMessageSound();
        }
        // Check for gift
        if (lastMsg.gift) playGiftSound();
      }
    }
    prevMsgCount.current = messages.length;

    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [messages.length]);

  useEffect(() => {
    const count = allUsers.filter(u => u.isOnline && !u.isHidden).length;
    setOnlineMembersCount(count);
  }, [allUsers]);

  async function handlePasswordSubmit() {
    if (!room?.password && room?.isLocked) {
      showAlert('مقفلة', 'هذه الغرفة مقفلة');
      router.back();
      return;
    }
    const ok = await verifyRoomPassword(roomId, passwordInput);
    if (ok) {
      setIsUnlocked(true);
      setPasswordInput('');
      loadMessages(roomId);
    } else {
      showAlert('خطأ', 'كلمة السر غير صحيحة');
      setPasswordInput('');
    }
  }

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUser) return;
    if (currentUser.isMuted) { showAlert('مكتوم', 'أنت مكتوم ولا يمكنك إرسال رسائل'); return; }
    setInputText('');
    const reply = replyTo;
    setReplyTo(null);
    if (editingMsg) {
      await editMsg(roomId, editingMsg.id, text);
      setEditingMsg(null);
      return;
    }
    // Check bot commands
    const botReply = processBotCommand(text, {
      level: currentUser.level, coins: currentUser.coins || 0,
      rank: currentUser.rank, displayName: currentUser.displayName,
      messageCount: currentUser.messageCount,
    });
    if (botReply) {
      // Send user message first
      await sendChatMessage(
        currentUser.id, currentUser.displayName, currentUser.avatar,
        currentUser.rank, currentUser.level, currentUser.badge, currentUser.nameColor,
        text, reply, null
      );
      // Then bot reply
      await sendChatMessage(
        'bot_system_001', '🤖 بوت هاوا', '🤖', 'owner', 99, null, '#00BCD4',
        botReply, null, null
      );
      await incrementMessageCount(currentUser.id);
      return;
    }
    // Anti-spam check
    if (botEnabled && !['owner','high_admin','legend'].includes(currentUser.rank)) {
      const spamResult = await trackSpam(currentUser.id, currentUser.rank);
      if (spamResult.muted) {
        setBotBanner('🤖 تم كتمك لمدة دقيقة بسبب الإرسال السريع');
        setTimeout(() => { setBotBanner(null); refreshUser(); }, 3000);
        return;
      }
      if (spamResult.warned) {
        setBotBanner('⚠️ تحذير: أرسلت رسائل كثيرة! ستُكتم إذا استمريت');
        setTimeout(() => setBotBanner(null), 3000);
      }
    }
    const { flagged } = await sendChatMessage(
      currentUser.id, currentUser.displayName, currentUser.avatar,
      currentUser.rank, currentUser.level, currentUser.badge, currentUser.nameColor,
      text, reply, null, currentUser.frame || null, currentUser.country
    );
    if (flagged) { setViolationNotice(true); setTimeout(() => setViolationNotice(false), 4000); }
    const updated = await incrementMessageCount(currentUser.id);
    if (updated) refreshUser();
  };

  const handleDelete = async (msg: ChatMessage) => {
    const isOwn = currentUser?.id === msg.senderId;
    if (!isOwn && !isMod) return;
    showAlert('حذف الرسالة', isOwn ? 'هل تريد حذف رسالتك؟' : `حذف رسالة ${msg.senderName}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteMsg(roomId, msg.id) },
    ]);
  };

  const handleEdit = (msg: ChatMessage) => {
    if (currentUser?.id !== msg.senderId) return;
    setEditingMsg(msg);
    setInputText(msg.text);
    inputRef.current?.focus();
  };

  const handleReport = async (msg: ChatMessage) => {
    showAlert('الإبلاغ عن الرسالة', 'هل تريد الإبلاغ عن هذه الرسالة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إبلاغ', style: 'destructive',
        onPress: async () => {
          await submitReport(currentUser!.id, currentUser!.displayName, msg.senderId, msg.senderName, msg.text, 'محتوى غير لائق');
          await addReportNotification('', msg.senderName, currentUser!.displayName, msg.text);
          await playReportAlertSound();
          showAlert('تم', 'تم إرسال البلاغ بنجاح — سيتم مراجعته من الإدارة');
        },
      },
    ]);
  };

  const handleAddFriend = async (msg: ChatMessage) => {
    if (!currentUser || msg.senderId === currentUser.id) return;
    const already = await isFriend(currentUser.id, msg.senderId);
    if (already) {
      showAlert('أصدقاء', `أنتما أصدقاء بالفعل! 🤝`);
      return;
    }
    const result = await sendFriendRequest(
      currentUser.id, currentUser.displayName, currentUser.avatar, currentUser.rank,
      msg.senderId, msg.senderName
    );
    if (result.success) {
      showAlert('تم الإرسال ✅', `تم إرسال طلب صداقة إلى ${msg.senderName}`);
    } else {
      showAlert('تنبيه', result.error || 'فشل إرسال الطلب');
    }
  };

  const handleSendGift = async (giftId: string) => {
    if (!giftModal.msg || !currentUser) return;
    const gift = GIFTS.find(g => g.id === giftId);
    if (!gift) return;
    if (currentUser.coins < gift.cost) { showAlert('رصيد غير كافٍ', `تحتاج ${gift.cost} عملة`); return; }
    await transferCoins(currentUser.id, giftModal.msg.senderId, gift.cost);
    await sendChatMessage(
      currentUser.id, currentUser.displayName, currentUser.avatar,
      currentUser.rank, currentUser.level, currentUser.badge, currentUser.nameColor,
      `أرسل هدية ${gift.emoji} ${gift.name} إلى ${giftModal.msg.senderName}`, null, giftId
    );
    await playGiftSound();
    await refreshUser();
    setGiftModal({ visible: false, msg: null, mode: 'gift' });
    showAlert('تم! 🎉', `أرسلت ${gift.name} ${gift.emoji} إلى ${giftModal.msg.senderName}`);
  };

  const handleSendMoney = async (amount: number) => {
    if (!giftModal.msg || !currentUser) return;
    const result = await transferCoins(currentUser.id, giftModal.msg.senderId, amount);
    if (!result.success) { showAlert('خطأ', result.error || 'فشل إرسال العملات'); return; }
    await sendChatMessage(
      currentUser.id, currentUser.displayName, currentUser.avatar,
      currentUser.rank, currentUser.level, currentUser.badge, currentUser.nameColor,
      `💸 أرسل ${amount} 💰 إلى ${giftModal.msg.senderName}`, null, null
    );
    await playGiftSound();
    await refreshUser();
    setGiftModal({ visible: false, msg: null, mode: 'gift' });
    showAlert('تم! 💸', `أرسلت ${amount} عملة إلى ${giftModal.msg.senderName}`);
  };

  const handleBottomAction = (id: string) => {
    switch (id) {
      case 'dark': toggleTheme(); break;
      case 'refresh': loadMessages(roomId); refreshAllUsers(); break;
      case 'members': setShowMembers(true); break;
      case 'rooms': router.back(); break;
      case 'search': setShowSearch(s => !s); break;
      case 'sound': {
        const newVal = !soundOn;
        setSoundOn(newVal);
        setSoundEnabled(newVal);
        showAlert(newVal ? '🔊 تم تفعيل الصوت' : '🔇 تم إيقاف الصوت', '');
        break;
      }
      case 'gift':
        showAlert('إرسال هدية', 'اضغط مطولاً على رسالة أي عضو ثم اختر "هدية"');
        break;
      case 'level':
        showAlert('مستواك', `Lv.${currentUser?.level} — ${currentUser?.levelTitle}\nرسائل: ${currentUser?.messageCount}`);
        break;
      case 'coins':
        showAlert('رصيدك', `💰 ${currentUser?.coins?.toLocaleString()} عملة`);
        break;
      case 'sticker':
        setShowStickerPicker(s => !s);
        break;
      case 'attach':
        setShowAttachModal(true);
        break;
    }
  };

  const handleHeaderAction = (id: string) => {
    switch (id) {
      case 'back': router.back(); break;
      case 'private': router.push({ pathname: '/(tabs)/messages', params: { tab: '0' } }); break;
      case 'friends': router.push({ pathname: '/(tabs)/messages', params: { tab: '1' } }); break;
      case 'reports': router.push({ pathname: '/admin', params: { tab: '1' } }); break;
      case 'profile': router.push('/profile'); break;
    }
  };

  const handleSendSticker = async (sticker: string) => {
    if (!currentUser) return;
    setShowStickerPicker(false);
    await sendChatMessage(
      currentUser.id, currentUser.displayName, currentUser.avatar,
      currentUser.rank, currentUser.level, currentUser.badge, currentUser.nameColor,
      sticker, null, null
    );
    await incrementMessageCount(currentUser.id);
    refreshUser();
  };

  const handleToggleBot = async () => {
    const newVal = !botEnabled;
    setBotEnabledState(newVal);
    await setBotEnabled(newVal);
    showAlert(newVal ? '🤖 البوت مُفعَّل' : '🤖 البوت متوقف', newVal ? 'سيراقب البوت الرسائل تلقائياً' : 'تم إيقاف مراقبة البوت');
  };

  const filteredMessages = searchText.trim()
    ? messages.filter(m => m.text.toLowerCase().includes(searchText.toLowerCase()))
    : messages;

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageBubble
      message={item}
      onReply={msg => { setReplyTo(msg); playReplySound(); }}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onReport={handleReport}
      onSendGift={msg => setGiftModal({ visible: true, msg, mode: 'gift' })}
      onSendMoney={msg => setGiftModal({ visible: true, msg, mode: 'money' })}
      onStartPrivateChat={msg => router.push(`/private/${msg.senderId}`)}
      onViewProfile={msg => router.push(`/user/${msg.senderId}`)}
      onAddFriend={handleAddFriend}
    />
  ), [currentUser, colors]);

  // ─── PASSWORD GATE ───
  if (room?.isLocked && !isUnlocked && !isMod) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }]}>
        <Text style={{ fontSize: 52, marginBottom: Spacing.md }}>🔒</Text>
        <Text style={[{ color: colors.text, fontSize: FontSize.xl, fontWeight: '800', marginBottom: Spacing.sm, textAlign: 'center' }]}>
          الغرفة مقفلة
        </Text>
        <Text style={[{ color: colors.textSecondary, fontSize: FontSize.body, textAlign: 'center', marginBottom: Spacing.lg }]}>
          أدخل كلمة السر للدخول
        </Text>
        <TextInput
          style={[styles.passwordInput, { backgroundColor: colors.surfaceCard, color: colors.text, borderColor: colors.border }]}
          placeholder="كلمة السر..."
          placeholderTextColor={colors.textMuted}
          value={passwordInput}
          onChangeText={setPasswordInput}
          secureTextEntry
          textAlign="center"
        />
        <Pressable onPress={handlePasswordSubmit} style={[styles.passwordBtn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: FontSize.body }}>دخول</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <Text style={[{ color: colors.textMuted }]}>رجوع</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f0f1a' : '#f0f0f5' }]}>
      {/* ─── HEADER ─── */}
      <LinearGradient
        colors={['#6A0DAD', '#9C27B0', '#E91E8C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <View style={styles.headerBtnRow}>
          {/* القائمة - Back */}
          <Pressable onPress={() => router.back()} style={[styles.headerActionBtn, { backgroundColor: '#5C1A8A' }]}>
            <Ionicons name="menu-outline" size={20} color="#fff" />
            <Text style={styles.headerBtnLabel}>القائمة</Text>
          </Pressable>

          {/* ر.خاصة - Private messages only */}
          <Pressable
            onPress={() => handleHeaderAction('private')}
            style={[styles.headerActionBtn, { backgroundColor: '#E91E8C' }]}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="mail-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.headerBtnLabel}>ر.خاصة</Text>
          </Pressable>

          {/* صداقة - Friends only */}
          <Pressable
            onPress={() => handleHeaderAction('friends')}
            style={[styles.headerActionBtn, { backgroundColor: '#E91E8C' }]}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="people-outline" size={20} color="#fff" />
              {friendNotifCount > 0 ? (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>{friendNotifCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.headerBtnLabel}>صداقة</Text>
          </Pressable>

          {/* إشعار - Notifications only */}
          <Pressable
            onPress={() => router.push('/notifications')}
            style={[styles.headerActionBtn, { backgroundColor: '#E91E8C' }]}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              {notifCount > 0 ? (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>{notifCount > 99 ? '99' : notifCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.headerBtnLabel}>إشعار</Text>
          </Pressable>

          {/* متصلين - Members list */}
          <Pressable
            onPress={() => setShowMembers(true)}
            style={[styles.headerActionBtn, { backgroundColor: '#E91E8C' }]}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="people-circle-outline" size={20} color="#fff" />
              {onlineMembersCount > 0 ? (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>{onlineMembersCount > 99 ? '99' : onlineMembersCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.headerBtnLabel}>متصلين</Text>
          </Pressable>

          {/* بلاغ - Reports (owner/admin only) */}
          {['owner', 'high_admin', 'legend', 'admin', 'general_supervisor'].includes(currentUser?.rank || '') ? (
            <Pressable
              onPress={() => handleHeaderAction('reports')}
              style={[styles.headerActionBtn, { backgroundColor: '#E91E8C' }]}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons name="flag-outline" size={20} color="#fff" />
                {reportNotifCount > 0 ? (
                  <View style={styles.badgeDot}>
                    <Text style={styles.badgeDotText}>{reportNotifCount > 9 ? '9+' : reportNotifCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.headerBtnLabel}>بلاغ</Text>
            </Pressable>
          ) : null}

          {/* Current user avatar */}
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.headerAvatar}>
            <Avatar avatar={currentUser?.avatar || '👤'} size={44} rank={currentUser?.rank || 'member'} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Mute/Ban lift banner */}
      {bannerNotif ? (
        <BannerNotification
          notification={bannerNotif}
          onDismiss={() => setBannerNotif(null)}
        />
      ) : null}
      {/* Bot banner */}
      {botBanner ? (
        <View style={[styles.violationBanner, { backgroundColor: '#1565C0' }]}>
          <Text style={{ fontSize: 14 }}>🤖</Text>
          <Text style={styles.violationText}>{botBanner}</Text>
        </View>
      ) : null}

      {/* Violation Notice */}
      {violationNotice ? (
        <View style={[styles.violationBanner, { backgroundColor: '#FF9800' }]}>
          <Ionicons name="warning" size={14} color="#fff" />
          <Text style={styles.violationText}>⚠️ رسالتك تحتوي على كلمات محظورة</Text>
        </View>
      ) : null}

      {/* Search bar */}
      {showSearch ? (
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Ionicons name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="بحث في الرسائل..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            textAlign="right"
            autoFocus
          />
          <Pressable onPress={() => { setShowSearch(false); setSearchText(''); }}>
            <Ionicons name="close" size={17} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={filteredMessages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: Spacing.sm, paddingBottom: Spacing.md }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
        />

        {/* Reply Preview */}
        {replyTo && !editingMsg ? (
          <View style={[styles.previewBar, { backgroundColor: colors.surfaceElevated, borderRightColor: colors.primary }]}>
            <Ionicons name="return-down-back" size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[{ color: colors.primary, fontSize: FontSize.xs, fontWeight: '700' }]}>{replyTo.senderName}</Text>
              <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm }]} numberOfLines={1}>{replyTo.text}</Text>
            </View>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={12}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        {/* Edit Preview */}
        {editingMsg ? (
          <View style={[styles.previewBar, { backgroundColor: colors.primary + '18', borderRightColor: colors.accent }]}>
            <Ionicons name="pencil" size={14} color={colors.accent} />
            <Text style={[{ color: colors.accent, flex: 1, fontSize: FontSize.sm }]}>تعديل الرسالة</Text>
            <Pressable onPress={() => { setEditingMsg(null); setInputText(''); }} hitSlop={12}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        {/* ─── INPUT BAR ─── */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable onPress={() => handleBottomAction('attach')} style={styles.inputSideBtn}>
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => handleBottomAction('sticker')} style={styles.inputSideBtn}>
            <Ionicons name="happy-outline" size={26} color={colors.secondary} />
          </Pressable>
          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
            placeholder="اكتب هنا..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlign="right"
            maxLength={2000}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceElevated }]}
          >
            <Ionicons name={editingMsg ? 'checkmark' : 'send'} size={20} color={inputText.trim() ? '#fff' : colors.textMuted} />
          </Pressable>
        </View>

        {/* ─── BOTTOM TOOLBAR ─── */}
        <View style={[styles.bottomToolbar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 4 }]}>
          {BOTTOM_ACTIONS.map(action => (
            <Pressable
              key={action.id}
              onPress={() => handleBottomAction(action.id)}
              style={styles.toolbarBtn}
            >
              <Ionicons
                name={
                  action.id === 'dark'
                    ? (isDark ? 'sunny-outline' : 'moon-outline')
                    : action.id === 'sound'
                    ? (soundOn ? 'volume-high-outline' : 'volume-mute-outline')
                    : action.icon as any
                }
                size={20}
                color={
                  action.id === 'members' ? colors.primary :
                  action.id === 'sound' && !soundOn ? colors.error :
                  colors.textSecondary
                }
              />
              <Text style={[styles.toolbarLabel, {
                color: action.id === 'members' ? colors.primary :
                       action.id === 'sound' && !soundOn ? colors.error :
                       colors.textMuted,
              }]}>
                {action.id === 'dark' ? (isDark ? 'فاتح' : 'داكن') : action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </KeyboardAvoidingView>

      {/* ─── MEMBERS PANEL ─── */}
      <Modal visible={showMembers} transparent animationType="slide" onRequestClose={() => setShowMembers(false)}>
        <Pressable style={styles.membersOverlay} onPress={() => setShowMembers(false)}>
          <Pressable style={[styles.membersPanel, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.membersHeader, { borderBottomColor: colors.border }]}>
              <Text style={[{ color: colors.text, fontSize: FontSize.body, fontWeight: '700' }]}>
                الأعضاء ({allUsers.length})
              </Text>
              <Pressable onPress={() => setShowMembers(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </Pressable>
            </View>
            <MemberList
              users={allUsers}
              onPress={user => {
                setShowMembers(false);
                if (user.id !== currentUser?.id) router.push(`/user/${user.id}`);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── STICKER PICKER ─── */}
      {showStickerPicker ? (
        <View style={[styles.stickerPanel, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing.sm }}>
            <Text style={[{ color: colors.text, fontWeight: '700', fontSize: FontSize.sm }]}>ملصقات</Text>
            <Pressable onPress={() => setShowStickerPicker(false)} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView horizontal={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 160 }}>
            {[
              ['😀','😂','🥰','😍','😎','🤩','🥳','😅','😭','🥺','😡','🤣','❤️','💔','💕','✨','🔥','💎','👑','🎉'],
              ['🌹','🌺','🌸','🌼','🌻','💐','🍀','🌈','⭐','🌙','☀️','💫','🌟','✌️','🤝','👍','🙏','💪','🎁','🏆'],
              ['🐱','🐶','🦁','🐉','🦄','🐺','🦊','🐼','🐨','🐸','🦋','🌊','🏔️','🏝️','🎵','🎶','🎮','💻','📱','🚀'],
            ].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.sm, gap: 2, marginBottom: 4 }}>
                {row.map(s => (
                  <Pressable key={s} onPress={() => handleSendSticker(s)} style={[styles.stickerBtn, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={{ fontSize: 22 }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView> {/* Closing tag for ScrollView */}
        </View>
      ) : null}

      {/* ─── ATTACH MODAL ─── */}
      <Modal visible={showAttachModal} transparent animationType="slide" onRequestClose={() => setShowAttachModal(false)}>
        <Pressable style={styles.membersOverlay} onPress={() => setShowAttachModal(false)}>
          <Pressable style={[styles.attachPanel, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.membersHeader, { borderBottomColor: colors.border }]}>
              <Text style={[{ color: colors.text, fontSize: FontSize.body, fontWeight: '700' }]}>📎 إرفاق</Text>
              <Pressable onPress={() => setShowAttachModal(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={styles.attachGrid}>
              {[
                { icon: 'image-outline', label: 'صورة', color: '#4CAF50', action: () => { setShowAttachModal(false); showAlert('قريباً', 'إرسال الصور قيد التطوير'); } },
                { icon: 'camera-outline', label: 'كاميرا', color: '#2196F3', action: () => { setShowAttachModal(false); showAlert('قريباً', 'إرسال الصور قيد التطوير'); } },
                { icon: 'gift-outline', label: 'هدية', color: '#FFD700', action: () => { setShowAttachModal(false); showAlert('إرسال هدية', 'اضغط مطولاً على رسالة عضو'); } },
                { icon: 'cash-outline', label: 'عملات', color: '#FF9800', action: () => { setShowAttachModal(false); showAlert('إرسال عملات', 'اضغط مطولاً على رسالة عضو'); } },
                { icon: 'location-outline', label: 'موقع', color: '#F44336', action: () => { setShowAttachModal(false); showAlert('قريباً', 'إرسال الموقع قيد التطوير'); } },
                { icon: 'mic-outline', label: 'صوتي', color: '#9C27B0', action: () => { setShowAttachModal(false); showAlert('قريباً', 'الرسائل الصوتية قيد التطوير'); } },
              ].map(item => (
                <Pressable key={item.label} onPress={item.action} style={[styles.attachItem, { backgroundColor: item.color + '22' }]}>
                  <View style={[styles.attachIcon, { backgroundColor: item.color + '33' }]}>
                    <Ionicons name={item.icon as any} size={26} color={item.color} />
                  </View>
                  <Text style={[{ color: colors.text, fontSize: FontSize.xs, fontWeight: '600' }]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── GIFT MODAL ─── */}
      <GiftModal
        visible={giftModal.visible}
        onClose={() => setGiftModal({ visible: false, msg: null, mode: 'gift' })}
        recipientName={giftModal.msg?.senderName || ''}
        onSendGift={handleSendGift}
        onSendMoney={handleSendMoney}
        mode={giftModal.mode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 6 },
  headerBtnRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, gap: 5, paddingVertical: 6,
    flexWrap: 'nowrap', overflow: 'hidden',
  },
  headerActionBtn: {
    backgroundColor: '#E91E8C', borderRadius: BorderRadius.md,
    paddingHorizontal: 6, paddingVertical: 6,
    alignItems: 'center', justifyContent: 'center',
    gap: 2, minWidth: 48, height: 52, flex: 1, maxWidth: 70,
  },
  headerBtnLabel: {
    color: '#fff', fontSize: 10, fontWeight: '700', includeFontPadding: false,
  },
  badgeDot: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#F44336', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeDotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  onlineCountChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ffffff20', borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4, minWidth: 60,
  },
  headerRoomName: { color: '#fff', fontSize: FontSize.sm, fontWeight: '800', textAlign: 'center' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50' },
  onlineText: { color: '#ffffffbb', fontSize: 11 },
  headerAvatar: {
    width: 52, height: 52, borderRadius: BorderRadius.md, overflow: 'hidden',
    borderWidth: 2, borderColor: '#fff4',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff20',
    flexShrink: 0,
  },
  violationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  violationText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.body, height: 36 },
  previewBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRightWidth: 3, gap: Spacing.sm,
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm,
    paddingBottom: 4, gap: 6, borderTopWidth: 1,
  },
  inputSideBtn: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: FontSize.body, maxHeight: 100, minHeight: 44, borderWidth: 1,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomToolbar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6 },
  toolbarBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 5, gap: 2 },
  toolbarLabel: { fontSize: 9, fontWeight: '600', includeFontPadding: false },
  membersOverlay: {
    flex: 1, backgroundColor: '#00000060',
    flexDirection: 'row', justifyContent: 'flex-end',
  },
  membersPanel: { width: '72%', height: '100%' },
  membersHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1,
  },
  passwordInput: {
    width: '100%', borderRadius: BorderRadius.md, borderWidth: 1,
    padding: Spacing.md, fontSize: FontSize.body, height: 52, marginBottom: Spacing.sm,
  },
  passwordBtn: {
    width: '100%', height: 48, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  stickerPanel: {
    borderTopWidth: 1, paddingBottom: 8,
  },
  stickerBtn: {
    width: 38, height: 38, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  attachPanel: {
    width: '80%', height: '100%',
  },
  attachGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: Spacing.md, gap: Spacing.md,
  },
  attachItem: {
    width: '28%', alignItems: 'center', gap: Spacing.xs,
    padding: Spacing.sm, borderRadius: BorderRadius.lg,
  },
  attachIcon: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
});
