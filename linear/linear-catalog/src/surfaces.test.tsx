/**
 * Every surface the Linear agent paints — its knowledge examples and its deterministic answers —
 * rendered through the real A2UI runtime with this catalog, inside the Provider.
 */
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {act, fireEvent, render} from '@testing-library/react';
import {A2uiSurface} from '@a2ui/react/v0_9';
import {MessageProcessor, type A2uiMessage} from '@a2ui/web_core/v0_9';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CATALOG} from './catalog';
import {Provider} from './provider';

// Paths from the package root (vitest's cwd).
const AGENT = '../agent/app';
const EXAMPLES = join(AGENT, 'knowledge/examples');
const DETERMINISTIC = join(AGENT, 'fixtures/deterministic');

type Message = Record<string, Record<string, unknown>>;

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as unknown;

const surfaces: [string, Message[]][] = [
  ...readdirSync(EXAMPLES).map(
    file =>
      [`example ${file}`, (read(join(EXAMPLES, file)) as {messages: Message[]}).messages] as [
        string,
        Message[],
      ],
  ),
  ...['my-issues.json', 'open-issue.json'].map(
    file =>
      [`deterministic ${file}`, read(join(DETERMINISTIC, file)) as Message[]] as [
        string,
        Message[],
      ],
  ),
];

/** The messages on one surface id, as the kit stamps them. */
function stamp(messages: Message[], surfaceId: string): A2uiMessage[] {
  return messages.map(message => {
    const [key] = Object.keys(message).filter(k => k !== 'version');
    return {...message, [key]: {...message[key], surfaceId}} as unknown as A2uiMessage;
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
  function paint() {
    const actions: unknown[] = [];
    const processor = new MessageProcessor([CATALOG], async action => {
      actions.push(action);
    });
    processor.processMessages(stamp(messages, 's1'));
    const surface = processor.model.getSurface('s1')!;
    const view = render(
      <Provider>
        <A2uiSurface surface={surface} />
      </Provider>,
    );
    return {view, actions};
  }

  it('renders inside one panel with no error', () => {
    const {view} = paint();
    expect(view.container.querySelectorAll('.lc-panel')).toHaveLength(1);
    expect(view.container.querySelector('.lc-panel')?.textContent?.length).toBeGreaterThan(20);
    expect(errors).not.toHaveBeenCalled();
  });

  it('binds every glyph to a named value', () => {
    const {view} = paint();
    for (const glyph of view.container.querySelectorAll('.lc-status, .lc-priority')) {
      expect(glyph.getAttribute('aria-label')).toBeTruthy();
    }
  });

  it('sends each row’s own target when a row is pressed', async () => {
    const {view, actions} = paint();
    const rows = view.container.querySelectorAll('.lc-row[data-interactive]');
    if (rows.length === 0) return;
    await act(async () => {
      fireEvent.click(rows[rows.length - 1]);
    });
    expect(actions).toHaveLength(1);
    expect(JSON.stringify(actions[0])).toContain('open-issue');
  });
});
