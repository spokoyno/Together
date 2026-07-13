import type { Locale } from "@/lib/i18n/constants";

export type Messages = {
  navHome: string;
  navPlans: string;
  navFeed: string;
  navProfile: string;
  navChat: string;
  backHome: string;
  profileSettings: string;
  profileNotifications: string;
  profileAccount: string;
  profileSettingsShort: string;
  profileNotificationsShort: string;
  profileEdit: string;
  profileEditTitle: string;
  profileName: string;
  profileGender: string;
  profileTogetherDays: string;
  profileStats: string;
  profileStatsMoods: string;
  profileStatsPlans: string;
  profileStatsMoments: string;
  profileStatsAnswers: string;
  profileWaitingPartner: string;
  profileManageInvite: string;
  profileCreatePair: string;
  profileExport: string;
  profileLeaveCouple: string;
  profileDeleteAccount: string;
  profileDeleteHint: string;
  profileSignOut: string;
  profileSave: string;
  profileSaving: string;
  profileCancel: string;
  profileColorPalette: string;
  profileLanguage: string;
  profileInstallApp: string;
  profileMarkAllRead: string;
  profileNoNotifications: string;
  profileUnread: string;
  ratingLabel: string;
  ratingNotYet: string;
  commonEmpty: string;
  commonRefresh: string;
  commonErrorSection: string;
};

export const en: Messages = {
  navHome: "Home",
  navPlans: "Plans",
  navFeed: "Activity",
  navProfile: "Profile",
  navChat: "Chat",
  backHome: "Home",
  profileSettings: "Settings",
  profileNotifications: "Notifications",
  profileAccount: "Account",
  profileSettingsShort: "Settings",
  profileNotificationsShort: "Alerts",
  profileEdit: "Edit",
  profileEditTitle: "Edit profile",
  profileName: "Name",
  profileGender: "Gender",
  profileTogetherDays: "Together {days} days",
  profileStats: "Stats",
  profileStatsMoods: "Moods",
  profileStatsPlans: "Plans",
  profileStatsMoments: "Moments",
  profileStatsAnswers: "Answers",
  profileWaitingPartner: "Waiting for partner",
  profileManageInvite: "Manage invitation",
  profileCreatePair: "Create or accept invitation",
  profileExport: "Export data",
  profileLeaveCouple: "Leave couple",
  profileDeleteAccount: "Delete account",
  profileDeleteHint: "Full deletion is via Supabase Dashboard. Export your data first.",
  profileSignOut: "Sign out",
  profileSave: "Save",
  profileSaving: "Saving…",
  profileCancel: "Cancel",
  profileColorPalette: "Color palette",
  profileLanguage: "Language",
  profileInstallApp: "Install on phone",
  profileMarkAllRead: "Mark all read",
  profileNoNotifications: "No notifications yet",
  profileUnread: "Unread",
  ratingLabel: "Rating",
  ratingNotYet: "not rated yet",
  commonEmpty: "Nothing here yet",
  commonRefresh: "Refresh",
  commonErrorSection: "Could not open this section",
};

export const uk: Messages = {
  ...en,
  navHome: "Головна",
  navPlans: "Плани",
  navFeed: "Стрічка",
  navProfile: "Профіль",
  backHome: "Головна",
  profileSettings: "Налаштування",
  profileNotifications: "Сповіщення",
  profileAccount: "Акаунт",
  profileSettingsShort: "Нал.",
  profileNotificationsShort: "Спов.",
  profileEdit: "Редагувати",
  profileEditTitle: "Редагування профілю",
  profileName: "Ім'я",
  profileGender: "Стать",
  profileTogetherDays: "Разом {days} днів",
  profileStats: "Статистика",
  profileStatsMoods: "Настрої",
  profileStatsPlans: "Плани",
  profileStatsMoments: "Моменти",
  profileStatsAnswers: "Відповіді",
  profileWaitingPartner: "Чекаємо партнера",
  profileManageInvite: "Керування запрошенням",
  profileCreatePair: "Створити або прийняти запрошення",
  profileExport: "Експорт даних",
  profileSignOut: "Вийти",
  profileSave: "Зберегти",
  profileSaving: "Зберігаємо…",
  profileCancel: "Скасувати",
  profileColorPalette: "Кольорова палітра",
  profileLanguage: "Мова",
  profileMarkAllRead: "Прочитати все",
  profileNoNotifications: "Сповіщень поки немає",
  ratingNotYet: "ще не оцінив(ла)",
  commonEmpty: "Поки порожньо",
  commonRefresh: "Оновити",
};

