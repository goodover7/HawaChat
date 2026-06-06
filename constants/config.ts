// Powered by OnSpace.AI
export const APP_CONFIG = {
  name: 'Hawa Chat',
  version: '6.0.0',
  ownerUsername: 'owner',
  ownerPassword: 'owner123',
};

// UNLIMITED levels — formula based, no cap
export const LEVEL_THRESHOLDS = [
  { level: 1, minMessages: 0, title: 'مبتدئ 🌱' },
  { level: 2, minMessages: 30, title: 'متحمس 😊' },
  { level: 3, minMessages: 100, title: 'نشيط 💪' },
  { level: 4, minMessages: 250, title: 'محترف 🎯' },
  { level: 5, minMessages: 500, title: 'خبير 🏆' },
  { level: 6, minMessages: 1000, title: 'أسطورة ⚡' },
  { level: 7, minMessages: 2000, title: 'أيقونة 🌟' },
  { level: 8, minMessages: 5000, title: 'إله الدردشة 🔥' },
  { level: 9, minMessages: 8000, title: 'نجم الكون 🌌' },
  { level: 10, minMessages: 12000, title: 'سيد الفضاء 🚀' },
  { level: 15, minMessages: 20000, title: 'ملك الأبدية 👑' },
  { level: 20, minMessages: 35000, title: 'عابر الكون 🌀' },
  { level: 30, minMessages: 60000, title: 'أسطورة الزمن ⚔️' },
  { level: 50, minMessages: 100000, title: 'إمبراطور الدردشة 🏅' },
  { level: 75, minMessages: 200000, title: 'أسطوري لا يُهزم 💎' },
  { level: 100, minMessages: 500000, title: 'خالد الدردشة 🔮' },
  // After level 100: every 5000 messages = +1 level (unlimited)
];

export const GIFTS = [
  { id: 'g1', name: 'قلب', emoji: '❤️', cost: 10 },
  { id: 'g2', name: 'وردة', emoji: '🌹', cost: 20 },
  { id: 'g3', name: 'نجمة', emoji: '⭐', cost: 30 },
  { id: 'g4', name: 'تاج', emoji: '👑', cost: 100 },
  { id: 'g5', name: 'ماسة', emoji: '💎', cost: 200 },
  { id: 'g6', name: 'صاروخ', emoji: '🚀', cost: 50 },
  { id: 'g7', name: 'كعكة', emoji: '🎂', cost: 40 },
  { id: 'g8', name: 'هدية', emoji: '🎁', cost: 25 },
  { id: 'g9', name: 'قبلة', emoji: '💋', cost: 60 },
  { id: 'g10', name: 'شمبانيا', emoji: '🍾', cost: 150 },
  { id: 'g11', name: 'يخت', emoji: '🛥️', cost: 500 },
  { id: 'g12', name: 'قصر', emoji: '🏰', cost: 1000 },
  { id: 'g13', name: 'طائرة', emoji: '✈️', cost: 800 },
  { id: 'g14', name: 'سيارة فارهة', emoji: '🏎️', cost: 600 },
  { id: 'g15', name: 'ألماس', emoji: '💠', cost: 300 },
  { id: 'g16', name: 'قمر', emoji: '🌙', cost: 80 },
  { id: 'g17', name: 'كنز', emoji: '💰', cost: 400 },
  { id: 'g18', name: 'زهرة', emoji: '🌺', cost: 35 },
];

