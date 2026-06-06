// Powered by OnSpace.AI
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, TextInput, Modal, ScrollView, Animated, Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import {
  createRoom, deleteRoom, lockRoom, unlockRoom, ChatRoom,
} from '@/services/chatService';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { useAlert } from '@/template';

// Floating particle component
function Particle({ x, y, delay, color }: { x: number; y: number; delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loopRef: Animated.CompositeAnimation | null = null;
    // Use setTimeout for initial delay to avoid Animated.delay native driver conflict
    const timer = setTimeout(() => {
      const runLoop = () => {
        anim.setValue(0);
        scaleAnim.setValue(0);
        loopRef = Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }), // hold
            Animated.timing(scaleAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ]);
        loopRef.start(({ finished }) => { if (finished) runLoop(); });
      };
      runLoop();
    }, delay);
    return () => {
      clearTimeout(timer);
      loopRef?.stop();
    };
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const opacity = anim.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 0.6, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        bottom: y,
        transform: [{ translateY }, { scale: scaleAnim }],
        opacity,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
      }}
    />
  );
}

// Pulsing glow ring
function GlowRing({ size, color, delay }: { size: number; color: string; delay: number }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    let scaleLoop: Animated.CompositeAnimation | null = null;
    let opacityLoop: Animated.CompositeAnimation | null = null;
    // Use setTimeout to avoid Animated.delay inside loop (native driver conflict)
    const timer = setTimeout(() => {
      scaleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.8, duration: 2000, useNativeDriver: true }),
        ])
      );
      opacityLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.35, duration: 2000, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.1, duration: 2000, useNativeDriver: true }),
        ])
      );
      scaleLoop.start();
      opacityLoop.start();
    }, delay);
    return () => {
      clearTimeout(timer);
      scaleLoop?.stop();
      opacityLoop?.stop();
    };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    />
  );
}

