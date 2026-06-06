// Powered by OnSpace.AI
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { loginUser } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useAlert } from '@/template';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setCurrentUser } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!username.trim()) errs.username = 'الرجاء إدخال اسم المستخدم';
    if (!password.trim()) errs.password = 'الرجاء إدخال كلمة المرور';
    else if (password.length < 4) errs.password = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await loginUser(username.trim(), password);
    setLoading(false);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      router.replace('/(tabs)');
    } else {
      showAlert('خطأ', result.error || 'بيانات غير صحيحة');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroContainer}>
            <Image
              source={require('@/assets/images/login-hero.png')}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', colors.background]}
              style={styles.heroGradient}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroEmoji}>💬</Text>
              <Text style={styles.heroTitle}>Hawa Chat</Text>
              <Text style={[styles.heroSubtitle, { color: '#ffffffcc' }]}>
                دردش، تعرّف، وابنِ صداقات جميلة
              </Text>
            </View>
          </View>

          {/* Login Form */}
          <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>تسجيل الدخول</Text>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
              أهلاً بك مجدداً! 👋
            </Text>

            <View style={styles.fields}>
              <Input
                label="اسم المستخدم"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                icon="person"
                error={errors.username}
              />
              <Input
                label="كلمة المرور"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed"
                error={errors.password}
              />
            </View>

            <Button
              title="تسجيل الدخول"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: Spacing.md }}
            />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>أو</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Button
              title="إنشاء حساب جديد"
              onPress={() => router.push('/register')}
              variant="outline"
            />

            <View style={[styles.ownerHint, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.ownerHintText, { color: colors.textMuted }]}>
                حساب المالك: owner / owner123
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  heroContainer: {
    height: height * 0.38,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  heroContent: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 40, marginBottom: 4 },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: '#00000060',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: FontSize.body,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  formCard: {
    margin: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  formTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: FontSize.body,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  fields: { gap: Spacing.md },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: FontSize.sm },
  ownerHint: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  ownerHintText: { fontSize: FontSize.xs },
});
