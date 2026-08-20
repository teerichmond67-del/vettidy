import type { WeightUnit } from '../types/weightEntry';

const KG_PER_LB = 0.45359237;

/**
 * Converts a weight value between kg and lb. Entries are never stored
 * pre-converted — this exists specifically so the trend chart can plot a
 * consistent scale even when a pet's history mixes units, rather than
 * silently treating raw kg and lb numbers as directly comparable.
 */
export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === 'lb' ? value * KG_PER_LB : value / KG_PER_LB;
}