export const es: Messages = {
  ...en,
  navHome: "Inicio",
  navPlans: "Planes",
  navFeed: "Actividad",
  navProfile: "Perfil",
  backHome: "Inicio",
  profileSettings: "Ajustes",
  profileNotifications: "Notificaciones",
  profileAccount: "Cuenta",
  profileEdit: "Editar",
  profileName: "Nombre",
  profileGender: "Género",
  profileTogetherDays: "Juntos {days} días",
  profileStats: "Estadísticas",
  profileSignOut: "Cerrar sesión",
  profileSave: "Guardar",
  profileCancel: "Cancelar",
  profileColorPalette: "Paleta de color",
  profileLanguage: "Idioma",
  profileMarkAllRead: "Marcar todo leído",
  profileNoNotifications: "Sin notificaciones",
  ratingNotYet: "sin valorar",
};

export const de: Messages = {
  ...en,
  navHome: "Start",
  navPlans: "Pläne",
  navFeed: "Aktivität",
  navProfile: "Profil",
  backHome: "Start",
  profileSettings: "Einstellungen",
  profileNotifications: "Benachrichtigungen",
  profileAccount: "Konto",
  profileEdit: "Bearbeiten",
  profileName: "Name",
  profileGender: "Geschlecht",
  profileTogetherDays: "{days} Tage zusammen",
  profileSignOut: "Abmelden",
  profileSave: "Speichern",
  profileCancel: "Abbrechen",
  profileColorPalette: "Farbpalette",
  profileLanguage: "Sprache",
  profileMarkAllRead: "Alle gelesen",
  profileNoNotifications: "Keine Benachrichtigungen",
};

export const it: Messages = {
  ...en,
  navHome: "Home",
  navPlans: "Piani",
  navFeed: "Attività",
  navProfile: "Profilo",
  backHome: "Home",
  profileSettings: "Impostazioni",
  profileNotifications: "Notifiche",
  profileAccount: "Account",
  profileEdit: "Modifica",
  profileName: "Nome",
  profileGender: "Genere",
  profileTogetherDays: "Insieme da {days} giorni",
  profileSignOut: "Esci",
  profileSave: "Salva",
  profileCancel: "Annulla",
  profileColorPalette: "Palette colori",
  profileLanguage: "Lingua",
  profileMarkAllRead: "Segna tutto letto",
  profileNoNotifications: "Nessuna notifica",
};

export const zh: Messages = {
  ...en,
  navHome: "首页",
  navPlans: "计划",
  navFeed: "动态",
  navProfile: "个人",
  navChat: "聊天",
  backHome: "首页",
  profileSettings: "设置",
  profileNotifications: "通知",
  profileAccount: "账户",
  profileEdit: "编辑",
  profileName: "姓名",
  profileGender: "性别",
  profileTogetherDays: "在一起 {days} 天",
  profileSignOut: "退出",
  profileSave: "保存",
  profileCancel: "取消",
  profileColorPalette: "配色",
  profileLanguage: "语言",
  profileMarkAllRead: "全部已读",
  profileNoNotifications: "暂无通知",
};

export const hi: Messages = {
  ...en,
  navHome: "होम",
  navPlans: "योजनाएँ",
  navFeed: "गतिविधि",
  navProfile: "प्रोफ़ाइल",
  backHome: "होम",
  profileSettings: "सेटिंग्स",
  profileNotifications: "सूचनाएँ",
  profileAccount: "खाता",
  profileEdit: "संपादित करें",
  profileName: "नाम",
  profileGender: "लिंग",
  profileTogetherDays: "साथ में {days} दिन",
  profileSignOut: "साइन आउट",
  profileSave: "सहेजें",
  profileCancel: "रद्द करें",
  profileColorPalette: "रंग पैलेट",
  profileLanguage: "भाषा",
  profileMarkAllRead: "सभी पढ़ा",
  profileNoNotifications: "कोई सूचना नहीं",
};

