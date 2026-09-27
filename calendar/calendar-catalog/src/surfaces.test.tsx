/**
 * Every surface the agent paints — its knowledge examples and its deterministic answers —
 * rendered through the real A2UI runtime with this catalog, inside the Provider.
 */
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {render} from '@testing-library/react';
import {A2uiSurface} from '@a2ui/react/v0_9';
import {MessageProcessor, type A2uiMessage} from '@a2ui/web_core/v0_9';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CATALOG} from './catalog';
import {Provider} from './provider';

// Paths from the package root (vitest's cwd).
const AGENT = '../agent/app';
const EXAMPLES = join(AGENT, 'knowledge/examples');
const DETERMINISTIC = join(AGENT, 'fixtures/deterministic');

type Message = Record<string, unknown>;

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as unknown;

const surfaces: [string, Message[]][] = [
  ...readdirSync(EXAMPLES).map(
    file =>
      [`example ${file}`, (read(join(EXAMPLES, file)) as {messages: Message[]}).messages] as [
        string,
        Message[],
      ],
  ),
  ...readdirSync(DETERMINISTIC).map(
    file =>
      [`deterministic ${file}`, read(join(DETERMINISTIC, file)) as Message[]] as [
        string,
        Message[],
      ],
  ),
];

/**
 * The messages on one surface id, as the kit stamps them. An action's answer updates a surface the
 * client already holds, so one is created for it first.
 */
function stamp(messages: Message[], surfaceId: string): A2uiMessage[] {
  const created = messages.some(message => 'createSurface' in message);
  const opening = created ? [] : [{version: 'v0.9', createSurface: {catalogId: CATALOG.id}}];
  return [...opening, ...messages].map(message => {
    const [key] = Object.keys(message).filter(k => k !== 'version');
    const body = (message as Record<string, object>)[key];
    return {...message, [key]: {...body, surfaceId}} as unknown as A2uiMessage;
  });
}

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  errors.mockRestore();
});

describe.each(surfaces)('%s', (_, messages) => {
  it('renders its root surface with no error', () => {
    const processor = new MessageProcessor([CATALOG], async () => {});
    processor.processMessages(stamp(messages, 's1'));
    const surface = processor.model.getSurface('s1')!;
    const view = render(
      <Provider>
        <A2uiSurface surface={surface} />
      </Provider>,
    );
    expect(view.container.querySelector('.gc-surface')).not.toBeNull();
    expect(view.container.textContent?.length).toBeGreaterThan(5);
    expect(errors).not.toHaveBeenCalled();
  });
});
