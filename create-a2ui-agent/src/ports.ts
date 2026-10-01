/** Suggests the next agent port from the agents already around the target. */
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

import {FIRST_AGENT_PORT} from './answers.js';

/** The `default_port=<n>` line `agentConfigPy` writes into every agent's `app/config.py`. */
const DEFAULT_PORT = /^\s*default_port\s*=\s*(\d+)/m;

function agentPorts(dir: string): number[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const ports: number[] = [];
  for (const entry of entries) {
    try {
      const config = readFileSync(join(dir, entry, 'agent', 'app', 'config.py'), 'utf8');
      const port = Number(DEFAULT_PORT.exec(config)?.[1]);
      if (Number.isInteger(port) && port > 0) ports.push(port);
    } catch {
      // not an app folder
    }
  }
  return ports;
}

/**
 * One above the highest `default_port` any sibling agent declares, so a scaffold beside the
 * in-repo apps lands on the next free `1100x`; the first port when there are none.
 */
export function suggestPort(dirs: string[]): number {
  const ports = dirs.flatMap(agentPorts).filter(p => p >= FIRST_AGENT_PORT);
  return ports.length ? Math.max(...ports) + 1 : FIRST_AGENT_PORT;
}
