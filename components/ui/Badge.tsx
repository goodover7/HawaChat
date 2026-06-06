// Powered by OnSpace.AI
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, BorderRadius, Spacing } from '@/constants/theme';

interface RankBadgeProps {
  rank: string;
  size?: 'sm' | 'md' | 'lg';
  // Support for dynamic rank info passed directly (so profile uses live data)
  rankLabel?: string;
  rankColor?: string;
  isGlow?: boolean;
}

export function RankBadge({ rank, size = 'sm', rankLabel, rankColor, isGlow }: RankBadgeProps) {
  const { colors } = useTheme();
  // Use provided dynamic values if available, fall back to static maps
  const color = rankColor || STATIC_RANK_COLORS[rank] || colors.textSecondary;
  const label = rankLabel || STATIC_RANK_LABELS[rank] || rank;
  const fontSize = size === 'sm' ? FontSize.xs : size === 'md' ? FontSize.sm : FontSize.body;
  const glow = isGlow ?? RANK_GLOWS[rank] ?? false;

  return (
    <View style={[
      styles.badge,
      { borderColor: color, backgroundColor: `${color}25` },
      glow && {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
      },
    ]}>
      <Text style={[styles.text, { color, fontSize }]}>{label}</Text>
    </View>
  );
}

interface LevelBadgeProps {
  level: number;
  title: string;
  size?: 'sm' | 'md';
}

export function LevelBadge({ level, title, size = 'sm' }: LevelBadgeProps) {
  const { colors } = useTheme();
  const fontSize = size === 'sm' ? FontSize.xs : FontSize.sm;
  return (
    <View style={[styles.badge, { borderColor: colors.accent, backgroundColor: `${colors.accent}20` }]}>
      <Text style={[styles.text, { color: colors.accent, fontSize }]}>⚡ Lv.{level} {title}</Text>
    </View>
  );
}

interface PrivilegeBadgeProps {
  label: string;
  color?: string;
}

export function PrivilegeBadge({ label, color = '#9C27B0' }: PrivilegeBadgeProps) {
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}20` }]}>
      <Text style={[styles.text, { color, fontSize: FontSize.xs }]}>{label}</Text>
    </View>
  );
}

/**
 * Blue verified checkmark badge — matching Twitter/Meta style.
 */
interface VerifiedBadgeProps {
  size?: number;
}

export function VerifiedBadge({ size = 16 }: VerifiedBadgeProps) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="11" fill="#1D9BF0" />
        <Path
          d="M7 12.5L10.5 16L17 9"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    includeFontPadding: false,
  },
});

// ── Static fallback maps (used when dynamic rank data not yet loaded) ──────
export const STATIC_RANK_LABELS: Record<string, string> = {
  owner: '👑 المالك',
  high_admin: '⭐ إدارة عليا',
  legend: '🔥 أسطورة',
  admin: '🛡️ أدمن',
  general_supervisor: '🛡️ مشرف عام',
  guardian: '⚔️ حارس',
  moderator: '🎖️ مشرف',
  room_owner: '🏆 مالك غرفة',
  room_manager: '⭐ مدير غرفة',
  room_supervisor: '🛡️ مشرف غرفة',
  chat_legend: '💎 أساطير الشات',
  vip: '💎 VIP',
  vip_char: '💜 كبار الشخصيات',
  star: '⭐ نجم',
  worthy: '✨ مميز بجدارة',
  distinguished: '💠 رتبة مميز',
  member: '👤 عضو',
  newbie: '🌱 جديد',
};

export const STATIC_RANK_COLORS: Record<string, string> = {
  owner: '#FF4500',
  high_admin: '#FFD700',
  legend: '#FF6B35',
  admin: '#E91E8C',
  general_supervisor: '#90A4AE',
  guardian: '#00BCD4',
  moderator: '#9C27B0',
  room_owner: '#F44336',
  room_manager: '#FF9800',
  room_supervisor: '#26C6DA',
  chat_legend: '#EF5350',
  vip: '#FFD700',
  vip_char: '#AB47BC',
  star: '#FF9800',
  worthy: '#FDD835',
  distinguished: '#29B6F6',
  member: '#B0B0CC',
  newbie: '#78909C',
};

const RANK_GLOWS: Record<string, boolean> = {
  owner: true,
  high_admin: true,
  legend: true,
  admin: true,
  general_supervisor: false,
};

// Re-export for backwards compatibility
export const RankColors = STATIC_RANK_COLORS;
export const RankLabels = STATIC_RANK_LABELS;
