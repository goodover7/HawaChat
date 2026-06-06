// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { registerUser } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useAlert } from '@/template';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setCurrentUser } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'الرجاء إدخال الاسم المعروض';
    if (!username.trim()) errs.username = 'الرجاء إدخال اسم المستخدم';
    else if (username.length < 3) errs.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errs.username = 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط';
    if (!password.trim()) errs.password = 'الرجاء إدخال كلمة المرور';
    else if (password.length < 4) errs.password = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل';
    if (password !== confirmPassword) errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await registerUser(username.trim(), password, displayName.trim());
    setLoading(false);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      router.replace('/(tabs)');
    } else {
      showAlert('خطأ', result.error || 'حدث خطأ أثناء إنشاء الحساب');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <Header
          title="إنشاء حساب جديد"
          subtitle="انضم إلى مجتمعنا الرائع 🌟"
          onBack={() => router.back()}
          gradient
        />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <View style={styles.avatarPreview}>
              <Text style={styles.avatarEmoji}>🎉</Text>
              <Text style={[styles.welcomeText, { color: colors.text }]}>أهلاً بك في Hawa Chat!</Text>
            </View>

            <Input
              label="الاسم المعروض"
              placeholder="كيف تريد أن يعرفك الآخرون؟"
              value={displayName}
              onChangeText={setDisplayName}
              icon="happy"
              error={errors.displayName}
            />
            <Input
              label="اسم المستخدم"
              placeholder="حروف إنجليزية وأرقام فقط"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              icon="at"
              error={errors.username}
            />
            <Input
              label="كلمة المرور"
              placeholder="4 أحرف على الأقل"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed"
              error={errors.password}
            />
            <Input
              label="تأكيد كلمة المرور"
              placeholder="أعد إدخال كلمة المرور"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon="shield-checkmark"
              error={errors.confirmPassword}
            />

            <View style={[styles.bonusBox, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.bonusText, { color: colors.accent }]}>
                🎁 مكافأة الانضمام: 100 عملة مجانية!
              </Text>
            </View>

            <Button
              title="إنشاء الحساب"
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGradient: {},
  scroll: { padding: Spacing.md, gap: Spacing.md },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  avatarEmoji: { fontSize: 56 },
  welcomeText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  bonusBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  bonusText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
