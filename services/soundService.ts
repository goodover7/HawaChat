// Powered by OnSpace.AI
import { Audio } from 'expo-av';

let isEnabled = true;

export function setSoundEnabled(val: boolean) {
  isEnabled = val;
}

export function isSoundEnabled() {
  return isEnabled;
}

// Reliable free CDN audio URLs
const SOUNDS = {
  message: 'https://cdn.freesound.org/previews/411/411642_5121236-lq.mp3',
  reply: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3',
  gift: 'https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3',
  report: 'https://cdn.freesound.org/previews/243/243020_4284968-lq.mp3',
  friend: 'https://cdn.freesound.org/previews/397/397354_4284968-lq.mp3',
  private: 'https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3',
  notification: 'https://cdn.freesound.org/previews/320/320654_5260872-lq.mp3',
};

// Fallback: simple base64 encoded short beep tones
// These are tiny base64-encoded WAV files for offline use
const BEEP_TONES: Record<string, string> = {
  message: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
  reply: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
};

async function playSound(uri: string, volume: number = 0.6, duration: number = 2500) {
  if (!isEnabled) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { volume, shouldPlay: true }
    );
    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, duration);
  } catch {
    // Silently fail
  }
}

export async function playMessageSound() {
  await playSound(SOUNDS.message, 0.5);
}

export async function playReplySound() {
  await playSound(SOUNDS.reply, 0.6);
}

export async function playGiftSound() {
  await playSound(SOUNDS.gift, 0.7, 3000);
}

export async function playReportAlertSound() {
  await playSound(SOUNDS.report, 0.8, 3000);
}

export async function playFriendRequestSound() {
  await playSound(SOUNDS.friend, 0.6);
}

export async function playPrivateMessageSound() {
  await playSound(SOUNDS.private, 0.5);
}

export async function playNotificationSound() {
  await playSound(SOUNDS.notification, 0.5);
}
