// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LEVEL_THRESHOLDS } from '@/constants/config';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { toggleHiddenStatus, changePassword, setUserGender, updateUser, setProfileBackground } from '@/services/authService';
import { getAllRanks, CustomRank } from '@/services/rankService';
import { useAlert } from '@/template';

// Renders rank emoji or image URI
function RankIcon({ emoji, size = 20 }: { emoji: string; size?: number }) {
  if (emoji && (emoji.startsWith('file://') || emoji.startsWith('http') || emoji.startsWith('/'))) {
    return <Image source={{ uri: emoji }} style={{ width: size, height: size, borderRadius: 4 }} contentFit="contain" />;
  }
  return <Text style={{ fontSize: size }}>{emoji || '🎖️'}</Text>;
}

const EMOJI_AVATARS = [
  '👩', '👨', '👩‍🦰', '👨‍🦱', '👩‍🦳', '👨‍🦲', '🧑', '👧', '👦',
  '🦸', '🧙', '🧚', '👸', '🤴', '🦊', '🐱', '🐻', '🦁',
  '🐼', '🐨', '🦄', '🐉', '🌺', '🌙', '⭐', '🔥', '💎', '👑',
];

const GRADIENT_PRESETS = [
  { label: 'بنفسجي (افتراضي)', colors: ['#AD1457', '#E91E8C', '#9C27B0'] },
  { label: 'أزرق غامق', colors: ['#1565C0', '#1976D2', '#42A5F5'] },
  { label: 'أخضر زمردي', colors: ['#1B5E20', '#388E3C', '#66BB6A'] },
  { label: 'برتقالي ناري', colors: ['#BF360C', '#E64A19', '#FF7043'] },
  { label: 'ذهبي ملكي', colors: ['#FF6F00', '#FFA000', '#FFD700'] },
  { label: 'أحمر قاني', colors: ['#B71C1C', '#C62828', '#EF5350'] },
  { label: 'فيروزي', colors: ['#006064', '#00838F', '#26C6DA'] },
  { label: 'رمادي أنيق', colors: ['#212121', '#424242', '#757575'] },
  { label: 'ليلكي حالم', colors: ['#4A148C', '#6A1B9A', '#AB47BC'] },
  { label: 'وردي فلامنغو', colors: ['#880E4F', '#C2185B', '#F06292'] },
];

const PROFILE_TABS = ['معلوماتي', 'الأصدقاء', 'معلومات'];

// Country picker feature
const COUNTRIES = [
  '🇸🇦', '🇦🇪', '🇧🇭', '🇰🇼', '🇪🇬', '🇮🇶', '🇮🇷', '🇯🇴', '🇧🇭',
  '🇴🇲', '🇾🇪', '🇺🇦', '🇵🇸', '🇱🇧', '🇸🇩', '🇹🇳', '🇲🇦',
  '🇲🇷', '🇲🇾', '🇳🇩', '🇱🇾', '🇸🇾',
  '🇵🇸', '🇱🇧', '🇳🇴', '🇹🇳', '🇯🇵',
  '🇰🇷', '🇨🇳', '🇰🇳', '🇪🇸',
  '🇮🇹', '🇵🇰', '🇹🇷', '🇷🇺',
  '🇺🇸', '🇨🇦', '🇧🇷', '🇩🇪',
  '🇦🇱', '🇸🇪', '🇳🇱', '🇵🇭', '🇨🇭',
  '🇸🇺', '🇸🇬', '🇧🇪', '🇨🇦', '🇦🇹',
];

