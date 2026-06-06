// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { getEffectiveStoreItems, updateStoreItemName, resetStoreItemName } from '@/services/storeService';
import { TextInput, Modal } from 'react-native';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useAlert } from '@/template';

// All categories
const CATEGORIES = [
  { id: 'all', label: 'الكل', emoji: '🛍️' },
  { id: 'frame', label: 'إطارات', emoji: '🖼️' },
  { id: 'badge', label: 'شارات', emoji: '🏅' },
  { id: 'nameColor', label: 'ألوان', emoji: '✨' },
  { id: 'bundle', label: 'حزم', emoji: '📦' },
  { id: 'boost', label: 'تعزيزات', emoji: '⚡' },
  { id: 'background', label: 'خلفيات', emoji: '🎨' },
  { id: 'sticker', label: 'ملصقات', emoji: '😄' },
  { id: 'subscription', label: 'اشتراكات', emoji: '👑' },
];

export default function StoreScreen() {
  const { colors } = useTheme();
  const { currentUser, updateCurrentUser } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPurchased, setShowPurchased] = useState(false);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [renameModal, setRenameModal] = useState<{ visible: boolean; item: any | null }>({ visible: false, item: null });
  const [newItemName, setNewItemName] = useState('');
  const isOwner = currentUser?.rank === 'owner';

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    const items = await getEffectiveStoreItems();
    setStoreItems(items);
  }

  async function handleRenameItem() {
    if (!renameModal.item || !currentUser) return;
    const result = await updateStoreItemName(renameModal.item.id, newItemName, currentUser.id, currentUser.rank);
    if (result.success) {
      await loadItems();
      setRenameModal({ visible: false, item: null });
      setNewItemName('');
      showAlert('تم ✅', newItemName.trim() ? `تم تغيير الاسم إلى "${newItemName.trim()}"` : 'تم إعادة الاسم الافتراضي');
    } else {
      showAlert('خطأ', result.error || 'فشل');
    }
  }

  async function handleResetName(item: any) {
    await resetStoreItemName(item.id);
    await loadItems();
    showAlert('تم ✅', 'تم إعادة الاسم الافتراضي');
  }

  const filtered = storeItems.filter(item => {
    if (showPurchased) return currentUser?.purchases.includes(item.id);
    if (selectedCategory === 'all') return true;
    return item.type === selectedCategory;
  });

  const isEquipped = (item: any) => {
    if (item.type === 'frame') return currentUser?.frame === item.id;
    if (item.type === 'badge') return currentUser?.badge === item.emoji;
    if (item.type === 'nameColor') return currentUser?.nameColor === item.color;
    return false;
  };

  const handleBuy = (item: any) => {
    if (!currentUser) return;
    // Check if item is locked for non-owners
    if (item.isLocked && currentUser.rank !== 'owner') {
      showAlert('🔒 مقفل', `"${item.name}" مقفل حالياً. يمكن للمالك فقط فتح هذا العنصر.`);
      return;
    }
    if (currentUser.purchases.includes(item.id)) {
      // Toggle equip/unequip for equippable items
      const updates: Record<string, any> = {};
      if (item.type === 'frame') updates.frame = currentUser.frame === item.id ? null : item.id;
      if (item.type === 'badge') updates.badge = currentUser.badge === item.emoji ? null : item.emoji;
      if (item.type === 'nameColor') updates.nameColor = currentUser.nameColor === item.color ? null : item.color;
      if (Object.keys(updates).length > 0) {
        updateCurrentUser(updates);
        showAlert('تم! ✅', isEquipped(item) ? 'تم إلغاء تفعيل العنصر' : 'تم تفعيل العنصر على ملفك الشخصي');
      } else {
        showAlert('مملوك ✅', 'هذا العنصر موجود في مشترياتك بالفعل');
      }
      return;
    }
    if (item.cost === 0) {
      const newPurchases = [...(currentUser.purchases || []), item.id];
      const updates: Record<string, any> = { purchases: newPurchases };
      if (item.type === 'frame') updates.frame = item.id;
      if (item.type === 'badge') updates.badge = item.emoji;
      if (item.type === 'nameColor') updates.nameColor = item.color;
      updateCurrentUser(updates);
      showAlert('مجاني! 🎉', `"${item.name}" تم تفعيله مجاناً`);
      return;
    }
    if (currentUser.coins < item.cost) {
      showAlert('رصيد غير كافٍ 💔', `تحتاج ${item.cost} 💰 لشراء "${item.name}"\nرصيدك: ${currentUser.coins} 💰`);
      return;
    }
    showAlert(
      `${item.emoji} ${item.name}`,
      `السعر: ${item.cost} عملة\n${item.description}\n\nرصيدك: ${currentUser.coins} 💰`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: '🛒 شراء الآن',
          onPress: async () => {
            const newPurchases = [...(currentUser.purchases || []), item.id];
            const newCoins = currentUser.coins - item.cost;
            const updates: Record<string, any> = { purchases: newPurchases, coins: newCoins };
            if (item.type === 'frame') updates.frame = item.id;
            if (item.type === 'badge') updates.badge = item.emoji;
            if (item.type === 'nameColor') updates.nameColor = item.color;
            await updateCurrentUser(updates);
            showAlert('تم الشراء! 🎉', `"${item.name}" أُضيف لمشترياتك وفُعِّل!`);
          },
        },
      ]
    );
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      frame: '#9C27B0', badge: '#FF9800', nameColor: '#E91E8C',
      bundle: '#2196F3', boost: '#FF4500', background: '#00BCD4',
      sticker: '#4CAF50', subscription: '#FFD700',
    };
    return map[type] || colors.primary;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      frame: 'إطار', badge: 'شارة', nameColor: 'لون اسم',
      bundle: 'حزمة', boost: 'تعزيز', background: 'خلفية',
      sticker: 'ملصقات', subscription: 'اشتراك',
    };
    return map[type] || type;
  };

  const getButtonLabel = (item: any) => {
    if (item.isLocked && currentUser?.rank !== 'owner') return '🔒 مقفل';
    const owned = currentUser?.purchases.includes(item.id);
    const equipped = isEquipped(item);
    if (!owned && item.cost === 0) return '🎁 مجاني';
    if (!owned) return `🛒 ${item.cost} 💰`;
    if (equipped) return '✓ مُفعَّل';
    return '▶ تفعيل';
  };

  const renderItem = ({ item }: { item: any }) => {
    const owned = currentUser?.purchases.includes(item.id);
    const equipped = isEquipped(item);
    const typeColor = item.color || getTypeColor(item.type);
    const isLockedForUser = item.isLocked && currentUser?.rank !== 'owner';

    return (
      <Pressable
        onPress={() => handleBuy(item)}
        onLongPress={() => {
          if (isOwner) {
            setNewItemName(item.isNameModified ? item.name : '');
            setRenameModal({ visible: true, item });
          }
        }}
        delayLongPress={600}
        style={({ pressed }) => [
          styles.itemCard,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: equipped ? typeColor : isLockedForUser ? '#F4433655' : owned ? `${typeColor}55` : colors.border,
            borderWidth: equipped ? 2 : 1,
            opacity: pressed ? 0.87 : 1,
          },
        ]}
      >
        {/* Lock indicator */}
        {item.isLocked ? (
          <View style={[styles.lockedTag, { backgroundColor: isLockedForUser ? '#F4433622' : '#4CAF5022' }]}>
            <Ionicons name={isLockedForUser ? 'lock-closed' : 'lock-open'} size={9} color={isLockedForUser ? '#F44336' : '#4CAF50'} />
            <Text style={{ fontSize: 8, color: isLockedForUser ? '#F44336' : '#4CAF50', fontWeight: '800' }}>
              {isLockedForUser ? 'مقفل' : 'مقفل (أنت المالك)'}
            </Text>
          </View>
        ) : null}

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeColor + '22' }]}>
          <Text style={[{ fontSize: 9, color: typeColor, fontWeight: '800' }]}>{getTypeLabel(item.type)}</Text>
        </View>

        {/* Custom name tag */}
        {item.isNameModified && isOwner ? (
          <View style={[styles.modifiedTag, { backgroundColor: '#9C27B033', top: 6, left: 6 }]}>
            <Text style={{ color: '#CE93D8', fontSize: 9, fontWeight: '800' }}>✏️ محرر</Text>
          </View>
        ) : null}

        {/* Modified price tag */}
        {item.isModified && !isLockedForUser ? (
          <View style={[styles.modifiedTag, { backgroundColor: colors.accent }]}>
            <Text style={{ color: '#000', fontSize: 9, fontWeight: '800' }}>سعر جديد!</Text>
          </View>
        ) : null}

        <View style={[styles.emojiWrap, { backgroundColor: `${typeColor}18`, opacity: isLockedForUser ? 0.5 : 1 }]}>
          <Text style={[styles.itemEmoji, isLockedForUser && { opacity: 0.5 }]}>{isLockedForUser ? '🔒' : item.emoji}</Text>
        </View>

        <Text style={[styles.itemName, { color: isLockedForUser ? colors.textMuted : typeColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.itemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {isLockedForUser ? 'هذا العنصر مقفل من قِبل المالك' : item.description}
        </Text>

        {!owned || isLockedForUser ? (
          <View style={styles.priceRow}>
            {item.isModified && !isLockedForUser ? (
              <Text style={[styles.originalPrice, { color: colors.textMuted }]}>{item.originalCost}</Text>
            ) : null}
            <Text style={[styles.priceText, { color: isLockedForUser ? colors.error : item.cost === 0 ? colors.success : colors.accent }]}>
              {isLockedForUser ? '🔒 مقفل' : item.cost === 0 ? '🎁 مجاني' : `${item.cost} 💰`}
            </Text>
          </View>
        ) : (
          <View style={[styles.ownedTag, { backgroundColor: equipped ? `${typeColor}22` : colors.surfaceElevated }]}>
            <Text style={[styles.ownedText, { color: equipped ? typeColor : colors.textMuted }]}>
              {equipped ? '✓ مُفعَّل' : '📦 مملوك'}
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => handleBuy(item)}
          style={[
            styles.buyBtn,
            {
              backgroundColor: isLockedForUser ? '#F4433622' : equipped ? `${typeColor}22` : owned ? colors.surfaceElevated : colors.primary,
            },
          ]}
        >
          <Text style={[
            styles.buyBtnText,
            { color: isLockedForUser ? colors.error : equipped ? typeColor : owned ? colors.textMuted : '#fff' },
          ]}>
            {getButtonLabel(item)}
          </Text>
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <Text style={styles.headerTitle}>🛍️ المتجر</Text>
        <View style={styles.coinsRow}>
          <Ionicons name="wallet" size={16} color="#FFD700" />
          <Text style={styles.coinsText}>{currentUser?.coins?.toLocaleString() || 0} عملة</Text>
        </View>
        <Text style={styles.headerSub}>{storeItems.length} عنصر · إطارات · شارات · حزم · اشتراكات</Text>
      </LinearGradient>

      {/* Category bar */}
      <View style={{ height: 56 }}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          <Pressable
            onPress={() => { setShowPurchased(!showPurchased); setSelectedCategory('all'); }}
            style={[styles.catChip, { backgroundColor: showPurchased ? colors.accent : colors.surfaceElevated }]}
          >
            <Text style={[styles.catText, { color: showPurchased ? '#000' : colors.textSecondary }]}>📦 مشترياتي</Text>
          </Pressable>
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat.id && !showPurchased;
            return (
              <Pressable
                key={cat.id}
                onPress={() => { setSelectedCategory(cat.id); setShowPurchased(false); }}
                style={[styles.catChip, { backgroundColor: active ? colors.primary : colors.surfaceElevated }]}
              >
                <Text style={[styles.catText, { color: active ? '#fff' : colors.textSecondary }]}>
                  {cat.emoji} {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        onRefresh={loadItems}
        refreshing={false}
        ListHeaderComponent={isOwner ? (
          <View style={[styles.ownerHint, { backgroundColor: '#9C27B022', borderColor: '#9C27B044' }]}>
            <Text style={{ fontSize: 14 }}>✏️</Text>
            <Text style={[{ color: '#CE93D8', fontSize: FontSize.xs, flex: 1 }]}>اضغط مطولاً على أي عنصر لتغيير اسمه (للمالك فقط)</Text>
          </View>
        ) : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.body }]}>
              {showPurchased ? 'لا توجد مشتريات بعد' : 'لا توجد عناصر'}
            </Text>
          </View>
        }
      />

      {/* Rename Modal — owner only */}
      <Modal
        visible={renameModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameModal({ visible: false, item: null })}
      >
        <View style={styles.renameOverlay}>
          <View style={[styles.renameCard, { backgroundColor: colors.surface }]}>
            <Text style={[{ color: colors.text, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' }]}>
              ✏️ تغيير اسم العنصر
            </Text>
            {renameModal.item ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.md, padding: Spacing.md }}>
                <Text style={{ fontSize: 28 }}>{renameModal.item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>الاسم الأصلي:</Text>
                  <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' }]}>{renameModal.item.originalName || renameModal.item.name}</Text>
                </View>
              </View>
            ) : null}
            <TextInput
              style={[styles.renameInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
              placeholder={`الاسم الجديد (اتركه فارغاً لإعادة الافتراضي)`}
              placeholderTextColor={colors.textMuted}
              value={newItemName}
              onChangeText={setNewItemName}
              textAlign="right"
              autoFocus
              maxLength={50}
            />
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Pressable
                onPress={handleRenameItem}
                style={[styles.renameSaveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: FontSize.sm }}>✅ حفظ</Text>
              </Pressable>
              {renameModal.item?.isNameModified ? (
                <Pressable
                  onPress={() => { handleResetName(renameModal.item); setRenameModal({ visible: false, item: null }); }}
                  style={[styles.renameSaveBtn, { backgroundColor: colors.error + '33', flex: 0.8 }]}
                >
                  <Text style={{ color: colors.error, fontWeight: '800', fontSize: FontSize.xs }}>🔄 إعادة</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setRenameModal({ visible: false, item: null })}
                style={[styles.renameSaveBtn, { backgroundColor: colors.surfaceElevated, flex: 0.8 }]}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: FontSize.sm }}>إلغاء</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    alignItems: 'center', gap: Spacing.xs,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#ffffffaa', fontSize: FontSize.xs, textAlign: 'center' },
  coinsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#00000030', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 5,
  },
  coinsText: { color: '#FFD700', fontWeight: '700', fontSize: FontSize.body },
  categories: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    gap: Spacing.sm, alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: Spacing.md, height: 36,
    borderRadius: BorderRadius.full, justifyContent: 'center',
  },
  catText: { fontSize: FontSize.sm, fontWeight: '600' },
  grid: { padding: Spacing.sm, paddingBottom: 60 },
  itemCard: {
    flex: 1, margin: Spacing.sm, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.sm,
    overflow: 'hidden', minHeight: 200,
  },
  lockedTag: {
    position: 'absolute', top: 26, right: 6,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  typeBadge: {
    position: 'absolute', top: 6, right: 6,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  modifiedTag: {
    position: 'absolute', top: 6, left: 6,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  emojiWrap: {
    width: 62, height: 62, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  itemEmoji: { fontSize: 32 },
  itemName: { fontSize: FontSize.sm, fontWeight: '800', textAlign: 'center' },
  itemDesc: { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 15, flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  originalPrice: { fontSize: FontSize.xs, textDecorationLine: 'line-through' },
  priceText: { fontSize: FontSize.sm, fontWeight: '800' },
  ownedTag: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  ownedText: { fontSize: FontSize.xs, fontWeight: '700' },
  buyBtn: {
    width: '100%', height: 36, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  buyBtnText: { fontSize: FontSize.xs, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.md },
  ownerHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, margin: Spacing.sm, marginBottom: 0 },
  renameOverlay: { flex: 1, backgroundColor: '#00000090', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  renameCard: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  renameInput: { borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md, fontSize: FontSize.body, height: 50 },
  renameSaveBtn: { flex: 1, height: 44, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
});
