// Powered by OnSpace.AI
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { RankColors } from '@/constants/theme';
import { AnimatedFrame } from '@/components/ui/AnimatedFrame';

interface AvatarProps {
  avatar: string;
  size?: number;
  rank?: string;
  frame?: string | null;
  isOnline?: boolean;
  nameColor?: string | null;
  isVerified?: boolean;
}

function isImageUri(avatar: string): boolean {
  return (
    avatar.startsWith('file://') ||
    avatar.startsWith('content://') ||
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('ph://')
  );
}

export function Avatar({ avatar, size = 44, rank = 'member', frame, isOnline, isVerified }: AvatarProps) {
  const { colors } = useTheme();
  const rankColor = RankColors[rank] || colors.primary;

  const innerSize = size;
  const avatarNode = (
    <View style={[
      styles.avatarInner,
      {
        width: innerSize,
        height: innerSize,
        borderRadius: innerSize / 2,
        backgroundColor: colors.surfaceElevated,
        // subtle rank ring when no frame
        borderColor: frame ? 'transparent' : rankColor,
        borderWidth: frame ? 0 : 2,
      },
    ]}>
      {isImageUri(avatar) ? (
        <Image
          source={{ uri: avatar }}
          style={{ width: innerSize - 4, height: innerSize - 4, borderRadius: (innerSize - 4) / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{ fontSize: innerSize * 0.54, includeFontPadding: false }}>{avatar}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.wrapper, { width: size + (frame ? 12 : 6), height: size + (frame ? 12 : 6) }]}>
      {frame ? (
        <AnimatedFrame size={innerSize} frame={frame}>
          {avatarNode}
        </AnimatedFrame>
      ) : (
        avatarNode
      )}

      {isOnline !== undefined ? (
        <View style={[
          styles.onlineDot,
          {
            backgroundColor: isOnline ? colors.online : colors.offline,
            width: Math.max(8, size * 0.24),
            height: Math.max(8, size * 0.24),
            borderRadius: Math.max(4, size * 0.12),
            borderColor: colors.surface,
            bottom: 1,
            right: 1,
          },
        ]} />
      ) : null}
      {isVerified ? (
        <View style={[styles.verifiedBadge, { bottom: isOnline !== undefined ? Math.max(8, size * 0.24) + 2 : 0, right: 0 }]}>
          <Text style={{ fontSize: Math.max(10, size * 0.22) }}>✅</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
  },
  verifiedBadge: {
    position: 'absolute',
  },
});
