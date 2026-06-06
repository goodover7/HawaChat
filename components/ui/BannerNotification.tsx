// Powered by OnSpace.AI
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';

interface BannerNotifProps {
  notification: {
    type: string;
    emoji: string;
    title: string;
    body: string;
  };
  onDismiss: () => void;
}

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

const styles = StyleSheet.create({
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
