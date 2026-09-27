import {Stack, StackApi} from './stack/index.js';
import {Panel, PanelApi} from './panel/index.js';
import {Heading, HeadingApi} from './heading/index.js';
import {Text, TextApi} from './text/index.js';
import {Link, LinkApi} from './link/index.js';
import {Button, ButtonApi} from './button/index.js';
import {StatusBadge, StatusBadgeApi} from './status-badge/index.js';
import {StatusIcon, StatusIconApi} from './status-icon/index.js';
import {List, ListApi} from './list/index.js';
import {ListItem, ListItemApi} from './list-item/index.js';
import {Field, FieldApi} from './field/index.js';
import {Divider, DividerApi} from './divider/index.js';
import {LogBlock, LogBlockApi} from './log-block/index.js';
import {LogLine, LogLineApi} from './log-line/index.js';

/** Every component's implementation, in the order `catalog.json` declares them. */
export const COMPONENTS = [
  Stack,
  Panel,
  Heading,
  Text,
  Link,
  Button,
  StatusBadge,
  StatusIcon,
  List,
  ListItem,
  Field,
  Divider,
  LogBlock,
  LogLine,
];

/** Every component's props schema, by name — what `catalog.json` is checked against. */
export const COMPONENT_APIS = {
  Stack: StackApi,
  Panel: PanelApi,
  Heading: HeadingApi,
  Text: TextApi,
  Link: LinkApi,
  Button: ButtonApi,
  StatusBadge: StatusBadgeApi,
  StatusIcon: StatusIconApi,
  List: ListApi,
  ListItem: ListItemApi,
  Field: FieldApi,
  Divider: DividerApi,
  LogBlock: LogBlockApi,
  LogLine: LogLineApi,
} as const;
