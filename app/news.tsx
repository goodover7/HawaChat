// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, RefreshControl,
  TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import {
  getNews, likeNewsPost, addNewsComment, getNewsComments, NewsPost, NewsComment,
  NEWS_TYPE_CONFIG, NEWS_PRIORITY_CONFIG,
} from '@/services/newsService';
import { useAlert } from '@/template';

export default function NewsWallScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    const data = await getNews();
    setPosts(data);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  }

  async function handleLike(postId: string) {
    if (!currentUser) return;
    await likeNewsPost(postId, currentUser.id);
    await loadNews();
  }

  async function openComments(postId: string) {
    setShowComments(postId);
    const data = await getNewsComments(postId);
    setComments(data);
  }

  async function handleSendComment() {
    if (!currentUser || !showComments || !commentText.trim()) return;
    setSendingComment(true);
    await addNewsComment(showComments, currentUser.id, currentUser.displayName, currentUser.avatar, currentUser.rank, commentText.trim());
    const data = await getNewsComments(showComments);
    setComments(data);
    setCommentText('');
    setSendingComment(false);
    await loadNews();
  }

  const renderPost = ({ item }: { item: NewsPost }) => {
    const typeConfig = NEWS_TYPE_CONFIG[item.type];
    const isLiked = item.likes?.includes(currentUser?.id || '') || false;
    const commentCount = item.commentCount || 0;

    return (
      <View style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: item.isPinned ? colors.accent :
                       item.priority === 'urgent' ? '#F4433666' :
                       typeConfig.color + '44',
          borderLeftWidth: item.isPinned ? 4 : 1,
        },
      ]}>
        {/* Priority banner */}
        {item.priority === 'urgent' ? (
          <LinearGradient
            colors={['#F44336', '#E91E8C']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.urgentBanner}
          >
            <Ionicons name="alert-circle" size={14} color="#fff" />
            <Text style={styles.urgentText}>🚨 عاجل — انتبه</Text>
          </LinearGradient>
        ) : item.priority === 'high' ? (
          <View style={[styles.highBanner, { backgroundColor: '#FF980022' }]}>
            <Text style={[styles.highText, { color: '#FF9800' }]}>⚠️ مهم</Text>
          </View>
        ) : null}

        {item.isPinned ? (
          <View style={[styles.pinBadge, { backgroundColor: colors.accent + '22' }]}>
            <Ionicons name="pin" size={11} color={colors.accent} />
            <Text style={[styles.pinText, { color: colors.accent }]}>مثبّت</Text>
          </View>
        ) : null}

        <View style={styles.cardHeader}>
          <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <View style={{ flexDirection: 'row', gap: 5, marginTop: 3 }}>
              <View style={[styles.typeBadge, { backgroundColor: typeConfig.color + '22', borderColor: typeConfig.color }]}>
                <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                  {typeConfig.emoji} {typeConfig.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.cardContent, { color: colors.textSecondary }]}>{item.content}</Text>

        <View style={styles.cardFooter}>
          <Text style={[{ fontSize: 11, color: colors.textMuted }]}>
            ✍️ {item.authorName} · {new Date(item.timestamp).toLocaleDateString('ar')}
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'center' }}>
            {/* Comments */}
            <Pressable onPress={() => openComments(item.id)} style={styles.reactionBtn}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
              <Text style={[styles.reactionCount, { color: colors.textMuted }]}>{commentCount}</Text>
            </Pressable>
            {/* Likes */}
            <Pressable onPress={() => handleLike(item.id)} style={styles.reactionBtn}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? '#E91E8C' : colors.textMuted}
              />
              <Text style={[styles.reactionCount, { color: isLiked ? '#E91E8C' : colors.textMuted }]}>
                {item.likes?.length || 0}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const selectedPost = posts.find(p => p.id === showComments);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>📰 حائط الأخبار</Text>
          <Text style={styles.headerSub}>أحداث وإعلانات الإدارة</Text>
        </View>
        <Pressable onPress={onRefresh} hitSlop={8}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </Pressable>
      </LinearGradient>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 56 }}>📰</Text>
            <Text style={[{ color: colors.text, fontSize: FontSize.xl, fontWeight: '700' }]}>لا توجد أخبار بعد</Text>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }]}>
              تابع هنا لأحدث الإعلانات والأحداث
            </Text>
          </View>
        }
      />

      {/* Comments Modal */}
      <Modal visible={!!showComments} transparent animationType="slide" onRequestClose={() => setShowComments(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.commentsOverlay} onPress={() => setShowComments(null)}>
            <Pressable style={[styles.commentsSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={[styles.commentsHeader, { borderBottomColor: colors.border }]}>
                <Text style={[{ color: colors.text, fontSize: FontSize.body, fontWeight: '800' }]}>
                  💬 التعليقات
                </Text>
                {selectedPost ? (
                  <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]} numberOfLines={1}>
                    {selectedPost.emoji} {selectedPost.title}
                  </Text>
                ) : null}
                <Pressable onPress={() => setShowComments(null)} hitSlop={8}>
                  <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                </Pressable>
              </View>
              <FlatList
                data={comments}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.commentCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 22 }}>{item.authorAvatar}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[{ color: colors.primary, fontWeight: '700', fontSize: FontSize.sm }]}>{item.authorName}</Text>
                        <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>
                          {new Date(item.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, textAlign: 'right' }]}>
                        {item.text}
                      </Text>
                    </View>
                  </View>
                )}
                contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingTop: 40, gap: Spacing.sm }}>
                    <Text style={{ fontSize: 36 }}>💬</Text>
                    <Text style={[{ color: colors.textMuted, fontSize: FontSize.sm }]}>لا توجد تعليقات بعد</Text>
                  </View>
                }
              />
              {/* Comment input */}
              <View style={[styles.commentInput, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TextInput
                  style={[styles.commentTextInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  placeholder="اكتب تعليقاً..."
                  placeholderTextColor={colors.textMuted}
                  value={commentText}
                  onChangeText={setCommentText}
                  textAlign="right"
                  multiline
                  maxLength={300}
                />
                <Pressable
                  onPress={handleSendComment}
                  disabled={!commentText.trim() || sendingComment}
                  style={[styles.commentSendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.surfaceElevated }]}
                >
                  <Ionicons name="send" size={18} color={commentText.trim() ? '#fff' : colors.textMuted} />
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
  headerSub: { color: '#ffffffaa', fontSize: FontSize.xs },
  card: {
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, gap: Spacing.sm, overflow: 'hidden',
  },
  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: Spacing.xs, paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm, marginBottom: 2, alignSelf: 'flex-start',
  },
  urgentText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '800' },
  highBanner: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.sm, alignSelf: 'flex-start', marginBottom: 2,
  },
  highText: { fontSize: FontSize.xs, fontWeight: '700' },
  pinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.full, alignSelf: 'flex-end', marginBottom: 2,
  },
  pinText: { fontSize: 10, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  cardTitle: { fontSize: FontSize.body, fontWeight: '800', textAlign: 'right' },
  typeBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.full, borderWidth: 1, alignSelf: 'flex-start',
  },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  cardContent: { fontSize: FontSize.sm, lineHeight: 22, textAlign: 'right' },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 4,
  },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reactionCount: { fontSize: FontSize.sm, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.md },
  commentsOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'flex-end' },
  commentsSheet: {
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    height: '75%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: Spacing.sm },
  commentsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, gap: Spacing.sm,
  },
  commentCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  commentInput: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.md, borderTopWidth: 1,
  },
  commentTextInput: {
    flex: 1, borderRadius: BorderRadius.full, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    fontSize: FontSize.sm, maxHeight: 80,
  },
  commentSendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
