import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog, type ReactComponentImplementation} from '@a2ui/react/v0_9';
import {CATALOG_ID} from './catalog-id.js';
import {Avatar, AvatarApi} from './components/avatar/index.js';
import {Button, ButtonApi} from './components/button/index.js';
import {Chip, ChipApi} from './components/chip/index.js';
import {Divider, DividerApi} from './components/divider/index.js';
import {Icon, IconApi} from './components/icon/index.js';
import {List, ListApi} from './components/list/index.js';
import {ListGroup, ListGroupApi} from './components/list-group/index.js';
import {ListItem, ListItemApi} from './components/list-item/index.js';
import {Markdown, MarkdownApi} from './components/markdown/index.js';
import {Panel, PanelApi} from './components/panel/index.js';
import {PriorityIcon, PriorityIconApi} from './components/priority-icon/index.js';
import {Property, PropertyApi} from './components/property/index.js';
import {Section, SectionApi} from './components/section/index.js';
import {Stack, StackApi} from './components/stack/index.js';
import {StatusIcon, StatusIconApi} from './components/status-icon/index.js';
import {Text, TextApi} from './components/text/index.js';
import {ViewHeader, ViewHeaderApi} from './components/view-header/index.js';

/** Every component's props schema, by name — what `catalogs/v0.9.1/catalog.json` declares. */
export const COMPONENT_APIS = {
  Panel: PanelApi,
  Stack: StackApi,
  Divider: DividerApi,
  ViewHeader: ViewHeaderApi,
  Section: SectionApi,
  Text: TextApi,
  Markdown: MarkdownApi,
  Button: ButtonApi,
  List: ListApi,
  ListGroup: ListGroupApi,
  ListItem: ListItemApi,
  Property: PropertyApi,
  Chip: ChipApi,
  Avatar: AvatarApi,
  Icon: IconApi,
  StatusIcon: StatusIconApi,
  PriorityIcon: PriorityIconApi,
} as const;

/**
 * Linear's runtime catalog: its own components, and the basic catalog's functions as
 * `@a2ui/react` implements them.
 */
export const CATALOG = new Catalog<ReactComponentImplementation>(
  CATALOG_ID,
  [
    Panel,
    Stack,
    Divider,
    ViewHeader,
    Section,
    Text,
    Markdown,
    Button,
    List,
    ListGroup,
    ListItem,
    Property,
    Chip,
    Avatar,
    Icon,
    StatusIcon,
    PriorityIcon,
  ],
  [...basicCatalog.functions.values()],
);
