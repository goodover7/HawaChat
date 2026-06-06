// Powered by OnSpace.AI
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { getPrivateMessages, sendPrivateMessage, PrivateMessage } from '@/services/chatService';
import { notifyPrivateMessage } from '@/services/notificationService';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { GiftModal } from '@/components/feature/GiftModal';
import { GIFTS } from '@/constants/config';
import { transferCoins } from '@/services/authService';
import { BorderRadius, FontSize, Spacing, RankColors } from '@/constants/theme';
import { useAlert } from '@/template';

export default function PrivateChatScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { currentUser, allUsers, refreshUser } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<PrivateMessage | null>(null);
  const [giftModal, setGiftModal] = useState<{ visible: boolean; mode: 'gift' | 'money' }>({ visible: false, mode: 'gift' });

  const otherUser = allUsers.find(u => u.id === userId);

  useEffect(() => {
    if (currentUser && userId) {
      loadMessages();
    }
  }, [userId]);

  async function loadMessages() {
    const msgs = await getPrivateMessages(currentUser!.id, userId);
    setMessages(msgs);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !currentUser || !otherUser) return;
    setInputText('');
    const msg = await sendPrivateMessage(
      currentUser.id, otherUser.id,
      currentUser.displayName, currentUser.avatar,
      text, replyTo, null
    );
    setMessages(prev => [...prev, msg]);
    setReplyTo(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    // Send notification to receiver
    await notifyPrivateMessage(otherUser.id, currentUser.displayName, currentUser.id, text);
  };

  const handleSendGift = async (giftId: string) => {
    if (!currentUser || !otherUser) return;
    const gift = GIFTS.find(g => g.id === giftId);
    if (!gift) return;
    if (currentUser.coins < gift.cost) {
      showAlert('رصيد غير كافٍ', `تحتاج ${gift.cost} عملة`);
      return;
    }
    await transferCoins(currentUser.id, otherUser.id, gift.cost);
    const msg = await sendPrivateMessage(
      currentUser.id, otherUser.id,
      currentUser.displayName, currentUser.avatar,
      `أرسل هدية ${gift.emoji} ${gift.name}`, null, giftId
    );
    setMessages(prev => [...prev, msg]);
    await refreshUser();
    showAlert('تم!', `أرسلت ${gift.name} إلى ${otherUser.displayName} 🎉`);
  };

  const handleSendMoney = async (amount: number) => {
    if (!currentUser || !otherUser) return;
    const result = await transferCoins(currentUser.id, otherUser.id, amount);
    if (!result.success) {
      showAlert('خطأ', result.error || 'فشل إرسال العملات');
      return;
    }
    const msg = await sendPrivateMessage(
      currentUser.id, otherUser.id,
      currentUser.displayName, currentUser.avatar,
      `أرسل ${amount} 💰 عملات`, null, null
    );
    setMessages(prev => [...prev, msg]);
    await refreshUser();
    showAlert('تم!', `أرسلت ${amount} عملة 💸`);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderMessage = ({ item }: { item: PrivateMessage }) => {
    const isOwn = item.senderId === currentUser?.id;
    const giftData = item.gift ? GIFTS.find(g => g.id === item.gift) : null;

    return (
      <View style={[styles.msgContainer, isOwn && styles.msgOwn]}>
        {!isOwn ? (
          <Avatar avatar={otherUser?.avatar || '👤'} size={32} rank={otherUser?.rank || 'member'} />
        ) : null}
        <Pressable
          onLongPress={() => setReplyTo(item)}
          style={[
            styles.msgBubble,
            isOwn
              ? { backgroundColor: colors.primary }
              : { backgroundColor: colors.surfaceCard, borderColor: colors.border, borderWidth: 1 },
          ]}
        >
          {item.replyTo ? (
            <View style={[styles.replyBox, { borderLeftColor: isOwn ? '#ffffff88' : colors.primary }]}>
              <Text style={[styles.replyText, { color: isOwn ? '#ffffffaa' : colors.textSecondary }]} numberOfLines={1}>
                {item.replyTo.text}
              </Text>
            </View>
          ) : null}
          {giftData ? (
            <Text style={styles.giftText}>{giftData.emoji} {giftData.name}</Text>
          ) : null}
          <Text style={[styles.msgText, { color: isOwn ? '#fff' : colors.text }]}>{item.text}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
            <Text style={[styles.msgTime, { color: isOwn ? '#ffffff88' : colors.textMuted }]}>
              {formatTime(item.timestamp)}
            </Text>
            {isOwn ? (
              <Text style={{ fontSize: 11, color: item.isRead ? '#4CAF50' : '#ffffffaa' }}>
                {item.isRead ? '✓✓' : '✓'}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </View>
    );
  };

  if (!otherUser) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.text }}>المستخدم غير موجود</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Avatar avatar={otherUser.avatar} size={36} rank={otherUser.rank} isOnline={otherUser.isOnline} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherUser.displayName}</Text>
          <Text style={styles.headerStatus}>{otherUser.isOnline ? '🟢 متصل' : '⭕ غير متصل'}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setGiftModal({ visible: true, mode: 'gift' })} hitSlop={8}>
            <Ionicons name="gift" size={22} color="#FFD700" />
          </Pressable>
          <Pressable onPress={() => setGiftModal({ visible: true, mode: 'money' })} hitSlop={8}>
            <Ionicons name="cash" size={22} color="#4CAF50" />
          </Pressable>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                ابدأ المحادثة مع {otherUser.displayName}
              </Text>
            </View>
          }
        />

        {replyTo ? (
          <View style={[styles.replyPreview, { backgroundColor: colors.surfaceElevated, borderLeftColor: colors.primary }]}>
            <Text style={[styles.replyPreviewText, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
              {replyTo.text}
            </Text>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
            placeholder="رسالة خاصة..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlign="right"
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceElevated }]}
          >
            <Ionicons name="send" size={20} color={inputText.trim() ? '#fff' : colors.textMuted} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <GiftModal
        visible={giftModal.visible}
        onClose={() => setGiftModal({ visible: false, mode: 'gift' })}
        recipientName={otherUser.displayName}
        onSendGift={handleSendGift}
        onSendMoney={handleSendMoney}
        mode={giftModal.mode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerInfo: { flex: 1 },
  headerName: { color: '#fff', fontSize: FontSize.body, fontWeight: '700' },
  headerStatus: { color: '#ffffffaa', fontSize: FontSize.xs },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  msgContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  msgOwn: { flexDirection: 'row-reverse' },
  msgBubble: {
    maxWidth: '75%',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderTopLeftRadius: 4,
    gap: 3,
  },
  replyBox: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.sm,
    marginBottom: 2,
  },
  replyText: { fontSize: FontSize.xs },
  giftText: { fontSize: 20 },
  msgText: { fontSize: FontSize.body },
  msgTime: { fontSize: FontSize.xs, textAlign: 'right' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  emptyEmoji: { fontSize: 64 },
  emptyText: { fontSize: FontSize.body, textAlign: 'center' },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: 3,
    gap: Spacing.sm,
  },
  replyPreviewText: { fontSize: FontSize.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.body,
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
