// Powered by OnSpace.AI
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/Badge';
import { ChatMessage, toggleReaction } from '@/services/chatService';
import { RankColors, FontSize, Spacing, BorderRadius, RankLabels } from '@/constants/theme';
import { GIFTS } from '@/constants/config';

const REACTION_EMOJIS = ['❤️', '😂', '🔥', '👍', '😮', '😢'];

interface MessageBubbleProps {
  message: ChatMessage;
  onReply: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onReport: (msg: ChatMessage) => void;
  onSendGift: (msg: ChatMessage) => void;
  onSendMoney: (msg: ChatMessage) => void;
  onStartPrivateChat: (msg: ChatMessage) => void;
  onViewProfile: (msg: ChatMessage) => void;
  onAddFriend?: (msg: ChatMessage) => void;
}

export function MessageBubble({
  message,
  onReply, onDelete, onEdit, onReport,
  onSendGift, onSendMoney, onStartPrivateChat, onViewProfile, onAddFriend,
}: MessageBubbleProps) {
  const { colors, isDark } = useTheme();
  const { currentUser, allUsers } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isOwn = currentUser?.id === message.senderId;
  const isModerator = ['owner', 'legend', 'admin', 'guardian', 'moderator', 'high_admin', 'general_supervisor'].includes(currentUser?.rank || '');
  const canDelete = isOwn || isModerator;
  const canEdit = isOwn && !message.isDeleted;

  const nameColor = message.senderNameColor || RankColors[message.senderRank] || colors.primary;
  const giftData = message.gift ? GIFTS.find(g => g.id === message.gift) : null;
  const isSpecial = !!giftData || (message.text.includes('أرسل هدية') && message.text.includes('إلى'));

  const rankLabel = RankLabels[message.senderRank] || message.senderRank || 'عضو';
  const rankColor = RankColors[message.senderRank] || colors.primary;

  const senderUser = allUsers.find(u => u.id === message.senderId);
  const genderLabel = senderUser
    ? (senderUser.gender === 'male' ? '♂️ ذكر' : senderUser.gender === 'female' ? '♀️ أنثى' : '⚧️')
    : '♂️ ذكر';
  const genderColor = senderUser
    ? (senderUser.gender === 'male' ? '#2196F3' : senderUser.gender === 'female' ? '#E91E8C' : '#9C27B0')
    : '#2196F3';
  const isVerified = senderUser?.isVerified || false;
  const senderCountry = message.senderCountry || senderUser?.country || '🌍';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showActions ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showActions]);

  const handleLongPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 70, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 70, useNativeDriver: true }),
    ]).start();
    setShowReactionPicker(true);
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUser || message.isDeleted) return;
    setShowReactionPicker(false);
    await toggleReaction(message.roomId, message.id, currentUser.id, emoji);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // ─── REACTION PICKER MODAL ───
  const ReactionPickerModal = (
    <Modal
      visible={showReactionPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReactionPicker(false)}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' }}
        onPress={() => setShowReactionPicker(false)}
      >
        <Pressable
          style={[styles.reactionPickerPanel, { backgroundColor: isDark ? '#1e1e2e' : '#ffffff' }]}
          onPress={() => {}}
        >
          <View style={[styles.reactionPickerHandle, { backgroundColor: isDark ? '#3a3a5a' : '#ddd' }]} />
          <Text style={[styles.reactionPickerTitle, { color: isDark ? '#B0B0CC' : '#5C3D7A' }]}>
            {message.senderName}
          </Text>
          <View style={styles.reactionEmojiRow}>
            {REACTION_EMOJIS.map(emoji => {
              const users = (message.reactions?.[emoji] || []) as string[];
              const myReaction = users.includes(currentUser?.id || '');
              return (
                <Pressable
                  key={emoji}
                  onPress={() => handleReaction(emoji)}
                  style={[
                    styles.reactionPickerBtn,
                    { backgroundColor: myReaction ? '#E91E8C22' : isDark ? '#2a2a3a' : '#f5f5f5' },
                    myReaction && { borderColor: '#E91E8C', borderWidth: 2 },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  {users.length > 0 ? (
                    <View style={[styles.reactionCount, { backgroundColor: myReaction ? '#E91E8C' : isDark ? '#3a3a5a' : '#ddd' }]}>
                      <Text style={[{ fontSize: 10, fontWeight: '800', color: myReaction ? '#fff' : isDark ? '#fff' : '#333' }]}>
                        {users.length}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => { setShowReactionPicker(false); setShowActions(true); }}
            style={[styles.reactionMoreBtn, { backgroundColor: isDark ? '#2a2a3a' : '#f0f0f0' }]}
          >
            <Ionicons name="ellipsis-horizontal" size={14} color={isDark ? '#B0B0CC' : '#5C3D7A'} />
            <Text style={[{ color: isDark ? '#B0B0CC' : '#5C3D7A', fontWeight: '700', fontSize: 12 }]}>
              مزيد من الخيارات
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // ─── SPECIAL (gift/money) ───
  if (isSpecial) {
    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: '#FFD70033' }]}>
        <View style={styles.cardInner}>
          <View style={styles.leftActions}>
            <Pressable onPress={() => onReply(message)} hitSlop={8} style={styles.sideIcon}>
              <Ionicons name="return-down-back" size={17} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.cardBody}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <Text style={[styles.senderName, { color: '#FFD700' }]}>
                {message.senderBadge ? `${message.senderBadge} ` : ''}{message.senderName}
              </Text>
              {isVerified ? <VerifiedBadge size={14} /> : null}
            </View>
            <Text style={[styles.msgText, { color: colors.text }]}>
              {giftData ? `${giftData.emoji} ${message.text}` : message.text}
            </Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(message.timestamp)}</Text>
          </View>
          <Pressable onPress={() => onViewProfile(message)} style={styles.avatarCol}>
            <Avatar avatar={message.senderAvatar} size={50} rank={message.senderRank} frame={message.senderFrame || undefined} isOnline={false} />
            <View style={[styles.levelBadge, { backgroundColor: rankColor }]}>
              <Text style={styles.levelBadgeText}>{message.senderLevel}</Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── NORMAL ───
  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1e1e2e' : '#ffffff',
            borderColor: message.violationFlag ? '#FF980055' : (isDark ? '#2a2a40' : '#ececec'),
          },
        ]}>
          <View style={styles.cardInner}>
            {/* Left: reply + report */}
            <View style={styles.leftActions}>
              <Pressable onPress={() => onReply(message)} hitSlop={8} style={styles.sideIcon}>
                <Ionicons name="return-down-back" size={18} color={colors.textMuted} />
              </Pressable>
              <Pressable onPress={() => onReport(message)} hitSlop={8} style={styles.sideIcon}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Center: message content */}
            <Pressable
              style={styles.cardBody}
              onLongPress={handleLongPress}
              delayLongPress={350}
              onPress={() => showActions && setShowActions(false)}
            >
              {/* Name + verified */}
              <Pressable onPress={() => onViewProfile(message)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {isVerified ? <VerifiedBadge size={14} /> : null}
                  <Text style={[styles.senderName, { color: nameColor }]}>
                    {message.senderBadge ? `${message.senderBadge} ` : ''}{message.senderName}
                  </Text>
                </View>
              </Pressable>

              {/* Info tags: country + gender + rank */}
              <View style={styles.infoTags}>
                <View style={[styles.tag, { backgroundColor: isDark ? '#2a2a3a' : '#f0f0f0' }]}>
                  <Text style={styles.tagText}>{senderCountry}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: genderColor + '22', borderColor: genderColor + '55', borderWidth: 1 }]}>
                  <Text style={[styles.tagText, { color: genderColor }]}>{genderLabel}</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: rankColor + '22', borderColor: rankColor + '55', borderWidth: 1 }]}>
                  <Ionicons name="people-outline" size={11} color={rankColor} />
                  <Text style={[styles.tagText, { color: rankColor }]}>{rankLabel}</Text>
                </View>
              </View>

              {/* Reply preview */}
              {message.replyTo && !message.isDeleted ? (
                <View style={[styles.replyBox, { backgroundColor: isDark ? '#2a2a3a' : '#f5f5f5', borderRightColor: colors.primary }]}>
                  <Text style={[styles.replyName, { color: colors.primary }]}>{message.replyTo.senderName}</Text>
                  <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {message.replyTo.text}
                  </Text>
                </View>
              ) : null}

              {/* Message text */}
              {message.isDeleted ? (
                <Text style={[styles.deletedText, { color: colors.textMuted }]}>🚫 تم حذف هذه الرسالة</Text>
              ) : (
                <Text style={[styles.msgText, { color: message.senderNameColor || colors.text }]}>
                  {message.text}
                </Text>
              )}

              {/* Bottom row */}
              <View style={styles.bottomRow}>
                {message.isEdited && !message.isDeleted ? (
                  <Text style={[{ fontSize: 10, color: colors.textMuted }]}>✏️ معدّل</Text>
                ) : null}
                {message.violationFlag ? <Ionicons name="warning" size={11} color="#FF9800" /> : null}
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(message.timestamp)}</Text>
              </View>

              {/* Reactions row */}
              <View style={styles.reactionsRow}>
                {Object.entries(message.reactions || {}).map(([emoji, users]) =>
                  (users as string[]).length > 0 ? (
                    <Pressable
                      key={emoji}
                      onPress={() => handleReaction(emoji)}
                      style={[
                        styles.reactionPill,
                        {
                          backgroundColor: (users as string[]).includes(currentUser?.id || '')
                            ? colors.primary + '33'
                            : isDark ? '#2a2a3a' : '#f0f0f0',
                          borderWidth: (users as string[]).includes(currentUser?.id || '') ? 1 : 0,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 12 }}>{emoji}</Text>
                      <Text style={[{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }]}>
                        {(users as string[]).length}
                      </Text>
                    </Pressable>
                  ) : null
                )}
                {/* Add reaction button */}
                {!message.isDeleted ? (
                  <Pressable
                    onPress={() => setShowReactionPicker(true)}
                    style={[styles.addReactionBtn, { backgroundColor: isDark ? '#2a2a3a' : '#f0f0f0' }]}
                  >
                    <Text style={{ fontSize: 12 }}>😊</Text>
                    <Text style={[{ fontSize: 10, color: colors.textMuted }]}>+</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Action chips on long press */}
              {showActions && !message.isDeleted ? (
                <Animated.View style={[styles.actionChips, { opacity: fadeAnim }]}>
                  {!isOwn ? (
                    <>
                      <Pressable onPress={() => { onSendGift(message); setShowActions(false); }} style={[styles.chip, { backgroundColor: '#FFD70022' }]}>
                        <Ionicons name="gift-outline" size={13} color="#FFD700" />
                        <Text style={[styles.chipText, { color: '#FFD700' }]}>هدية</Text>
                      </Pressable>
                      <Pressable onPress={() => { onSendMoney(message); setShowActions(false); }} style={[styles.chip, { backgroundColor: colors.success + '22' }]}>
                        <Ionicons name="cash-outline" size={13} color={colors.success} />
                        <Text style={[styles.chipText, { color: colors.success }]}>نقود</Text>
                      </Pressable>
                      <Pressable onPress={() => { onStartPrivateChat(message); setShowActions(false); }} style={[styles.chip, { backgroundColor: colors.secondary + '22' }]}>
                        <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.secondary} />
                        <Text style={[styles.chipText, { color: colors.secondary }]}>خاص</Text>
                      </Pressable>
                      {onAddFriend ? (
                        <Pressable onPress={() => { onAddFriend(message); setShowActions(false); }} style={[styles.chip, { backgroundColor: '#4CAF5022' }]}>
                          <Ionicons name="person-add-outline" size={13} color="#4CAF50" />
                          <Text style={[styles.chipText, { color: '#4CAF50' }]}>صديق</Text>
                        </Pressable>
                      ) : null}
                      <Pressable onPress={() => { onViewProfile(message); setShowActions(false); }} style={[styles.chip, { backgroundColor: colors.info + '22' }]}>
                        <Ionicons name="person-outline" size={13} color={colors.info} />
                        <Text style={[styles.chipText, { color: colors.info }]}>بروفايل</Text>
                      </Pressable>
                    </>
                  ) : null}
                  {canEdit ? (
                    <Pressable onPress={() => { onEdit(message); setShowActions(false); }} style={[styles.chip, { backgroundColor: colors.primary + '22' }]}>
                      <Ionicons name="pencil-outline" size={13} color={colors.primary} />
                      <Text style={[styles.chipText, { color: colors.primary }]}>تعديل</Text>
                    </Pressable>
                  ) : null}
                  {canDelete ? (
                    <Pressable onPress={() => { onDelete(message); setShowActions(false); }} style={[styles.chip, { backgroundColor: colors.error + '22' }]}>
                      <Ionicons name="trash-outline" size={13} color={colors.error} />
                      <Text style={[styles.chipText, { color: colors.error }]}>حذف</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => setShowActions(false)} style={[styles.chip, { backgroundColor: colors.surfaceElevated }]}>
                    <Ionicons name="close" size={13} color={colors.textMuted} />
                  </Pressable>
                </Animated.View>
              ) : null}
            </Pressable>

            {/* Right: avatar + level badge */}
            <Pressable onPress={() => onViewProfile(message)} style={styles.avatarCol}>
              <Avatar avatar={message.senderAvatar} size={52} rank={message.senderRank} frame={message.senderFrame || undefined} isOnline={false} />
              <View style={[styles.levelBadge, { backgroundColor: rankColor }]}>
                <Text style={styles.levelBadgeText}>{message.senderLevel}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* Reaction Picker Modal */}
      {ReactionPickerModal}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.sm, marginVertical: 4,
    borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden',
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.sm, gap: 8 },
  leftActions: { alignItems: 'center', gap: 6, paddingTop: 4, width: 22 },
  sideIcon: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 5, alignItems: 'flex-end' },
  senderName: { fontSize: FontSize.body, fontWeight: '800', textAlign: 'right', includeFontPadding: false },
  infoTags: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.sm },
  tagText: { fontSize: 11, fontWeight: '600' },
  replyBox: { width: '100%', borderRightWidth: 3, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.sm, gap: 2 },
  replyName: { fontSize: FontSize.xs, fontWeight: '700', textAlign: 'right', includeFontPadding: false },
  replyText: { fontSize: FontSize.xs, textAlign: 'right' },
  msgText: { fontSize: FontSize.body, lineHeight: 24, textAlign: 'right', width: '100%' },
  deletedText: { fontSize: FontSize.sm, fontStyle: 'italic', textAlign: 'right' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  timeText: { fontSize: 11 },
  reactionsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' },
  reactionPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.full },
  addReactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: BorderRadius.full },
  actionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end', marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  chipText: { fontSize: 11, fontWeight: '700', includeFontPadding: false },
  avatarCol: { alignItems: 'center', gap: 0, position: 'relative' },
  levelBadge: { minWidth: 26, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: -6, paddingHorizontal: 5, borderWidth: 2, borderColor: '#fff' },
  levelBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', includeFontPadding: false },
  // Reaction picker
  reactionPickerPanel: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 16, gap: 12, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 16,
  },
  reactionPickerHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  reactionPickerTitle: { fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center' },
  reactionEmojiRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 6 },
  reactionPickerBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: BorderRadius.lg,
    gap: 4, position: 'relative',
  },
  reactionCount: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  reactionMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 10, borderRadius: BorderRadius.full,
  },
});
