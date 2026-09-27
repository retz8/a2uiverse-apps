import type {ReactNode} from 'react';

/**
 * A status word's tone and glyph, shared by the status pill and the status glyph.
 *
 * Keyed on CircleCI's own words and on the API's status values, lower-cased with `_` read as a
 * space. A word with no tone of its own draws neutral rather than a guessed one.
 */
export type Tone = 'success' | 'failed' | 'running' | 'hold' | 'queued' | 'neutral';

const TONES: Record<string, Tone> = {
  success: 'success',
  succeeded: 'success',
  failed: 'failed',
  failing: 'failed',
  error: 'failed',
  'infrastructure fail': 'failed',
  timedout: 'failed',
  'timed out': 'failed',
  unauthorized: 'failed',
  running: 'running',
  started: 'running',
  'on hold': 'hold',
  queued: 'queued',
  blocked: 'queued',
  'not running': 'queued',
  created: 'queued',
};

export function toneOf(status: string): Tone {
  return TONES[status.trim().toLowerCase().replace(/_/g, ' ')] ?? 'neutral';
}

/**
 * The catalog's own glyph per tone, on a 16-unit grid in the current color: a check, a cross, a
 * circular arrow, a pause, an hourglass, three dots. Decorative — the word is the signal.
 */
export function StatusGlyph({tone}: {tone: Tone}) {
  return (
    <svg
      className="circleci-glyph"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPH_PATHS[tone]}
    </svg>
  );
}

const GLYPH_PATHS: Record<Tone, ReactNode> = {
  success: <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />,
  failed: <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />,
  running: (
    <>
      <path d="M12.9 9.2A5 5 0 1 1 11.5 4.4" />
      <polyline points="12 1.8 12 4.8 9 4.8" />
    </>
  ),
  hold: <path d="M6 4.5v7M10 4.5v7" />,
  queued: (
    <path d="M5 2.5h6M5 13.5h6M5.5 2.5c0 3.5 5 3.5 5 5.5s-5 2-5 5.5M10.5 2.5c0 3.5-5 3.5-5 5.5s5 2 5 5.5" />
  ),
  neutral: (
    <g fill="currentColor" stroke="none">
      <circle cx="4" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="12" cy="8" r="1.4" />
    </g>
  ),
};
