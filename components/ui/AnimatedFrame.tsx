// Powered by OnSpace.AI
// Comprehensive animated frames — 30+ VIP frames + crown/laurel/rare decorative frames
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Platform, Text } from 'react-native';

interface AnimatedFrameProps {
  size: number;
  frame: string;
  children: React.ReactNode;
}

interface FrameConfig {
  colors: string[];
  borderWidth: number;
  animated: boolean;
  style:
    | 'solid' | 'glow' | 'spin' | 'pulse_border' | 'rainbow'
    | 'vip_glow' | 'owner_crown' | 'double_spin' | 'diamond_glow'
    | 'fire_glow' | 'crown_decor' | 'laurel' | 'star_burst' | 'galaxy'
    | 'divine_glow' | 'eternal_spin' | 'dragon_frame';
  topDecor?: string;
}

const FRAME_CONFIGS: Record<string, FrameConfig> = {
  // ── Basic frames ──
  frame1:  { colors: ['#FFD700', '#FFA000', '#FFD700'], borderWidth: 3, animated: false, style: 'solid' },
  frame2:  { colors: ['#FF69B4', '#E91E8C', '#FF69B4'], borderWidth: 3, animated: true,  style: 'glow' },
  frame3:  { colors: ['#9C27B0', '#673AB7', '#9C27B0'], borderWidth: 3, animated: true,  style: 'glow' },
  frame4:  { colors: ['#00BCD4', '#0097A7', '#00E5FF'], borderWidth: 4, animated: true,  style: 'spin' },
  frame5:  { colors: ['#FF4500', '#FF6B35', '#FF4500'], borderWidth: 4, animated: true,  style: 'glow' },
  frame6:  { colors: ['#4CAF50', '#66BB6A', '#4CAF50'], borderWidth: 3, animated: true,  style: 'glow' },
  frame7:  { colors: ['#E91E8C', '#9C27B0', '#3F51B5'], borderWidth: 4, animated: true,  style: 'spin' },
  frame8:  { colors: ['#FFFFFF', '#E0E0E0', '#FFFFFF'], borderWidth: 3, animated: false, style: 'solid' },
  frame9:  { colors: ['#03A9F4', '#00BCD4', '#29B6F6'], borderWidth: 4, animated: true,  style: 'spin' },
  frame10: { colors: ['#1A237E', '#283593', '#3949AB'], borderWidth: 4, animated: true,  style: 'glow' },
  frame11: { colors: ['#E53935', '#F44336', '#EF5350'], borderWidth: 3, animated: true,  style: 'pulse_border' },
  frame12: { colors: ['#4FC3F7', '#81D4FA', '#B3E5FC'], borderWidth: 3, animated: true,  style: 'glow' },

  // ── VIP Frames ──
  vip1:  { colors: ['#FFD700', '#FF9800', '#FFD700', '#E91E8C'], borderWidth: 5, animated: true, style: 'vip_glow',     topDecor: '⭐' },
  vip2:  { colors: ['#E91E8C', '#FF4081', '#F06292'],            borderWidth: 5, animated: true, style: 'vip_glow',     topDecor: '🩷' },
  vip3:  { colors: ['#9C27B0', '#CE93D8', '#7B1FA2'],            borderWidth: 5, animated: true, style: 'vip_glow',     topDecor: '💜' },
  vip4:  { colors: ['#2196F3', '#64B5F6', '#1976D2'],            borderWidth: 5, animated: true, style: 'vip_glow',     topDecor: '💙' },
  vip5:  { colors: ['#4CAF50', '#A5D6A7', '#388E3C'],            borderWidth: 5, animated: true, style: 'vip_glow',     topDecor: '💚' },
  vip6:  { colors: ['#FF6D00', '#FFB300', '#FF8F00'],            borderWidth: 5, animated: true, style: 'vip_glow',     topDecor: '🧡' },
  vip7:  { colors: ['#00BCD4', '#80DEEA', '#0097A7'],            borderWidth: 5, animated: true, style: 'diamond_glow', topDecor: '💎' },
  vip8:  { colors: ['#F44336', '#EF9A9A', '#B71C1C'],            borderWidth: 5, animated: true, style: 'fire_glow',    topDecor: '🔥' },
  vip9:  { colors: ['#FF4500', '#FFD700', '#FF4500'],            borderWidth: 5, animated: true, style: 'double_spin',  topDecor: '🌀' },
  vip10: { colors: ['#E91E8C', '#9C27B0', '#3F51B5', '#00BCD4'], borderWidth: 5, animated: true, style: 'rainbow',     topDecor: '🌈' },
  vip11: { colors: ['#FFF176', '#FFD600', '#F9A825'],            borderWidth: 4, animated: true, style: 'vip_glow',     topDecor: '✨' },
  vip12: { colors: ['#B39DDB', '#7E57C2', '#512DA8'],            borderWidth: 5, animated: true, style: 'diamond_glow', topDecor: '🔮' },
  vip13: { colors: ['#FF80AB', '#FF4081', '#F50057'],            borderWidth: 5, animated: true, style: 'pulse_border', topDecor: '💗' },
  vip14: { colors: ['#18FFFF', '#00E5FF', '#00B8D4'],            borderWidth: 5, animated: true, style: 'spin',         topDecor: '🌊' },
  vip15: { colors: ['#CCFF90', '#76FF03', '#64DD17'],            borderWidth: 4, animated: true, style: 'glow',         topDecor: '🍀' },
  vip16: { colors: ['#FF6E40', '#FF3D00', '#DD2C00'],            borderWidth: 5, animated: true, style: 'fire_glow',    topDecor: '🔶' },
  vip17: { colors: ['#84FFFF', '#18FFFF', '#00E5FF'],            borderWidth: 5, animated: true, style: 'diamond_glow', topDecor: '🔷' },
  vip18: { colors: ['#F48FB1', '#F06292', '#EC407A'],            borderWidth: 4, animated: true, style: 'vip_glow',     topDecor: '🌸' },
  vip19: { colors: ['#FFD180', '#FFAB40', '#FF6D00'],            borderWidth: 5, animated: true, style: 'double_spin',  topDecor: '🏆' },
  vip20: { colors: ['#A5D6A7', '#66BB6A', '#2E7D32'],            borderWidth: 4, animated: true, style: 'glow',         topDecor: '🌿' },

  // ── Special / Decorative ──
  frame_vip:    { colors: ['#FFD700', '#FF9800', '#FFD700', '#E91E8C'], borderWidth: 5, animated: true, style: 'crown_decor', topDecor: '👑' },
  frame_laurel: { colors: ['#9C27B0', '#E91E8C', '#FFD700'],           borderWidth: 5, animated: true, style: 'laurel',      topDecor: '🔴' },
  frame_star:   { colors: ['#FFD700', '#FFA000'],                       borderWidth: 4, animated: true, style: 'star_burst',  topDecor: '⭐' },
  frame_galaxy: { colors: ['#1A237E', '#7B1FA2', '#00BCD4'],           borderWidth: 5, animated: true, style: 'galaxy',      topDecor: '🌌' },
  frame_owner:  { colors: ['#FF4500', '#FFD700', '#FF4500'],           borderWidth: 6, animated: true, style: 'owner_crown', topDecor: '👑' },

  // ── RARE frames (ultra limited) ──
  rare_divine:  { colors: ['#FFFFFF', '#E0E0FF', '#B0C4FF', '#FFFFFF'], borderWidth: 6, animated: true, style: 'divine_glow',  topDecor: '✨' },
  rare_eternal: { colors: ['#C0C0C0', '#FFD700', '#C0C0C0'],           borderWidth: 6, animated: true, style: 'eternal_spin', topDecor: '♾️' },
  rare_nebula:  { colors: ['#7C4DFF', '#00E5FF', '#E040FB', '#7C4DFF'], borderWidth: 6, animated: true, style: 'rainbow',     topDecor: '🌌' },
  rare_dragon:  { colors: ['#1C1C1C', '#0D47A1', '#1565C0'],           borderWidth: 7, animated: true, style: 'dragon_frame', topDecor: '🐲' },
};

