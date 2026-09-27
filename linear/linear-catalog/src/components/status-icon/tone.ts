/**
 * How a workflow state is drawn, keyed on its type as the data carries it (`statusType`), falling
 * back to Linear's default state names when the type is missing or unknown. A started state named
 * like a review is drawn further along than one in progress.
 */
export type StatusTone =
  'backlog' | 'unstarted' | 'started' | 'review' | 'completed' | 'canceled' | 'triage' | 'neutral';

const BY_TYPE: Record<string, StatusTone> = {
  backlog: 'backlog',
  unstarted: 'unstarted',
  started: 'started',
  completed: 'completed',
  canceled: 'canceled',
  duplicate: 'canceled',
  triage: 'triage',
};

const BY_NAME: Record<string, StatusTone> = {
  backlog: 'backlog',
  todo: 'unstarted',
  'in progress': 'started',
  'in review': 'review',
  done: 'completed',
  canceled: 'canceled',
  cancelled: 'canceled',
  duplicate: 'canceled',
  triage: 'triage',
};

const norm = (value: string) => value.trim().toLowerCase();

export function toneOf(type: string, status: string): StatusTone {
  const byType = BY_TYPE[norm(type)];
  const byName = BY_NAME[norm(status)];
  if (byType === 'started' && byName === 'review') return 'review';
  return byType ?? byName ?? 'neutral';
}

/** The share of the centre a started state fills. */
export const FILL: Partial<Record<StatusTone, number>> = {started: 0.5, review: 0.75};