export const STORE_ITEMS = [
  // ── إطارات متحركة (12 إطار) ─────────────────────────────────────────
  { id: 'frame1', name: 'إطار ذهبي', type: 'frame', emoji: '🟡', description: 'إطار ذهبي لامع ثابت', cost: 500, color: '#FFD700' },
  { id: 'frame2', name: 'إطار وردي متوهج', type: 'frame', emoji: '🩷', description: 'إطار وردي متحرك بتوهج', cost: 350, color: '#FF69B4' },
  { id: 'frame3', name: 'إطار ملكي بنفسجي', type: 'frame', emoji: '💜', description: 'توهج بنفسجي فاخر', cost: 420, color: '#9C27B0' },
  { id: 'frame4', name: 'إطار ماسي دوار', type: 'frame', emoji: '💎', description: 'دوران لانهائي بألوان الماس', cost: 1200, color: '#00BCD4' },
  { id: 'frame5', name: 'إطار ناري متوهج', type: 'frame', emoji: '🔥', description: 'توهج ناري ساخن', cost: 800, color: '#FF4500' },
  { id: 'frame6', name: 'إطار أخضر فلوري', type: 'frame', emoji: '💚', description: 'توهج أخضر مضيء', cost: 380, color: '#4CAF50' },
  { id: 'frame7', name: 'إطار قوس قزح', type: 'frame', emoji: '🌈', description: 'دوران متعدد الألوان', cost: 1500, color: '#E91E8C' },
  { id: 'frame8', name: 'إطار فضي نقي', type: 'frame', emoji: '⚪', description: 'إطار فضي أنيق ثابت', cost: 280, color: '#B0BEC5' },
  { id: 'frame9', name: 'إطار كهربائي أزرق', type: 'frame', emoji: '⚡', description: 'توهج كهربائي مذهل', cost: 950, color: '#03A9F4' },
  { id: 'frame10', name: 'إطار الكون المظلم', type: 'frame', emoji: '🌌', description: 'توهج كوني غامض', cost: 1800, color: '#1A237E' },
  { id: 'frame11', name: 'إطار الوردة الحمراء', type: 'frame', emoji: '🌹', description: 'توهج أحمر رومانسي', cost: 600, color: '#E53935' },
  { id: 'frame12', name: 'إطار الثلج الأزرق', type: 'frame', emoji: '❄️', description: 'وميض جليدي رائع', cost: 720, color: '#4FC3F7' },
  // ── إطارات VIP حصرية (10 إطار) ────────────────────────────────────
  { id: 'vip1', name: 'VIP ذهبي ملكي', type: 'frame', emoji: '🌟', description: 'إطار VIP بتوهج ذهبي فاخر', cost: 2500, color: '#FFD700' },
  { id: 'vip2', name: 'VIP وردي ناعم', type: 'frame', emoji: '🩷', description: 'إطار VIP بتوهج وردي رومانسي', cost: 2200, color: '#E91E8C' },
  { id: 'vip3', name: 'VIP بنفسجي حصري', type: 'frame', emoji: '💜', description: 'إطار VIP بنفسجي فائق التوهج', cost: 2800, color: '#9C27B0' },
  { id: 'vip4', name: 'VIP أزرق ملكي', type: 'frame', emoji: '💙', description: 'إطار VIP أزرق ساحر', cost: 2400, color: '#2196F3' },
  { id: 'vip5', name: 'VIP أخضر الطبيعة', type: 'frame', emoji: '💚', description: 'إطار VIP أخضر هادئ', cost: 2000, color: '#4CAF50' },
  { id: 'vip9', name: 'VIP دوار ناري', type: 'frame', emoji: '🌀', description: 'إطار VIP بدوران ناري مزدوج', cost: 3500, color: '#FF4500' },
  { id: 'vip10', name: 'VIP قوس قزح', type: 'frame', emoji: '🌈', description: 'إطار VIP بألوان قوس قزح المتغيرة', cost: 4000, color: '#E91E8C' },
  { id: 'vip7', name: 'VIP ماسي لامع', type: 'frame', emoji: '💎', description: 'إطار VIP بتوهج ماسي ودوران', cost: 3200, color: '#00BCD4' },
  { id: 'vip8', name: 'VIP لهيب أحمر', type: 'frame', emoji: '🔥', description: 'إطار VIP بلهب أحمر متقلب', cost: 3800, color: '#F44336' },
  { id: 'vip12', name: 'VIP بنفسجي ماسي', type: 'frame', emoji: '🔮', description: 'إطار VIP بنفسجي مع دوران ماسي', cost: 3000, color: '#7E57C2' },
  // ── إطارات نادرة جداً ──────────────────────────────────────────────
  { id: 'rare_divine', name: 'إطار إلهي ✨', type: 'frame', emoji: '✨', description: 'إطار إلهي مقدس نادر للغاية', cost: 9999, color: '#FFFFFF' },
  { id: 'rare_eternal', name: 'إطار الخلود ♾️', type: 'frame', emoji: '♾️', description: 'إطار الخلود الأسطوري الحصري', cost: 12000, color: '#C0C0C0' },
  { id: 'rare_nebula', name: 'إطار السديم 🌌', type: 'frame', emoji: '🌌', description: 'إطار سديمي كوني فائق النادر', cost: 15000, color: '#7C4DFF' },
  { id: 'rare_dragon', name: 'إطار التنين الأسود 🐲', type: 'frame', emoji: '🐲', description: 'تنين أسود ناري بنيران زرقاء — أندر الإطارات', cost: 20000, color: '#1C1C1C' },
  // ── شارات مميزة (14 شارة) ─────────────────────────────────────────
  { id: 'badge1', name: 'شارة النجم', type: 'badge', emoji: '🌟', description: 'نجمة مميزة بجانب اسمك', cost: 200, color: '#FFD700' },
  { id: 'badge2', name: 'شارة القلب', type: 'badge', emoji: '💖', description: 'شارة قلب رومانسية', cost: 150, color: '#E91E8C' },
  { id: 'badge3', name: 'شارة الماسة', type: 'badge', emoji: '💎', description: 'ماسة نادرة للنخبة', cost: 900, color: '#00BCD4' },
  { id: 'badge4', name: 'شارة النار', type: 'badge', emoji: '🔥', description: 'للأعضاء الأكثر نشاطاً', cost: 350, color: '#FF4500' },
  { id: 'badge5', name: 'شارة التاج', type: 'badge', emoji: '👑', description: 'شارة حصرية للملوك', cost: 2000, color: '#FFD700' },
  { id: 'badge6', name: 'شارة الصاروخ', type: 'badge', emoji: '🚀', description: 'للصاعدين بسرعة', cost: 280, color: '#2196F3' },
  { id: 'badge7', name: 'شارة الكوكب', type: 'badge', emoji: '🪐', description: 'لمن يطوف الكون', cost: 750, color: '#9C27B0' },
  { id: 'badge8', name: 'شارة الجوكر', type: 'badge', emoji: '🃏', description: 'للمرحين وصانعي البهجة', cost: 320, color: '#FF9800' },
  { id: 'badge9', name: 'شارة الذئب', type: 'badge', emoji: '🐺', description: 'الذئب المنفرد', cost: 440, color: '#607D8B' },
  { id: 'badge10', name: 'شارة الأسد', type: 'badge', emoji: '🦁', description: 'ملك الغابة الرقمية', cost: 600, color: '#FF8F00' },
  { id: 'badge11', name: 'شارة الموثَّق', type: 'badge', emoji: '✅', description: 'حساب موثَّق رسمياً', cost: 0, color: '#1DA1F2' },
  { id: 'badge12', name: 'شارة الملاك', type: 'badge', emoji: '👼', description: 'روح بيضاء نقية', cost: 480, color: '#B39DDB' },
  { id: 'badge13', name: 'شارة السيف', type: 'badge', emoji: '⚔️', description: 'المحارب الشجاع', cost: 520, color: '#90A4AE' },
  { id: 'badge14', name: 'شارة القمر', type: 'badge', emoji: '🌙', description: 'ليلي ورومانسي', cost: 260, color: '#7986CB' },
  // ── ألوان أسماء (10 لون) ───────────────────────────────────────────
  { id: 'color1', name: 'اسم ذهبي', type: 'nameColor', emoji: '✨', description: 'يتلألأ بالذهب', cost: 600, color: '#FFD700' },
  { id: 'color2', name: 'اسم وردي', type: 'nameColor', emoji: '🌸', description: 'وردي أنيق', cost: 400, color: '#E91E8C' },
  { id: 'color3', name: 'اسم سماوي', type: 'nameColor', emoji: '💙', description: 'أزرق سماوي', cost: 350, color: '#00BCD4' },
  { id: 'color4', name: 'اسم ناري', type: 'nameColor', emoji: '🧡', description: 'برتقالي ناري', cost: 500, color: '#FF4500' },
  { id: 'color5', name: 'اسم أخضر', type: 'nameColor', emoji: '💚', description: 'أخضر مريح', cost: 300, color: '#4CAF50' },
  { id: 'color6', name: 'اسم بنفسجي', type: 'nameColor', emoji: '💜', description: 'بنفسجي ملكي', cost: 450, color: '#9C27B0' },
  { id: 'color7', name: 'اسم قرمزي', type: 'nameColor', emoji: '❤️', description: 'أحمر قاتل', cost: 550, color: '#C62828' },
  { id: 'color8', name: 'اسم فيروزي', type: 'nameColor', emoji: '🩵', description: 'فيروزي نادر', cost: 480, color: '#00897B' },
  { id: 'color9', name: 'اسم أبيض مُضيء', type: 'nameColor', emoji: '🤍', description: 'نقاء لامع', cost: 320, color: '#ECEFF1' },
  { id: 'color10', name: 'اسم وردي فاتح', type: 'nameColor', emoji: '🩷', description: 'وردي حالم', cost: 280, color: '#F48FB1' },
  // ── حزم خاصة (8 حزمة) ────────────────────────────────────────────
  { id: 'bundle_starter', name: '📦 حزمة المبتدئ', type: 'bundle', emoji: '📦', description: 'إطار ذهبي + شارة نجمة + اسم ذهبي', cost: 999, color: '#FFD700' },
  { id: 'bundle_vip', name: '💎 حزمة VIP', type: 'bundle', emoji: '💎', description: 'إطار VIP ذهبي + شارة التاج + اسم ناري', cost: 4999, color: '#FF9800' },
  { id: 'bundle_lover', name: '❤️ حزمة العاشق', type: 'bundle', emoji: '❤️', description: 'إطار وردي + شارة قلب + اسم وردي', cost: 799, color: '#E91E8C' },
  { id: 'bundle_fire', name: '🔥 حزمة الناري', type: 'bundle', emoji: '🔥', description: 'إطار ناري + شارة نار + اسم ناري', cost: 1499, color: '#FF4500' },
  { id: 'bundle_king', name: '👑 حزمة الملك', type: 'bundle', emoji: '👑', description: 'إطار كون مظلم + شارة تاج + اسم ذهبي', cost: 3499, color: '#1A237E' },
  { id: 'bundle_galaxy', name: '🌌 حزمة المجرة', type: 'bundle', emoji: '🌌', description: 'إطار قوس قزح VIP + اسم بنفسجي + شارة كوكب', cost: 5999, color: '#9C27B0' },
  { id: 'bundle_ice', name: '❄️ حزمة الجليد', type: 'bundle', emoji: '❄️', description: 'إطار ثلجي + اسم سماوي + شارة نجم', cost: 1299, color: '#4FC3F7' },
  { id: 'bundle_elite', name: '⚡ حزمة النخبة', type: 'bundle', emoji: '⚡', description: 'إطار ماسي دوار VIP + كل ألوان الأسماء', cost: 8888, color: '#00BCD4' },
  // ── تعزيزات (8 تعزيز) ─────────────────────────────────────────────
  { id: 'boost_coins100', name: '💰 100 عملة', type: 'boost', emoji: '💰', description: 'احصل على 100 عملة فوراً', cost: 0, color: '#FFD700' },
  { id: 'boost_coins500', name: '💰 500 عملة', type: 'boost', emoji: '💰', description: 'احصل على 500 عملة فوراً', cost: 0, color: '#FFD700' },
  { id: 'boost_double', name: '⚡ مضاعف العملات ×2', type: 'boost', emoji: '⚡', description: 'ضاعف عملاتك لمدة 24 ساعة', cost: 1000, color: '#FF9800' },
  { id: 'boost_vip_daily', name: '🌟 وضع VIP يومي', type: 'boost', emoji: '🌟', description: 'ظهور VIP خاص لمدة يوم', cost: 800, color: '#FFD700' },
  { id: 'boost_top10', name: '🏆 بطاقة المتصدرين', type: 'boost', emoji: '🏆', description: 'اظهر في أعلى قائمة النشاط', cost: 600, color: '#FF9800' },
  { id: 'boost_invisible', name: '🕵️ وضع التخفي', type: 'boost', emoji: '🕵️', description: 'تصفح دون أن يراك أحد لساعة', cost: 300, color: '#607D8B' },
  { id: 'boost_rename', name: '✏️ تغيير الاسم مجاناً', type: 'boost', emoji: '✏️', description: 'غيّر اسمك مرة واحدة', cost: 150, color: '#2196F3' },
  { id: 'boost_highlight', name: '✨ تمييز الرسائل', type: 'boost', emoji: '✨', description: 'رسائلك تتميز بخلفية ذهبية لمدة ساعة', cost: 400, color: '#FDD835' },
  // ── مستلزمات البروفايل (8 عناصر) ───────────────────────────────────
  { id: 'bg_galaxy', name: '🌌 خلفية المجرة', type: 'background', emoji: '🌌', description: 'خلفية بروفايل مجرية رائعة', cost: 700, color: '#1A237E' },
  { id: 'bg_sunset', name: '🌅 خلفية الغروب', type: 'background', emoji: '🌅', description: 'ألوان غروب الشمس الدافئة', cost: 500, color: '#FF7043' },
  { id: 'bg_ocean', name: '🌊 خلفية المحيط', type: 'background', emoji: '🌊', description: 'هدوء المحيط وزرقته', cost: 550, color: '#0288D1' },
  { id: 'bg_forest', name: '🌿 خلفية الغابة', type: 'background', emoji: '🌿', description: 'خضرة الغابة الهادئة', cost: 480, color: '#2E7D32' },
  { id: 'bg_fire', name: '🔥 خلفية اللهب', type: 'background', emoji: '🔥', description: 'ألوان النار الحارة', cost: 650, color: '#BF360C' },
  { id: 'bg_purple', name: '💜 خلفية الملكية', type: 'background', emoji: '💜', description: 'بنفسجي ملكي فاخر', cost: 600, color: '#4A148C' },
  { id: 'bg_rose', name: '🌹 خلفية الورد', type: 'background', emoji: '🌹', description: 'وردي رومانسي ناعم', cost: 520, color: '#880E4F' },
  { id: 'bg_night', name: '🌙 خلفية الليل', type: 'background', emoji: '🌙', description: 'سكون الليل الغامض', cost: 580, color: '#0D0D2B' },
  // ── ملصقات (10 ملصق) ──────────────────────────────────────────────
  { id: 'sticker_heart', name: '💓 ملصق القلوب', type: 'sticker', emoji: '💓', description: 'مجموعة ملصقات قلوب رومانسية (10 ملصق)', cost: 200, color: '#E91E8C' },
  { id: 'sticker_fire', name: '🔥 ملصق النار', type: 'sticker', emoji: '🔥', description: 'ملصقات نارية حماسية (10 ملصق)', cost: 200, color: '#FF4500' },
  { id: 'sticker_cute', name: '🐱 ملصق كيوت', type: 'sticker', emoji: '🐱', description: 'ملصقات كيوت ولطيفة (10 ملصق)', cost: 180, color: '#FFB74D' },
  { id: 'sticker_sad', name: '😢 ملصق الحزن', type: 'sticker', emoji: '😢', description: 'عبّر عن مشاعرك (8 ملصق)', cost: 150, color: '#7986CB' },
  { id: 'sticker_funny', name: '😂 ملصق الضحك', type: 'sticker', emoji: '😂', description: 'ملصقات مضحكة وطريفة (12 ملصق)', cost: 220, color: '#FF9800' },
  { id: 'sticker_vip', name: '⭐ ملصق VIP', type: 'sticker', emoji: '⭐', description: 'ملصقات VIP حصرية (5 ملصق)', cost: 500, color: '#FFD700' },
  { id: 'sticker_love', name: '💝 ملصق الحب', type: 'sticker', emoji: '💝', description: 'أروع ملصقات الحب والعشق (10 ملصق)', cost: 250, color: '#C2185B' },
  { id: 'sticker_angry', name: '😡 ملصق الغضب', type: 'sticker', emoji: '😡', description: 'للتعبير عن الغضب (8 ملصق)', cost: 160, color: '#D32F2F' },
  { id: 'sticker_cool', name: '😎 ملصق البارد', type: 'sticker', emoji: '😎', description: 'ملصقات للشخصيات الكول (10 ملصق)', cost: 230, color: '#455A64' },
  { id: 'sticker_ramadan', name: '🌙 ملصق رمضان', type: 'sticker', emoji: '🌙', description: 'ملصقات رمضانية مباركة (12 ملصق)', cost: 300, color: '#1B5E20' },
  // ── اشتراكات VIP (4 اشتراك) ────────────────────────────────────────
  { id: 'sub_weekly', name: '🌟 VIP أسبوعي', type: 'subscription', emoji: '🌟', description: 'اشتراك VIP أسبوعي مع كل المميزات', cost: 1500, color: '#FFD700' },
  { id: 'sub_monthly', name: '💎 VIP شهري', type: 'subscription', emoji: '💎', description: 'اشتراك VIP شهري بخصم 30%', cost: 4500, color: '#FF9800' },
  { id: 'sub_premium', name: '👑 Premium شهري', type: 'subscription', emoji: '👑', description: 'الباقة الملكية مع إطار خاص', cost: 8000, color: '#FF4500' },
  { id: 'sub_elite', name: '⚡ Elite سنوي', type: 'subscription', emoji: '⚡', description: 'اشتراك النخبة سنوي — خصم 50%', cost: 25000, color: '#9C27B0' },
];

