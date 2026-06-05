// tests/unit/contexts/RewardContext.test.ts
import { describe, it, expect } from 'vitest';
import {
  verifyStreak,
  getTitleForLevel,
  getTitleColorClass,
  TITLES,
  type FirestoreTimestamp,
} from '../../../src/contexts/RewardContext';

// ── verifyStreak ─────────────────────────────────────────────────────────────
describe('verifyStreak', () => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  it('returns increment=true when lastVisit is null (first visit)', () => {
    expect(verifyStreak(null)).toEqual({ reset: false, increment: true });
  });

  it('returns increment=true when lastVisit is undefined', () => {
    expect(verifyStreak(undefined)).toEqual({ reset: false, increment: true });
  });

  it('returns increment=false when visited today (string)', () => {
    const result = verifyStreak(todayStr + 'T08:00:00.000Z');
    expect(result).toEqual({ reset: false, increment: false });
  });

  it('returns increment=true when visited yesterday (string)', () => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const result = verifyStreak(yesterday.toISOString());
    expect(result).toEqual({ reset: false, increment: true });
  });

  it('returns reset=true when visited 2+ days ago (string)', () => {
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const result = verifyStreak(twoDaysAgo.toISOString());
    expect(result).toEqual({ reset: true, increment: false });
  });

  it('handles FirestoreTimestamp with toDate()', () => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const ts: FirestoreTimestamp = { toDate: () => yesterday };
    expect(verifyStreak(ts)).toEqual({ reset: false, increment: true });
  });

  it('handles FirestoreTimestamp with seconds field', () => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const ts: FirestoreTimestamp = { seconds: Math.floor(yesterday.getTime() / 1000) };
    expect(verifyStreak(ts)).toEqual({ reset: false, increment: true });
  });

  it('handles FirestoreTimestamp with stale seconds (2 days ago → reset)', () => {
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const ts: FirestoreTimestamp = { seconds: Math.floor(twoDaysAgo.getTime() / 1000) };
    expect(verifyStreak(ts)).toEqual({ reset: true, increment: false });
  });
});

// ── getTitleForLevel ─────────────────────────────────────────────────────────
describe('getTitleForLevel', () => {
  it('returns correct title for level 1', () => {
    expect(getTitleForLevel(1)).toBe('Pemula Crypto');
  });

  it('returns correct title for level 10', () => {
    expect(getTitleForLevel(10)).toBe('CrypdoID Legend');
  });

  it('caps at level 10 for levels above 10', () => {
    expect(getTitleForLevel(99)).toBe('CrypdoID Legend');
  });

  it('returns all titles in order (1–10)', () => {
    Object.entries(TITLES).forEach(([lvl, title]) => {
      expect(getTitleForLevel(Number(lvl))).toBe(title);
    });
  });
});

// ── getTitleColorClass ───────────────────────────────────────────────────────
describe('getTitleColorClass', () => {
  it('returns a non-empty string for all levels 1–10', () => {
    for (let i = 1; i <= 10; i++) {
      expect(getTitleColorClass(i)).toBeTruthy();
    }
  });

  it('returns slate color for level 1', () => {
    expect(getTitleColorClass(1)).toContain('slate');
  });

  it('returns gold/yellow color class for level 10', () => {
    expect(getTitleColorClass(10)).toContain('gold');
  });

  it('caps at level 10 for levels above', () => {
    expect(getTitleColorClass(11)).toBe(getTitleColorClass(10));
  });
});