export const VIP_FRAMES = Object.keys(FRAME_CONFIGS).filter(k =>
  k.startsWith('vip') || k.startsWith('frame_') || k.startsWith('rare_')
);

export interface GiftFrameItem {
  id: string;
  name: string;
  emoji: string;
  colors: string[];
}

// Human-readable names for all giftable frames (Arabic)
const FRAME_NAMES: Record<string, string> = {
  vip1: 'إطار VIP ذهبي', vip2: 'إطار VIP وردي', vip3: 'إطار VIP بنفسجي',
  vip4: 'إطار VIP أزرق', vip5: 'إطار VIP أخضر', vip6: 'إطار VIP برتقالي',
  vip7: 'إطار الماس المضيء', vip8: 'إطار الجحيم الملتهب', vip9: 'إطار الدوامة المزدوجة',
  vip10: 'إطار قوس قزح', vip11: 'إطار النجوم اللامعة', vip12: 'إطار الكريستال السحري',
  vip13: 'إطار القلب النابض', vip14: 'إطار أمواج المحيط', vip15: 'إطار الربيع الأخضر',
  vip16: 'إطار اللهب المتقد', vip17: 'إطار الماس الأزرق', vip18: 'إطار زهرة الكرز',
  vip19: 'إطار البطولة الذهبية', vip20: 'إطار الغابة السحرية',
  frame_vip: 'إطار التاج الذهبي', frame_laurel: 'إطار إكليل الغار',
  frame_star: 'إطار النجمة الملتهبة', frame_galaxy: 'إطار المجرة',
  frame_owner: 'إطار المالك الأسطوري',
  rare_divine: 'إطار إلهي ✨', rare_eternal: 'إطار الخلود ♾️',
  rare_nebula: 'إطار السديم 🌌', rare_dragon: 'التنين الأسود 🐲',
};

