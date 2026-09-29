import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundService } from '../services/soundService';

describe('SoundService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('manages sound enabled state in localStorage', () => {
    soundService.setSoundEnabled(false);
    expect(soundService.getSoundEnabled()).toBe(false);
    expect(localStorage.getItem('superapps_sound_enabled')).toBe('false');

    soundService.setSoundEnabled(true);
    expect(soundService.getSoundEnabled()).toBe(true);
    expect(localStorage.getItem('superapps_sound_enabled')).toBe('true');
  });

  it('safely handles play methods without crashing in non-audio environments', () => {
    expect(() => soundService.playUnlock()).not.toThrow();
    expect(() => soundService.playLock()).not.toThrow();
    expect(() => soundService.playClick()).not.toThrow();
    expect(() => soundService.playSuccess()).not.toThrow();
  });
});
