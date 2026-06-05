export const INVESTOR_REFRAME: Record<string, {
  quizName: string;
  tagline: string;
  emoji: string;
}> = {
  deep_diver: { quizName: 'Si Riset Freak', tagline: 'The Fundamentalist', emoji: '🔬' },
  conviction_holder: { quizName: 'Si Diamond Hand', tagline: 'The Long-Term Believer', emoji: '💎' },
  narrative_reader: { quizName: 'Si Pembaca Tren', tagline: 'The Macro Strategist', emoji: '📚' },
  accumulator: { quizName: 'Si DCA Lovers', tagline: 'The Steady Accumulator', emoji: '🐢' },
  reward_hunter: { quizName: 'Si Reward Hunter', tagline: 'The Yield Grinder', emoji: '🪂' },
  momentum_chaser: { quizName: 'Si Trend Surfer', tagline: 'The Fast Mover', emoji: '⚡' },
  community_native: { quizName: 'Si Community Rider', tagline: 'The Social Investor', emoji: '👥' },
  dopamine_trader: { quizName: 'Si Chart Hunter', tagline: 'The Pulse Trader', emoji: '📈' },
};

export const getShortName = (quizName?: string) => {
  if (!quizName) return 'Unknown';
  return quizName.replace(/^Si\s+/i, '');
};