export const GIFT_FRAMES_DATA: GiftFrameItem[] = VIP_FRAMES.map(id => ({
  id,
  name: FRAME_NAMES[id] || id,
  emoji: FRAME_CONFIGS[id]?.topDecor || '🎁',
  colors: FRAME_CONFIGS[id]?.colors || ['#FFD700', '#9C27B0'],
}));

export interface NameColorItem {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export const GLOWING_NAME_COLORS: NameColorItem[] = [
  { id: 'gold',   name: 'ذهبي',     color: '#FFD700', emoji: '🌟' },
  { id: 'pink',   name: 'وردي',     color: '#FF69B4', emoji: '🩷' },
  { id: 'purple', name: 'بنفسجي',  color: '#9C27B0', emoji: '💜' },
  { id: 'cyan',   name: 'سماوي',   color: '#00BCD4', emoji: '💎' },
  { id: 'green',  name: 'أخضر',    color: '#4CAF50', emoji: '💚' },
  { id: 'orange', name: 'برتقالي', color: '#FF6D00', emoji: '🧡' },
  { id: 'red',    name: 'أحمر',    color: '#F44336', emoji: '❤️' },
  { id: 'white',  name: 'أبيض',    color: '#FFFFFF', emoji: '🤍' },
  { id: 'blue',   name: 'أزرق',    color: '#2196F3', emoji: '💙' },
  { id: 'teal',   name: 'زمردي',   color: '#009688', emoji: '🌊' },
  { id: 'lime',   name: 'ليموني',  color: '#CDDC39', emoji: '🍋' },
  { id: 'amber',  name: 'كهرماني', color: '#FFC107', emoji: '✨' },
];

export function AnimatedFrame({ size, frame, children }: AnimatedFrameProps) {
  const config = FRAME_CONFIGS[frame];

  // ALL animations use useNativeDriver: false to prevent Hermes native-promotion conflict.
  // Frames are avatar decorations — JS thread cost is negligible here.
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const rotateAnim  = useRef(new Animated.Value(0)).current;
  const rotate2Anim = useRef(new Animated.Value(0)).current;
  const borderAnim  = useRef(new Animated.Value(0.5)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
    rotate2Anim.setValue(0);
    borderAnim.setValue(0.5);
    glowAnim.setValue(0);

    if (!config?.animated) return;

    const animations: Animated.CompositeAnimation[] = [];

    // ── Rotation (native) ──
    const spinStyles = ['spin','double_spin','diamond_glow','star_burst','galaxy','divine_glow','dragon_frame','eternal_spin'];
    if (spinStyles.includes(config.style)) {
      const dur =
        config.style === 'double_spin'  ? 2000 :
        config.style === 'eternal_spin' ? 3000 :
        config.style === 'galaxy'       ? 6000 :
        config.style === 'divine_glow'  ? 4000 :
        config.style === 'dragon_frame' ? 2500 : 3000;
      const loop = Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: false })
      );
      loop.start();
      animations.push(loop);
    }

    // ── Counter-rotation (native) ──
    const counterStyles = ['double_spin', 'eternal_spin', 'dragon_frame'];
    if (counterStyles.includes(config.style)) {
      const dur2 =
        config.style === 'dragon_frame' ? 1800 :
        config.style === 'eternal_spin' ? 2500 : 1500;
      const loop2 = Animated.loop(
        Animated.timing(rotate2Anim, { toValue: 1, duration: dur2, easing: Easing.linear, useNativeDriver: false })
      );
      loop2.start();
      animations.push(loop2);
    }

    // ── Scale pulse (native) ──
    const pulseStyles = ['glow','pulse_border','vip_glow','owner_crown','rainbow','fire_glow','diamond_glow','crown_decor','laurel','star_burst','galaxy','divine_glow','eternal_spin','dragon_frame'];
    if (pulseStyles.includes(config.style)) {
      const dur =
        config.style === 'vip_glow'     ? 600 :
        config.style === 'owner_crown'  ? 500 :
        config.style === 'crown_decor'  ? 550 :
        config.style === 'fire_glow'    ? 400 :
        config.style === 'laurel'       ? 700 :
        config.style === 'star_burst'   ? 500 :
        config.style === 'dragon_frame' ? 450 : 900;
      const maxScale =
        config.style === 'owner_crown'  ? 1.1 :
        config.style === 'fire_glow'    ? 1.07 :
        config.style === 'dragon_frame' ? 1.08 : 1.06;
      const pLoop = Animated.loop(Animated.sequence([
        Animated.timing(scaleAnim, { toValue: maxScale, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 1,        duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]));
      pLoop.start();
      animations.push(pLoop);
    }

    // ── Border color cycle (JS) ──
    const borderStyles = ['pulse_border','vip_glow','owner_crown','crown_decor','fire_glow','laurel','dragon_frame','star_burst','rainbow','eternal_spin','divine_glow','galaxy'];
    if (borderStyles.includes(config.style)) {
      const bDur =
        config.style === 'pulse_border' ? 600 :
        config.style === 'vip_glow'     ? 400 :
        config.style === 'owner_crown'  ? 350 :
        config.style === 'crown_decor'  ? 400 :
        config.style === 'fire_glow'    ? 300 :
        config.style === 'laurel'       ? 500 :
        config.style === 'dragon_frame' ? 350 : 1200;
      const bLoop = Animated.loop(Animated.sequence([
        Animated.timing(borderAnim, { toValue: 1,   duration: bDur, useNativeDriver: false }),
        Animated.timing(borderAnim, { toValue: 0.2, duration: bDur, useNativeDriver: false }),
      ]));
      bLoop.start();
      animations.push(bLoop);
    }

    // ── Glow (JS) ──
    const glowStyles = ['vip_glow','owner_crown','fire_glow','diamond_glow','rainbow','crown_decor','laurel','galaxy','divine_glow','dragon_frame'];
    if (glowStyles.includes(config.style)) {
      const gLoop = Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]));
      gLoop.start();
      animations.push(gLoop);
    }

    return () => animations.forEach(a => a.stop());
  }, [frame]);

  if (!config) return <>{children}</>;

  const borderRadius = size / 2 + config.borderWidth + 2;
  const frameSize   = size + config.borderWidth * 2 + 4;

  // Interpolated values
  const rotate  = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rotate2 = rotate2Anim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  const borderColor = borderAnim.interpolate({
    inputRange: [0.2, 0.6, 1],
    outputRange: [
      config.colors[0] + '88',
      config.colors[1] || config.colors[0],
      config.colors[2] || config.colors[0],
    ],
  });

  // ── SOLID ──
  if (!config.animated || config.style === 'solid') {
    return (
      <View style={{
        borderRadius,
        borderWidth: config.borderWidth,
        borderColor: config.colors[0],
        shadowColor: config.colors[0],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
      }}>
        {children}
      </View>
    );
  }

  // ── CROWN DECOR ──
  if (config.style === 'crown_decor') {
    const bc = borderAnim.interpolate({
      inputRange: [0.2, 1],
      outputRange: [config.colors[0] + '66', config.colors[1] || config.colors[0]],
    });
    return (
      <View style={{ alignItems: 'center' }}>
        {config.topDecor ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: -10, zIndex: 2 }}>
            <Text style={{ fontSize: size * 0.25 }}>{config.topDecor}</Text>
          </Animated.View>
        ) : null}
        <Animated.View style={{
          borderRadius,
          borderWidth: config.borderWidth,
          borderColor: bc,
          elevation: Platform.OS === 'android' ? 12 : 0,
          shadowColor: config.colors[0],
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 14,
          shadowOpacity: Platform.OS === 'ios' ? 0.8 : 0,
        }}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {children}
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  // ── LAUREL WREATH ──
  if (config.style === 'laurel') {
    const bc = borderAnim.interpolate({
      inputRange: [0.2, 0.6, 1],
      outputRange: [config.colors[0], config.colors[1], config.colors[2] || config.colors[0]],
    });
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: -12, zIndex: 3 }}>
          <Text style={{
            fontSize: size * 0.28,
            textShadowColor: config.colors[0],
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }}>
            {config.topDecor || '🔴'}
          </Text>
        </Animated.View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginRight: -6, zIndex: 2 }}>
            <Text style={{ fontSize: size * 0.22, opacity: 0.9 }}>🌿</Text>
          </Animated.View>
          <Animated.View style={{
            borderRadius,
            borderWidth: config.borderWidth,
            borderColor: bc,
            elevation: Platform.OS === 'android' ? 14 : 0,
            shadowColor: config.colors[0],
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 16,
            shadowOpacity: Platform.OS === 'ios' ? 0.9 : 0,
          }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {children}
            </Animated.View>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginLeft: -6, zIndex: 2 }}>
            <Text style={{ fontSize: size * 0.22, opacity: 0.9 }}>🌿</Text>
          </Animated.View>
        </View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: -12, zIndex: 3 }}>
          <Text style={{ fontSize: size * 0.2 }}>💎</Text>
        </Animated.View>
      </View>
    );
  }

  // ── STAR BURST ──
  if (config.style === 'star_burst') {
    const bc = borderAnim.interpolate({
      inputRange: [0.2, 1],
      outputRange: [config.colors[0] + '77', config.colors[1] || config.colors[0]],
    });
    return (
      <View style={{ alignItems: 'center' }}>
        {config.topDecor ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: -8, zIndex: 2 }}>
            <Text style={{ fontSize: size * 0.22 }}>{config.topDecor}</Text>
          </Animated.View>
        ) : null}
        <View style={{ width: frameSize, height: frameSize, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{
            position: 'absolute',
            width: frameSize,
            height: frameSize,
            borderRadius,
            borderWidth: 2,
            borderTopColor: config.colors[0],
            borderRightColor: 'transparent',
            borderBottomColor: config.colors[0],
            borderLeftColor: 'transparent',
            transform: [{ rotate }],
          }} />
          <Animated.View style={{
            borderRadius,
            borderWidth: config.borderWidth - 1,
            borderColor: bc,
            elevation: Platform.OS === 'android' ? 10 : 0,
          }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {children}
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── GALAXY ──
  if (config.style === 'galaxy') {
    const bc = borderAnim.interpolate({
      inputRange: [0.2, 0.6, 1],
      outputRange: [config.colors[0], config.colors[1], config.colors[2] || config.colors[0]],
    });
    return (
      <View style={{ alignItems: 'center' }}>
        {config.topDecor ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: -6, zIndex: 2 }}>
            <Text style={{ fontSize: size * 0.22 }}>{config.topDecor}</Text>
          </Animated.View>
        ) : null}
        <View style={{ width: frameSize + 6, height: frameSize + 6, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{
            position: 'absolute',
            width: frameSize + 6,
            height: frameSize + 6,
            borderRadius: borderRadius + 3,
            borderWidth: 2,
            borderTopColor: config.colors[2] || config.colors[0],
            borderRightColor: config.colors[0],
            borderBottomColor: config.colors[1],
            borderLeftColor: config.colors[2] || config.colors[0],
            transform: [{ rotate }],
          }} />
          <Animated.View style={{
            borderRadius,
            borderWidth: config.borderWidth,
            borderColor: bc,
            elevation: Platform.OS === 'android' ? 14 : 0,
          }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {children}
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── DIVINE GLOW (rare) ──
  if (config.style === 'divine_glow') {
    const bc = borderAnim.interpolate({
      inputRange: [0.2, 0.5, 0.8, 1],
      outputRange: [
        config.colors[0] + '55',
        config.colors[1],
        config.colors[2] || config.colors[0],
        config.colors[0],
      ],
    });
    return (
      <View style={{ alignItems: 'center' }}>
        {config.topDecor ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: -8, zIndex: 3 }}>
            <Text style={{
              fontSize: size * 0.28,
              textShadowColor: '#B0C4FF',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }}>
              {config.topDecor}
            </Text>
          </Animated.View>
        ) : null}
        <View style={{ width: frameSize + 8, height: frameSize + 8, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{
            position: 'absolute',
            width: frameSize + 8,
            height: frameSize + 8,
            borderRadius: borderRadius + 4,
            borderWidth: 2,
            borderTopColor: '#FFFFFF99',
            borderRightColor: '#B0C4FF88',
            borderBottomColor: '#FFFFFF99',
            borderLeftColor: '#B0C4FF88',
            transform: [{ rotate }],
          }} />
          <Animated.View style={{
            borderRadius,
            borderWidth: config.borderWidth,
            borderColor: bc,
            elevation: Platform.OS === 'android' ? 20 : 0,
            shadowColor: '#FFFFFF',
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 20,
            shadowOpacity: Platform.OS === 'ios' ? 1 : 0,
          }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {children}
            </Animated.View>
          </Animated.View>
        </View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: -8, flexDirection: 'row' }}>
          {['✨', '✨', '✨'].map((s, i) => (
            <Text key={i} style={{ fontSize: size * 0.12 }}>{s}</Text>
          ))}
        </Animated.View>
      </View>
    );
  }

  // ── ETERNAL SPIN (rare) ──
  if (config.style === 'eternal_spin') {
    const bc = borderAnim.interpolate({
      inputRange: [0.2, 0.6, 1],
      outputRange: [config.colors[0], config.colors[1] || config.colors[0], config.colors[2] || config.colors[0]],
    });
    return (
      <View style={{ alignItems: 'center' }}>
        {config.topDecor ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: -10, zIndex: 3 }}>
            <Text style={{
              fontSize: size * 0.3,
              textShadowColor: '#FFD700',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 12,
            }}>
              {config.topDecor}
            </Text>
          </Animated.View>
        ) : null}
        <View style={{ width: frameSize + 10, height: frameSize + 10, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{
            position: 'absolute',
            width: frameSize + 10,
            height: frameSize + 10,
            borderRadius: borderRadius + 5,
            borderWidth: 3,
            borderTopColor: '#FFD700',
            borderRightColor: '#C0C0C0',
            borderBottomColor: '#FFD700',
            borderLeftColor: '#C0C0C0',
            transform: [{ rotate }],
          }} />
          <Animated.View style={{
            position: 'absolute',
            width: frameSize + 4,
            height: frameSize + 4,
            borderRadius: borderRadius + 2,
            borderWidth: 2,
            borderTopColor: '#C0C0C0',
            borderRightColor: '#FFD700AA',
            borderBottomColor: '#C0C0C0',
            borderLeftColor: '#FFD700AA',
            transform: [{ rotate: rotate2 }],
          }} />
          <Animated.View style={{
            borderRadius,
            borderWidth: config.borderWidth,
            borderColor: bc,
            elevation: 15,
          }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {children}
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ── DRAGON FRAME (rare) ──
  if (config.style === 'dragon_frame') {
    const bc = borderAnim.interpolate({
      inputRange: [0.2, 0.6, 1],
      outputRange: [config.colors[0], config.colors[1], config.colors[2] || config.colors[0]],
    });
    return (
      <View style={{ alignItems: 'center' }}>
        {config.topDecor ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: -10, zIndex: 3 }}>
            <Text style={{
              fontSize: size * 0.3,
              textShadowColor: '#0D47A1',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 10,
            }}>
              {config.topDecor}
            </Text>
          </Animated.View>
        ) : null}
        <View style={{ width: frameSize + 10, height: frameSize + 10, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{
            position: 'absolute',
            width: frameSize + 10,
            height: frameSize + 10,
            borderRadius: borderRadius + 5,
            borderWidth: 3,
            borderTopColor: '#1565C0',
            borderRightColor: '#0D47A1',
            borderBottomColor: '#1565C0',
            borderLeftColor: '#0D47A1',
            transform: [{ rotate }],
          }} />
          <Animated.View style={{
            position: 'absolute',
            width: frameSize + 4,
            height: frameSize + 4,
            borderRadius: borderRadius + 2,
            borderWidth: 2,
            borderTopColor: '#0D47A1',
            borderRightColor: '#1565C0',
            borderBottomColor: '#0D47A1',
            borderLeftColor: '#1565C0',
            transform: [{ rotate: rotate2 }],
          }} />
          <Animated.View style={{
            borderRadius,
            borderWidth: config.borderWidth,
            borderColor: bc,
            elevation: Platform.OS === 'android' ? 18 : 0,
            shadowColor: '#0D47A1',
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 16,
            shadowOpacity: Platform.OS === 'ios' ? 0.9 : 0,
          }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              {children}
            </Animated.View>
          </Animated.View>
        </View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: -8, flexDirection: 'row' }}>
          {['🔥', '🐲', '🔥'].map((s, i) => (
            <Text key={i} style={{ fontSize: size * 0.14 }}>{s}</Text>
          ))}
        </Animated.View>
      </View>
    );
  }

  // ── DEFAULT ANIMATED RENDER (glow, spin, pulse_border, vip_glow, owner_crown, double_spin, diamond_glow, fire_glow, rainbow) ──
  const isSpinStyle = ['spin', 'double_spin', 'diamond_glow'].includes(config.style);

  return (
    <View style={{ alignItems: 'center' }}>
      {config.topDecor ? (
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: -10, zIndex: 2 }}>
          <Text style={{ fontSize: size * 0.25 }}>{config.topDecor}</Text>
        </Animated.View>
      ) : null}
      <View style={{
        width: frameSize + (isSpinStyle ? 4 : 0),
        height: frameSize + (isSpinStyle ? 4 : 0),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {config.style === 'double_spin' ? (
          <>
            <Animated.View style={{
              position: 'absolute',
              width: frameSize + 4,
              height: frameSize + 4,
              borderRadius: borderRadius + 2,
              borderWidth: 2,
              borderTopColor: config.colors[0],
              borderRightColor: 'transparent',
              borderBottomColor: config.colors[1] || config.colors[0],
              borderLeftColor: 'transparent',
              transform: [{ rotate }],
            }} />
            <Animated.View style={{
              position: 'absolute',
              width: frameSize,
              height: frameSize,
              borderRadius,
              borderWidth: 2,
              borderTopColor: 'transparent',
              borderRightColor: config.colors[1] || config.colors[0],
              borderBottomColor: 'transparent',
              borderLeftColor: config.colors[0],
              transform: [{ rotate: rotate2 }],
            }} />
          </>
        ) : null}
        <Animated.View style={{
          borderRadius,
          borderWidth: config.borderWidth,
          borderColor,
          elevation: Platform.OS === 'android' ? 10 : 0,
          shadowColor: config.colors[0],
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: Platform.OS === 'ios' ? 0.8 : 0,
          shadowRadius: 12,
        }}>
          <Animated.View style={{
            transform: [
              { scale: scaleAnim },
              ...(config.style === 'spin' ? [{ rotate }] : []),
            ],
          }}>
            {children}
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}
