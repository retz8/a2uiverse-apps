import {Catalog} from '@a2ui/web_core/v0_9';
import type {ReactComponentImplementation} from '@a2ui/react/v0_9';
import {CATALOG_ID} from './catalog-id.js';
import {TextComponent} from './components/text/index.js';
import {ButtonComponent} from './components/button/index.js';
import {IconButtonComponent} from './components/iconbutton/index.js';
import {IconComponent} from './components/icon/index.js';
import {LinkComponent} from './components/link/index.js';
import {HeadingComponent} from './components/heading/index.js';
import {BranchNameComponent} from './components/branchname/index.js';
import {RelativeTimeComponent} from './components/relative-time/index.js';
import {LabelComponent} from './components/label/index.js';
import {StateLabelComponent} from './components/statelabel/index.js';
import {CounterLabelComponent} from './components/counterlabel/index.js';
import {AvatarComponent} from './components/avatar/index.js';
import {SpinnerComponent} from './components/spinner/index.js';
import {TokenComponent} from './components/token/index.js';
import {IssueLabelTokenComponent} from './components/issuelabeltoken/index.js';
import {CheckboxComponent} from './components/checkbox/index.js';
import {ProgressBarComponent} from './components/progressbar/index.js';
import {RadioComponent} from './components/radio/index.js';
import {ToggleSwitchComponent} from './components/toggleswitch/index.js';
import {TextareaComponent} from './components/textarea/index.js';
import {TextInputComponent} from './components/textinput/index.js';
import {TextInputActionComponent} from './components/textinput-action/index.js';
import {SkeletonBoxComponent} from './components/skeletonbox/index.js';
import {TruncateComponent} from './components/truncate/index.js';
import {KeybindingHintComponent} from './components/keybindinghint/index.js';
import {StackComponent} from './components/stack/index.js';
import {StackItemComponent} from './components/stackitem/index.js';
import {LabelGroupComponent} from './components/label-group/index.js';
import {AvatarStackComponent} from './components/avatarstack/index.js';
import {ButtonGroupComponent} from './components/buttongroup/index.js';
import {PaginationComponent} from './components/pagination/index.js';
import {SegmentedControlComponent} from './components/segmentedcontrol/index.js';
import {SegmentedControlButtonComponent} from './components/segmentedcontrolbutton/index.js';
import {SegmentedControlIconButtonComponent} from './components/segmentedcontroliconbutton/index.js';
import {DetailsComponent} from './components/details/index.js';
import {SelectComponent} from './components/select/index.js';
import {SelectOptionComponent} from './components/selectoption/index.js';
import {SelectOptGroupComponent} from './components/selectoptgroup/index.js';
import {BreadcrumbsComponent} from './components/breadcrumbs/index.js';
import {BreadcrumbsItemComponent} from './components/breadcrumbsitem/index.js';
import {NavListComponent} from './components/navlist/index.js';
import {NavListItemComponent} from './components/navlist-item/index.js';
import {NavListSubNavComponent} from './components/navlist-subnav/index.js';
import {NavListLeadingVisualComponent} from './components/navlist-leadingvisual/index.js';
import {NavListTrailingVisualComponent} from './components/navlist-trailingvisual/index.js';
import {NavListTrailingActionComponent} from './components/navlist-trailingaction/index.js';
import {NavListGroupComponent} from './components/navlist-group/index.js';
import {NavListGroupHeadingComponent} from './components/navlist-groupheading/index.js';
import {NavListDividerComponent} from './components/navlist-divider/index.js';
import {NavListDescriptionComponent} from './components/navlist-description/index.js';
import {NavListGroupExpandComponent} from './components/navlist-groupexpand/index.js';
import {PageLayoutComponent} from './components/pagelayout/index.js';
import {PageLayoutHeaderComponent} from './components/pagelayout-header/index.js';
import {PageLayoutContentComponent} from './components/pagelayout-content/index.js';
import {PageLayoutPaneComponent} from './components/pagelayout-pane/index.js';
import {PageLayoutSidebarComponent} from './components/pagelayout-sidebar/index.js';
import {PageLayoutFooterComponent} from './components/pagelayout-footer/index.js';
import {SplitPageLayoutComponent} from './components/split-page-layout/index.js';
import {SplitPageLayoutHeaderComponent} from './components/split-page-layout-header/index.js';
import {SplitPageLayoutContentComponent} from './components/split-page-layout-content/index.js';
import {SplitPageLayoutPaneComponent} from './components/split-page-layout-pane/index.js';
import {SplitPageLayoutSidebarComponent} from './components/split-page-layout-sidebar/index.js';
import {SplitPageLayoutFooterComponent} from './components/split-page-layout-footer/index.js';
import {PageHeaderComponent} from './components/pageheader/index.js';
import {PageHeaderContextAreaComponent} from './components/pageheader-contextarea/index.js';
import {PageHeaderParentLinkComponent} from './components/pageheader-parentlink/index.js';
import {PageHeaderContextBarComponent} from './components/pageheader-contextbar/index.js';
import {PageHeaderContextAreaActionsComponent} from './components/pageheader-contextareaactions/index.js';
import {PageHeaderTitleAreaComponent} from './components/pageheader-titlearea/index.js';
import {PageHeaderLeadingActionComponent} from './components/pageheader-leadingaction/index.js';
import {PageHeaderLeadingVisualComponent} from './components/pageheader-leadingvisual/index.js';
import {PageHeaderTitleComponent} from './components/pageheader-title/index.js';
import {PageHeaderTrailingVisualComponent} from './components/pageheader-trailingvisual/index.js';
import {PageHeaderTrailingActionComponent} from './components/pageheader-trailingaction/index.js';
import {PageHeaderActionsComponent} from './components/pageheader-actions/index.js';
import {PageHeaderBreadcrumbsComponent} from './components/pageheader-breadcrumbs/index.js';
import {PageHeaderDescriptionComponent} from './components/pageheader-description/index.js';
import {PageHeaderNavigationComponent} from './components/pageheader-navigation/index.js';
import {ActionListComponent} from './components/actionlist/index.js';
import {ActionListItemComponent} from './components/actionlist-item/index.js';
import {ActionListLinkItemComponent} from './components/actionlist-linkitem/index.js';
import {ActionListGroupComponent} from './components/actionlist-group/index.js';
import {ActionListGroupHeadingComponent} from './components/actionlist-groupheading/index.js';
import {ActionListLeadingVisualComponent} from './components/actionlist-leadingvisual/index.js';
import {ActionListTrailingVisualComponent} from './components/actionlist-trailingvisual/index.js';
import {ActionListDescriptionComponent} from './components/actionlist-description/index.js';
import {ActionListDividerComponent} from './components/actionlist-divider/index.js';
import {ActionListTrailingActionComponent} from './components/actionlist-trailingaction/index.js';
import {ActionListHeadingComponent} from './components/actionlist-heading/index.js';
import {ActionBarComponent} from './components/actionbar/index.js';
import {ActionBarIconButtonComponent} from './components/actionbar-iconbutton/index.js';
import {ActionBarDividerComponent} from './components/actionbar-divider/index.js';
import {ActionBarGroupComponent} from './components/actionbar-group/index.js';
import {ActionBarMenuComponent} from './components/actionbar-menu/index.js';
import {TreeViewComponent} from './components/treeview/index.js';
import {TreeViewItemComponent} from './components/treeview-item/index.js';
import {TreeViewSubTreeComponent} from './components/treeview-subtree/index.js';
import {TreeViewLeadingVisualComponent} from './components/treeview-leadingvisual/index.js';
import {TreeViewTrailingVisualComponent} from './components/treeview-trailingvisual/index.js';
import {TreeViewDirectoryIconComponent} from './components/treeview-directoryicon/index.js';
import {TreeViewErrorDialogComponent} from './components/treeview-errordialog/index.js';
import {UnderlineNavComponent} from './components/underline-nav/index.js';
import {UnderlineNavItemComponent} from './components/underline-nav-item/index.js';
import {TimelineComponent} from './components/timeline/index.js';
import {TimelineItemComponent} from './components/timeline-item/index.js';
import {TimelineBadgeComponent} from './components/timeline-badge/index.js';
import {TimelineBodyComponent} from './components/timeline-body/index.js';
import {TimelineBreakComponent} from './components/timeline-break/index.js';
import {TimelineActionsComponent} from './components/timeline-actions/index.js';
import {TimelineAvatarComponent} from './components/timeline-avatar/index.js';
import {DialogComponent} from './components/dialog/index.js';
import {DialogHeaderComponent} from './components/dialog-header/index.js';
import {DialogTitleComponent} from './components/dialog-title/index.js';
import {DialogSubtitleComponent} from './components/dialog-subtitle/index.js';
import {DialogBodyComponent} from './components/dialog-body/index.js';
import {DialogFooterComponent} from './components/dialog-footer/index.js';
import {DialogButtonsComponent} from './components/dialog-buttons/index.js';
import {DialogCloseButtonComponent} from './components/dialog-closebutton/index.js';
import {ConfirmationDialogComponent} from './components/confirmationdialog/index.js';
import {PopoverComponent} from './components/popover/index.js';
import {PopoverContentComponent} from './components/popover-content/index.js';
import {FormControlComponent} from './components/formcontrol/index.js';
import {FormControlLabelComponent} from './components/formcontrol-label/index.js';
import {FormControlCaptionComponent} from './components/formcontrol-caption/index.js';
import {FormControlValidationComponent} from './components/formcontrol-validation/index.js';
import {FormControlLeadingVisualComponent} from './components/formcontrol-leadingvisual/index.js';
import {CheckboxGroupComponent} from './components/checkboxgroup/index.js';
import {CheckboxGroupLabelComponent} from './components/checkboxgroup-label/index.js';
import {CheckboxGroupCaptionComponent} from './components/checkboxgroup-caption/index.js';
import {CheckboxGroupValidationComponent} from './components/checkboxgroup-validation/index.js';
import {RadioGroupComponent} from './components/radiogroup/index.js';
import {RadioGroupLabelComponent} from './components/radiogroup-label/index.js';
import {RadioGroupCaptionComponent} from './components/radiogroup-caption/index.js';
import {RadioGroupValidationComponent} from './components/radiogroup-validation/index.js';
import {AnchoredOverlayComponent} from './components/anchoredoverlay/index.js';
import {ActionMenuComponent} from './components/actionmenu/index.js';
import {ActionMenuButtonComponent} from './components/actionmenu-button/index.js';
import {ActionMenuAnchorComponent} from './components/actionmenu-anchor/index.js';
import {ActionMenuOverlayComponent} from './components/actionmenu-overlay/index.js';
import {ActionMenuDividerComponent} from './components/actionmenu-divider/index.js';
import {SelectPanelComponent} from './components/selectpanel/index.js';
import {SelectPanelItemComponent} from './components/selectpanel-item/index.js';
import {AutocompleteComponent} from './components/autocomplete/index.js';
import {AutocompleteInputComponent} from './components/autocomplete-input/index.js';
import {AutocompleteOverlayComponent} from './components/autocomplete-overlay/index.js';
import {AutocompleteMenuComponent} from './components/autocomplete-menu/index.js';
import {consoleLog} from './functions/console-log.js';
import {windowAlert} from './functions/window-alert.js';
import {clearValue} from './functions/clear-value.js';
import {countSelected} from './functions/count-selected.js';
import {setBoolean} from './functions/set-boolean.js';
import {required} from './functions/required.js';
import {regex} from './functions/regex.js';
import {length} from './functions/length.js';
import {numeric} from './functions/numeric.js';
import {email} from './functions/email.js';
import {formatString} from './functions/format-string.js';
import {formatNumber} from './functions/format-number.js';
import {formatCurrency} from './functions/format-currency.js';
import {formatDate} from './functions/format-date.js';
import {pluralize} from './functions/pluralize.js';
import {openUrl} from './functions/open-url.js';
import {and} from './functions/and.js';
import {or} from './functions/or.js';
import {not} from './functions/not.js';

