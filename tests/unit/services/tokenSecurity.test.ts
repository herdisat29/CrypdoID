// tests/unit/services/tokenSecurity.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateAISimulatedSecurityReport,
  checkTokenSecurity,
} from '../../../src/services/tokenSecurity';

const VALID_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7'; // USDT mainnet
const INVALID_ADDRESS = '0xSHORT';

// ── generateAISimulatedSecurityReport ────────────────────────────────────────
describe('generateAISimulatedSecurityReport', () => {
  it('returns a valid TokenSecurityResult shape', () => {
    const result = generateAISimulatedSecurityReport(VALID_ADDRESS, 1);

    expect(result).toMatchObject({
      isSimulated: true,
      chain: expect.stringContaining('AI Simulated'),
    });
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.overallRisk);
    expect(result.riskScore).toBeGreaterThanOrEqual(15);
    expect(result.riskScore).toBeLessThanOrEqual(95);
  });

  it('is deterministic — same address always returns same result', () => {
    const a = generateAISimulatedSecurityReport(VALID_ADDRESS, 1);
    const b = generateAISimulatedSecurityReport(VALID_ADDRESS, 1);
    expect(a).toEqual(b);
  });

  it('returns different results for different addresses', () => {
    const a = generateAISimulatedSecurityReport(VALID_ADDRESS, 1);
    const b = generateAISimulatedSecurityReport(
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      1
    );
    // At minimum risk scores should not always be identical
    // (addresses differ enough that hash diverges)
    expect(a.tokenSymbol).not.toEqual(b.tokenSymbol);
  });

  it('includes the TOKEN UNINDEXED warning', () => {
    const result = generateAISimulatedSecurityReport(VALID_ADDRESS, 56);
    expect(result.warnings[0]).toContain('TOKEN UNINDEXED');
  });

  it('respects BNB chain name', () => {
    const result = generateAISimulatedSecurityReport(VALID_ADDRESS, 56);
    expect(result.chain).toContain('BNB Chain');
  });

  it('uses fallback chain name for unknown chainId', () => {
    const result = generateAISimulatedSecurityReport(VALID_ADDRESS, 99999);
    expect(result.chain).toContain('Other Chain');
  });

  it('riskScore caps at 95 regardless of flags', () => {
    // Force worst-case: address that triggers isHoneypot + mint + blacklist + ownerCanChangeBalance
    // We brute-force an address that hits all mod checks
    // For pure cap test, verify max is 95
    for (let i = 0; i < 50; i++) {
      const addr = `0x${'a'.repeat(38)}${i.toString(16).padStart(2, '0')}`;
      const r = generateAISimulatedSecurityReport(addr, 1);
      expect(r.riskScore).toBeLessThanOrEqual(95);
    }
  });
});

// ── checkTokenSecurity — input validation ────────────────────────────────────
describe('checkTokenSecurity — input validation', () => {
  it('throws on invalid address format', async () => {
    await expect(checkTokenSecurity(INVALID_ADDRESS)).rejects.toThrow(
      /format address/i
    );
  });

  it('throws on empty string', async () => {
    await expect(checkTokenSecurity('')).rejects.toThrow();
  });

  it('throws on address that is too long', async () => {
    await expect(checkTokenSecurity('0x' + 'a'.repeat(42))).rejects.toThrow();
  });
});

// ── checkTokenSecurity — GoPlus API integration (mocked) ────────────────────
describe('checkTokenSecurity — GoPlus fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to simulated result when GoPlus returns empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: {} }),
    }));

    const result = await checkTokenSecurity(VALID_ADDRESS, 1);
    expect(result.isSimulated).toBe(true);
  });

  it('falls back to simulated result when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await checkTokenSecurity(VALID_ADDRESS, 1);
    expect(result.isSimulated).toBe(true);
  });

  it('parses real GoPlus data when available', async () => {
    const mockGoPlusData = {
      is_honeypot: '0',
      buy_tax: '5',
      sell_tax: '10',
      is_mintable: '1',
      is_blacklisted: '0',
      owner_can_change_balance: '0',
      is_proxy: '0',
      lp_holder_count: 3,
      trust_list: '1',
      is_anti_whale: '0',
      owner_address: '0x1234567890123456789012345678901234567890',
      creator_address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      creator_percent: '10',
      owner_percent: '5',
      token_name: 'Test Token',
      token_symbol: 'TEST',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: { [VALID_ADDRESS]: mockGoPlusData },
      }),
    }));

    const result = await checkTokenSecurity(VALID_ADDRESS, 1);

    expect(result.isSimulated).toBe(false);
    expect(result.tokenName).toBe('Test Token');
    expect(result.tokenSymbol).toBe('TEST');
    expect(result.buyTax).toBe(5);
    expect(result.sellTax).toBe(10);
    expect(result.hasMint).toBe(true);
    expect(result.isHoneypot).toBe(false);
  });

  it('detects honeypot when GoPlus flags cannot_sell', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          [VALID_ADDRESS]: {
            cannot_sell: '1',
            buy_tax: '0',
            sell_tax: '0',
            token_name: 'Trap Token',
            token_symbol: 'TRAP',
          },
        },
      }),
    }));

    const result = await checkTokenSecurity(VALID_ADDRESS, 1);
    expect(result.isHoneypot).toBe(true);
    expect(result.overallRisk).toBe('HIGH');
  });

  it('marks overallRisk HIGH when riskScore >= 70', async () => {
    // honeypot (90) should push to HIGH
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          [VALID_ADDRESS]: {
            is_honeypot: '1',
            buy_tax: '20',
            sell_tax: '25',
            is_mintable: '1',
            owner_can_change_balance: '1',
            token_name: 'Rug Token',
            token_symbol: 'RUG',
          },
        },
      }),
    }));

    const result = await checkTokenSecurity(VALID_ADDRESS, 1);
    expect(result.overallRisk).toBe('HIGH');
    expect(result.riskScore).toBeGreaterThanOrEqual(70);
  });
});
