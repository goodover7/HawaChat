// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/Badge';
import { BorderRadius, FontSize, Spacing, RankColors } from '@/constants/theme';

const CATEGORIES = [
  { id: 'messages', label: 'الرسائل', emoji: '💬', color: '#E91E8C' },
  { id: 'coins', label: 'العملات', emoji: '💰', color: '#FFD700' },
  { id: 'level', label: 'المستوى', emoji: '📊', color: '#9C27B0' },
  { id: 'gifts', label: 'الهدايا', emoji: '🎁', color: '#FF4500' },
];

const MEDALS = [
  { rank: 1, emoji: '🥇', color: '#FFD700', bgColor: '#FFD70022', label: 'ذهب' },
  { rank: 2, emoji: '🥈', color: '#C0C0C0', bgColor: '#C0C0C022', label: 'فضة' },
  { rank: 3, emoji: '🥉', color: '#CD7F32', bgColor: '#CD7F3222', label: 'برونز' },
];

function getMedal(rank: number) {
  return MEDALS.find(m => m.rank === rank) || null;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { allUsers, currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(0);

  const cat = CATEGORIES[activeCategory];

  const sortedUsers = [...allUsers]
    .filter(u => !u.isHidden)
    .sort((a, b) => {
      if (cat.id === 'messages') return b.messageCount - a.messageCount;
      if (cat.id === 'coins') return b.coins - a.coins;
      if (cat.id === 'level') return b.level - a.level;
      if (cat.id === 'gifts') return (b.giftsReceived || 0) - (a.giftsReceived || 0);
      return 0;
    })
    .slice(0, 20);

  const getValue = (user: any) => {
    if (cat.id === 'messages') return user.messageCount.toLocaleString();
    if (cat.id === 'coins') return user.coins.toLocaleString();
    if (cat.id === 'level') return `Lv.${user.level}`;
    if (cat.id === 'gifts') return String(user.giftsReceived || 0);
    return '0';
  };

  const myRank = sortedUsers.findIndex(u => u.id === currentUser?.id) + 1;

  const top3 = sortedUsers.slice(0, 3);
  const rest = sortedUsers.slice(3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#1A0033', '#4A0080', '#9C27B0']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🏆 لوحة المتصدرين</Text>
          <Text style={styles.headerSub}>أفضل 20 عضو</Text>
        </View>
        {myRank > 0 ? (
          <View style={styles.myRankChip}>
            <Text style={styles.myRankText}>#{myRank}</Text>
          </View>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </LinearGradient>

      {/* Category Tabs */}
      <View style={[styles.catBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {CATEGORIES.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => setActiveCategory(i)}
            style={[
              styles.catBtn,
              activeCategory === i && { backgroundColor: c.color, borderRadius: BorderRadius.full },
            ]}
          >
            <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
            <Text style={[
              styles.catLabel,
              { color: activeCategory === i ? '#fff' : colors.textSecondary },
            ]}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Top 3 Podium */}
        {top3.length > 0 ? (
          <View style={[styles.podium, { backgroundColor: colors.surfaceCard }]}>
            <LinearGradient
              colors={[cat.color + '33', cat.color + '11']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.podiumTitle, { color: cat.color }]}>
              {cat.emoji} أفضل المتصدرين
            </Text>
            <View style={styles.podiumRow}>
              {/* 2nd place */}
              {top3[1] ? (
                <PodiumCard
                  user={top3[1]}
                  rank={2}
                  value={getValue(top3[1])}
                  catColor={cat.color}
                  colors={colors}
                  height={100}
                  onPress={() => router.push(`/user/${top3[1].id}`)}
                />
              ) : <View style={{ flex: 1 }} />}
              {/* 1st place */}
              {top3[0] ? (
                <PodiumCard
                  user={top3[0]}
                  rank={1}
                  value={getValue(top3[0])}
                  catColor={cat.color}
                  colors={colors}
                  height={130}
                  onPress={() => router.push(`/user/${top3[0].id}`)}
                />
              ) : null}
              {/* 3rd place */}
              {top3[2] ? (
                <PodiumCard
                  user={top3[2]}
                  rank={3}
                  value={getValue(top3[2])}
                  catColor={cat.color}
                  colors={colors}
                  height={80}
                  onPress={() => router.push(`/user/${top3[2].id}`)}
                />
              ) : <View style={{ flex: 1 }} />}
            </View>
          </View>
        ) : null}

        {/* Rest of list (4-20) */}
        <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.xs, marginTop: Spacing.sm }}>
          {rest.map((user, i) => {
            const rank = i + 4;
            const isMe = user.id === currentUser?.id;
            return (
              <Pressable
                key={user.id}
                onPress={() => router.push(`/user/${user.id}`)}
                style={[
                  styles.listRow,
                  {
                    backgroundColor: isMe ? cat.color + '22' : colors.surfaceCard,
                    borderColor: isMe ? cat.color : colors.border,
                  },
                ]}
              >
                <View style={[styles.rankNumBadge, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.rankNum, { color: colors.textSecondary }]}>#{rank}</Text>
                </View>
                <Avatar avatar={user.avatar} size={42} rank={user.rank} frame={user.frame} isOnline={user.isOnline} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[styles.userName, { color: user.nameColor || colors.text }]} numberOfLines={1}>
                      {user.badge ? `${user.badge} ` : ''}{user.displayName}
                    </Text>
                    {user.isVerified ? <VerifiedBadge size={13} /> : null}
                  </View>
                  <Text style={[styles.userSub, { color: colors.textMuted }]}>
                    {user.country || '🌍'} · Lv.{user.level}
                  </Text>
                </View>
                <View style={[styles.valueBadge, { backgroundColor: cat.color + '22', borderColor: cat.color }]}>
                  <Text style={[styles.valueText, { color: cat.color }]}>{getValue(user)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* My rank if not in top 20 */}
        {myRank === 0 && currentUser ? (
          <View style={[styles.myRankBanner, { backgroundColor: colors.surfaceCard, borderColor: cat.color }]}>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }]}>
              أنت لم تدخل أفضل 20 بعد في هذه الفئة
            </Text>
            <Text style={[{ color: cat.color, fontSize: FontSize.body, fontWeight: '800', textAlign: 'center' }]}>
              {cat.emoji} {getValue(currentUser)} — واصل النشاط!
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function PodiumCard({ user, rank, value, catColor, colors, height, onPress }: any) {
  const medal = getMedal(rank);
  return (
    <Pressable onPress={onPress} style={[styles.podiumCard, { flex: 1 }]}>
      <Text style={{ fontSize: 24, textAlign: 'center' }}>{medal?.emoji}</Text>
      <Avatar avatar={user.avatar} size={rank === 1 ? 60 : 48} rank={user.rank} frame={user.frame} isOnline={user.isOnline} />
      <Text style={[styles.podiumName, { color: user.nameColor || colors.text }]} numberOfLines={1}>
        {user.displayName}
      </Text>
      <View style={[
        styles.podiumValue,
        {
          backgroundColor: medal?.bgColor || catColor + '22',
          borderColor: medal?.color || catColor,
          height,
          justifyContent: 'flex-start',
          paddingTop: Spacing.sm,
        },
      ]}>
        <Text style={[styles.podiumValueText, { color: medal?.color || catColor }]}>{value}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '900' },
  headerSub: { color: '#ffffffaa', fontSize: FontSize.xs },
  myRankChip: {
    backgroundColor: '#FFD70030', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 5, minWidth: 44, alignItems: 'center',
  },
  myRankText: { color: '#FFD700', fontWeight: '900', fontSize: FontSize.body },
  catBar: {
    flexDirection: 'row', borderBottomWidth: 1,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs,
  },
  catBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: 4, gap: 2,
  },
  catLabel: { fontSize: 11, fontWeight: '700' },
  podium: {
    margin: Spacing.md, borderRadius: BorderRadius.xl,
    overflow: 'hidden', padding: Spacing.md, gap: Spacing.md,
  },
  podiumTitle: { fontSize: FontSize.body, fontWeight: '800', textAlign: 'center' },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  podiumCard: { alignItems: 'center', gap: 6 },
  podiumName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  podiumValue: {
    width: '100%', borderRadius: BorderRadius.md, borderWidth: 1.5,
    alignItems: 'center', borderBottomRightRadius: 0, borderBottomLeftRadius: 0,
  },
  podiumValueText: { fontSize: FontSize.sm, fontWeight: '900' },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  rankNumBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum: { fontSize: FontSize.xs, fontWeight: '800' },
  userName: { fontSize: FontSize.sm, fontWeight: '700', flex: 1 },
  userSub: { fontSize: 11 },
  valueBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 5,
    borderRadius: BorderRadius.full, borderWidth: 1, minWidth: 60, alignItems: 'center',
  },
  valueText: { fontSize: FontSize.xs, fontWeight: '900' },
  myRankBanner: {
    margin: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: Spacing.xs,
  },
});
