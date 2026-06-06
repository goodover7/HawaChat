// Powered by OnSpace.AI
// Rank management screen - Owner only
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, TextInput,
  Modal, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import {
  CustomRank, RankPermission, ALL_PERMISSIONS,
  getAllRanks, updateRank, createCustomRank, deleteCustomRank,
} from '@/services/rankService';
import { useAlert } from '@/template';

const COLOR_PRESETS = [
  '#FF4500', '#FFD700', '#E91E8C', '#9C27B0', '#2196F3',
  '#4CAF50', '#FF9800', '#F44336', '#00BCD4', '#607D8B',
  '#AB47BC', '#26C6DA', '#FDD835', '#29B6F6', '#EF5350',
  '#66BB6A', '#FF7043', '#42A5F5', '#EC407A', '#8D6E63',
];

const EMOJI_PRESETS = [
  '👑', '🔥', '🛡️', '⚔️', '🎖️', '💎', '⭐', '👤', '🌱',
  '🏆', '💜', '✨', '💠', '⚡', '🌟', '🦁', '🐉', '🎯',
  '🌈', '💫', '🎪', '🔮', '👊', '🏅', '🥇',
];

export default function RankManagementScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [ranks, setRanks] = useState<CustomRank[]>([]);
  const [editModal, setEditModal] = useState<{ visible: boolean; rank: CustomRank | null }>({ visible: false, rank: null });
  const [createModal, setCreateModal] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('👤');
  const [editColor, setEditColor] = useState('#9C27B0');
  const [editPermissions, setEditPermissions] = useState<RankPermission[]>([]);
  const [editImageUri, setEditImageUri] = useState<string | null>(null);

  // Create fields
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('👤');
  const [newColor, setNewColor] = useState('#9C27B0');
  const [newOrder, setNewOrder] = useState('5');
  const [newPermissions, setNewPermissions] = useState<RankPermission[]>(['send_messages']);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  useEffect(() => { loadRanks(); }, []);

  async function loadRanks() {
    const all = await getAllRanks();
    setRanks(all);
  }

  function openEdit(rank: CustomRank) {
    setEditName(rank.name);
    setEditEmoji(rank.emoji);
    setEditColor(rank.color);
    setEditPermissions([...rank.permissions]);
    setEditImageUri(null);
    setEditModal({ visible: true, rank });
  }

  async function pickImage(setter: (uri: string) => void) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('إذن مطلوب', 'يجب السماح بالوصول إلى معرض الصور'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
  }

  async function handleSaveEdit() {
    if (!currentUser || !editModal.rank) return;
    if (!editName.trim()) { showAlert('خطأ', 'أدخل اسم الرتبة'); return; }
    // Use image URI as emoji if set, otherwise use the emoji string
    const finalEmoji = editImageUri || editEmoji;
    const result = await updateRank(
      editModal.rank.id,
      { name: editName.trim(), emoji: finalEmoji, color: editColor, permissions: editPermissions },
      currentUser.id, currentUser.rank
    );
    if (result.success) {
      setEditModal({ visible: false, rank: null });
      await loadRanks();
      showAlert('تم ✅', 'تم تحديث الرتبة بنجاح');
    } else {
      showAlert('خطأ', result.error || 'فشل التحديث');
    }
  }

  async function handleCreate() {
    if (!currentUser) return;
    if (!newName.trim()) { showAlert('خطأ', 'أدخل اسم الرتبة'); return; }
    const order = parseInt(newOrder) || 5;
    const savedName = newName;
    const finalEmoji = newImageUri || newEmoji;
    const result = await createCustomRank(
      savedName, finalEmoji, newColor, newPermissions, order,
      currentUser.id, currentUser.rank
    );
    if (result.success) {
      setCreateModal(false);
      setNewName(''); setNewEmoji('👤'); setNewColor('#9C27B0');
      setNewOrder('5'); setNewPermissions(['send_messages']); setNewImageUri(null);
      await loadRanks();
      showAlert('تم ✅', `تم إنشاء رتبة "${savedName}" بنجاح`);
    } else {
      showAlert('خطأ', result.error || 'فشل الإنشاء');
    }
  }

  async function handleDelete(rank: CustomRank) {
    if (!currentUser) return;
    if (rank.isSystem) { showAlert('محظور', 'لا يمكن حذف الرتب الأساسية'); return; }
    showAlert('حذف الرتبة', `هل تريد حذف رتبة "${rank.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف', style: 'destructive',
        onPress: async () => {
          const result = await deleteCustomRank(rank.id, currentUser.id, currentUser.rank);
          if (result.success) { await loadRanks(); showAlert('تم', 'تم حذف الرتبة'); }
          else showAlert('خطأ', result.error || 'فشل الحذف');
        },
      },
    ]);
  }

  function togglePermission(perm: RankPermission, list: RankPermission[], setList: (p: RankPermission[]) => void) {
    if (list.includes(perm)) setList(list.filter(p => p !== perm));
    else setList([...list, perm]);
  }

  const PermissionsEditor = ({
    permissions, setPermissions,
  }: { permissions: RankPermission[]; setPermissions: (p: RankPermission[]) => void }) => (
    <View style={{ gap: Spacing.xs }}>
      {ALL_PERMISSIONS.map(p => (
        <Pressable
          key={p.key}
          onPress={() => togglePermission(p.key, permissions, setPermissions)}
          style={[
            styles.permRow,
            {
              backgroundColor: permissions.includes(p.key) ? colors.primary + '22' : colors.surfaceElevated,
              borderColor: permissions.includes(p.key) ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={{ fontSize: 16 }}>{p.emoji}</Text>
          <Text style={[{ flex: 1, color: colors.text, fontSize: FontSize.sm, textAlign: 'right' }]}>{p.label}</Text>
          <Ionicons
            name={permissions.includes(p.key) ? 'checkbox' : 'square-outline'}
            size={20}
            color={permissions.includes(p.key) ? colors.primary : colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );

  // Shared emoji/image picker section
  const BadgeSelector = ({
    selectedEmoji, setEmoji, imageUri, setImageUri, previewColor, previewName,
  }: {
    selectedEmoji: string; setEmoji: (e: string) => void;
    imageUri: string | null; setImageUri: (u: string | null) => void;
    previewColor: string; previewName: string;
  }) => (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>شعار الرتبة</Text>
      {/* Preview + upload row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        <View style={[styles.badgePreview, { backgroundColor: previewColor + '22', borderColor: previewColor }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: 36, height: 36, borderRadius: 18 }} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 24 }}>{selectedEmoji}</Text>
          )}
        </View>
        <Pressable
          onPress={() => pickImage(uri => setImageUri(uri))}
          style={[styles.uploadBtn, { backgroundColor: colors.secondary + '22', borderColor: colors.secondary }]}
        >
          <Ionicons name="image-outline" size={16} color={colors.secondary} />
          <Text style={[{ color: colors.secondary, fontSize: FontSize.xs, fontWeight: '700' }]}>رفع صورة</Text>
        </Pressable>
        {imageUri ? (
          <Pressable onPress={() => setImageUri(null)} style={[styles.clearBtn, { backgroundColor: colors.error + '22' }]}>
            <Ionicons name="close" size={14} color={colors.error} />
          </Pressable>
        ) : null}
      </View>
      {/* Emoji grid */}
      <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>أو اختر إيموجي:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        {EMOJI_PRESETS.map(e => (
          <Pressable
            key={e} onPress={() => { setEmoji(e); setImageUri(null); }}
            style={[styles.emojiBtn, selectedEmoji === e && !imageUri && { backgroundColor: colors.primary + '33', borderColor: colors.primary }]}
          >
            <Text style={{ fontSize: 20 }}>{e}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderRank = ({ item }: { item: CustomRank }) => {
    const isImageEmoji = item.emoji.startsWith('file://') || item.emoji.startsWith('content://') || item.emoji.startsWith('http');
    return (
      <View style={[styles.rankCard, { backgroundColor: colors.surfaceCard, borderColor: item.color + '55', borderLeftWidth: 4, borderLeftColor: item.color }]}>
        <View style={[styles.rankIconWrap, { backgroundColor: item.color + '22' }]}>
          {isImageEmoji ? (
            <Image source={{ uri: item.emoji }} style={{ width: 32, height: 32, borderRadius: 16 }} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.rankName, { color: item.color }]}>{item.name}</Text>
            {item.isSystem ? (
              <View style={[styles.sysBadge, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[{ fontSize: 9, color: colors.textMuted, fontWeight: '700' }]}>نظام</Text>
              </View>
            ) : (
              <View style={[styles.sysBadge, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[{ fontSize: 9, color: colors.primary, fontWeight: '700' }]}>مخصص</Text>
              </View>
            )}
          </View>
          <Text style={[styles.rankOrder, { color: colors.textMuted }]}>
            ترتيب: {item.order} · {item.permissions.length} صلاحية
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
          <Pressable onPress={() => openEdit(item)} style={[styles.iconBtn, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </Pressable>
          {!item.isSystem ? (
            <Pressable onPress={() => handleDelete(item)} style={[styles.iconBtn, { backgroundColor: colors.error + '22' }]}>
              <Ionicons name="trash" size={16} color={colors.error} />
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  if (currentUser?.rank !== 'owner') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 52 }}>🔒</Text>
        <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '700' }]}>للمالك فقط</Text>
        <Button title="رجوع" onPress={() => router.back()} variant="outline" style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#7B1FA2', '#E91E8C']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>🎖️ إدارة الرتب</Text>
          <Text style={styles.headerSub}>{ranks.length} رتبة · للمالك فقط</Text>
        </View>
        <Pressable onPress={() => setCreateModal(true)} style={[styles.addBtn, { backgroundColor: '#ffffff30' }]}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: FontSize.sm }}>إضافة</Text>
        </Pressable>
      </LinearGradient>

      <FlatList
        data={ranks}
        keyExtractor={item => item.id}
        renderItem={renderRank}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />

      {/* ── EDIT MODAL ── */}
      <Modal visible={editModal.visible} transparent animationType="slide" onRequestClose={() => setEditModal({ visible: false, rank: null })}>
        <Pressable style={styles.overlay} onPress={() => setEditModal({ visible: false, rank: null })}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: 60 }}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>✏️ تعديل رتبة: {editModal.rank?.name}</Text>

              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>اسم الرتبة</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={editName} onChangeText={setEditName}
                  placeholder="اسم الرتبة" placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />
              </View>

              <BadgeSelector
                selectedEmoji={editEmoji} setEmoji={setEditEmoji}
                imageUri={editImageUri} setImageUri={setEditImageUri}
                previewColor={editColor} previewName={editName}
              />

              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>اللون</Text>
                <View style={styles.colorGrid}>
                  {COLOR_PRESETS.map(c => (
                    <Pressable key={c} onPress={() => setEditColor(c)}
                      style={[styles.colorBtn, { backgroundColor: c }, editColor === c && { borderWidth: 3, borderColor: '#fff' }]}
                    />
                  ))}
                </View>
                <View style={[styles.colorPreview, { backgroundColor: editColor }]}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>معاينة: {editName || 'اسم الرتبة'}</Text>
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>الصلاحيات</Text>
                <PermissionsEditor permissions={editPermissions} setPermissions={setEditPermissions} />
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button title="💾 حفظ" onPress={handleSaveEdit} style={{ flex: 1 }} />
                <Button title="إلغاء" onPress={() => setEditModal({ visible: false, rank: null })} variant="outline" style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── CREATE MODAL ── */}
      <Modal visible={createModal} transparent animationType="slide" onRequestClose={() => setCreateModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setCreateModal(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: 60 }}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>✨ إضافة رتبة جديدة</Text>

              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>اسم الرتبة *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={newName} onChangeText={setNewName}
                  placeholder="اسم الرتبة" placeholderTextColor={colors.textMuted}
                  textAlign="right" autoFocus
                />
              </View>

              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>ترتيب القوة (1–99)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  value={newOrder} onChangeText={setNewOrder}
                  placeholder="5" placeholderTextColor={colors.textMuted}
                  keyboardType="numeric" textAlign="right"
                />
              </View>

              <BadgeSelector
                selectedEmoji={newEmoji} setEmoji={setNewEmoji}
                imageUri={newImageUri} setImageUri={setNewImageUri}
                previewColor={newColor} previewName={newName}
              />

              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>اللون</Text>
                <View style={styles.colorGrid}>
                  {COLOR_PRESETS.map(c => (
                    <Pressable key={c} onPress={() => setNewColor(c)}
                      style={[styles.colorBtn, { backgroundColor: c }, newColor === c && { borderWidth: 3, borderColor: '#fff' }]}
                    />
                  ))}
                </View>
                <View style={[styles.colorPreview, { backgroundColor: newColor }]}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{newEmoji} {newName || 'اسم الرتبة'}</Text>
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>الصلاحيات</Text>
                <PermissionsEditor permissions={newPermissions} setPermissions={setNewPermissions} />
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button title="✨ إنشاء" onPress={handleCreate} style={{ flex: 1 }} />
                <Button title="إلغاء" onPress={() => setCreateModal(false)} variant="outline" style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.md,
  },
  rankCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: BorderRadius.lg,
    borderWidth: 1, gap: Spacing.sm,
  },
  rankIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  rankName: { fontSize: FontSize.body, fontWeight: '800' },
  rankOrder: { fontSize: FontSize.xs, marginTop: 2 },
  sysBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.full },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    maxHeight: '94%', paddingTop: Spacing.md,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' },
  label: { fontSize: FontSize.sm, fontWeight: '700', textAlign: 'right', marginBottom: 4 },
  input: {
    borderRadius: BorderRadius.md, borderWidth: 1,
    padding: Spacing.md, fontSize: FontSize.body, height: 48,
  },
  badgePreview: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    borderRadius: BorderRadius.md, borderWidth: 1,
  },
  clearBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  colorBtn: { width: 36, height: 36, borderRadius: 18 },
  colorPreview: {
    height: 40, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  permRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1,
  },
});
