/**
 * The catalog's palette, generated in LCH from three inputs — a base colour, an accent colour and
 * a contrast — the method Linear describes for its own themes ("How we redesigned the Linear UI,
 * part II", linear.app/now). Every token is a CSS `lch()` value.
 *
 * The bases are the two colours Linear's brand page publishes: Mercury White `#F4F5F8` for the
 * light appearance and Nordic Gray `#222326` for the dark one, converted to LCH (D50). The accent
 * is our own desaturated blue on the bases' hue, after the brand page's "a subtle desaturated
 * blue"; the status and priority hues and the contrast level are ours.
 */

/** A colour in CIE LCH: lightness 0–100, chroma, hue in degrees. */
export type Lch = readonly [l: number, c: number, h: number];

export interface ThemeInputs {
  base: Lch;
  accent: Lch;
  /** How far text and borders stand from the base, 0–100; 30 is the normal level. */
  contrast: number;
}

export type Appearance = 'light' | 'dark';

/** Mercury White `#F4F5F8`. */
export const MERCURY_WHITE: Lch = [96.52, 1.57, 272];
/** Nordic Gray `#222326`. */
export const NORDIC_GRAY: Lch = [13.7, 2.19, 272.6];

export const NORMAL_CONTRAST = 30;

export const INPUTS: Record<Appearance, ThemeInputs> = {
  light: {base: MERCURY_WHITE, accent: [50, 38, 272], contrast: NORMAL_CONTRAST},
  dark: {base: NORDIC_GRAY, accent: [55, 38, 272], contrast: NORMAL_CONTRAST},
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number) => Number(value.toFixed(2));

export function lch([l, c, h]: Lch, alpha?: number): string {
  const body = `${round(clamp(l, 0, 100))}% ${round(Math.max(0, c))} ${round(h)}`;
  return alpha === undefined ? `lch(${body})` : `lch(${body} / ${alpha})`;
}

/**
 * The tokens for one appearance. The neutrals keep the base's hue and chroma and step its
 * lightness: surfaces rise from the page by elevation, text and borders stand off it by the
 * contrast. The hues of status and priority are fixed; their lightness follows the appearance.
 */
export function generateTheme({base, accent, contrast}: ThemeInputs, appearance: Appearance) {
  const [baseL, baseC, baseH] = base;
  const dark = appearance === 'dark';
  /** Toward the text: darker on a light base, lighter on a dark one. */
  const ink = (distance: number): Lch => [baseL + (dark ? 1 : -1) * distance, baseC, baseH];
  /** Up an elevation: a panel rises from the page toward white in both appearances. */
  const elevate = (steps: number): Lch => [baseL + steps * (dark ? 2.6 : 1.6), baseC, baseH];
  const k = contrast / NORMAL_CONTRAST;
  const [accentL, accentC, accentH] = accent;
  const hue = (h: number, c: number, lightL: number, darkL: number): Lch => [
    dark ? darkL : lightL,
    c,
    h,
  ];

  return {
    '--lc-page': lch(base),
    '--lc-surface': lch(elevate(1)),
    '--lc-band': lch(dark ? elevate(2) : ink(2)),
    '--lc-hover': lch(dark ? elevate(3) : ink(3.5)),
    '--lc-border': lch(ink(8 * k)),
    '--lc-border-strong': lch(ink(14 * k)),
    '--lc-text': lch(ink(80 * k)),
    '--lc-text-secondary': lch(ink(52 * k)),
    '--lc-text-tertiary': lch(ink(38 * k)),
    '--lc-accent': lch(accent),
    '--lc-accent-hover': lch([accentL + (dark ? 4 : -4), accentC, accentH]),
    '--lc-on-accent': lch([99, 0, 0]),
    '--lc-focus': lch(accent, 0.5),
    '--lc-status-backlog': lch(ink(38 * k)),
    '--lc-status-unstarted': lch(ink(46 * k)),
    '--lc-status-started': lch(hue(84, 72, 74, 80)),
    '--lc-status-review': lch(hue(148, 52, 58, 66)),
    '--lc-status-completed': lch(accent),
    '--lc-status-canceled': lch(ink(42 * k)),
    '--lc-status-triage': lch(hue(52, 62, 62, 68)),
    '--lc-priority': lch(ink(52 * k)),
    '--lc-priority-empty': lch(ink(18 * k)),
    '--lc-priority-urgent': lch(hue(42, 70, 60, 66)),
    '--lc-knockout': lch(elevate(1)),
  } as const;
}

export type ThemeTokens = ReturnType<typeof generateTheme>;

/** The hues an avatar is drawn in, chosen by the person's name. */
export const AVATAR_HUES = [272, 200, 148, 84, 32, 328] as const;

/** An avatar's fill: one lightness that carries white initials on either appearance. */
export function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return lch([56, 34, AVATAR_HUES[hash % AVATAR_HUES.length]]);
}
