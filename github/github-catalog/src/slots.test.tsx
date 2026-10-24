/**
 * Each child a Primer parent routes by its type, through the real A2UI runtime with this catalog,
 * inside the Provider: `@a2ui/react` hands a component its children as their nodes' own ids, so a
 * parent reads each child's type from the child list its model holds, and builds only its own
 * children.
 */
import {cleanup, fireEvent, render, screen, within} from '@testing-library/react';
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
  return render(
    <Provider>
      <A2uiSurface surface={processor.model.getSurface('s')!} />
    </Provider>,
  );
}

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
});

/** Nothing the renderer draws in place of a child it could not build. */
function expectEveryChildBuilt(container: HTMLElement) {
  expect(container.textContent).not.toMatch(/Unresolved|Unknown component|\[Loading/);
}

describe('ActionList.Item', () => {
  const item = (id: string, label: string) => [
    {id, component: 'ActionList.Item', children: [`${id}-lv`, `${id}-label`]},
    {id: `${id}-lv`, component: 'ActionList.LeadingVisual', children: [`${id}-icon`]},
    {id: `${id}-icon`, component: 'Icon', name: 'repo'},
    {id: `${id}-label`, component: 'Text', text: label},
  ];

  it('puts its leading visual in its slot, beside the label rather than inside it', () => {
    const {container} = paint([
      {id: 'root', component: 'ActionList', children: ['pr']},
      ...item('pr', 'Pull requests'),
    ]);
    const visual = container.querySelector('[data-component="ActionList.LeadingVisual"]');
    expect(visual).not.toBeNull();
    expect(visual!.closest('[data-component="ActionList.Item.Label"]')).toBeNull();
    expectEveryChildBuilt(container);
  });

  it('does so in every instance of a template', () => {
    const {container} = paint(
      [
        {id: 'root', component: 'ActionList', children: {componentId: 'row', path: '/rows'}},
        ...item('row', 'Row'),
      ],
      {rows: [{}, {}]},
    );
    const visuals = container.querySelectorAll('[data-component="ActionList.LeadingVisual"]');
    expect(visuals).toHaveLength(2);
    for (const visual of visuals)
      expect(visual.closest('[data-component="ActionList.Item.Label"]')).toBeNull();
  });
});

describe('FormControl', () => {
  it('labels its input with its label, its caption after the input', () => {
    const {container} = paint(
      [
        {id: 'root', component: 'FormControl', children: ['label', 'caption', 'input']},
        {id: 'label', component: 'FormControlLabel', text: 'Comment'},
        {id: 'caption', component: 'FormControlCaption', text: 'Markdown is supported.'},
        {id: 'input', component: 'TextInput', value: {path: '/comment'}},
      ],
      {comment: ''},
    );
    const input = screen.getByLabelText('Comment');
    const caption = screen.getByText('Markdown is supported.');
    expect(input.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/FormControl\.Label/);
    expectEveryChildBuilt(container);
  });
});

describe('NavList.Item', () => {
  it('nests its sub-navigation, each sub-item built', () => {
    const {container} = paint([
      {id: 'root', component: 'NavList', children: ['item']},
      {id: 'item', component: 'NavList.Item', children: ['item-label', 'sub']},
      {id: 'item-label', component: 'Text', text: 'Settings'},
      {id: 'sub', component: 'NavList.SubNav', children: ['sub-item']},
      {id: 'sub-item', component: 'NavList.Item', href: '#profile', children: ['sub-label']},
      {id: 'sub-label', component: 'Text', text: 'Profile'},
    ]);
    // The item opens and closes its sub-navigation, which lists the sub-item under it.
    expect(screen.getByText('Settings').closest('[aria-expanded]')).not.toBeNull();
    const profile = screen.getByText('Profile');
    expect(profile.closest('li')?.parentElement?.closest('li')).not.toBeNull();
    expectEveryChildBuilt(container);
  });
});

describe('TreeViewItem', () => {
  it('shows its leading visual with the icon built inside', () => {
    const {container} = paint([
      {id: 'root', component: 'TreeView', children: ['dir'], accessibility: {label: 'Files'}},
      {id: 'dir', component: 'TreeViewItem', children: ['dir-lv', 'dir-label']},
      {id: 'dir-lv', component: 'TreeViewLeadingVisual', child: 'dir-icon', label: 'Folder'},
      {id: 'dir-icon', component: 'Icon', name: 'repo'},
      {id: 'dir-label', component: 'Text', text: 'src'},
    ]);
    const icon = screen.getByRole('treeitem').querySelector('svg');
    expect(icon).not.toBeNull();
    // In the item's visual slot, ahead of its text rather than inside it.
    expect(icon!.closest('[class*="TreeViewItemVisual"]')).not.toBeNull();
    expect(icon!.closest('[class*="TreeViewItemContentText"]')).toBeNull();
    expectEveryChildBuilt(container);
  });
});

describe('SelectPanel', () => {
  it('lists its items, each with its visual', () => {
    const {container} = paint(
      [
        {
          id: 'root',
          component: 'SelectPanel',
          anchor: 'anchor',
          open: true,
          title: 'Labels',
          children: ['bug', 'docs'],
        },
        {id: 'anchor', component: 'Button', child: 'anchor-text', action: {event: {name: 'pick'}}},
        {id: 'anchor-text', component: 'Text', text: 'Pick labels'},
        {id: 'bug', component: 'SelectPanel.Item', text: 'bug', leadingVisual: 'bug-icon'},
        {id: 'bug-icon', component: 'Icon', name: 'bug'},
        {id: 'docs', component: 'SelectPanel.Item', text: 'documentation'},
      ],
      {},
    );
    const bug = screen.getByText('bug');
    expect(screen.getByText('documentation')).toBeInTheDocument();
    expect(bug.closest('li')?.querySelector('svg')).not.toBeNull();
    expectEveryChildBuilt(container);
  });
});

describe('ActionMenu', () => {
  it('takes its button as the anchor that opens it', () => {
    const {container} = paint([
      {id: 'root', component: 'ActionMenu', children: ['button', 'overlay']},
      {id: 'button', component: 'ActionMenu.Button', child: 'button-text'},
      {id: 'button-text', component: 'Text', text: 'Options'},
      {id: 'overlay', component: 'ActionMenu.Overlay', children: ['list']},
      {id: 'list', component: 'ActionList', children: ['copy']},
      {id: 'copy', component: 'ActionList.Item', children: ['copy-label']},
      {id: 'copy-label', component: 'Text', text: 'Copy link'},
    ]);
    // Primer wires the anchor on the element around the button.
    const anchor = screen.getByRole('button', {name: 'Options'}).closest('[aria-haspopup="true"]');
    expect(anchor).not.toBeNull();
    fireEvent.click(anchor!);
    expect(screen.getByText('Copy link')).toBeInTheDocument();
    expectEveryChildBuilt(container);
  });
});

describe('ActionBar.Menu', () => {
  it('shows a trailing visual that names an icon as the icon, and one that is text as text', () => {
    const {container} = paint([
      {id: 'root', component: 'ActionBar', children: ['menu'], accessibility: {label: 'Tools'}},
      {
        id: 'menu',
        component: 'ActionBar.Menu',
        icon: 'menu-icon',
        accessibility: {label: 'More'},
        items: [
          {label: 'Pin', trailingVisual: 'pin-icon'},
          {label: 'Copy', trailingVisual: '⌘C'},
        ],
      },
      {id: 'menu-icon', component: 'Icon', name: 'kebab-horizontal'},
      {id: 'pin-icon', component: 'Icon', name: 'pin'},
    ]);
    fireEvent.click(screen.getByRole('button', {name: 'More'}));
    const menu = screen.getByRole('menu');
    const pin = within(menu).getByText('Pin').closest('li')!;
    expect(pin.querySelector('svg')).not.toBeNull();
    expect(within(menu).getByText('⌘C')).toBeInTheDocument();
    expect(menu.textContent).not.toMatch(/a2ui-n\d|pin-icon/);
    expectEveryChildBuilt(container);
  });

  it('shows the icon of an entry inside a submenu', () => {
    paint([
      {id: 'root', component: 'ActionBar', children: ['menu'], accessibility: {label: 'Tools'}},
      {
        id: 'menu',
        component: 'ActionBar.Menu',
        icon: 'menu-icon',
        accessibility: {label: 'More'},
        items: [{label: 'Move', items: [{label: 'Archive', leadingVisual: 'archive-icon'}]}],
      },
      {id: 'menu-icon', component: 'Icon', name: 'kebab-horizontal'},
      {id: 'archive-icon', component: 'Icon', name: 'archive'},
    ]);
    fireEvent.click(screen.getByRole('button', {name: 'More'}));
    fireEvent.click(within(screen.getByRole('menu')).getByText('Move'));
    const archive = screen.getByText('Archive').closest('li')!;
    expect(archive.querySelector('svg')).not.toBeNull();
    expect(archive.textContent).not.toMatch(/Unresolved/);
  });
});