/** From-scratch catalog over CommonSchemas: id, component implementations, functions. */
export const CATALOG = new Catalog<ReactComponentImplementation>(
  CATALOG_ID,
  [
    TextComponent,
    ButtonComponent,
    IconButtonComponent,
    IconComponent,
    LinkComponent,
    HeadingComponent,
    BranchNameComponent,
    RelativeTimeComponent,
    LabelComponent,
    StateLabelComponent,
    CounterLabelComponent,
    AvatarComponent,
    SpinnerComponent,
    TokenComponent,
    IssueLabelTokenComponent,
    CheckboxComponent,
    ProgressBarComponent,
    RadioComponent,
    ToggleSwitchComponent,
    TextareaComponent,
    TextInputComponent,
    TextInputActionComponent,
    SkeletonBoxComponent,
    TruncateComponent,
    KeybindingHintComponent,
    StackComponent,
    StackItemComponent,
    LabelGroupComponent,
    AvatarStackComponent,
    ButtonGroupComponent,
    PaginationComponent,
    SegmentedControlComponent,
    SegmentedControlButtonComponent,
    SegmentedControlIconButtonComponent,
    DetailsComponent,
    SelectComponent,
    SelectOptionComponent,
    SelectOptGroupComponent,
    BreadcrumbsComponent,
    BreadcrumbsItemComponent,
    NavListComponent,
    NavListItemComponent,
    NavListSubNavComponent,
    NavListLeadingVisualComponent,
    NavListTrailingVisualComponent,
    NavListTrailingActionComponent,
    NavListGroupComponent,
    NavListGroupHeadingComponent,
    NavListDividerComponent,
    NavListDescriptionComponent,
    NavListGroupExpandComponent,
    PageLayoutComponent,
    PageLayoutHeaderComponent,
    PageLayoutContentComponent,
    PageLayoutPaneComponent,
    PageLayoutSidebarComponent,
    PageLayoutFooterComponent,
    SplitPageLayoutComponent,
    SplitPageLayoutHeaderComponent,
    SplitPageLayoutContentComponent,
    SplitPageLayoutPaneComponent,
    SplitPageLayoutSidebarComponent,
    SplitPageLayoutFooterComponent,
    PageHeaderComponent,
    PageHeaderContextAreaComponent,
    PageHeaderParentLinkComponent,
    PageHeaderContextBarComponent,
    PageHeaderContextAreaActionsComponent,
    PageHeaderTitleAreaComponent,
    PageHeaderLeadingActionComponent,
    PageHeaderLeadingVisualComponent,
    PageHeaderTitleComponent,
    PageHeaderTrailingVisualComponent,
    PageHeaderTrailingActionComponent,
    PageHeaderActionsComponent,
    PageHeaderBreadcrumbsComponent,
    PageHeaderDescriptionComponent,
    PageHeaderNavigationComponent,
    ActionListComponent,
    ActionListItemComponent,
    ActionListLinkItemComponent,
    ActionListGroupComponent,
    ActionListGroupHeadingComponent,
    ActionListLeadingVisualComponent,
    ActionListTrailingVisualComponent,
    ActionListDescriptionComponent,
    ActionListDividerComponent,
    ActionListTrailingActionComponent,
    ActionListHeadingComponent,
    ActionBarComponent,
    ActionBarIconButtonComponent,
    ActionBarDividerComponent,
    ActionBarGroupComponent,
    ActionBarMenuComponent,
    TreeViewComponent,
    TreeViewItemComponent,
    TreeViewSubTreeComponent,
    TreeViewLeadingVisualComponent,
    TreeViewTrailingVisualComponent,
    TreeViewDirectoryIconComponent,
    TreeViewErrorDialogComponent,
    UnderlineNavComponent,
    UnderlineNavItemComponent,
    TimelineComponent,
    TimelineItemComponent,
    TimelineBadgeComponent,
    TimelineBodyComponent,
    TimelineBreakComponent,
    TimelineActionsComponent,
    TimelineAvatarComponent,
    DialogComponent,
    DialogHeaderComponent,
    DialogTitleComponent,
    DialogSubtitleComponent,
    DialogBodyComponent,
    DialogFooterComponent,
    DialogButtonsComponent,
    DialogCloseButtonComponent,
    ConfirmationDialogComponent,
    PopoverComponent,
    PopoverContentComponent,
    FormControlComponent,
    FormControlLabelComponent,
    FormControlCaptionComponent,
    FormControlValidationComponent,
    FormControlLeadingVisualComponent,
    CheckboxGroupComponent,
    CheckboxGroupLabelComponent,
    CheckboxGroupCaptionComponent,
    CheckboxGroupValidationComponent,
    RadioGroupComponent,
    RadioGroupLabelComponent,
    RadioGroupCaptionComponent,
    RadioGroupValidationComponent,
    AnchoredOverlayComponent,
    ActionMenuComponent,
    ActionMenuButtonComponent,
    ActionMenuAnchorComponent,
    ActionMenuOverlayComponent,
    ActionMenuDividerComponent,
    SelectPanelComponent,
    SelectPanelItemComponent,
    AutocompleteComponent,
    AutocompleteInputComponent,
    AutocompleteOverlayComponent,
    AutocompleteMenuComponent,
  ],
  [
    // The adapter's own write/effect functions (Phase 6, demand-driven).
    consoleLog,
    windowAlert,
    clearValue,
    countSelected,
    setBoolean,
    // The A2UI basic catalog's 14 declared read/compute functions (task 7.9).
    required,
    regex,
    length,
    numeric,
    email,
    formatString,
    formatNumber,
    formatCurrency,
    formatDate,
    pluralize,
    openUrl,
    and,
    or,
    not,
  ],
);