export default function ProfileScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const { currentUser, logout, updateCurrentUser, refreshUser } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isHidden, setIsHidden] = useState(currentUser?.isHidden || false);
  const [allRanks, setAllRanks] = useState<CustomRank[]>([]);

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Gender modal
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Gradient picker modal
  const [showGradientModal, setShowGradientModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [bgEnabled, setBgEnabled] = useState(currentUser?.profileBackgroundEnabled || false);
  const [bgUri, setBgUri] = useState<string | null>(currentUser?.profileBackground || null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName);
      setBio(currentUser.bio || '');
      setIsHidden(currentUser.isHidden || false);
      setBgEnabled(currentUser.profileBackgroundEnabled || false);
      setBgUri(currentUser.profileBackground || null);
    }
    loadRanks();
  }, [currentUser?.id]);

  async function loadRanks() {
    const ranks = await getAllRanks();
    setAllRanks(ranks);
  }

  if (!currentUser) return null;

  const isOwner = currentUser.rank === 'owner';
  const genderLabel = currentUser.gender === 'male' ? '♂️ ذكر' : currentUser.gender === 'female' ? '♀️ أنثى' : '⚧️ آخر';
  const genderColor = currentUser.gender === 'male' ? '#2196F3' : currentUser.gender === 'female' ? '#E91E8C' : '#9C27B0';

  const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === currentUser.level + 1);
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentUser.level);
  const progress = nextLevel && currentThreshold
    ? Math.min(1, (currentUser.messageCount - currentThreshold.minMessages) /
      (nextLevel.minMessages - currentThreshold.minMessages))
    : 1;

  const headerGradient = currentUser.profileGradient || [colors.primaryDark, colors.primary, colors.secondary];

  // Current rank info (supports custom ranks with image icons)
  const rankInfo = allRanks.find(r => r.id === currentUser.rank);

  async function handleSetCountry(country: string) {
    await updateCurrentUser({ country });
    setShowCountryModal(false);
    showAlert('تم ✅', `تم تحديد دولتك: ${country}`);
  }

  const handlePickBgImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 6],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setBgUri(uri);
      await setProfileBackground(currentUser.id, uri, true);
      await updateCurrentUser({ profileBackground: uri, profileBackgroundEnabled: true });
      setBgEnabled(true);
      setShowBgModal(false);
      showAlert('تم ✅', 'تم تعيين صورة خلفية الملف الشخصي');
    }
  };

  const handleToggleBg = async () => {
    const newEnabled = !bgEnabled;
    setBgEnabled(newEnabled);
    await setProfileBackground(currentUser.id, bgUri, newEnabled);
    await updateCurrentUser({ profileBackgroundEnabled: newEnabled });
  };

  const handleRemoveBg = async () => {
    setBgUri(null); setBgEnabled(false);
    await setProfileBackground(currentUser.id, null, false);
    await updateCurrentUser({ profileBackground: null, profileBackgroundEnabled: false });
    setShowBgModal(false);
    showAlert('تم', 'تم حذف خلفية الملف الشخصي');
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    await updateCurrentUser({ displayName: displayName.trim(), bio: bio.trim() });
    setSaving(false);
    setEditMode(false);
    showAlert('تم الحفظ ✅', 'تم تحديث ملفك الشخصي');
  };

  const handleLogout = () => {
    showAlert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const handleToggleHidden = async () => {
    if (!isOwner) return;
    const result = await toggleHiddenStatus(currentUser.id);
    if (result.success) {
      setIsHidden(result.isHidden!);
      await refreshUser();
      showAlert(result.isHidden ? '🕵️ وضع الإخفاء مُفعَّل' : '👁️ الظهور مُفعَّل', result.isHidden ? 'لن يراك الأعضاء في قائمة المتصلين' : 'أنت مرئي للجميع الآن');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) { await updateCurrentUser({ avatar: result.assets[0].uri }); setShowAvatarPicker(false); }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { showAlert('إذن مطلوب', 'يجب السماح بالوصول إلى الكاميرا'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!result.canceled && result.assets[0]) { await updateCurrentUser({ avatar: result.assets[0].uri }); setShowAvatarPicker(false); }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) { showAlert('خطأ', 'أدخل كلمة المرور الجديدة'); return; }
    if (newPassword !== confirmPassword) { showAlert('خطأ', 'كلمة المرور غير متطابقة'); return; }
    if (newPassword.length < 4) { showAlert('خطأ', 'كلمة المرور يجب 4 أحرف على الأقل'); return; }
    setChangingPassword(true);
    const result = await changePassword(currentUser.id, currentUser.id, newPassword, oldPassword);
    setChangingPassword(false);
    if (result.success) {
      setShowPasswordModal(false); setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      showAlert('تم ✅', 'تم تغيير كلمة المرور بنجاح');
    } else showAlert('خطأ', result.error || 'فشل تغيير كلمة المرور');
  };

  const handleSetGender = async (gender: 'male' | 'female' | 'other') => {
    const result = await setUserGender(currentUser.id, currentUser.id, gender);
    if (result.success) {
      await updateCurrentUser({ gender });
      setShowGenderModal(false);
      showAlert('تم ✅', 'تم تحديد الجنس');
    }
  };

  const handleSetGradient = async (gradient: string[]) => {
    await updateCurrentUser({ profileGradient: gradient });
    setShowGradientModal(false);
    showAlert('تم ✅', 'تم تحديث لون الملف الشخصي');
  };

  const lastSeenFormatted = () => {
    if (currentUser.isOnline && !isHidden) return 'متصل الآن 🟢';
    if (isHidden) return '🕵️ مخفي';
    const d = new Date(currentUser.lastSeen);
    return `${d.toLocaleDateString('ar')}`;
  };

  const joinDate = new Date(currentUser.createdAt || Date.now()).toLocaleDateString('ar-SA');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ─── COVER / HEADER ─── */}
        <View style={styles.coverWrap}>
          {bgEnabled && bgUri ? (
            <Image source={{ uri: bgUri }} style={styles.coverBg} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={headerGradient as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {/* Overlay for readability */}
          <View style={styles.coverOverlay} />

          {/* Top action buttons */}
          <View style={[styles.topActions, { paddingTop: insets.top + 4 }]}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={toggleTheme} style={styles.topBtn}>
                <Ionicons name={isDark ? 'sunny' : 'moon'} size={17} color="#fff" />
              </Pressable>
              {isOwner ? (
                <Pressable onPress={handleToggleHidden} style={[styles.topBtn, isHidden && { backgroundColor: '#FFD70040' }]}>
                  <Ionicons name={isHidden ? 'eye-off' : 'eye'} size={17} color={isHidden ? '#FFD700' : '#fff'} />
                </Pressable>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['owner', 'high_admin', 'admin', 'legend'].includes(currentUser.rank) ? (
                <Pressable onPress={() => router.push('/admin')} style={styles.topBtn}>
                  <Ionicons name="shield" size={17} color="#FFD700" />
                </Pressable>
              ) : null}
              <Pressable onPress={() => setShowPasswordModal(true)} style={styles.topBtn}>
                <Ionicons name="key-outline" size={17} color="#fff" />
              </Pressable>
              <Pressable onPress={handleLogout} style={styles.topBtn}>
                <Ionicons name="log-out" size={17} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Rank badge above avatar */}
          {rankInfo ? (
            <View style={[styles.rankTagOnCover, { backgroundColor: rankInfo.color + '33', borderColor: rankInfo.color }]}>
              <RankIcon emoji={rankInfo.emoji} size={14} />
              <Text style={[{ color: '#fff', fontSize: 11, fontWeight: '800' }]}>{rankInfo.name}</Text>
            </View>
          ) : null}

          {/* Verified */}
          {currentUser.isVerified ? (
            <View style={styles.verifiedOnCover}>
              <Text style={{ fontSize: 13, color: '#fff' }}>✅ حساب مؤكد</Text>
            </View>
          ) : null}

          {/* Avatar on right side */}
          <View style={styles.coverBottom}>
            <View style={{ flex: 1, gap: 4 }}>
              {editMode ? (
                <TextInput
                  style={[styles.nameEditInput, { color: '#fff', borderBottomColor: '#ffffff60' }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  textAlign="right"
                  placeholder="الاسم المعروض"
                  placeholderTextColor="#ffffff80"
                />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
                    <Text style={[styles.coverName, { color: currentUser.nameColor || '#fff' }]}>
                      {currentUser.badge ? `${currentUser.badge} ` : ''}{currentUser.displayName}
                    </Text>
                    {currentUser.isVerified ? <VerifiedBadge size={18} /> : null}
                  </View>
                </View>
              )}
              <Text style={styles.coverUsername}>@{currentUser.username}</Text>
              {/* Bio below name */}
              <Text style={styles.coverBio} numberOfLines={2}>{currentUser.bio || ''}</Text>
            </View>
            {/* Avatar */}
            <Pressable onPress={() => setShowAvatarPicker(true)} style={styles.avatarWrap}>
              <Avatar avatar={currentUser.avatar} size={80} rank={currentUser.rank} frame={currentUser.frame} isOnline={currentUser.isOnline} />
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── TABS ─── */}
        <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {PROFILE_TABS.map((tab, i) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(i)}
              style={[
                styles.tab,
                activeTab === i && { backgroundColor: colors.primary, borderRadius: BorderRadius.full },
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === i ? '#fff' : colors.textSecondary }]}>{tab}</Text>
            </Pressable>
          ))}
        </View>

        {/* ─── TAB: معلوماتي ─── */}
        {activeTab === 0 ? (
          <View style={{ gap: Spacing.sm, padding: Spacing.md }}>
            {/* Level & Coins highlight cards */}
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={[styles.highlightCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border, flex: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={[styles.levelBadge, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.levelBadgeText}>{currentUser.level}</Text>
                  </View>
                  <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' }]}>المستوى الحالي: ←</Text>
                  <Text style={{ fontSize: 22 }}>{rankInfo?.emoji ? (
                    rankInfo.emoji.startsWith('file://') || rankInfo.emoji.startsWith('http') ? null : rankInfo.emoji
                  ) : '👑'}</Text>
                </View>
              </View>
              <View style={[styles.highlightCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border, flex: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={[styles.coinsBadge, { backgroundColor: '#FFD700' }]}>
                    <Text style={styles.coinsBadgeText}>{currentUser.coins?.toLocaleString() || 0}</Text>
                  </View>
                  <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' }]}>النقود الذهبية: ←</Text>
                  <Text style={{ fontSize: 22 }}>💰</Text>
                </View>
              </View>
            </View>

            {/* Info rows */}
            {[
              { icon: '📋', label: 'النـوع', value: genderLabel },
              { icon: '🏆', label: 'الجوائـز', value: (currentUser.giftsReceived || 0).toLocaleString() },
              { icon: '📊', label: 'النقاط', value: currentUser.messageCount.toLocaleString() },
              { icon: '✅', label: 'حالة الحساب', value: currentUser.isVerified ? 'مؤكد' : 'غير مؤكد' },
              { icon: '🌐', label: 'الدولة', value: currentUser.country || 'غير محدد', onPress: () => setShowCountryModal(true) },
              { icon: '📅', label: 'تاريخ الاشتراك', value: joinDate },
              { icon: '📩', label: 'الروم الحالي', value: '🌐 الغرفة العامة' },
            ].map(row => (
              <View key={row.label} style={[styles.infoRow, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
                <Text style={[styles.infoValue, { color: colors.text }]}>{row.value}</Text>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                  <Text style={{ fontSize: 16 }}>{row.icon}</Text>
                </View>
              </View>
            ))}

            {/* Status / Bio card */}
            <View style={[styles.bioCard, { backgroundColor: colors.surfaceCard, borderColor: colors.primary + '44' }]}>
              <Text style={[{ color: colors.primary, fontWeight: '800', fontSize: FontSize.sm, textAlign: 'right' }]}>💌 الحالة</Text>
              {editMode ? (
                <TextInput
                  style={[styles.bioInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  placeholder="اكتب حالتك هنا..."
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              ) : (
                <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, lineHeight: 24, textAlign: 'right' }]}>
                  {currentUser.bio || 'لا توجد حالة'}
                </Text>
              )}
            </View>

            {/* Edit buttons */}
            {editMode ? (
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button title="💾 حفظ" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
                <Button title="إلغاء" onPress={() => { setEditMode(false); setDisplayName(currentUser.displayName); setBio(currentUser.bio || ''); }} variant="outline" style={{ flex: 1 }} />
              </View>
            ) : (
              <Button title="✏️ تعديل الملف الشخصي" onPress={() => setEditMode(true)} variant="outline" />
            )}
          </View>
        ) : activeTab === 1 ? (
          // ─── TAB: الأصدقاء ───
          <View style={{ padding: Spacing.md, alignItems: 'center', paddingTop: 60, gap: Spacing.md }}>
            <Text style={{ fontSize: 56 }}>🤝</Text>
            <Text style={[{ color: colors.text, fontSize: FontSize.xl, fontWeight: '700' }]}>قائمة الأصدقاء</Text>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }]}>
              يمكنك إدارة أصدقائك من صفحة الرسائل والأصدقاء
            </Text>
            <Button title="💌 الانتقال إلى الرسائل" onPress={() => router.push('/(tabs)/messages')} />
          </View>
        ) : (
          // ─── TAB: معلومات ───
          <View style={{ gap: Spacing.sm, padding: Spacing.md }}>

            {/* Rank card with icon */}
            {rankInfo ? (
              <View style={[styles.rankCard, { backgroundColor: rankInfo.color + '18', borderColor: rankInfo.color + '55' }]}>
                <RankIcon emoji={rankInfo.emoji} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: rankInfo.color, fontWeight: '800', fontSize: FontSize.body }]}>{rankInfo.name}</Text>
                  <Text style={[{ color: colors.textSecondary, fontSize: FontSize.xs }]}>
                    {rankInfo.permissions.includes('all') ? 'صلاحيات مطلقة' : `${rankInfo.permissions.length} صلاحية`}
                  </Text>
                </View>
                {currentUser.isVerified ? <VerifiedBadge size={22} /> : null}
              </View>
            ) : null}

            {/* Level Progress */}
            <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[{ color: colors.text, fontSize: FontSize.sm, fontWeight: '700' }]}>🎯 تقدم المستوى</Text>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>
                  {nextLevel ? `${(nextLevel.minMessages - currentUser.messageCount).toLocaleString()} رسالة` : '🏆 أقصى مستوى!'}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceElevated }]}>
                <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>Lv.{currentUser.level}</Text>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{currentUser.messageCount.toLocaleString()} رسالة</Text>
                {nextLevel ? <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>Lv.{nextLevel.level}</Text> : null}
              </View>
            </View>

            {/* Settings */}
            <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
              <Text style={[{ color: colors.text, fontSize: FontSize.sm, fontWeight: '800', textAlign: 'right' }]}>⚙️ الإعدادات</Text>
              {[
                { icon: 'key-outline', label: 'تغيير كلمة المرور', color: colors.primary, onPress: () => setShowPasswordModal(true) },
                { icon: 'person-outline', label: `تحديد الجنس (${genderLabel})`, color: genderColor, onPress: () => setShowGenderModal(true) },
                { icon: 'flag-outline', label: `اختيار الدولة ${currentUser.country || '🌍'}`, color: '#2196F3', onPress: () => setShowCountryModal(true) },
                { icon: 'color-palette-outline', label: 'تغيير لون الملف الشخصي', color: colors.secondary, onPress: () => setShowGradientModal(true) },
                { icon: 'image-outline', label: `خلفية الملف الشخصي ${bgEnabled && bgUri ? '✅' : ''}`, color: colors.accent, onPress: () => setShowBgModal(true) },
              ].map(item => (
                <Pressable key={item.label} onPress={item.onPress} style={[styles.settingRow, { borderColor: colors.border }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                  <Text style={[{ flex: 1, color: colors.text, fontSize: FontSize.sm, textAlign: 'right' }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </Pressable>
              ))}
              {isOwner ? (
                <>
                  <Pressable onPress={handleToggleHidden} style={[styles.settingRow, { borderColor: colors.border }]}>
                    <Ionicons name={isHidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.secondary} />
                    <Text style={[{ flex: 1, color: colors.text, fontSize: FontSize.sm, textAlign: 'right' }]}>{isHidden ? 'إلغاء وضع الإخفاء' : 'إخفاء تواجدك'}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => router.push('/rank-management')} style={[styles.settingRow, { borderColor: colors.border }]}>
                    <Ionicons name="ribbon" size={18} color="#FFD700" />
                    <Text style={[{ flex: 1, color: colors.text, fontSize: FontSize.sm, textAlign: 'right' }]}>إدارة الرتب</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </Pressable>
                </>
              ) : null}
            </View>

            <View style={{ paddingBottom: Spacing.xl }}>
              <Button title="🚪 تسجيل الخروج" onPress={handleLogout} variant="danger" />
            </View>
          </View>
        )}

      </ScrollView>

      {/* Avatar Picker */}
      <Modal visible={showAvatarPicker} transparent animationType="slide" onRequestClose={() => setShowAvatarPicker(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowAvatarPicker(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>🖼️ تغيير صورة البروفايل</Text>
            <View style={styles.uploadBtns}>
              <Pressable onPress={handlePickImage} style={[styles.uploadBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="images" size={22} color="#fff" />
                <Text style={styles.uploadBtnText}>من المعرض</Text>
              </Pressable>
              <Pressable onPress={handleTakePhoto} style={[styles.uploadBtn, { backgroundColor: colors.secondary }]}>
                <Ionicons name="camera" size={22} color="#fff" />
                <Text style={styles.uploadBtnText}>كاميرا</Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              <View style={styles.emojiGrid}>
                {EMOJI_AVATARS.map(emoji => (
                  <Pressable key={emoji} onPress={async () => { await updateCurrentUser({ avatar: emoji }); setShowAvatarPicker(false); }} style={[styles.emojiOption, { backgroundColor: colors.surfaceElevated }, currentUser.avatar === emoji && { borderColor: colors.primary, borderWidth: 2 }]}>
                    <Text style={{ fontSize: 28 }}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <Pressable onPress={() => setShowAvatarPicker(false)} style={{ padding: Spacing.md, alignItems: 'center' }}>
              <Text style={[{ color: colors.textMuted }]}>إغلاق</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Gender Modal */}
      <Modal visible={showGenderModal} transparent animationType="fade" onRequestClose={() => setShowGenderModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>⚧️ تحديد الجنس</Text>
            {[
              { gender: 'male' as const, label: '♂️ ذكر', color: '#2196F3' },
              { gender: 'female' as const, label: '♀️ أنثى', color: '#E91E8C' },
              { gender: 'other' as const, label: '⚧️ آخر', color: '#9C27B0' },
            ].map(opt => (
              <Pressable key={opt.gender} onPress={() => handleSetGender(opt.gender)} style={[styles.genderOption, { backgroundColor: currentUser.gender === opt.gender ? opt.color + '22' : colors.surfaceElevated, borderColor: currentUser.gender === opt.gender ? opt.color : colors.border }]}>
                <Text style={{ fontSize: 24 }}>{opt.label.split(' ')[0]}</Text>
                <Text style={[{ flex: 1, color: colors.text, fontWeight: '700', fontSize: FontSize.body, textAlign: 'right' }]}>{opt.label.split(' ')[1]}</Text>
                {currentUser.gender === opt.gender ? <Ionicons name="checkmark-circle" size={22} color={opt.color} /> : null}
              </Pressable>
            ))}
            <Button title="إغلاق" onPress={() => setShowGenderModal(false)} variant="ghost" />
          </View>
        </View>
      </Modal>

      {/* Gradient Picker Modal */}
      <Modal visible={showGradientModal} transparent animationType="fade" onRequestClose={() => setShowGradientModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>🎨 اختر لون ملفك الشخصي</Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {GRADIENT_PRESETS.map((preset, idx) => (
                <Pressable key={idx} onPress={() => handleSetGradient(preset.colors)} style={{ marginBottom: Spacing.sm }}>
                  <LinearGradient colors={preset.colors as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradientPreviewRow, { borderColor: JSON.stringify(currentUser.profileGradient) === JSON.stringify(preset.colors) ? '#fff' : 'transparent', borderWidth: 2 }]}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: FontSize.sm }}>{preset.label}</Text>
                    {JSON.stringify(currentUser.profileGradient) === JSON.stringify(preset.colors) ? <Ionicons name="checkmark-circle" size={18} color="#fff" /> : null}
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
            <Button title="إغلاق" onPress={() => setShowGradientModal(false)} variant="ghost" />
          </View>
        </View>
      </Modal>

      {/* Country Picker Modal */}
      <Modal visible={showCountryModal} transparent animationType="slide" onRequestClose={() => setShowCountryModal(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowCountryModal(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>🌍 اختيار دولتك</Text>
            {/* Current selected */}
            {currentUser.country ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: colors.primary + '22', borderRadius: BorderRadius.md, padding: Spacing.sm, marginBottom: Spacing.sm }}>
                <Text style={{ fontSize: 28 }}>{currentUser.country}</Text>
                <Text style={[{ color: colors.primary, fontWeight: '700', fontSize: FontSize.body }]}>الدولة الحالية</Text>
              </View>
            ) : null}
            <View style={styles.countryGrid}>
              {COUNTRIES.map(flag => (
                <Pressable
                  key={flag}
                  onPress={() => handleSetCountry(flag)}
                  style={[
                    styles.countryBtn,
                    { backgroundColor: currentUser.country === flag ? colors.primary + '33' : colors.surfaceElevated,
                      borderColor: currentUser.country === flag ? colors.primary : 'transparent', borderWidth: 2 },
                  ]}
                >
                  <Text style={{ fontSize: 28 }}>{flag}</Text>
                </Pressable>
              ))}
            </View>
            <Button title="إغلاق" onPress={() => setShowCountryModal(false)} variant="ghost" />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Background Image Modal */}
      <Modal visible={showBgModal} transparent animationType="fade" onRequestClose={() => setShowBgModal(false)}>
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>🖼️ خلفية الملف الشخصي</Text>
            {bgUri ? (
              <Image source={{ uri: bgUri }} style={{ width: '100%', height: 120, borderRadius: BorderRadius.lg }} contentFit="cover" />
            ) : (
              <View style={[{ width: '100%', height: 80, borderRadius: BorderRadius.lg, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 36 }}>🖼️</Text>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.sm }]}>لا توجد خلفية</Text>
              </View>
            )}
            <Pressable onPress={handlePickBgImage} style={[styles.uploadBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="images" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>اختر صورة خلفية</Text>
            </Pressable>
            {bgUri ? (
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Pressable onPress={handleToggleBg} style={[styles.uploadBtn, { flex: 1, backgroundColor: bgEnabled ? '#FF9800' : '#4CAF50' }]}>
                  <Ionicons name={bgEnabled ? 'eye-off-outline' : 'eye-outline'} size={18} color="#fff" />
                  <Text style={[styles.uploadBtnText, { fontSize: FontSize.sm }]}>{bgEnabled ? 'إخفاء' : 'إظهار'}</Text>
                </Pressable>
                <Pressable onPress={handleRemoveBg} style={[styles.uploadBtn, { flex: 1, backgroundColor: '#F44336' }]}>
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={[styles.uploadBtnText, { fontSize: FontSize.sm }]}>حذف</Text>
                </Pressable>
              </View>
            ) : null}
            <Button title="إغلاق" onPress={() => setShowBgModal(false)} variant="ghost" />
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowPasswordModal(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>🔐 تغيير كلمة المرور</Text>
            <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
              <View style={[styles.passInputRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <TextInput style={[styles.passInput, { color: colors.text }]} placeholder="كلمة المرور الحالية" placeholderTextColor={colors.textMuted} value={oldPassword} onChangeText={setOldPassword} secureTextEntry={!showOld} textAlign="right" />
                <Pressable onPress={() => setShowOld(s => !s)} hitSlop={8}><Ionicons name={showOld ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} /></Pressable>
              </View>
              <View style={[styles.passInputRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <TextInput style={[styles.passInput, { color: colors.text }]} placeholder="كلمة المرور الجديدة" placeholderTextColor={colors.textMuted} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNew} textAlign="right" />
                <Pressable onPress={() => setShowNew(s => !s)} hitSlop={8}><Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} /></Pressable>
              </View>
              <View style={[styles.passInputRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <TextInput style={[styles.passInput, { color: colors.text }]} placeholder="تأكيد كلمة المرور الجديدة" placeholderTextColor={colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showNew} textAlign="right" />
              </View>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button title="🔐 تغيير" onPress={handleChangePassword} loading={changingPassword} style={{ flex: 1 }} />
                <Button title="إلغاء" onPress={() => { setShowPasswordModal(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }} variant="outline" style={{ flex: 1 }} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Cover header
  coverWrap: { height: 220, position: 'relative', overflow: 'hidden' },
  coverBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000044' },
  topActions: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md,
    position: 'absolute', top: 0, left: 0, right: 0,
  },
  topBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#00000040', alignItems: 'center', justifyContent: 'center',
  },
  rankTagOnCover: {
    position: 'absolute', top: 52, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1,
  },
  verifiedOnCover: {
    position: 'absolute', top: 52, left: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#1D9BF033', borderRadius: BorderRadius.full,
  },
  coverBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'flex-end',
    padding: Spacing.md, gap: Spacing.md,
  },
  coverName: { fontSize: 20, fontWeight: '800', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  coverUsername: { color: '#ffffffaa', fontSize: FontSize.xs },
  coverBio: { color: '#ffffffcc', fontSize: FontSize.xs, lineHeight: 18 },
  nameEditInput: { fontSize: 18, fontWeight: '800', borderBottomWidth: 1, paddingBottom: 4 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  cameraOverlay: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#00000090', alignItems: 'center', justifyContent: 'center',
  },
  // Tabs
  tabs: {
    flexDirection: 'row', padding: Spacing.sm, gap: Spacing.xs,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tabText: { fontSize: FontSize.sm, fontWeight: '700' },
  // Highlight cards (level, coins)
  highlightCard: {
    borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1,
  },
  levelBadge: {
    minWidth: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  levelBadgeText: { color: '#fff', fontWeight: '900', fontSize: FontSize.body },
  coinsBadge: {
    minWidth: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  coinsBadgeText: { color: '#000', fontWeight: '900', fontSize: FontSize.sm },
  // Info rows
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  infoLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  infoValue: { fontSize: FontSize.sm, fontWeight: '700' },
  // Bio card
  bioCard: { borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, gap: Spacing.sm },
  bioInput: { borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, fontSize: FontSize.sm, textAlignVertical: 'top', minHeight: 80 },
  // Rank card
  rankCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  // General card
  card: { borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, gap: Spacing.sm },
  progressBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  // Modals
  sheetOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, paddingBottom: Spacing.xl },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm },
  uploadBtns: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 48, borderRadius: BorderRadius.md },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, paddingBottom: Spacing.sm },
  emojiOption: { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  passInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, height: 48 },
  passInput: { flex: 1, fontSize: FontSize.body },
  centeredOverlay: { flex: 1, backgroundColor: '#00000090', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  centeredCard: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.sm },
  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.xs, maxHeight: 280 },
  countryBtn: { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  gradientPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
});
