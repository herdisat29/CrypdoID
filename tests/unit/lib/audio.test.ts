// tests/unit/lib/audio.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playSfx } from '../../../src/lib/audio';

describe('playSfx', () => {
  let mockOscillator: {
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    type: OscillatorType;
    frequency: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
  };

  let mockGain: {
    connect: ReturnType<typeof vi.fn>;
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      linearRampToValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
  };

  let mockCtx: {
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
    destination: object;
    currentTime: number;
  };

  beforeEach(() => {
    mockOscillator = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };

    mockGain = {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };

    mockCtx = {
      createOscillator: vi.fn(() => ({ ...mockOscillator })),
      createGain: vi.fn(() => ({ ...mockGain })),
      destination: {},
      currentTime: 0,
    };

    vi.stubGlobal('AudioContext', vi.fn(function() { return mockCtx; }));
  });

  const sfxTypes = ['xp', 'levelUp', 'error', 'click', 'hover', 'claim'] as const;

  sfxTypes.forEach((type) => {
    it(`does not throw for type "${type}"`, () => {
      expect(() => playSfx(type)).not.toThrow();
    });
  });

  it('creates AudioContext on call', () => {
    playSfx('xp');
    expect(AudioContext).toHaveBeenCalledTimes(1);
  });

  it('creates oscillator and gain node', () => {
    playSfx('xp');
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it('does not throw when AudioContext is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => playSfx('xp')).not.toThrow();
  });

  it('catches and swallows AudioContext errors gracefully', () => {
    vi.stubGlobal('AudioContext', vi.fn(function() {
      throw new Error('AudioContext not allowed');
    }));
    expect(() => playSfx('xp')).not.toThrow();
  });

  it('claim type creates multiple oscillators (3 notes)', () => {
    playSfx('claim');
    // claim creates 3 extra oscillators via ctx.createOscillator inside forEach
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4); // 1 main + 3 claim notes
  });
});
