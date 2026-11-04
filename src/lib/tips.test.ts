import { describe, expect, it } from 'vitest';
import { GENERIC_TIPS, getTips } from './tips';

describe('getTips', () => {
  it('returns only generic tips when no answers are given', () => {
    expect(getTips({})).toEqual([...GENERIC_TIPS]);
  });

  it('adds the Greek toe tip when toe is greek', () => {
    const tips = getTips({ toe: 'greek' });
    expect(tips).toContain('Your second toe is longest (Greek foot): choose round or almond toe boxes with room in front of the second toe — avoid pointed or tapered shoes.');
    expect(tips.length).toBe(GENERIC_TIPS.length + 1);
  });

  it('adds a tip for every answered question', () => {
    const tips = getTips({ toe: 'roman', width: 'wide', arch: 'flat' });
    expect(tips).toContain('Your toes are nearly even (Roman/square foot): look for wide toe boxes and avoid narrow fashion lasts.');
    expect(tips).toContain('Wide feet: consider wide-fit lasts, or go up half a size — never size up so much the heel slips.');
    expect(tips).toContain('Flat arch: choose stability or motion-control shoes with a low heel-to-toe drop; avoid flat unsupportive soles.');
    expect(tips.length).toBe(GENERIC_TIPS.length + 3);
  });

  it('adds the narrow and high-arch tips', () => {
    const tips = getTips({ width: 'narrow', arch: 'high' });
    expect(tips).toContain('Narrow feet: standard or narrow lasts fit best — consider half a size down for a snug performance fit.');
    expect(tips).toContain('High arch: cushioned midsoles and lace-ups (over slip-ons) let you adjust fit across the instep.');
  });

  it('ignores unanswered questions', () => {
    const tips = getTips({ toe: 'egyptian' });
    expect(tips).toContain('Big toe longest (Egyptian foot) is the most common shape — most standard lasts fit; size up half if between sizes for dress shoes.');
    expect(tips.length).toBe(GENERIC_TIPS.length + 1);
  });
});
