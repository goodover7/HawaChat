// Powered by OnSpace.AI
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReportNotification {
  id: string;
  reportId: string;
  reportedUserName: string;
  reporterName: string;
  messageText: string;
  timestamp: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  action?: 'muted' | 'kicked' | 'banned' | 'ignored' | 'warned';
}

const REPORT_NOTIF_KEY = 'hawa_report_notifs_v1';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function getReportNotifications(): Promise<ReportNotification[]> {
  try {
    const data = await AsyncStorage.getItem(REPORT_NOTIF_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export async function addReportNotification(
  reportId: string,
  reportedUserName: string,
  reporterName: string,
  messageText: string
): Promise<void> {
  const existing = await getReportNotifications();
  const notif: ReportNotification = {
    id: generateId(),
    reportId,
    reportedUserName,
    reporterName,
    messageText,
    timestamp: new Date().toISOString(),
    isRead: false,
    isResolved: false,
  };
  await AsyncStorage.setItem(REPORT_NOTIF_KEY, JSON.stringify([notif, ...existing]));
}

export async function resolveReportNotification(
  reportNotifId: string,
  resolvedBy: string,
  action: ReportNotification['action']
): Promise<void> {
  const notifs = await getReportNotifications();
  const idx = notifs.findIndex(n => n.id === reportNotifId);
  if (idx !== -1) {
    notifs[idx].isResolved = true;
    notifs[idx].isRead = true;
    notifs[idx].resolvedBy = resolvedBy;
    notifs[idx].action = action;
    await AsyncStorage.setItem(REPORT_NOTIF_KEY, JSON.stringify(notifs));
  }
}

export async function markAllReportNotifsRead(): Promise<void> {
  const notifs = await getReportNotifications();
  const updated = notifs.map(n => ({ ...n, isRead: true }));
  await AsyncStorage.setItem(REPORT_NOTIF_KEY, JSON.stringify(updated));
}

export async function getUnreadReportNotifCount(): Promise<number> {
  const notifs = await getReportNotifications();
  return notifs.filter(n => !n.isRead).length;
}