export const BANNED_WORDS = ['كلمة1', 'كلمة2', 'سب', 'شتم'];

export const DEFAULT_ROOMS = [
  { id: 'room1', name: '💬 الغرفة الرئيسية', description: 'غرفة الدردشة العامة', isDefault: true },
  { id: 'room2', name: '❤️ غرفة التعارف', description: 'للتعارف والصداقة' },
  { id: 'room3', name: '🎮 غرفة الترفيه', description: 'ألعاب ونكت وترفيه' },
  { id: 'room4', name: '🌹 غرفة الرومانسية', description: 'لمحبي الحب والرومانسية' },
  { id: 'room5', name: '📰 حائط الأخبار', description: 'أحداث وإعلانات الإدارة' },
];

export const RANK_LIST = [
  'newbie', 'member', 'distinguished', 'worthy', 'star',
  'vip_char', 'vip', 'chat_legend',
  'room_supervisor', 'room_manager', 'room_owner',
  'moderator', 'guardian', 'general_supervisor',
  'admin', 'legend', 'high_admin',
];

export const ASSIGNABLE_RANKS = RANK_LIST;
export const VERIFICATION_BADGE = '✅';

export const MUTE_DURATIONS = [
  { label: '1 دقيقة', minutes: 1 },
  { label: '5 دقائق', minutes: 5 },
  { label: '10 دقائق', minutes: 10 },
  { label: '15 دقيقة', minutes: 15 },
  { label: '30 دقيقة', minutes: 30 },
  { label: 'ساعة', minutes: 60 },
  { label: '3 ساعات', minutes: 180 },
  { label: '12 ساعة', minutes: 720 },
  { label: 'يوم كامل', minutes: 1440 },
  { label: 'دائم', minutes: -1 },
];

// Bot mute durations (owner-configurable)
export const BOT_MUTE_DURATIONS = [
  { label: '30 ثانية', seconds: 30 },
  { label: '1 دقيقة', seconds: 60 },
  { label: '2 دقيقة', seconds: 120 },
  { label: '5 دقائق', seconds: 300 },
  { label: '10 دقائق', seconds: 600 },
  { label: '30 دقيقة', seconds: 1800 },
];

export const BOT_SETTINGS_KEY = 'hawa_bot_settings_v2';
