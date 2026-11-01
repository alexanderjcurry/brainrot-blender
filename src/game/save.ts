import AsyncStorage from '@react-native-async-storage/async-storage';
import { SaveData } from './state';

const KEY = 'brainrot-blender/save/v1';

// Storage can be unavailable (for example in a sandboxed browser preview).
// The game must keep working, so failures fall back to "no save".
export async function loadGame(): Promise<SaveData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    return data?.version === 1 ? data : null;
  } catch {
    return null;
  }
}

export async function saveGame(data: SaveData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Ignore: the next save will try again.
  }
}
