// Powered by OnSpace.AI
export const Colors = {
  dark: {
    primary: '#E91E8C',
    primaryLight: '#FF6BB5',
    primaryDark: '#AD1457',
    secondary: '#9C27B0',
    secondaryLight: '#CE93D8',
    accent: '#FFD700',
    background: '#0D0D1A',
    surface: '#1A1A2E',
    surfaceElevated: '#252540',
    surfaceCard: '#1E1E35',
    border: '#2A2A4A',
    text: '#FFFFFF',
    textSecondary: '#B0B0CC',
    textMuted: '#6060A0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    online: '#4CAF50',
    offline: '#666688',
    vip: '#FFD700',
    owner: '#FF4500',
    admin: '#E91E8C',
    moderator: '#9C27B0',
    guardian: '#00BCD4',
    star: '#FF9800',
    legend: '#FF6B35',
    member: '#B0B0CC',
    newbie: '#78909C',
    // new ranks
    high_admin: '#FFD700',
    general_supervisor: '#90A4AE',
    room_owner: '#F44336',
    room_manager: '#FF9800',
    room_supervisor: '#26C6DA',
    chat_legend: '#EF5350',
    vip_char: '#AB47BC',
    worthy: '#FDD835',
    distinguished: '#29B6F6',
  },
  light: {
    primary: '#E91E8C',
    primaryLight: '#FF6BB5',
    primaryDark: '#AD1457',
    secondary: '#9C27B0',
    secondaryLight: '#CE93D8',
    accent: '#FF8C00',
    background: '#F8F0FF',
    surface: '#FFFFFF',
    surfaceElevated: '#F3E5F5',
    surfaceCard: '#FFFFFF',
    border: '#E1BEF0',
    text: '#1A0033',
    textSecondary: '#5C3D7A',
    textMuted: '#9B7DB5',
    success: '#2E7D32',
    warning: '#E65100',
    error: '#C62828',
    info: '#1565C0',
    online: '#2E7D32',
    offline: '#9B7DB5',
    vip: '#E65100',
    owner: '#C62828',
    admin: '#AD1457',
    moderator: '#6A1B9A',
    guardian: '#00838F',
    star: '#E65100',
    legend: '#BF360C',
    member: '#5C3D7A',
    newbie: '#546E7A',
    high_admin: '#F57F17',
    general_supervisor: '#546E7A',
    room_owner: '#C62828',
    room_manager: '#E65100',
    room_supervisor: '#00838F',
    chat_legend: '#B71C1C',
    vip_char: '#6A1B9A',
    worthy: '#F57F17',
    distinguished: '#0277BD',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  body: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  small: {
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#E91E8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const RankColors: Record<string, string> = {
  // Core ranks
  owner: '#FF4500',
  legend: '#FF6B35',
  admin: '#E91E8C',
  guardian: '#00BCD4',
  moderator: '#9C27B0',
  vip: '#FFD700',
  star: '#FF9800',
  member: '#B0B0CC',
  newbie: '#78909C',
  // New ranks from the image
  high_admin: '#FFD700',         // رتبة إدارة عليا - gold star
  general_supervisor: '#90A4AE', // رتبة مشرف عام - gray shield
  room_owner: '#F44336',         // مالك غرفة - red crown shield
  room_manager: '#FF9800',       // مدير غرفة - orange star shield
  room_supervisor: '#26C6DA',    // مشرف غرفة - teal shield
  chat_legend: '#EF5350',        // أساطير الشات - red diamond
  vip_char: '#AB47BC',           // رتبة كبار الشخصيات - purple diamond
  worthy: '#FDD835',             // مميز بجدارة - yellow diamond
  distinguished: '#29B6F6',      // رتبة مميز - cyan diamond
};

export const RankLabels: Record<string, string> = {
  owner: '👑 المالك',
  legend: '🔥 أسطورة',
  admin: '🛡️ أدمن',
  guardian: '⚔️ حارس',
  moderator: '🎖️ مشرف',
  vip: '💎 VIP',
  star: '⭐ نجم',
  member: '👤 عضو',
  newbie: '🌱 جديد',
  // New ranks
  high_admin: '⭐ إدارة عليا',
  general_supervisor: '🛡️ مشرف عام',
  room_owner: '🏆 مالك غرفة',
  room_manager: '⭐ مدير غرفة',
  room_supervisor: '🛡️ مشرف غرفة',
  chat_legend: '💎 أساطير الشات',
  vip_char: '💜 كبار الشخصيات',
  worthy: '✨ مميز بجدارة',
  distinguished: '💠 رتبة مميز',
};

export const RankOrder: Record<string, number> = {
  owner: 10,
  high_admin: 9,
  legend: 8,
  admin: 7,
  general_supervisor: 6,
  guardian: 5,
  moderator: 4,
  room_owner: 4,
  room_manager: 3,
  room_supervisor: 3,
  chat_legend: 3,
  vip: 3,
  vip_char: 3,
  star: 2,
  worthy: 2,
  distinguished: 2,
  member: 1,
  newbie: 0,
};

export const RankPermissions: Record<string, string[]> = {
  owner: ['all'],
  high_admin: ['delete_messages', 'mute_timed', 'kick', 'ban', 'delete_photos', 'manage_reports', 'change_names', 'verify_accounts', 'post_news', 'change_ranks', 'change_password'],
  legend: ['delete_messages', 'mute_timed', 'kick', 'ban', 'delete_photos', 'manage_reports', 'change_names', 'verify_accounts', 'post_news'],
  admin: ['delete_messages', 'mute_timed', 'kick', 'ban', 'delete_photos', 'manage_reports', 'post_news', 'change_password_members'],
  general_supervisor: ['delete_messages', 'mute_timed', 'kick', 'ban', 'delete_photos', 'manage_reports'],
  guardian: ['delete_messages', 'mute_timed', 'kick', 'delete_photos', 'manage_reports'],
  moderator: ['delete_messages', 'mute_timed', 'delete_photos'],
  // Room-specific ranks
  room_owner: ['room_ban', 'room_mute', 'room_kick', 'room_lock'],
  room_manager: ['room_ban', 'room_mute', 'room_kick'],
  room_supervisor: ['room_mute', 'room_kick'],
  // Social ranks - no admin permissions
  chat_legend: ['send_gifts', 'private_chat', 'change_avatar', 'custom_frame'],
  vip: ['send_gifts', 'private_chat', 'change_avatar', 'custom_frame'],
  vip_char: ['send_gifts', 'private_chat', 'change_avatar', 'custom_frame'],
  star: ['send_gifts', 'private_chat', 'change_avatar'],
  worthy: ['send_gifts', 'private_chat', 'change_avatar'],
  distinguished: ['send_messages', 'private_chat', 'change_avatar'],
  member: ['send_messages', 'private_chat', 'change_avatar'],
  newbie: ['send_messages'],
};
