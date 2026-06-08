import type { Channel, HookEvaluation } from '../types'

export interface DayPoint {
  day: string
  meta: number
  google: number
  linkedin: number
}

export const CHANNELS: Channel[] = ['meta', 'google', 'linkedin']

const DAILY_BUDGET = 1000 // simulated $/day, split across channels

/**
 * Scripted reallocation model. NOT connected to any ad network.
 *
 * Seeds each channel from the average hook scores, then over 7 days fluidly
 * drifts budget toward the channel with the strongest signal and away from
 * the weakest — a deterministic illustration of an automated rule, not a
 * live optimizer.
 */
export function simulateBudget(evaluations: HookEvaluation[]): DayPoint[] {
  const avg = evaluations.length
    ? evaluations.reduce((a, e) => a + e.overall, 0) / evaluations.length
    : 50

  // Derive a per-channel "affinity" from the score. Higher overall scores
  // favor consumer channels (Meta); lower, more considered scores favor B2B.
  const consumerBias = avg / 100 // 0..1
  let weights: Record<Channel, number> = {
    meta: 0.34 + 0.25 * consumerBias,
    google: 0.33,
    linkedin: 0.33 - 0.25 * consumerBias,
  }
  normalize(weights)

  const strongest = strongestChannel(weights)
  const weakest = weakestChannel(weights)

  const points: DayPoint[] = []
  for (let day = 1; day <= 7; day++) {
    // Each day, shift 4% of the weakest channel's weight to the strongest.
    if (day > 1) {
      const move = weights[weakest] * 0.18
      weights = { ...weights, [weakest]: weights[weakest] - move, [strongest]: weights[strongest] + move }
      normalize(weights)
    }
    points.push({
      day: `Day ${day}`,
      meta: Math.round(weights.meta * DAILY_BUDGET),
      google: Math.round(weights.google * DAILY_BUDGET),
      linkedin: Math.round(weights.linkedin * DAILY_BUDGET),
    })
  }
  return points
}

function normalize(w: Record<Channel, number>) {
  const sum = CHANNELS.reduce((a, c) => a + w[c], 0)
  for (const c of CHANNELS) w[c] = w[c] / sum
}
function strongestChannel(w: Record<Channel, number>): Channel {
  return CHANNELS.reduce((a, c) => (w[c] > w[a] ? c : a), CHANNELS[0])
}
function weakestChannel(w: Record<Channel, number>): Channel {
  return CHANNELS.reduce((a, c) => (w[c] < w[a] ? c : a), CHANNELS[0])
}
