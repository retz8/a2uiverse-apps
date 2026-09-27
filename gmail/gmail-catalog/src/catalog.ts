import {Catalog} from '@a2ui/web_core/v0_9';
import {basicCatalog, type ReactComponentImplementation} from '@a2ui/react/v0_9';
import {CATALOG_ID} from './catalog-id.js';
import {Avatar, AvatarApi} from './components/avatar/index.js';
import {Button, ButtonApi} from './components/button/index.js';
import {Card, CardApi} from './components/card/index.js';
import {Checkbox, CheckboxApi} from './components/checkbox/index.js';
import {Chip, ChipApi} from './components/chip/index.js';
import {Divider, DividerApi} from './components/divider/index.js';
import {Icon, IconApi} from './components/icon/index.js';
import {IconButton, IconButtonApi} from './components/icon-button/index.js';
import {List, ListApi} from './components/list/index.js';
import {ListItem, ListItemApi} from './components/list-item/index.js';
import {NavigationItem, NavigationItemApi} from './components/navigation-item/index.js';
import {Stack, StackApi} from './components/stack/index.js';
import {Surface, SurfaceApi} from './components/surface/index.js';
import {Tag, TagApi} from './components/tag/index.js';
import {Text, TextApi} from './components/text/index.js';
import {TextField, TextFieldApi} from './components/text-field/index.js';

/** Every component's props schema, by name — what `catalogs/v0.9.1/catalog.json` declares. */
export const COMPONENT_APIS = {
  Surface: SurfaceApi,
  Card: CardApi,
  Stack: StackApi,
  Divider: DividerApi,
  Text: TextApi,
  Icon: IconApi,
  Button: ButtonApi,
  IconButton: IconButtonApi,
  Chip: ChipApi,
  Tag: TagApi,
  Avatar: AvatarApi,
  List: ListApi,
  ListItem: ListItemApi,
  NavigationItem: NavigationItemApi,
  TextField: TextFieldApi,
  Checkbox: CheckboxApi,
} as const;

/**
 * Gmail's runtime catalog: its own Material 3 components, and the basic catalog's functions as
 * `@a2ui/react` implements them.
 */
export const CATALOG = new Catalog<ReactComponentImplementation>(
  CATALOG_ID,
  [
    Surface,
    Card,
    Stack,
    Divider,
    Text,
    Icon,
    Button,
    IconButton,
    Chip,
    Tag,
    Avatar,
    List,
    ListItem,
    NavigationItem,
    TextField,
    Checkbox,
  ],
  [...basicCatalog.functions.values()],
);