export const pt: Messages = {
  ...en,
  navHome: "Início",
  navPlans: "Planos",
  navFeed: "Atividade",
  navProfile: "Perfil",
  backHome: "Início",
  profileSettings: "Configurações",
  profileNotifications: "Notificações",
  profileAccount: "Conta",
  profileEdit: "Editar",
  profileName: "Nome",
  profileGender: "Gênero",
  profileTogetherDays: "Juntos há {days} dias",
  profileSignOut: "Sair",
  profileSave: "Salvar",
  profileCancel: "Cancelar",
  profileColorPalette: "Paleta de cores",
  profileLanguage: "Idioma",
  profileMarkAllRead: "Marcar tudo lido",
  profileNoNotifications: "Sem notificações",
};

export const ja: Messages = {
  ...en,
  navHome: "ホーム",
  navPlans: "予定",
  navFeed: "アクティビティ",
  navProfile: "プロフィール",
  navChat: "チャット",
  backHome: "ホーム",
  profileSettings: "設定",
  profileNotifications: "通知",
  profileAccount: "アカウント",
  profileEdit: "編集",
  profileName: "名前",
  profileGender: "性別",
  profileTogetherDays: "付き合って {days} 日",
  profileSignOut: "ログアウト",
  profileSave: "保存",
  profileCancel: "キャンセル",
  profileColorPalette: "カラーパレット",
  profileLanguage: "言語",
  profileMarkAllRead: "すべて既読",
  profileNoNotifications: "通知はありません",
};

export const tr: Messages = {
  ...en,
  navHome: "Ana sayfa",
  navPlans: "Planlar",
  navFeed: "Akış",
  navProfile: "Profil",
  backHome: "Ana sayfa",
  profileSettings: "Ayarlar",
  profileNotifications: "Bildirimler",
  profileAccount: "Hesap",
  profileEdit: "Düzenle",
  profileName: "Ad",
  profileGender: "Cinsiyet",
  profileTogetherDays: "Birlikte {days} gün",
  profileSignOut: "Çıkış",
  profileSave: "Kaydet",
  profileCancel: "İptal",
  profileColorPalette: "Renk paleti",
  profileLanguage: "Dil",
  profileMarkAllRead: "Tümünü okundu işaretle",
  profileNoNotifications: "Bildirim yok",
};

export const fr: Messages = {
  ...en,
  navHome: "Accueil",
  navPlans: "Plans",
  navFeed: "Activité",
  navProfile: "Profil",
  backHome: "Accueil",
  profileSettings: "Paramètres",
  profileNotifications: "Notifications",
  profileAccount: "Compte",
  profileEdit: "Modifier",
  profileName: "Nom",
  profileGender: "Genre",
  profileTogetherDays: "Ensemble depuis {days} jours",
  profileSignOut: "Déconnexion",
  profileSave: "Enregistrer",
  profileCancel: "Annuler",
  profileColorPalette: "Palette de couleurs",
  profileLanguage: "Langue",
  profileMarkAllRead: "Tout marquer lu",
  profileNoNotifications: "Aucune notification",
};

export const ko: Messages = {
  ...en,
  navHome: "홈",
  navPlans: "일정",
  navFeed: "활동",
  navProfile: "프로필",
  navChat: "채팅",
  backHome: "홈",
  profileSettings: "설정",
  profileNotifications: "알림",
  profileAccount: "계정",
  profileEdit: "편집",
  profileName: "이름",
  profileGender: "성별",
  profileTogetherDays: "함께한 지 {days}일",
  profileSignOut: "로그아웃",
  profileSave: "저장",
  profileCancel: "취소",
  profileColorPalette: "색상 팔레트",
  profileLanguage: "언어",
  profileMarkAllRead: "모두 읽음",
  profileNoNotifications: "알림 없음",
};

export const messagesByLocale: Record<Locale, Messages> = {
  en,
  uk,
  es,
  de,
  it,
  zh,
  hi,
  pt,
  ja,
  tr,
  fr,
  ko,
};

export function translate(locale: Locale, key: keyof Messages, params?: Record<string, string | number>): string {
  const template = messagesByLocale[locale]?.[key] ?? messagesByLocale.en[key] ?? key;
  if (!params) {
    return template;
  }
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, String(value)),
    template,
  );
}
