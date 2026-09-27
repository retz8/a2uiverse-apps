/** The event colours, by the names the Calendar UI gives them. */
export const EVENT_COLORS = [
  'lavender',
  'sage',
  'grape',
  'flamingo',
  'banana',
  'tangerine',
  'peacock',
  'graphite',
  'blueberry',
  'basil',
  'tomato',
] as const;

export type EventColor = (typeof EVENT_COLORS)[number];
