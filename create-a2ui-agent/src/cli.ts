#!/usr/bin/env node
/**
 * `create-a2ui-agent [dir] [flags]` — flags with a guided walkthrough as fallback.
 *
 * Any input given as a flag is taken as is; anything missing is asked. `--yes` (or a
 * non-TTY stdin) takes the defaults where one exists and fails on the rest, which is how
 * scripts and tests drive it.
 */
import * as p from '@clack/prompts';
import {Command, InvalidArgumentError, Option} from 'commander';
import {dirname, relative, resolve} from 'node:path';

import {
  catalogPackageName,
  defaultDescription,
  normalizeRepoUrl,
  titleCase,
  validateId,
  validatePort,
  validateRepoUrl,
  type CatalogKind,
  type PartialAnswers,
  type ScaffoldAnswers,
} from './answers.js';
import {originUrl, repoToplevel} from './git.js';
import {describe, installSteps, runStep} from './install.js';
import {resolveKitPin} from './kit.js';
import {suggestPort} from './ports.js';
import {askInstall, walkthrough} from './prompts.js';
import {scaffold} from './scaffold.js';

interface Flags {
  id?: string;
  displayName?: string;
  description?: string;
  port?: number;
  catalog?: CatalogKind;
  googleAdc?: boolean;
  ecosystem?: boolean;
  repoUrl?: string;
  kitRev?: string;
  install?: boolean;
  yes?: boolean;
}

function parsePort(value: string): number {
  const port = Number(value);
  const problem = validatePort(port);
  if (problem) throw new InvalidArgumentError(problem);
  return port;
}

function parseId(value: string): string {
  const problem = validateId(value);
  if (problem) throw new InvalidArgumentError(problem);
  return value;
}

/** Fills every missing answer from its default; reports the ones that have none. */
function fillDefaults(
  given: PartialAnswers,
  defaults: {port: number; repoUrl?: string},
): {answers?: ScaffoldAnswers; missing: string[]} {
  const missing: string[] = [];
  if (!given.id) missing.push('--id');
  const repoUrl = given.repoUrl ?? defaults.repoUrl;
  if (!repoUrl) missing.push('--repo-url (no git origin to derive it from)');
  if (missing.length || !given.id || !repoUrl) return {missing};
  const displayName = given.displayName ?? titleCase(given.id);
  return {
    missing,
    answers: {
      id: given.id,
      displayName,
      description: given.description ?? defaultDescription(displayName),
      port: given.port ?? defaults.port,
      catalogKind: given.catalogKind ?? 'basic',
      googleAdc: given.googleAdc ?? false,
      ecosystemReady: given.ecosystemReady ?? false,
      repoUrl,
    },
  };
}

async function main(dirArg: string | undefined, flags: Flags): Promise<void> {
  const given: PartialAnswers = {
    id: flags.id,
    displayName: flags.displayName,
    description: flags.description,
    port: flags.port,
    catalogKind: flags.catalog,
    googleAdc: flags.googleAdc,
    ecosystemReady: flags.ecosystem,
    repoUrl: flags.repoUrl ? normalizeRepoUrl(flags.repoUrl) : undefined,
  };
  if (given.repoUrl) {
    const problem = validateRepoUrl(given.repoUrl);
    if (problem) throw new Error(problem);
  }

  const cwd = process.cwd();
  const parentDir = dirArg ? dirname(resolve(cwd, dirArg)) : cwd;
  const origin = originUrl(parentDir);
  const defaults = {
    port: suggestPort([cwd, parentDir]),
    repoUrl: origin ? normalizeRepoUrl(origin) : undefined,
  };

  const nonInteractive = flags.yes || !process.stdin.isTTY;
  let answers: ScaffoldAnswers;
  if (nonInteractive) {
    const filled = fillDefaults(given, defaults);
    if (!filled.answers) {
      throw new Error(`Non-interactive run is missing: ${filled.missing.join(', ')}.`);
    }
    answers = filled.answers;
  } else {
    answers = await walkthrough(given, defaults);
  }

  const targetDir = resolve(cwd, dirArg ?? answers.id);
  const repoRoot = repoToplevel(dirname(targetDir)) ?? dirname(targetDir);
  const repoDirectory = relative(repoRoot, resolve(targetDir, catalogPackageName(answers.id)));

  const pin = resolveKitPin(flags.kitRev);
  for (const warning of pin.warnings) p.log.warn(warning);

  const result = scaffold({answers, targetDir, repoDirectory, kitRev: pin.rev});
  p.log.success(
    `Wrote ${result.files.length} files to ${relative(cwd, targetDir) || '.'} ` +
      `(kit pinned at ${pin.rev.slice(0, 12)}).`,
  );
  p.log.info(`Catalog id: ${result.catalogId}`);

  const install = flags.install ?? (nonInteractive ? false : await askInstall());
  const steps = installSteps(targetDir, catalogPackageName(answers.id));
  if (install) {
    for (const step of steps) {
      const spinner = p.spinner();
      spinner.start(`${step.label} — ${describe(step, cwd)}`);
      const {ok, output} = runStep(step);
      if (ok) {
        spinner.stop(`${step.label} ✓`);
      } else {
        spinner.stop(`${step.label} failed`);
        p.log.error(output.trim());
        throw new Error(`${describe(step, cwd)} failed; fix the cause and run it by hand.`);
      }
    }
  }

  const agentRel = relative(cwd, resolve(targetDir, 'agent')) || 'agent';
  p.note(
    [
      ...(install ? [] : steps.map(step => describe(step, cwd)).concat('')),
      `cd ${agentRel} && uv run pytest              # green on a fresh scaffold`,
      `cd ${agentRel} && uv run python -m app --mode deterministic`,
      '',
      'Then fill the TODO markers: prompt prose (app/prose.py), the domain doc and brand',
      'guidance (app/knowledge/), the stub tools and fixtures (app/tools.py), and the live',
      'MCP wiring (app/mcp.py). The README in agent/ walks through each.',
    ].join('\n'),
    'Next steps',
  );
  p.outro(`${answers.displayName} is scaffolded.`);
}

const program = new Command('create-a2ui-agent')
  .description('Scaffold a new A2UI over A2A vendor app on a2ui-agent-kit.')
  .argument('[dir]', 'directory to create (default: ./<id>)')
  .option('--id <id>', 'kebab-case app id', parseId)
  .option('--display-name <name>', 'product name for the card and catalog title')
  .option('--description <text>', 'one-line description for the agent card')
  .option('--port <port>', 'agent port (default: next free above sibling manifests)', parsePort)
  .addOption(new Option('--catalog <kind>', 'catalog kind').choices(['basic', 'custom']))
  .option('--google-adc', "wire the kit's Google ADC credential block into app/mcp.py")
  .option('--no-google-adc', 'skip the Google ADC block')
  .option('--ecosystem', 'emit the paintMeta shell convention for the A2UIVerse canvas')
  .option('--no-ecosystem', 'skip the paintMeta convention')
  .option('--repo-url <url>', 'repository the app lives in (default: git origin of the target)')
  .option('--kit-rev <sha>', 'kit commit to pin (default: HEAD of the checkout this runs from)')
  .option('--install', 'run uv sync and pnpm install after writing')
  .option('--no-install', 'skip the install step')
  .option('-y, --yes', 'no prompts: take every default, fail on inputs that have none')
  .action(async (dir: string | undefined, flags: Flags) => {
    try {
      await main(dir, flags);
    } catch (error) {
      p.log.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
