/**
 * The guided walkthrough: every input the flags did not supply is asked here, with what it
 * is for, its default, and — for the two opt-ins — what saying yes wires in.
 */
import * as p from '@clack/prompts';

import {
  CATALOG_KINDS,
  defaultDescription,
  titleCase,
  validateId,
  validatePort,
  validateRepoUrl,
  type CatalogKind,
  type PartialAnswers,
  type ScaffoldAnswers,
} from './answers.js';

export interface WalkthroughDefaults {
  port: number;
  repoUrl?: string;
}

function bail(): never {
  p.cancel('Nothing was written.');
  process.exit(1);
}

async function ask<T>(promise: Promise<T | symbol>): Promise<T> {
  const value = await promise;
  if (p.isCancel(value)) bail();
  return value as T;
}

export async function walkthrough(
  given: PartialAnswers,
  defaults: WalkthroughDefaults,
): Promise<ScaffoldAnswers> {
  p.intro('create-a2ui-agent');
  p.note(
    [
      'This scaffolds one vendor app on a2ui-agent-kit, in the shape the roster uses:',
      '',
      '  <id>/agent/            the A2A agent (Python, uv), all three run modes',
      '  <id>/<id>-catalog/     the A2UI catalog: schema + React implementation + Provider',
      '  <id>/manifest.json     the app manifest',
      '',
      'Every answer can also be a flag; run with --help to see them.',
    ].join('\n'),
    'What you will get',
  );

  const id =
    given.id ??
    (await ask(
      p.text({
        message: 'App id',
        placeholder: 'acme-mail',
        validate: value => validateId(value ?? ''),
      }),
    ));

  const displayName =
    given.displayName ??
    (await ask(
      p.text({
        message: 'Display name — the product name, as the agent card and catalog title show it',
        initialValue: titleCase(id),
        validate: value => (value?.trim() ? undefined : 'A display name is required.'),
      }),
    ));

  const description =
    given.description ??
    (await ask(
      p.text({
        message: "One-line description — what the agent can be asked for, in the user's words",
        initialValue: defaultDescription(displayName),
        validate: value => (value?.trim() ? undefined : 'A description is required.'),
      }),
    ));

  const port =
    given.port ??
    Number(
      await ask(
        p.text({
          message: 'Agent port — one port per app, in every run mode',
          initialValue: String(defaults.port),
          validate: value => validatePort(Number(value)),
        }),
      ),
    );

  const catalogKind =
    given.catalogKind ??
    (await ask(
      p.select<CatalogKind>({
        message: 'Catalog kind',
        options: [
          {
            value: 'basic',
            label: 'basic — the A2UI basic catalog under your product theme',
            hint: 'complete out of the box; you design the tokens and theme CSS',
          },
          {
            value: 'custom',
            label: 'custom — your own design system, one component at a time',
            hint: 'a package shell with one seed component; content comes later',
          },
        ],
        initialValue: CATALOG_KINDS[0],
      }),
    ));

  if (given.googleAdc === undefined) {
    p.note(
      [
        "Only for an MCP server that is Google's (Gmail, Calendar, ...). Saying yes wires the",
        "kit's Application Default Credentials helper into app/mcp.py: the developer mints ADC",
        'once with gcloud, the agent reads and refreshes it, and never holds a secret. Any other',
        'vendor answers no and supplies its own credential in .env.',
      ].join('\n'),
      'Google ADC',
    );
  }
  const googleAdc =
    given.googleAdc ??
    (await ask(
      p.confirm({message: 'Does this vendor authenticate with Google ADC?', initialValue: false}),
    ));

  if (given.ecosystemReady === undefined) {
    p.note(
      [
        "The kit's one shell convention, paintMeta: the agent titles every paint and declares",
        'question surfaces, and the A2UIVerse canvas uses both. Optional and degradable — an',
        'agent that never emits it still composes there, with generic titles. Saying yes adds',
        'the paint-title prompt block and a question policy to the config.',
      ].join('\n'),
      'A2UIVerse ecosystem',
    );
  }
  const ecosystemReady =
    given.ecosystemReady ??
    (await ask(
      p.confirm({
        message: 'Make the agent ready for the A2UIVerse ecosystem?',
        initialValue: false,
      }),
    ));

  const repoUrl =
    given.repoUrl ??
    (await ask(
      p.text({
        message: 'Repository URL — the catalog id is a URL to catalog.json inside this repository',
        initialValue: defaults.repoUrl ?? '',
        placeholder: 'https://github.com/you/your-apps',
        validate: value => validateRepoUrl(value ?? ''),
      }),
    ));

  return {id, displayName, description, port, catalogKind, googleAdc, ecosystemReady, repoUrl};
}

export async function askInstall(): Promise<boolean> {
  return ask(
    p.confirm({
      message: 'Install now? (uv sync for the agent, pnpm install for the catalog)',
      initialValue: true,
    }),
  );
}
