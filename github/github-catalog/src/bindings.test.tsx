/**
 * Each property declared as a union of a value and a data binding, through the real A2UI runtime
 * with this catalog, inside the Provider: written as a value, the component receives that value;
 * written as a binding, it receives the bound value, and a write goes back to the bound path.
 */
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {A2uiSurface} from '@a2ui/react/v0_9';
import {MessageProcessor, type A2uiMessage} from '@a2ui/web_core/v0_9';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {CATALOG} from './catalog';
import {Provider} from './provider';

type Component = Record<string, unknown>;

/** One surface painted with these components over this data, rendered as the client renders it. */
function paint(components: Component[], data: Record<string, unknown> = {}) {
  const processor = new MessageProcessor([CATALOG], async () => {});
  processor.processMessages([
    {version: 'v0.9', createSurface: {surfaceId: 's', catalogId: CATALOG.id}},
    {version: 'v0.9', updateDataModel: {surfaceId: 's', path: '/', value: data}},
    {version: 'v0.9', updateComponents: {surfaceId: 's', components}},
  ] as unknown as A2uiMessage[]);
  const surface = processor.model.getSurface('s')!;
  return {
    ...render(
      <Provider>
        <A2uiSurface surface={surface} />
      </Provider>,
    ),
    dataModel: surface.dataModel,
  };
}

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
});

/** The validation status Primer draws on the message showing this text. */
function statusOf(text: string) {
  return screen
    .getAllByText(text)
    .map(node => node.closest('[data-validation-status]')?.getAttribute('data-validation-status'))
    .find(Boolean);
}

const validations: [string, (variant: unknown) => Component[]][] = [
  [
    'FormControlValidation',
    variant => [
      {id: 'root', component: 'FormControl', children: ['label', 'input', 'validation']},
      {id: 'label', component: 'FormControlLabel', text: 'Name'},
      {id: 'input', component: 'TextInput', value: {path: '/name'}},
      {id: 'validation', component: 'FormControlValidation', text: 'Checked', variant},
    ],
  ],
  [
    'RadioGroupValidation',
    variant => [
      {
        id: 'root',
        component: 'RadioGroup',
        name: 'size',
        children: ['label', 'small', 'validation'],
      },
      {id: 'label', component: 'RadioGroupLabel', text: 'Size'},
      {id: 'small', component: 'Radio', value: 'small', accessibility: {label: 'Small'}},
      {id: 'validation', component: 'RadioGroupValidation', text: 'Checked', variant},
    ],
  ],
  [
    'CheckboxGroupValidation',
    variant => [
      {id: 'root', component: 'CheckboxGroup', children: ['label', 'box', 'validation']},
      {id: 'label', component: 'CheckboxGroupLabel', text: 'Topics'},
      {id: 'box', component: 'Checkbox', checked: false, accessibility: {label: 'Docs'}},
      {id: 'validation', component: 'CheckboxGroupValidation', text: 'Checked', variant},
    ],
  ],
];

describe.each(validations)('%s.variant', (_name, tree) => {
  it('takes a variant written as a value', () => {
    paint(tree('success'));
    expect(statusOf('Checked')).toBe('success');
  });

  it('takes a variant bound to the data model', () => {
    paint(tree({path: '/status'}), {status: 'error'});
    expect(statusOf('Checked')).toBe('error');
  });
});

describe('Autocomplete.Menu.selectedItemIds', () => {
  const tree = (selectedItemIds: unknown): Component[] => [
    {id: 'root', component: 'Autocomplete', children: ['input', 'overlay']},
    {id: 'input', component: 'Autocomplete.Input', accessibility: {label: 'Labels'}},
    {id: 'overlay', component: 'Autocomplete.Overlay', children: ['menu']},
    {
      id: 'menu',
      component: 'Autocomplete.Menu',
      selectionVariant: 'multiple',
      selectedItemIds,
      items: [
        {id: 'bug', text: 'bug'},
        {id: 'docs', text: 'documentation'},
      ],
      accessibility: {label: 'Labels'},
    },
  ];

  /** Opens the menu and returns whether each item is drawn selected. */
  function selection() {
    fireEvent.focus(screen.getByRole('combobox'));
    return ['bug', 'documentation'].map(
      text =>
        screen.getByText(text).closest('[role="option"]')?.getAttribute('aria-selected') === 'true',
    );
  }

  it('takes a selection written as a list', () => {
    paint(tree(['docs']));
    expect(selection()).toEqual([false, true]);
  });

  it('takes a selection bound to the data model and writes a pick back to it', () => {
    const {dataModel} = paint(tree({path: '/picked'}), {picked: ['bug']});
    expect(selection()).toEqual([true, false]);
    fireEvent.click(screen.getByText('documentation'));
    expect(dataModel.get('/picked')).toEqual(['bug', 'docs']);
  });
});
