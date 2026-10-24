import {createContext} from 'react';

/**
 * Set by a parent that draws a child's Primer slot component itself, around the child — Primer
 * matches some slots by the component's identity, which a child built through the renderer never
 * has. The child then draws its own children bare inside it, and clears the flag beneath them.
 */
export const SlotDrawnContext = createContext(false);
