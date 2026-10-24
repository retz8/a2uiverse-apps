import {createContext} from 'react';

/**
 * The per-item props Primer's `AvatarStack` injects into each direct child via `cloneElement` — the
 * overlap `AvatarItem` className and the `square` flag derived from the stack's `shape`. The
 * renderer's host element (what `buildChild` renders) swallows any injected React prop, so
 * AvatarStack bridges the injection through this context, which flows through the wrapper to the
 * real `Avatar`.
 */
export type AvatarStackItemInjection = {className?: string; square?: boolean};

export const AvatarStackItemContext = createContext<AvatarStackItemInjection | null>(null);
