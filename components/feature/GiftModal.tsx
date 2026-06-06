// Powered by OnSpace.AI
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { GIFTS } from '@/constants/config';
import { BorderRadius, FontSize, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

interface GiftModalProps {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
  onSendGift: (giftId: string) => void;
  onSendMoney: (amount: number) => void;
  mode: 'gift' | 'money';
}

export function GiftModal({ visible, onClose, recipientName, onSendGift, onSendMoney, mode }: GiftModalProps) {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [moneyAmount, setMoneyAmount] = useState(10);

  const handleSend = () => {
    if (mode === 'gift' && selectedGift) {
      onSendGift(selectedGift);
      setSelectedGift(null);
    } else if (mode === 'money') {
      onSendMoney(moneyAmount);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>
            {mode === 'gift' ? '🎁 إرسال هدية' : '💰 إرسال عملات'} إلى {recipientName}
          </Text>

          {mode === 'gift' ? (
            <>
              <Text style={[styles.balance, { color: colors.textSecondary }]}>
                رصيدك: {currentUser?.coins || 0} 💰
              </Text>
              <FlatList
                data={GIFTS}
                keyExtractor={item => item.id}
                numColumns={4}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setSelectedGift(item.id)}
                    style={[
                      styles.giftItem,
                      { backgroundColor: colors.surfaceElevated },
                      selectedGift === item.id && { borderColor: colors.primary, borderWidth: 2 },
                    ]}
                  >
                    <Text style={styles.giftEmoji}>{item.emoji}</Text>
                    <Text style={[styles.giftName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.giftCost, { color: colors.accent }]}>{item.cost} 💰</Text>
                  </Pressable>
                )}
              />
            </>
          ) : (
            <View style={styles.moneySection}>
              <Text style={[styles.balance, { color: colors.textSecondary }]}>
                رصيدك: {currentUser?.coins || 0} 💰
              </Text>
              <View style={styles.moneyRow}>
                {[10, 50, 100, 200, 500].map(amount => (
                  <Pressable
                    key={amount}
                    onPress={() => setMoneyAmount(amount)}
                    style={[
                      styles.moneyBtn,
                      { backgroundColor: colors.surfaceElevated },
                      moneyAmount === amount && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={[styles.moneyBtnText, { color: moneyAmount === amount ? '#fff' : colors.text }]}>
                      {amount}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Button
            title={mode === 'gift' ? 'إرسال الهدية' : `إرسال ${moneyAmount} 💰`}
            onPress={handleSend}
            disabled={mode === 'gift' && !selectedGift}
            style={{ marginTop: Spacing.md }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  balance: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  giftItem: {
    flex: 1,
    margin: 4,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 2,
  },
  giftEmoji: { fontSize: 28 },
  giftName: { fontSize: FontSize.xs, fontWeight: '600' },
  giftCost: { fontSize: FontSize.xs },
  moneySection: { gap: Spacing.md },
  moneyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  moneyBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  moneyBtnText: { fontSize: FontSize.body, fontWeight: '700' },
});
