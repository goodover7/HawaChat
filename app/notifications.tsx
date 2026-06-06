// Powered by OnSpace.AI
// In-app notification center + mute/ban/kick auto-lift banner
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, Animated, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import {
  getNotificationsForUser, markAsRead, markAllRead, deleteNotification,
  getUnreadCount, clearAllForUser, AppNotification,
} from '@/services/notificationService';
import { checkAndGetLiftedActions } from '@/services/authService';
import { playMessageSound, playFriendRequestSound, playReportAlertSound } from '@/services/soundService';

const NOTIF_ICONS: Record<string, { icon: string; color: string }> = {
  friend_request: { icon: 'person-add', color: '#4CAF50' },
  friend_accepted: { icon: 'people', color: '#2196F3' },
  friend_rejected: { icon: 'person-remove', color: '#F44336' },
  private_message: { icon: 'chatbubble', color: '#9C27B0' },
  report_received: { icon: 'alert-circle', color: '#F44336' },
  report_resolved: { icon: 'checkmark-circle', color: '#4CAF50' },
  mute_lifted: { icon: 'volume-high', color: '#FF9800' },
  ban_lifted: { icon: 'checkmark-shield', color: '#4CAF50' },
  news_published: { icon: 'newspaper', color: '#E91E8C' },
  gift_received: { icon: 'gift', color: '#FFD700' },
  warning: { icon: 'warning', color: '#FF9800' },
  rank_changed: { icon: 'ribbon', color: '#9C27B0' },
  level_changed: { icon: 'trending-up', color: '#2196F3' },
};

interface BannerNotifProps {
  notification: AppNotification;
  onDismiss: () => void;
}

export function BannerNotification({ notification, onDismiss }: BannerNotifProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const { colors } = useTheme();
  const iconInfo = NOTIF_ICONS[notification.type] || { icon: 'notifications', color: '#E91E8C' };

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0, useNativeDriver: true,
      tension: 80, friction: 10,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -100, duration: 300, useNativeDriver: true,
      }).start(() => onDismiss());
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: colors.surface, transform: [{ translateY }] },
      ]}
    >
      <LinearGradient
        colors={[iconInfo.color + '22', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.bannerGradient}
      >
        <View style={[styles.bannerIcon, { backgroundColor: iconInfo.color + '33' }]}>
          <Text style={{ fontSize: 18 }}>{notification.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: colors.text }]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={[styles.bannerBody, { color: colors.textSecondary }]} numberOfLines={1}>
            {notification.body}
          </Text>
        </View>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentUser, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) load();
  }, [currentUser]);

  async function load() {
    if (!currentUser) return;
    setLoading(true);
    const notifs = await getNotificationsForUser(currentUser.id);
    setNotifications(notifs);
    const count = await getUnreadCount(currentUser.id);
    setUnreadCount(count);
    setLoading(false);
  }

  async function handleMarkAll() {
    if (!currentUser) return;
    await markAllRead(currentUser.id);
    await load();
  }

  async function handleClearAll() {
    if (!currentUser) return;
    await clearAllForUser(currentUser.id);
    setNotifications([]);
    setUnreadCount(0);
  }

  async function handleRead(notif: AppNotification) {
    await markAsRead(notif.id);
    await load();
  }

  async function handleDelete(notifId: string) {
    await deleteNotification(notifId);
    await load();
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} د`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `منذ ${diffH} س`;
    return d.toLocaleDateString('ar');
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const iconInfo = NOTIF_ICONS[item.type] || { icon: 'notifications', color: '#E91E8C' };
    return (
      <Pressable
        onPress={() => handleRead(item)}
        style={[
          styles.notifCard,
          {
            backgroundColor: item.isRead ? colors.surfaceCard : colors.primary + '12',
            borderColor: item.isRead ? colors.border : colors.primary + '55',
          },
        ]}
      >
        <View style={[styles.notifIconWrap, { backgroundColor: iconInfo.color + '22' }]}>
          <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead ? (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            ) : null}
          </View>
          <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.notifTime, { color: colors.textMuted }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
        <Pressable onPress={() => handleDelete(item.id)} hitSlop={8} style={styles.deleteBtn}>
          <Ionicons name="close" size={14} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🔔 الإشعارات</Text>
          {unreadCount > 0 ? (
            <Text style={styles.headerSub}>{unreadCount} غير مقروء</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {unreadCount > 0 ? (
            <Pressable onPress={handleMarkAll} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name="checkmark-done" size={18} color="#fff" />
            </Pressable>
          ) : null}
          {notifications.length > 0 ? (
            <Pressable onPress={handleClearAll} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name="trash" size={16} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 56 }}>🔔</Text>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '700' }]}>
              لا توجد إشعارات
            </Text>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }]}>
              ستظهر إشعاراتك هنا عند وصولها
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
  headerSub: { color: '#ffffffaa', fontSize: FontSize.xs },
  headerBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center',
  },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    borderWidth: 1, gap: Spacing.sm,
  },
  notifIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  notifTitle: { fontSize: FontSize.sm, fontWeight: '700', flex: 1 },
  notifBody: { fontSize: FontSize.sm, lineHeight: 20 },
  notifTime: { fontSize: FontSize.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  deleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: Spacing.md, paddingTop: 80 },
  // Banner styles
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
    borderBottomLeftRadius: BorderRadius.lg, borderBottomRightRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 12,
  },
  bannerGradient: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.sm,
  },
  bannerIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontSize: FontSize.sm, fontWeight: '800' },
  bannerBody: { fontSize: FontSize.xs },
});
