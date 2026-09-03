/** Suggests the next agent port from the manifests already around the target. */
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import {FIRST_AGENT_PORT} from './answers.js';

function manifestPorts(dir: string): number[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const ports: number[] = [];
  for (const entry of entries) {
    try {
      const manifest = JSON.parse(readFileSync(join(dir, entry, 'manifest.json'), 'utf8')) as {
        agent?: {url?: string};
      };
      const port = Number(new URL(manifest.agent?.url ?? '').port);
      if (Number.isInteger(port) && port > 0) ports.push(port);
    } catch {
      // not an app folder
    }
  }
  return ports;
}

/**
 * One above the highest port any sibling manifest advertises, so a scaffold beside the
 * in-repo apps lands on the next free `1100x`; the first port when there are none.
 */
export function suggestPort(dirs: string[]): number {
  const ports = dirs.flatMap(manifestPorts).filter(p => p >= FIRST_AGENT_PORT);
  return ports.length ? Math.max(...ports) + 1 : FIRST_AGENT_PORT;
}
