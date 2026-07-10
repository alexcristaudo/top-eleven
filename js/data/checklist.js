// Season checklist — the season-cycle guide as tickable tasks.
export const SEASON_CHECKLIST = [
  {
    id: 'start',
    label: 'Season start (days 1–3)',
    tasks: [
      { id: 'start-renew', text: 'Renew every expiring contract (avoids morale penalties)' },
      { id: 'start-cupdraw', text: 'Check the Cup draw before making big signings (draw seeds on squad quality)' },
      { id: 'start-buy-young', text: 'Buy 18-year-old fast trainers while the market is flooded and cheap' },
      { id: 'start-youth', text: 'Visit the Young Talent Center on days 3–7: take the 2–3 free youths, sign token youths EARLY in the season (late signings lose a star at rollover)' },
      { id: 'start-training-plan', text: 'Set a training plan per player (Player pages generate one)' },
      { id: 'start-facilities', text: 'Queue the next training-facility upgrade' },
      { id: 'start-association', text: 'Confirm association lineup and availability for the first weekend' },
    ],
  },
  {
    id: 'mid',
    label: 'Mid-season (around day 10–14)',
    tasks: [
      { id: 'mid-audit', text: 'Audit the squad: list underperformers and players blocking a youngster' },
      { id: 'mid-scout-rivals', text: 'Re-scout title rivals\' formations and update counter presets' },
      { id: 'mid-packs', text: 'Check pack reserves — aim to enter the final week with 20+ greens' },
      { id: 'mid-positions', text: 'Start second-position training for rotation players' },
      { id: 'mid-competitions', text: 'Decide which competition to prioritise if fixtures pile up' },
    ],
  },
  {
    id: 'final',
    label: 'Final week',
    tasks: [
      { id: 'final-sell', text: 'Sell everyone you won\'t keep BEFORE rollover (age +1 and value drop at reset)' },
      { id: 'final-farm', text: 'Farm ad videos for greens/tokens for the day-1 market' },
      { id: 'final-rest', text: 'Rest fast trainers if matches are dead; keep training gains rolling' },
      { id: 'final-tokens', text: 'Set next season\'s token budget (top up the tracker below if needed)' },
    ],
  },
];

export const ALL_TASK_IDS = SEASON_CHECKLIST.flatMap((p) => p.tasks.map((t) => t.id));

// Token tracker spend/earn categories.
export const TOKEN_CATEGORIES = [
  { id: 'transfer', label: 'Transfers', kind: 'spend' },
  { id: 'packs', label: 'Packs / boosts', kind: 'spend' },
  { id: 'other-spend', label: 'Other spending', kind: 'spend' },
  { id: 'videos', label: 'Ad videos', kind: 'earn' },
  { id: 'rewards', label: 'Competition rewards', kind: 'earn' },
  { id: 'association', label: 'Association', kind: 'earn' },
  { id: 'purchase', label: 'Bought / gifted', kind: 'earn' },
];
