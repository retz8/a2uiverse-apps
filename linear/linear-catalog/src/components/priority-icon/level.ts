/**
 * A priority's level, from Linear's word for it (`priority.name`) or its number
 * (`priority.value`: 0 none, 1 urgent, 2 high, 3 medium, 4 low).
 */
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low' | 'none';

const LEVELS: Record<string, PriorityLevel> = {
  urgent: 'urgent',
  high: 'high',
  medium: 'medium',
  low: 'low',
  'no priority': 'none',
  none: 'none',
  '1': 'urgent',
  '2': 'high',
  '3': 'medium',
  '4': 'low',
  '0': 'none',
};

export function levelOf(priority: string): PriorityLevel {
  return LEVELS[priority.trim().toLowerCase()] ?? 'none';
}

/** How many of the three bars a level fills. */
export const BARS: Record<'high' | 'medium' | 'low', number> = {high: 3, medium: 2, low: 1};