// Animated room card with glowing effect
function RoomCard({ item, onPress, onLongPress, colors }: { item: ChatRoom; onPress: () => void; onLongPress: () => void; colors: any }) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowDuration = useRef(2500 + Math.random() * 1000).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: glowDuration, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: glowDuration, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      item.isLocked ? '#FF980055' : colors.primary + '33',
      item.isLocked ? '#FF9800AA' : colors.primary + '88',
      item.isLocked ? '#FF980055' : colors.primary + '33',
    ],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayLongPress={500}
    >
      <Animated.View style={[styles.roomCard, { backgroundColor: colors.surfaceCard, borderWidth: 1.5, borderColor }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md }}>
        <LinearGradient
          colors={[colors.primary + '22', colors.secondary + '11']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.roomGradientAccent}
        />
        <View style={[styles.roomIcon, { backgroundColor: colors.primary + '22' }]}>
          <Text style={styles.roomEmoji}>
            {item.name.match(/[\u{1F600}-\u{1FFFF}]/u)?.[0] || '💬'}
          </Text>
        </View>
        <View style={styles.roomInfo}>
          <View style={styles.roomNameRow}>
            <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isLocked ? (
              <View style={[styles.lockTag, { backgroundColor: '#FF980022', borderColor: '#FF9800' }]}>
                <Ionicons name="lock-closed" size={11} color="#FF9800" />
                <Text style={[styles.lockTagText, { color: '#FF9800' }]}>مقفلة</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.roomDesc, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function RoomsScreen() {
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const { currentUser, allUsers, refreshAllUsers } = useAuth();
  const { rooms, refreshRooms } = useChat();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  const [roomActionModal, setRoomActionModal] = useState<{ visible: boolean; room: ChatRoom | null }>({
    visible: false, room: null,
  });
  const [lockPassword, setLockPassword] = useState('');
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockTargetRoom, setLockTargetRoom] = useState<ChatRoom | null>(null);

  // Header animations
  const titlePulseAnim = useRef(new Animated.Value(1)).current;
  const coinsShineAnim = useRef(new Animated.Value(0)).current;

  const isOwner = currentUser?.rank === 'owner';
  const isMod = ['owner', 'legend', 'admin', 'guardian', 'moderator'].includes(currentUser?.rank || '');

  useEffect(() => {
    const interval = setInterval(() => refreshAllUsers(), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Title pulse (native driver: only transform)
    const titleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(titlePulseAnim, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(titlePulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    titleLoop.start();

    // Coins shine loop (non-native: color interpolation)
    const coinsLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coinsShineAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(coinsShineAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
      ])
    );
    coinsLoop.start();

    return () => { titleLoop.stop(); coinsLoop.stop(); };
  }, []);

  const onlineCount = allUsers.filter(u => u.isOnline && !u.isHidden).length;

  const particles = [
    { x: 20, y: 30, delay: 0, color: '#FFD700' },
    { x: 60, y: 20, delay: 500, color: '#FF69B4' },
    { x: 110, y: 40, delay: 1000, color: '#00E5FF' },
    { x: 160, y: 10, delay: 1500, color: '#FFD700' },
    { x: 220, y: 35, delay: 700, color: '#E91E8C' },
    { x: 280, y: 15, delay: 200, color: '#7C4DFF' },
    { x: 320, y: 45, delay: 1200, color: '#FFD700' },
    { x: 360, y: 20, delay: 900, color: '#00E5FF' },
  ];

  const coinsColor = coinsShineAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FFD700', '#FFF176', '#FFD700'],
  });

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    await createRoom(newRoomName.trim(), newRoomDesc.trim(), currentUser!.id);
    await refreshRooms();
    setShowCreateRoom(false);
    setNewRoomName('');
    setNewRoomDesc('');
  };

  const handleDeleteRoom = async (room: ChatRoom) => {
    if (!isOwner) { showAlert('محظور', 'فقط المالك يمكنه حذف الغرف'); return; }
    if (room.isDefault) { showAlert('محظور', 'لا يمكن حذف الغرف الافتراضية'); return; }
    showAlert(
      `حذف الغرفة "${room.name}"`,
      'هل أنت متأكد؟ سيتم حذف كل الرسائل داخلها أيضاً',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً', style: 'destructive',
          onPress: async () => {
            const result = await deleteRoom(room.id, currentUser!.id, currentUser!.rank);
            if (result.success) {
              await refreshRooms();
              setRoomActionModal({ visible: false, room: null });
              showAlert('تم ✅', 'تم حذف الغرفة');
            } else {
              showAlert('خطأ', result.error || 'فشل الحذف');
            }
          },
        },
      ]
    );
  };

  const handleLockRoom = async () => {
    if (!lockTargetRoom || !currentUser) return;
    const result = await lockRoom(lockTargetRoom.id, currentUser.id, currentUser.rank, lockPassword.trim() || null);
    if (result.success) {
      await refreshRooms();
      setShowLockModal(false);
      setLockPassword('');
      setLockTargetRoom(null);
      setRoomActionModal({ visible: false, room: null });
      showAlert('تم 🔒', 'تم قفل الغرفة' + (lockPassword.trim() ? ' بكلمة سر' : ''));
    } else {
      showAlert('خطأ', result.error || 'فشل القفل');
    }
  };

  const handleUnlockRoom = async (room: ChatRoom) => {
    if (!currentUser) return;
    showAlert('فتح الغرفة', `هل تريد إزالة القفل عن "${room.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'فتح', onPress: async () => {
          const result = await unlockRoom(room.id, currentUser.id, currentUser.rank);
          if (result.success) {
            await refreshRooms();
            setRoomActionModal({ visible: false, room: null });
            showAlert('تم 🔓', 'تم فتح الغرفة');
          } else {
            showAlert('خطأ', result.error || 'فشل الفتح');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Animated Header ── */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        {/* Floating particles */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {particles.map((p, i) => (
            <Particle key={i} x={p.x} y={p.y} delay={p.delay} color={p.color} />
          ))}
        </View>

        {/* Glow rings in background */}
        <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          <GlowRing size={180} color="#FFD700" delay={0} />
          <GlowRing size={280} color="#E91E8C" delay={1000} />
        </View>

        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarGlow}>
              <Avatar avatar={currentUser?.avatar || '👤'} size={42} rank={currentUser?.rank || 'member'} frame={currentUser?.frame} isOnline />
            </View>
            <View>
              <Text style={styles.headerName}>{currentUser?.displayName}</Text>
              <Animated.Text style={[styles.headerCoins, { color: coinsColor }]}>
                💰 {currentUser?.coins?.toLocaleString()}
              </Animated.Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={toggleTheme} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={() => router.push('/news')} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name="newspaper-outline" size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={() => router.push('/leaderboard')} hitSlop={8} style={styles.headerBtn}>
              <Ionicons name="trophy-outline" size={20} color="#FFD700" />
            </Pressable>
            {isOwner || currentUser?.rank === 'admin' || currentUser?.rank === 'legend' ? (
              <Pressable onPress={() => router.push('/admin')} hitSlop={8} style={[styles.headerBtn, { backgroundColor: '#FFD70030' }]}>
                <Ionicons name="shield" size={20} color="#FFD700" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Animated title */}
        <View style={styles.titleSection}>
          <Animated.Text style={[styles.appTitle, { transform: [{ scale: titlePulseAnim }] }]}>
            ✨ هوى شات ✨
          </Animated.Text>
          <Text style={styles.appSubtitle}>تواصل • تعارف • تفاعل</Text>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{onlineCount}</Text>
            <Text style={styles.statLabel}>متصل</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{rooms.length}</Text>
            <Text style={styles.statLabel}>غرفة</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFD700' }]}>Lv.{currentUser?.level}</Text>
            <Text style={styles.statLabel}>{currentUser?.levelTitle}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Rooms List */}
      <FlatList
        data={rooms}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <RoomCard
            item={item}
            colors={colors}
            onPress={() => router.push(`/chat/${item.id}`)}
            onLongPress={() => isMod && setRoomActionModal({ visible: true, room: item })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>🏠 الغرف المتاحة</Text>
            <View style={styles.listHeaderActions}>
              {isMod ? (
                <Text style={[styles.longPressHint, { color: colors.textMuted }]}>اضغط مطولاً للإدارة</Text>
              ) : null}
              {isOwner ? (
                <Pressable
                  onPress={() => setShowCreateRoom(true)}
                  style={[styles.createBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.createBtnText}>غرفة جديدة</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        }
      />

      {/* Create Room Modal */}
      <Modal visible={showCreateRoom} transparent animationType="fade" onRequestClose={() => setShowCreateRoom(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>إنشاء غرفة جديدة</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
              placeholder="اسم الغرفة (مثل: 💬 غرفتي)"
              placeholderTextColor={colors.textMuted}
              value={newRoomName}
              onChangeText={setNewRoomName}
              textAlign="right"
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
              placeholder="وصف الغرفة"
              placeholderTextColor={colors.textMuted}
              value={newRoomDesc}
              onChangeText={setNewRoomDesc}
              textAlign="right"
            />
            <View style={styles.modalBtns}>
              <Button title="إنشاء" onPress={handleCreateRoom} style={{ flex: 1 }} />
              <Button title="إلغاء" onPress={() => setShowCreateRoom(false)} variant="outline" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Room Action Modal */}
      <Modal
        visible={roomActionModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoomActionModal({ visible: false, room: null })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRoomActionModal({ visible: false, room: null })}
        >
          <Pressable style={[styles.actionSheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              ⚙️ إدارة: {roomActionModal.room?.name}
            </Text>
            {roomActionModal.room?.isLocked ? (
              <Pressable
                onPress={() => roomActionModal.room && handleUnlockRoom(roomActionModal.room)}
                style={[styles.sheetBtn, { backgroundColor: '#4CAF5022', borderColor: '#4CAF50' }]}
              >
                <Ionicons name="lock-open-outline" size={20} color="#4CAF50" />
                <Text style={[styles.sheetBtnText, { color: '#4CAF50' }]}>🔓 فتح الغرفة</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  setLockTargetRoom(roomActionModal.room);
                  setShowLockModal(true);
                  setRoomActionModal({ visible: false, room: null });
                }}
                style={[styles.sheetBtn, { backgroundColor: '#FF980022', borderColor: '#FF9800' }]}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#FF9800" />
                <Text style={[styles.sheetBtnText, { color: '#FF9800' }]}>🔒 قفل الغرفة بكلمة سر</Text>
              </Pressable>
            )}
            {isOwner && !roomActionModal.room?.isDefault ? (
              <Pressable
                onPress={() => roomActionModal.room && handleDeleteRoom(roomActionModal.room)}
                style={[styles.sheetBtn, { backgroundColor: colors.error + '22', borderColor: colors.error }]}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.sheetBtnText, { color: colors.error }]}>🗑️ حذف الغرفة نهائياً</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setRoomActionModal({ visible: false, room: null })}
              style={[styles.sheetBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <Text style={[styles.sheetBtnText, { color: colors.textSecondary }]}>إلغاء</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Lock Room Modal */}
      <Modal
        visible={showLockModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowLockModal(false); setLockPassword(''); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>🔒 قفل الغرفة</Text>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' }]}>
              "{lockTargetRoom?.name}"
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
              placeholder="كلمة السر (اتركها فارغة للقفل بدون سر)"
              placeholderTextColor={colors.textMuted}
              value={lockPassword}
              onChangeText={setLockPassword}
              secureTextEntry
              textAlign="right"
            />
            <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' }]}>
              إذا تركت كلمة السر فارغة، يُمنع الوصول على الجميع ما عدا المشرفين
            </Text>
            <View style={styles.modalBtns}>
              <Button title="قفل الغرفة 🔒" onPress={handleLockRoom} style={{ flex: 1 }} />
              <Button
                title="إلغاء"
                onPress={() => { setShowLockModal(false); setLockPassword(''); setLockTargetRoom(null); }}
                variant="outline"
                style={{ flex: 1 }}
              />
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    overflow: 'hidden',
    minHeight: 180,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatarGlow: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.8,
    elevation: 8,
  },
  headerName: { color: '#fff', fontSize: FontSize.body, fontWeight: '700' },
  headerCoins: { fontSize: FontSize.sm, fontWeight: '700' },
  headerRight: { flexDirection: 'row', gap: Spacing.sm },
  headerBtn: {
    padding: Spacing.xs, backgroundColor: '#ffffff20',
    borderRadius: BorderRadius.full, width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  titleSection: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    zIndex: 2,
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    letterSpacing: 2,
  },
  appSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  statsBar: {
    flexDirection: 'row', backgroundColor: '#ffffff18',
    borderRadius: BorderRadius.lg, padding: Spacing.sm,
    alignItems: 'center', justifyContent: 'space-around',
    borderWidth: 1, borderColor: '#ffffff20',
    zIndex: 2,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: '#fff', fontSize: FontSize.body, fontWeight: '800' },
  statLabel: { color: '#ffffffaa', fontSize: FontSize.xs },
  statDivider: { width: 1, height: 28, backgroundColor: '#ffffff30' },
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },
  listHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.sm,
    flexWrap: 'wrap', gap: Spacing.xs,
  },
  listTitle: { fontSize: FontSize.lg, fontWeight: '800' },
  listHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  longPressHint: { fontSize: FontSize.xs },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  createBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  roomCard: {
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 2,
  },
  roomGradientAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  roomIcon: {
    width: 50, height: 50, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  roomEmoji: { fontSize: 28 },
  roomInfo: { flex: 1 },
  roomNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  roomName: { fontSize: FontSize.body, fontWeight: '700' },
  lockTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  lockTagText: { fontSize: 11, fontWeight: '700' },
  roomDesc: { fontSize: FontSize.sm, marginTop: 2 },
  modalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  modalCard: { width: '100%', borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' },
  modalInput: { borderRadius: BorderRadius.md, borderWidth: 1, padding: Spacing.md, fontSize: FontSize.body },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm },
  actionSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.sm,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: Spacing.md,
  },
  sheetTitle: { fontSize: FontSize.body, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  sheetBtnText: { fontSize: FontSize.body, fontWeight: '700' },
});
