// Powered by OnSpace.AI
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, TextInput,
  Modal, ScrollView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { getPrivateMessages, PrivateMessage } from '@/services/chatService';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { User } from '@/services/authService';
import { BorderRadius, FontSize, Spacing, RankColors } from '@/constants/theme';
import {
  getPendingRequestsForUser, respondToFriendRequest,
  getFriendsList, getFriendNotifications, markFriendNotifsRead,
  FriendRequest, FriendNotification, isFriend,
} from '@/services/friendService';
import { playFriendRequestSound } from '@/services/soundService';
import { useAlert } from '@/template';

interface Conversation {
  user: User;
  lastMessage: PrivateMessage | null;
  unreadCount: number;
  isFriend: boolean;
}

const MSG_TABS = ['الرسائل', 'الأصدقاء', 'إشعارات'];

export default function MessagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentUser, allUsers } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState(tab ? parseInt(tab) : 0);

  useEffect(() => {
    if (tab !== undefined) setActiveTab(parseInt(tab));
  }, [tab]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendNotifications, setFriendNotifications] = useState<FriendNotification[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAll();
  }, [allUsers, currentUser]);

  const loadAll = useCallback(async () => {
    if (!currentUser) return;
    await Promise.all([
      loadConversations(),
      loadFriendData(),
    ]);
  }, [currentUser, allUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  async function loadConversations() {
    if (!currentUser) return;
    const friends = await getFriendsList(currentUser.id);
    setFriendIds(friends);
    const convs: Conversation[] = [];
    for (const user of allUsers) {
      if (user.id === currentUser.id) continue;
      const messages = await getPrivateMessages(currentUser.id, user.id);
      if (messages.length > 0) {
        const unread = messages.filter(m => m.receiverId === currentUser.id && !m.isRead).length;
        convs.push({
          user,
          lastMessage: messages[messages.length - 1],
          unreadCount: unread,
          isFriend: friends.includes(user.id),
        });
      }
    }
    convs.sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0;
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });
    setConversations(convs);
  }

  async function loadFriendData() {
    if (!currentUser) return;
    const requests = await getPendingRequestsForUser(currentUser.id);
    setFriendRequests(requests);
    const notifs = await getFriendNotifications(currentUser.id);
    setFriendNotifications(notifs);
    if (notifs.some(n => !n.isRead)) await markFriendNotifsRead(currentUser.id);
  }

  async function handleRespondRequest(req: FriendRequest, accept: boolean) {
    if (!currentUser) return;
    const result = await respondToFriendRequest(
      req.id, accept,
      currentUser.id, currentUser.displayName, currentUser.avatar, currentUser.rank
    );
    if (result.success) {
      if (accept) await playFriendRequestSound();
      showAlert(accept ? 'تم القبول 🎉' : 'تم الرفض', accept ? `أنتما الآن أصدقاء!` : 'رُفض الطلب');
      await loadFriendData();
    }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const friendUsers = allUsers.filter(u => friendIds.includes(u.id));
  const filteredFriends = searchText.trim()
    ? friendUsers.filter(u => u.displayName.toLowerCase().includes(searchText.toLowerCase()))
    : friendUsers;

  const totalNotifCount = friendRequests.length + friendNotifications.filter(n => !n.isRead).length;

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
      onPress={() => router.push(`/private/${item.user.id}`)}
      style={({ pressed }) => [
        styles.convCard,
        { backgroundColor: colors.surfaceCard, borderColor: item.isFriend ? colors.success + '55' : colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Avatar avatar={item.user.avatar} size={48} rank={item.user.rank} frame={item.user.frame} isOnline={item.user.isOnline} />
      <View style={styles.convInfo}>
        <View style={styles.convTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
            <Text style={[styles.convName, { color: item.user.nameColor || colors.text }]} numberOfLines={1}>
              {item.user.badge || ''} {item.user.displayName}
            </Text>
            {item.user.isVerified ? <Text style={{ fontSize: 12 }}>✅</Text> : null}
            {item.isFriend ? <Ionicons name="people" size={12} color={colors.success} /> : null}
          </View>
          {item.lastMessage ? (
            <Text style={[styles.convTime, { color: colors.textMuted }]}>
              {formatTime(item.lastMessage.timestamp)}
            </Text>
          ) : null}
        </View>
        <View style={styles.convBottom}>
          <Text style={[styles.convLast, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.lastMessage?.gift ? '🎁 هدية' : item.lastMessage?.text || ''}
          </Text>
          {item.unreadCount > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={[styles.reqCard, { backgroundColor: colors.surfaceCard, borderColor: colors.primary + '44' }]}>
      <Avatar avatar={item.fromAvatar} size={44} rank={item.fromRank} />
      <View style={{ flex: 1 }}>
        <Text style={[{ color: colors.text, fontWeight: '700', fontSize: FontSize.body }]}>{item.fromName}</Text>
        <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>
          طلب صداقة · {new Date(item.timestamp).toLocaleDateString('ar')}
        </Text>
      </View>
      <View style={styles.reqBtns}>
        <Pressable onPress={() => handleRespondRequest(item, true)} style={[styles.reqBtn, { backgroundColor: '#4CAF50' }]}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </Pressable>
        <Pressable onPress={() => handleRespondRequest(item, false)} style={[styles.reqBtn, { backgroundColor: colors.error }]}>
          <Ionicons name="close" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );

  const renderFriendUser = ({ item }: { item: User }) => (
    <Pressable
      onPress={() => router.push(`/private/${item.id}`)}
      style={({ pressed }) => [
        styles.friendCard,
        { backgroundColor: colors.surfaceCard, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Avatar avatar={item.avatar} size={44} rank={item.rank} frame={item.frame} isOnline={item.isOnline} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[{ color: item.nameColor || colors.text, fontWeight: '700', fontSize: FontSize.body }]} numberOfLines={1}>
            {item.badge || ''} {item.displayName}
          </Text>
          {item.isVerified ? <Text style={{ fontSize: 12 }}>✅</Text> : null}
        </View>
        <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>
          {item.isOnline ? '🟢 متصل' : '⚪ غير متصل'} · Lv.{item.level}
        </Text>
      </View>
      <RankBadge rank={item.rank} />
      <Pressable
        onPress={() => router.push(`/private/${item.id}`)}
        style={[styles.msgFriendBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="chatbubble" size={14} color="#fff" />
      </Pressable>
    </Pressable>
  );

  const renderNotification = ({ item }: { item: FriendNotification }) => (
    <View style={[
      styles.notifCard,
      {
        backgroundColor: colors.surfaceCard,
        borderColor: item.type === 'friend_accepted' ? colors.success + '44' :
                     item.type === 'friend_rejected' ? colors.error + '44' : colors.primary + '44',
      },
    ]}>
      <Avatar avatar={item.fromAvatar} size={40} rank={item.fromRank} />
      <View style={{ flex: 1 }}>
        <Text style={[{ color: colors.text, fontWeight: '600', fontSize: FontSize.sm }]}>{item.message}</Text>
        <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }]}>
          {new Date(item.timestamp).toLocaleDateString('ar')} · {new Date(item.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={{ fontSize: 18 }}>
        {item.type === 'friend_accepted' ? '🎉' : item.type === 'friend_rejected' ? '😢' : '👋'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Text style={styles.headerTitle}>💌 الرسائل والأصدقاء</Text>
        <Text style={styles.headerSub}>
          {conversations.length} محادثة · {friendIds.length} صديق
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {MSG_TABS.map((tab, i) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(i)}
            style={[styles.tab, activeTab === i && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === i ? colors.primary : colors.textMuted }]}>
              {tab}
              {i === 1 && friendRequests.length > 0 ? ` (${friendRequests.length})` : ''}
              {i === 2 && totalNotifCount > 0 ? ` (${totalNotifCount})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Search bar for conversations + friends */}
      {activeTab !== 2 ? (
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={activeTab === 0 ? 'بحث في المحادثات...' : 'بحث في الأصدقاء...'}
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            textAlign="right"
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText('')}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* ── TAB: Conversations ── */}
      {activeTab === 0 ? (
        <FlatList
          data={searchText.trim() ? conversations.filter(c => c.user.displayName.toLowerCase().includes(searchText.toLowerCase())) : conversations}
          keyExtractor={item => item.user.id}
          renderItem={renderConversation}
          contentContainerStyle={[styles.list, conversations.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            allUsers.filter(u => u.isOnline && u.id !== currentUser?.id).length > 0 ? (
              <View style={[styles.onlineBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.onlineTitle, { color: colors.textSecondary }]}>متصلون:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md, paddingHorizontal: 4 }}>
                  {allUsers.filter(u => u.isOnline && u.id !== currentUser?.id && !u.isHidden).map(u => (
                    <Pressable key={u.id} onPress={() => router.push(`/private/${u.id}`)} style={styles.onlineUser}>
                      <Avatar avatar={u.avatar} size={38} rank={u.rank} isOnline />
                      <Text style={[styles.onlineUserName, { color: colors.textMuted }]} numberOfLines={1}>
                        {u.displayName.split(' ')[0]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>لا توجد محادثات</Text>
              <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }]}>
                ابدأ محادثة من غرفة الدردشة
              </Text>
            </View>
          }
        />
      ) : activeTab === 1 ? (
        // ── TAB: Friends ──
        <FlatList
          data={filteredFriends}
          keyExtractor={item => item.id}
          renderItem={renderFriendUser}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListHeaderComponent={
            friendRequests.length > 0 ? (
              <View>
                <Text style={[styles.sectionHeader, { color: colors.text }]}>
                  👥 طلبات الصداقة ({friendRequests.length})
                </Text>
                {friendRequests.map(req => (
                  <View key={req.id} style={{ marginBottom: Spacing.sm }}>
                    {renderFriendRequest({ item: req })}
                  </View>
                ))}
                <Text style={[styles.sectionHeader, { color: colors.text, marginTop: Spacing.md }]}>
                  🤝 أصدقاؤك ({friendIds.length})
                </Text>
              </View>
            ) : (
              <Text style={[styles.sectionHeader, { color: colors.text }]}>
                🤝 أصدقاؤك ({friendIds.length})
              </Text>
            )
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🤝</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>لا يوجد أصدقاء بعد</Text>
              <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }]}>
                أرسل طلبات صداقة من غرفة الدردشة
              </Text>
            </View>
          }
        />
      ) : (
        // ── TAB: Notifications ──
        <FlatList
          data={friendNotifications}
          keyExtractor={item => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>لا توجد إشعارات</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, alignItems: 'center', gap: 2 },
  headerTitle: { color: '#fff', fontSize: FontSize.xl, fontWeight: '800' },
  headerSub: { color: '#ffffffaa', fontSize: FontSize.sm },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  tabText: { fontSize: FontSize.xs, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.body, height: 36 },
  list: { padding: Spacing.md, gap: Spacing.sm },
  emptyList: { flex: 1 },
  convCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    gap: Spacing.md, borderWidth: 1,
  },
  convInfo: { flex: 1, gap: 4 },
  convTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convName: { fontSize: FontSize.body, fontWeight: '700', flex: 1 },
  convTime: { fontSize: FontSize.xs },
  convBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convLast: { fontSize: FontSize.sm, flex: 1 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  unreadText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  onlineBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm,
  },
  onlineTitle: { fontSize: FontSize.xs, fontWeight: '600', minWidth: 50 },
  onlineUser: { alignItems: 'center', gap: 2, width: 52 },
  onlineUserName: { fontSize: 10, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingTop: 60 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700' },
  sectionHeader: { fontSize: FontSize.body, fontWeight: '800', marginBottom: Spacing.sm, textAlign: 'right' },
  reqCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    gap: Spacing.sm, borderWidth: 1,
  },
  reqBtns: { flexDirection: 'row', gap: Spacing.xs },
  reqBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  friendCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    gap: Spacing.sm, borderWidth: 1,
  },
  msgFriendBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  notifCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    gap: Spacing.sm, borderWidth: 1,
  },
});
