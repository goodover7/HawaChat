// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NewsPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: string;
  title: string;
  content: string;
  emoji: string;
  type: 'announcement' | 'event' | 'warning' | 'celebration' | 'news';
  priority: 'normal' | 'high' | 'urgent';
  timestamp: string;
  isPinned: boolean;
  likes: string[];
  commentCount: number;
  isDeleted: boolean;
}

export interface NewsComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRank: string;
  text: string;
  timestamp: string;
}

const NEWS_KEY = 'hawa_news_v2';
const COMMENTS_KEY = 'hawa_news_comments_v1';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const NEWS_TYPE_CONFIG: Record<NewsPost['type'], { label: string; emoji: string; color: string }> = {
  announcement: { label: 'إعلان', emoji: '📢', color: '#2196F3' },
  event: { label: 'حدث', emoji: '🎉', color: '#9C27B0' },
  warning: { label: 'تنبيه', emoji: '⚠️', color: '#FF9800' },
  celebration: { label: 'احتفال', emoji: '🎊', color: '#E91E8C' },
  news: { label: 'خبر', emoji: '📰', color: '#4CAF50' },
};

export const NEWS_PRIORITY_CONFIG: Record<NewsPost['priority'], { label: string; color: string }> = {
  normal: { label: 'عادي', color: '#607D8B' },
  high: { label: 'مهم', color: '#FF9800' },
  urgent: { label: '🚨 عاجل', color: '#F44336' },
};

export async function getNews(): Promise<NewsPost[]> {
  try {
    // Migrate v1 data
    let data = await AsyncStorage.getItem(NEWS_KEY);
    if (!data) {
      const oldData = await AsyncStorage.getItem('hawa_news_v1');
      if (oldData) {
        const parsed: NewsPost[] = JSON.parse(oldData).map((p: any) => ({ commentCount: 0, ...p }));
        await AsyncStorage.setItem(NEWS_KEY, JSON.stringify(parsed));
        data = JSON.stringify(parsed);
      }
    }
    if (!data) return [];
    const posts: NewsPost[] = JSON.parse(data);
    return posts
      .filter(p => !p.isDeleted)
      .map(p => ({ commentCount: 0, ...p }))
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  } catch { return []; }
}

export async function createNewsPost(
  authorId: string,
  authorName: string,
  authorAvatar: string,
  authorRank: string,
  title: string,
  content: string,
  emoji: string,
  type: NewsPost['type'],
  priority: NewsPost['priority']
): Promise<{ success: boolean; post?: NewsPost; error?: string }> {
  const canPost = ['owner', 'legend', 'admin'].includes(authorRank);
  if (!canPost) return { success: false, error: 'لا تملك صلاحية نشر الأخبار' };

  try {
    const existing = await AsyncStorage.getItem(NEWS_KEY);
    const posts: NewsPost[] = existing ? JSON.parse(existing) : [];
    const newPost: NewsPost = {
      id: generateId(),
      authorId, authorName, authorAvatar, authorRank,
      title: title.trim(),
      content: content.trim(),
      emoji,
      type,
      priority,
      timestamp: new Date().toISOString(),
      isPinned: priority === 'urgent',
      likes: [],
      commentCount: 0,
      isDeleted: false,
    };
    await AsyncStorage.setItem(NEWS_KEY, JSON.stringify([newPost, ...posts]));
    return { success: true, post: newPost };
  } catch { return { success: false, error: 'فشل النشر' }; }
}

export async function togglePinPost(postId: string, requesterId: string, requesterRank: string): Promise<void> {
  if (!['owner', 'legend', 'admin'].includes(requesterRank)) return;
  const existing = await AsyncStorage.getItem(NEWS_KEY);
  if (!existing) return;
  const posts: NewsPost[] = JSON.parse(existing);
  const idx = posts.findIndex(p => p.id === postId);
  if (idx !== -1) {
    posts[idx].isPinned = !posts[idx].isPinned;
    await AsyncStorage.setItem(NEWS_KEY, JSON.stringify(posts));
  }
}

export async function deleteNewsPost(postId: string, requesterId: string, requesterRank: string): Promise<void> {
  if (!['owner', 'legend', 'admin'].includes(requesterRank)) return;
  const existing = await AsyncStorage.getItem(NEWS_KEY);
  if (!existing) return;
  const posts: NewsPost[] = JSON.parse(existing);
  const idx = posts.findIndex(p => p.id === postId);
  if (idx !== -1) {
    posts[idx].isDeleted = true;
    await AsyncStorage.setItem(NEWS_KEY, JSON.stringify(posts));
  }
}

export async function likeNewsPost(postId: string, userId: string): Promise<void> {
  const existing = await AsyncStorage.getItem(NEWS_KEY);
  if (!existing) return;
  const posts: NewsPost[] = JSON.parse(existing);
  const idx = posts.findIndex(p => p.id === postId);
  if (idx !== -1) {
    const likes = posts[idx].likes || [];
    if (likes.includes(userId)) {
      posts[idx].likes = likes.filter(id => id !== userId);
    } else {
      posts[idx].likes = [...likes, userId];
    }
    await AsyncStorage.setItem(NEWS_KEY, JSON.stringify(posts));
  }
}

export async function getNewsComments(postId: string): Promise<NewsComment[]> {
  try {
    const data = await AsyncStorage.getItem(COMMENTS_KEY);
    const all: NewsComment[] = data ? JSON.parse(data) : [];
    return all.filter(c => c.postId === postId).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  } catch { return []; }
}

export async function addNewsComment(
  postId: string,
  authorId: string,
  authorName: string,
  authorAvatar: string,
  authorRank: string,
  text: string
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(COMMENTS_KEY);
    const all: NewsComment[] = data ? JSON.parse(data) : [];
    const comment: NewsComment = {
      id: generateId(),
      postId,
      authorId,
      authorName,
      authorAvatar,
      authorRank,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(COMMENTS_KEY, JSON.stringify([...all, comment]));
    // Update comment count on post
    const postsData = await AsyncStorage.getItem(NEWS_KEY);
    if (postsData) {
      const posts: NewsPost[] = JSON.parse(postsData);
      const idx = posts.findIndex(p => p.id === postId);
      if (idx !== -1) {
        posts[idx].commentCount = (posts[idx].commentCount || 0) + 1;
        await AsyncStorage.setItem(NEWS_KEY, JSON.stringify(posts));
      }
    }
  } catch {}
}
