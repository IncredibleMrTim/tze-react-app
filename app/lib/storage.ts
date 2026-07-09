import type { IStorageState } from "@/types/interfaces";
import { STORE_KEY } from "@/constants/storage.const";
import { setNextTZE } from "@/lib/helpers";

export const saveState = (state: IStorageState): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e: unknown) {
    // Quota exceeded - strip photos and retry
    const error = e as DOMException;
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      try {
        const stripped = {
          ...state,
          jobs: state.jobs.map(j => ({
            ...j,
            poPic: null,
            partsPic: null,
          })),
        };
        localStorage.setItem(STORE_KEY, JSON.stringify(stripped));
      } catch (e2) {
        console.error('Storage save failed even after stripping photos:', e2);
      }
    } else {
      console.error('Storage save failed:', e);
    }
  }
};

export const loadState = (): IStorageState | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;

    const d = JSON.parse(raw);
    const state: IStorageState = {
      jobs: Array.isArray(d.jobs) ? d.jobs : [],
      jigAssignments: Array.isArray(d.jigAssignments) ? d.jigAssignments : [],
      jigPhotos: d.jigPhotos || {},
      invSeq: typeof d.invSeq === 'number' ? d.invSeq : 1,
      nextTZE: typeof d.nextTZE === 'number' ? d.nextTZE : 1,
    };

    // Update the counter
    setNextTZE(state.nextTZE);

    return state;
  } catch (e) {
    console.error('Storage load failed:', e);
    return null;
  }
};

export const loadApiKey = (): string => {
  if (typeof window === 'undefined') return '';

  try {
    const storedKey = localStorage.getItem('tze_api_key');
    if (storedKey) return storedKey;
    return '';
  } catch (e) {
    return '';
  }
};

export const saveApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('tze_api_key', key);
  } catch (e) {
    console.error('Failed to save API key:', e);
  }
};
