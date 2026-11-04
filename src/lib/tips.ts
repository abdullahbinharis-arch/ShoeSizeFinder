import type { FootShape } from './types';

export const GENERIC_TIPS: readonly string[] = [
  'Measure at the end of the day — feet swell and are largest then.',
  'Wear the sock thickness you plan to wear with the shoes when trying them on.',
  'Brand sizes vary: a US 9 in one brand can fit like a 9.5 in another — try before buying or check the brand-specific chart.',
];

const SHAPE_TIPS: { [K in keyof FootShape]: Record<FootShape[K], string> } = {
  toe: {
    egyptian: 'Big toe longest (Egyptian foot) is the most common shape — most standard lasts fit; size up half if between sizes for dress shoes.',
    greek: 'Your second toe is longest (Greek foot): choose round or almond toe boxes with room in front of the second toe — avoid pointed or tapered shoes.',
    roman: 'Your toes are nearly even (Roman/square foot): look for wide toe boxes and avoid narrow fashion lasts.',
    square: 'Your toes are nearly even (Roman/square foot): look for wide toe boxes and avoid narrow fashion lasts.',
  },
  width: {
    narrow: 'Narrow feet: standard or narrow lasts fit best — consider half a size down for a snug performance fit.',
    normal: 'Medium width: standard lasts should fit well — focus on toe-box shape instead.',
    wide: 'Wide feet: consider wide-fit lasts, or go up half a size — never size up so much the heel slips.',
  },
  arch: {
    flat: 'Flat arch: choose stability or motion-control shoes with a low heel-to-toe drop; avoid flat unsupportive soles.',
    normal: 'Neutral arch: most shoe categories work for you — pick by activity and toe-box fit.',
    high: 'High arch: cushioned midsoles and lace-ups (over slip-ons) let you adjust fit across the instep.',
  },
};

export function getTips(answers: Partial<FootShape>): string[] {
  const tips = [...GENERIC_TIPS];
  (Object.keys(SHAPE_TIPS) as (keyof FootShape)[]).forEach(<K extends keyof FootShape>(dimension: K) => {
    const answer = answers[dimension];
    if (answer) tips.push(SHAPE_TIPS[dimension][answer]);
  });
  return tips;
}
