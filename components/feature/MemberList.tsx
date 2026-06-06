// Powered by OnSpace.AI
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { RankBadge } from '@/components/ui/Badge';
import { User } from '@/services/authService';
import { sendFriendRequest, isFriend } from '@/services/friendService';
import { FontSize, Spacing, BorderRadius, RankOrder } from '@/constants/theme';
import { useAlert } from '@/template';

interface MemberListProps {
  users: User[];
  onPress?: (user: User) => void;
}

const FILTER_OPTIONS = [
  { id: 'all', label: 'الكل' },
  { id: 'online', label: 'متصل' },
  { id: 'owner', label: 'إدارة' },
];

export function MemberList({ users, onPress }: MemberListProps) {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const ADMIN_RANKS = ['owner', 'high_admin', 'legend', 'admin', 'general_supervisor', 'guardian', 'moderator'];

  const filtered = useMemo(() => {
    let list = [...users];
    // Apply filter
    if (filter === 'online') list = list.filter(u => u.isOnline && !u.isHidden);
    else if (filter === 'owner') list = list.filter(u => ADMIN_RANKS.includes(u.rank));
    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    }
    // Sort: online first, then by rank
    return list.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return (RankOrder[b.rank] || 0) - (RankOrder[a.rank] || 0);
    });
  }, [users, search, filter]);

  const online = filtered.filter(u => u.isOnline && !u.isHidden);
  const offline = filtered.filter(u => !u.isOnline || u.isHidden);

  const handleQuickPrivate = (user: User) => {
    if (!currentUser || user.id === currentUser.id) return;
    router.push(`/private/${user.id}`);
  };

  const handleQuickFriend = async (user: User) => {
    if (!currentUser || user.id === currentUser.id) return;
    const already = await isFriend(currentUser.id, user.id);
    if (already) { showAlert('أصدقاء 🤝', `أنتما أصدقاء بالفعل`); return; }
    const result = await sendFriendRequest(
      currentUser.id, currentUser.displayName, currentUser.avatar, currentUser.rank,
      user.id, user.displayName
    );
    if (result.success) showAlert('تم ✅', `تم إرسال طلب صداقة إلى ${user.displayName}`);
    else showAlert('تنبيه', result.error || 'فشل الإرسال');
  };

  const renderUser = (user: User) => {
    const isMe = user.id === currentUser?.id;
    const genderColor = user.gender === 'male' ? '#2196F3' : user.gender === 'female' ? '#E91E8C' : null;
    const genderEmoji = user.gender === 'male' ? '♂️' : user.gender === 'female' ? '♀️' : null;

    return (
      <Pressable
        key={user.id}
        style={({ pressed }) => [
          styles.userItem,
          { backgroundColor: pressed ? colors.surfaceElevated : 'transparent' },
        ]}
        onPress={() => onPress?.(user)}
      >
        <Avatar avatar={user.avatar} size={40} rank={user.rank} frame={user.frame} isOnline={user.isOnline} />
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            {user.badge ? <Text style={styles.badge}>{user.badge}</Text> : null}
            <Text
              style={[styles.userName, { color: user.nameColor || colors.text }]}
              numberOfLines={1}
            >
              {user.displayName}
            </Text>
            {user.isVerified ? <Text style={{ fontSize: 12 }}>✅</Text> : null}
            {genderEmoji && genderColor ? (
              <Text style={{ fontSize: 11, color: genderColor }}>{genderEmoji}</Text>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <RankBadge rank={user.rank} size="sm" />
            <Text style={[styles.levelText, { color: colors.textMuted }]}>Lv.{user.level}</Text>
            {user.isMuted ? <Text style={{ fontSize: 10, color: '#FF9800' }}>🔇</Text> : null}
          </View>
        </View>
        {/* Quick action buttons */}
        {!isMe ? (
          <View style={styles.quickActions}>
            <Pressable
              onPress={() => handleQuickPrivate(user)}
              style={[styles.quickBtn, { backgroundColor: colors.primary + '22' }]}
              hitSlop={4}
            >
              <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
            </Pressable>
            <Pressable
              onPress={() => handleQuickFriend(user)}
              style={[styles.quickBtn, { backgroundColor: '#4CAF5022' }]}
              hitSlop={4}
            >
              <Ionicons name="person-add-outline" size={14} color="#4CAF50" />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.meTag, { backgroundColor: colors.primary + '22' }]}>
            <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '700' }}>أنا</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.border }]}>
        <Ionicons name="search-outline" size={15} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="بحث عن عضو..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={15} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ maxHeight: 40 }}
      >
        {FILTER_OPTIONS.map(opt => {
          const active = filter === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setFilter(opt.id)}
              style={[styles.filterChip, {
                backgroundColor: active ? colors.primary : colors.surfaceElevated,
                borderColor: active ? colors.primary : colors.border,
              }]}
            >
              <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Online */}
        {online.length > 0 ? (
          <>
            <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceElevated }]}>
              <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>متصل ({online.length})</Text>
            </View>
            {online.map(renderUser)}
          </>
        ) : null}

        {/* Offline */}
        {offline.length > 0 ? (
          <>
            <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceElevated }]}>
              <View style={[styles.dot, { backgroundColor: colors.offline }]} />
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>غير متصل ({offline.length})</Text>
            </View>
            {offline.map(renderUser)}
          </>
        ) : null}

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={[{ color: colors.textMuted, fontSize: FontSize.sm }]}>لا توجد نتائج</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    gap: Spacing.sm, borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, height: 34 },
  filterRow: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    gap: Spacing.xs, alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  filterChipText: { fontSize: FontSize.xs, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: '800' },
  userItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  userInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: { fontSize: 14 },
  userName: { fontSize: FontSize.sm, fontWeight: '700', flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  levelText: { fontSize: 10, fontWeight: '600' },
  quickActions: { flexDirection: 'row', gap: 5 },
  quickBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  meTag: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingTop: 40 },
});
