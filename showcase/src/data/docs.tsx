import type { EmptyAttrs, RenderableElements } from "@velotype/velotype"
import { Component, getComponent, RenderBasic } from "@velotype/velotype"

import { stories } from "../../../tests/test_modules/explorer-schema.tsx"
import type { ComponentStory } from "../../../tests/test_modules/explorer-schema.tsx"

import {
    Accordion, Alert, AspectRatio, Avatar, Badge, Breadcrumbs, Button, ButtonGroup, ButtonModal,
    Calendar, CalendarRange, Card, Carousel, Checkbox, Collapse, ColorPicker, Combobox, Command, ContextMenu,
    DatePicker, DateTimePicker, DateTimeRangePicker, Divider, Drawer, Empty, Form, FormField, I, InputNumber, Link, List, Menu,
    Navbar, NavLink, Pagination, Popconfirm, Popover, Progress, RadioButton, Rate, ScrollArea, Select, SelectMenu,
    showToast, Sidebar, Skeleton, Slider, Spinner, Statistic, Steps, Table, DataTable, Tabs, Tag, TextBox,
    LineChart, AreaChart, BarChart, PieChart, Gauge, Sparkline,
    Heading, Text, Paragraph, Stack, Grid, CodeBlock, TableOfContents,
    Textarea, TextEditableField, TextFormField, TextNonEditableField, TimeAgo, Timeline, Toggle,
    Tooltip, Tree, Upload, AsyncDataTable,
} from "@velotype/velodesign"

/** One row in a component's attribute reference table */
export type AttrDoc = {
    name: string
    type: string
    /**
     * Whether the component needs this to be passed.
     *
     * Its own flag rather than "(required)." appended to the description, for the same reason
     * `defaultValue` is its own column: it is the second thing a reader wants off this row, and
     * prose is the one place they cannot scan for it. Optional is the default and carries no
     * marker - that matches how the attrs types are written (`foo?: string`), and required is the
     * minority here (59 of 341), so marking the exception keeps the signal sparse and visible.
     */
    required?: boolean
    /**
     * What the component uses when the attr is not passed, as its own column rather than buried
     * mid-sentence in `description` - a reader scanning for "what happens if I leave this out"
     * was having to read every description to find out.
     *
     * Omitted means there is no default - the attr is required, or the component deliberately
     * falls back to nothing, which is what every ARIA label and placeholder here does (see the
     * language-agnostic rule). Both render as one em dash: they are the same fact from the
     * reader's side, and spelling them differently read as a distinction to decode.
     */
    defaultValue?: string
    description: string
}

/**
 * One labeled variant shown on a component's page, e.g. {label: "Disabled", node: () => <Button disabled>...}
 *
 * `node` is a factory, not a precomputed value, so every place that shows an example (a
 * component's own page, a category overview page, potentially more than one of either across a
 * session) gets its own freshly-constructed instance. A precomputed `RenderableElements` value
 * is itself a real DOM node/Component instance built exactly once, at module load - embedding
 * that same object in a second location doesn't clone it, it just relocates it, and this
 * framework's `mount()`/`unmount()` lifecycle (where interactive components add/remove their
 * event listeners) isn't guaranteed to re-run just because a pre-built node gets re-inserted
 * elsewhere. A shared instance whose subtree gets unmounted once (any navigation away from
 * whichever page currently holds it) can end up permanently non-interactive everywhere
 * afterward - this is what made `SelectMenu`'s category-page preview stop responding to clicks,
 * and is suspected of causing `ContextMenu`'s inconsistent behavior between its own page and
 * the Overlays category page. Calling `node()` fresh each render sidesteps the whole class of
 * bug instead of relying on the mount lifecycle firing correctly for a relocated node.
 */
export type ExampleDoc = {
    label: string
    node: () => RenderableElements
    /**
     * The source that produces `node`, shown under the live preview.
     *
     * Required, not optional, so a missing snippet is a type error rather than an example that
     * quietly renders without one.
     *
     * It has to be a hand-written string: `node` is a compiled factory, and there is no way to
     * recover its source text at runtime. So this can drift from what `node` actually renders -
     * the one real cost of showing code at all. Keep them edited together, and prefer trimming
     * the snippet (dropping a wrapper `<div style={row}>` that exists only to lay the preview
     * out) over adding scaffolding that teaches nothing about the component.
     */
    code: string
}

/**
 * One method a component exposes on its instance, e.g. `Modal`'s `showModal()`.
 *
 * Kept out of `attrs` entirely: a method is not something you pass in JSX, and listing
 * `showModal()` beside `title` told the reader to write `showModal={...}`.
 */
export type MethodDoc = {
    name: string
    description: string
}

/**
 * A named type a component's attributes refer to, documented with the same columns as an
 * attribute table.
 *
 * A row reading `items: AccordionItemType[]` told the reader the name of a shape and nothing about
 * it. These are that shape, shown under the component that uses them rather than in a reference
 * page nobody navigates to.
 */
export type TypeDoc = {
    name: string
    /** One line on what the type is for, shown above its table */
    description?: string
    /** Its fields - the same shape as an attribute row, so the tables read identically */
    fields: AttrDoc[]
}

/** A `ComponentStory` (from the Explorer) augmented with showcase-only documentation */
export type ComponentDoc = ComponentStory & {
    /** URL-safe id, e.g. "context-menu" for "ContextMenu" */
    slug: string
    /** One-sentence summary shown at the top of the component's page */
    description: string
    /**
     * What this entry actually is.
     *
     * Not everything the package exports is a component: `showToast` is a plain function you call,
     * with parameters rather than attributes and no children and no JSX tag at all. Documenting it
     * in a table headed "Attributes" claimed an API it does not have.
     */
    kind: "component" | "function"
    /** For a `"function"` entry, how it is called, e.g. `showToast(message, options?)` */
    signature?: string
    /** Attribute reference table rows - the parameter list, for a `"function"` entry */
    attrs: AttrDoc[]
    /** Methods callable on the component's instance, shown in their own section */
    methods?: MethodDoc[]
    /** Named types this component's attributes refer to, shown below the attribute table */
    types?: TypeDoc[]
    /** Overridable theme-option objects this component reads, shown in their own section */
    themeOptions?: TypeDoc[]
    /**
     * What this component does with the children placed inside it, if it takes any.
     *
     * Deliberately *not* a row in `attrs`: children are passed by nesting content inside the
     * component's tags, never as `children={...}`, so listing them beside real named attributes
     * told the reader to write the one thing the component doesn't accept.
     */
    children?: string
    /** Labeled variants demonstrating the component's common states, shown on its page */
    examples: ExampleDoc[]
}

const descriptions: Record<string, string> = {
    // Form
    Button: "A clickable action trigger with themed color variants and an optional loading state.",
    ButtonGroup: "Visually joins a row (or column) of Buttons into a single connected control, sharing borders instead of each having its own.",
    RadioButton: "A single option in a mutually-exclusive group, wrapping a native radio input.",
    Checkbox: "A tri-state (checked/unchecked/indeterminate) toggle, wrapping a native checkbox input.",
    Toggle: "A switch-style boolean control, wrapping a native checkbox input styled as a track and thumb.",
    TextBox: "A single-line text input supporting text, email, phone, and password variants.",
    Textarea: "A multi-line text input with a configurable row count and resize behavior.",
    Select: "A themed dropdown for choosing one of a fixed set of options, wrapping a native select.",
    SelectMenu: "A Select-alike with fully custom rendering of each option (and of the trigger's current value), for options that need icons, avatars, or other rich content a native select can't display.",
    TextNonEditableField: "A read-only label/value pair, styled consistently with the other form-field components.",
    TextFormField: "A label paired with a TextBox, bound to a RenderBasic field value.",
    TextEditableField: "A label/value pair that swaps between a read view and an inline-editable TextBox with confirm/cancel.",
    // Navigation
    NavLink: "A Link that also knows whether it matches the current location, for highlighting active navigation items.",
    Link: "An anchor that navigates within the app via History.changeLocation instead of a full page reload.",
    Breadcrumbs: "A navigational trail showing where the current page sits in the site hierarchy. Crumbs can carry an avatar or icon, and a long trail collapses its middle behind an expander.",
    Pagination: "A control for navigating between pages of results, with a windowed page-number list.",
    Navbar: "A themed top navigation bar with a brand slot and a row of children (typically NavLinks).",
    Sidebar: "A themed vertical navigation list, with the current page highlighted automatically.",
    TableOfContents: "A list of a page's sections, indented by level, with the one currently in view highlighted. Each entry is an in-page anchor.",
    Menu: "A dropdown menu of navigational links or actions, built on native details/summary.",
    Steps: "A horizontal sequence of numbered steps for wizards and checkout flows.",
    // Feedback
    Alert: "An inline message box that draws attention to important information, with an optional dismiss button.",
    Toast: "A transient, auto-dismissing notification message, shown via the imperative showToast() function rather than placed in your JSX tree.",
    Tooltip: "A CSS-only hover/focus bubble that shows a short hint next to its trigger content.",
    Spinner: "A standalone animated loading indicator.",
    Progress: "A determinate progress bar, wrapping a native progress element.",
    Skeleton: "An animated placeholder shown in place of content that hasn't loaded yet.",
    Empty: "A placeholder shown in place of a list/table/section that has no data.",
    // Overlays
    Modal: "A centered dialog over the page, wrapping a native <dialog>, with confirm/cancel actions built in.",
    Drawer: "A panel that slides in from a viewport edge over the page, for side/top/bottom-anchored content.",
    Popover: "A click-triggered bubble of rich content anchored to its trigger - can wrap a real Button, unlike Menu.",
    Popconfirm: "An inline \"are you sure?\" bubble for confirming a destructive action without the weight of a full Modal.",
    ContextMenu: "Opens a themed menu at the cursor position on right-click, in place of the browser's native context menu.",
    Command: "A searchable command-palette overlay with keyboard navigation, built on a native <dialog>.",
    // Data Display
    Badge: "A small inline label, typically used to show a status or count.",
    Card: "A themed container with optional header/footer slots, for grouping related content.",
    CodeBlock: "A block of source code, highlighted and scrollable. The grammar is a small scanner in the package itself, so it adds no runtime dependency.",
    Avatar: "A small circular image (or initials fallback) representing a person or entity.",
    TimeAgo: "Formats a timestamp as a localized relative time string, e.g. \"5 minutes ago\".",
    Divider: "A thin themed line used to visually separate content, horizontal or vertical.",
    Tabs: "A set of labeled panels where only one panel is shown at a time.",
    Accordion: "A list of collapsible sections built on native details/summary. Set exclusive and opening one closes the rest - that grouping belongs to the list, which is why a row of Collapses cannot express it.",
    Tag: "A small inline label like Badge, but optionally removable - for filter chips and multi-select values.",
    Collapse: "A single collapsible section you place yourself and fill with children. Same widget Accordion renders - same border, chevron and animated open - but one section rather than a list.",
    Statistic: "A labeled numeric stat tile, for dashboards and KPI summaries.",
    List: "A styled list of items, each with optional leading/trailing slots.",
    Timeline: "A vertical list of dated/ordered events, each with a dot marker on a connecting line.",
    AspectRatio: "Constrains its children to a fixed width:height ratio, via pure CSS.",
    ScrollArea: "A scrollable container with a themed thin scrollbar.",
    Table: "A themed data table wrapping a native <table>, generic over the row type.",
    DataTable: "A batteries-included data table: sortable and resizable columns, user-toggleable column visibility, an optional search box, and built-in pagination via Pagination.",
    Heading: "A heading, h1 through h6. Size comes from level, so the visual hierarchy and the document outline cannot disagree.",
    Text: "Inline text with a semantic colour and the usual modifiers. type=\"muted\" is the one to reach for most.",
    Paragraph: "A block of prose with the package's line height and spacing. The last paragraph in a container drops its bottom margin.",
    Stack: "One-dimensional layout: a row or column of children with a consistent gap. The component that replaces style={{display:'flex', gap:'0.5rem'}}.",
    Grid: "Two-dimensional layout: cells that reflow to fill the width they are given, without a media query.",
    LineChart: "A line chart for trends over time, optionally filled and optionally stacked. Hovering anywhere over the plot reads out every series at the nearest category.",
    AreaChart: "A filled line chart - LineChart with area set. Stack it to show how parts add up to a total.",
    BarChart: "A bar chart for comparing categories: vertical or horizontal, with series side by side or stacked.",
    PieChart: "A pie or donut chart for part-to-whole. Slices are drawn in the order given, never re-sorted, so they stay aligned with a legend or table beside them.",
    Gauge: "A radial gauge for one value against a range, with optional coloured bands for good/warning/critical zones.",
    Sparkline: "A tiny axis-less trend, sized to sit inside a table cell or beside a Statistic. Line, area or bar.",
    AsyncDataTable: "The same table, for data a server filters, sorts and pages. Give it a load() and it handles debouncing, out-of-order responses, loading and error states, and pagination.",
    Carousel: "A single-slide-at-a-time carousel with prev/next arrows and optional dot indicators.",
    Calendar: "A month-grid date picker with prev/next month navigation and a selectable day.",
    CalendarRange: "A month-grid date-*range* picker: click a start day, then an end day, and the span between them highlights.",
    Tree: "A hierarchical, expandable/collapsible list built on nested native details/summary pairs. Nodes open and close with the same animation as Collapse and Accordion.",
    // Data Entry
    DatePicker: "A themed date input, wrapping a native <input type=\"date\">.",
    DateTimePicker: "A themed date-and-time input, wrapping a native <input type=\"datetime-local\">.",
    DateTimeRangePicker: "A pair of linked date-and-time inputs for picking a span rather than a single moment.",
    Slider: "A themed range input, wrapping a native <input type=\"range\">.",
    InputNumber: "A themed numeric input, wrapping a native <input type=\"number\">.",
    ColorPicker: "A themed color swatch input, wrapping a native <input type=\"color\">.",
    Combobox: "A free-text input with a searchable dropdown of suggestions, wrapping a native input paired with a datalist.",
    Upload: "A themed drop-zone wrapping a visually-hidden native file input.",
    Rate: "An interactive star rating, built on a group of visually-hidden native radio inputs.",
    Form: "A themed <form> layout wrapper, paired with FormField for a label/control/error stack around each input.",
    // Utility
    Icon: "Renders a registered vector icon as an inline SVG.",
}

/**
 * What each component that accepts children does with them.
 *
 * Separate from `attrTables` on purpose - see `ComponentDoc.children`. A component absent from
 * this map takes no children, and its page shows no Children section.
 */
const childrenDocs: Record<string, string> = {
    // Form
    Button: "The button's content - usually a label, optionally an icon beside it.",
    ButtonGroup: "The Buttons to join together, in the order they should appear.",
    TextNonEditableField: "The field's label content.",
    TextFormField: "The field's label content.",
    TextEditableField: "The field's label content.",
    // Navigation
    Link: "The link's content - the text (or markup) the reader clicks.",
    Navbar: "The bar's trailing content, typically a row of NavLinks.",
    // Feedback
    Alert: "The alert's body content, shown below the title.",
    Tooltip: "The trigger: whatever the reader hovers or focuses to reveal the bubble.",
    Empty: "An optional follow-up action shown below the message, e.g. a Button that creates the first record.",
    // Overlays
    Drawer: "The drawer's body content.",
    Popconfirm: "The trigger whose click opens the confirmation, typically a Button.",
    ContextMenu: "The area that opens the menu on right-click.",
    // Data display
    Badge: "The badge's content, usually a short label or count.",
    Card: "The card's body content, between the header and footer slots.",
    Tag: "The tag's content, usually a short label.",
    Collapse: "The content revealed when the section is expanded.",
    AspectRatio: "The content to hold at the given ratio, typically a single image, video or iframe.",
    ScrollArea: "The content to scroll within the fixed-height region.",
    // Data entry
    Upload: "The drop zone's content - what the reader sees in the area files can be dropped onto.",
    Form: "The form's fields, typically a stack of FormFields.",
}

/**
 * Methods each component exposes on its instance.
 *
 * Separate from `attrTables` because a method is not an attribute: it is called on the component,
 * not passed to it, and listing `showModal()` in a column headed "Attribute" told the reader to
 * write `showModal={...}`.
 */
/**
 * Entries that are a plain function rather than a component, mapped to how they are called.
 *
 * `showToast` has no JSX tag, no attributes and no children - it is called. Its page shows a
 * signature and a Parameters table instead of an Attributes one.
 */
const functionDocs: Record<string, string> = {
    Toast: "showToast(message, options?)",
}

const methodDocs: Record<string, MethodDoc[]> = {
    Sidebar: [
        {name: "setItems(items)", description: "Replaces the entries, rebuilding only the list. The header survives - which is what lets a search box live there without losing focus on every keystroke - as do the collapsed state and the dragged width. The open/closed state does not, since the entries are new; read it off getTree() first."},
        {name: "setCollapsed(collapsed)", description: "Collapses to the rail or expands, and calls onCollapsedChange."},
        {name: "isCollapsed()", description: "Is it collapsed to the rail?"},
        {name: "setWidth(width)", description: "Sets the expanded width in px, clamped to minWidth/maxWidth."},
        {name: "getWidth()", description: "The expanded width in px - what a drag changes, unaffected by collapsing."},
        {name: "getTree()", description: "The Tree behind the groups, for reading or driving which are open."},
    ],
    Tree: [
        {name: "isOpen(key)", description: "Is this branch open? A branch mid-close still carries the open attribute - it is held for the length of the collapse - and is reported as closed here, because what a caller wants is where the tree is heading."},
        {name: "getOpenKeys()", description: "Every branch currently open, in document order. Safe to call from onToggle, which runs after the change."},
        {name: "getBranchKeys()", description: "Every branch, open or not, in document order - the keys these methods accept."},
        {name: "setOpen(key, open, animate?)", description: "Opens or closes one branch. animate defaults to true, matching a click; pass false when the change is a consequence of something else the reader did, where a transition reads as lag."},
        {name: "setOpenKeys(keys, animate?)", description: "Makes exactly these branches open and every other one closed. animate defaults to false here, because animating several branches in opposite directions at once reads as noise."},
        {name: "reveal(key)", description: "Opens a node and every ancestor above it, so it is actually on screen. The one to use for a search match - setOpen alone leaves a closed ancestor hiding it."},
    ],
    Modal: [
        {name: "showModal()", description: "Opens the modal. This is the <dialog>'s own native method, which is why calling it on the JSX value works."},
        {name: "close()", description: "Closes the modal. Also the <dialog>'s own native method."},
    ],
    Drawer: [
        {name: "showModal()", description: "Opens the drawer. This is the <dialog>'s own native method, which is why calling it on the JSX value works."},
        {name: "close()", description: "Closes the drawer. Also the <dialog>'s own native method."},
    ],
    Command: [
        {name: "showModal()", description: "Opens the palette, first clearing the search query and reselecting the top entry. Reach it with getComponent<Command>(...) - the JSX evaluates to the raw <dialog>, whose native showModal() of the same name would skip all of that."},
        {name: "close()", description: "Closes the palette."},
    ],
}

/**
 * The named types each component's attributes refer to.
 *
 * A row reading `items: AccordionItemType[]` gave the reader the name of a shape and nothing
 * about it. Defined once and shared by every component that uses them - the three cartesian
 * charts all point at ChartPointType, and a copy per component is how copies drift apart.
 */
const typeDefinitions: Record<string, TypeDoc> = {
    AccordionItemType: {
        name: "AccordionItemType",
        description: "One section of an Accordion.",
        fields: [
            {name: "header", type: "RenderableElements", required: true, description: "Content of the section's clickable header."},
            {name: "content", type: "RenderableElements", required: true, description: "Content revealed when the section is open."},
            {name: "defaultOpen", type: "boolean", defaultValue: "false", description: "Whether this section starts open."},
        ],
    },
    TableOfContentsItemType: {
        name: "TableOfContentsItemType",
        description: "One entry in a TableOfContents.",
        fields: [
            {name: "id", type: "string", required: true, description: "id of the element this entry links to - the anchor target."},
            {name: "label", type: "RenderableElements", required: true, description: "Displayed text for this entry."},
            {name: "level", type: "number", defaultValue: "1", description: "Depth, 1 being top level. Levels past 6 render at 6."},
        ],
    },
    BreadcrumbItemType: {
        name: "BreadcrumbItemType",
        description: "One crumb in a trail.",
        fields: [
            {name: "label", type: "RenderableElements", required: true, description: "The crumb's text."},
            {name: "to", type: "string", description: "Target URL. The last crumb usually omits it, which renders it as plain text marked aria-current."},
            {name: "leading", type: "RenderableElements", description: "Content shown immediately before the label - an Avatar for a project or group, an Icon for a section. It is decoration beside a label that already names the destination, so mark it aria-hidden unless it says something the label does not."},
        ],
    },
    SidebarItemType: {
        name: "SidebarItemType",
        description: "One entry in a Sidebar - a link, or a group with children.",
        fields: [
            {name: "label", type: "RenderableElements", required: true, description: "The entry's content."},
            {name: "to", type: "string", description: "Target URL, matched against the current location to highlight the active entry. A group with children needs none."},
            {name: "key", type: "string", defaultValue: "the entry's to", description: "Identifies this entry. A group has no to of its own, so give those one."},
            {name: "icon", type: "RenderableElements", description: "Shown before the label - and, once collapsed to the rail, the only thing shown, so an entry without one is unidentifiable at that width."},
            {name: "trailing", type: "RenderableElements", description: "Content at the trailing edge of the row - a count, a Badge."},
            {name: "children", type: "SidebarItemType[]", description: "Nested entries. An entry with children renders as a collapsible group."},
            {name: "defaultOpen", type: "boolean", defaultValue: "false", description: "Whether this group starts expanded."},
        ],
    },
    SidebarProfileType: {
        name: "SidebarProfileType",
        description: "The account row at the foot of a Sidebar. It is a Menu whose trigger is the row itself, so it gets that component's keyboard handling, submenus and dividers rather than a second copy of them.",
        fields: [
            {name: "avatar", type: "RenderableElements", required: true, description: "Shown at the leading edge, typically an Avatar. On the collapsed rail this is the whole row."},
            {name: "name", type: "RenderableElements", required: true, description: "The account's name."},
            {name: "detail", type: "RenderableElements", description: "A smaller supporting line beneath the name - an email, an organisation."},
            {name: "menuItems", type: "MenuItemType[]", required: true, description: "Entries for the menu the row opens. Supports submenus and dividers, like any Menu."},
            {name: "menuAriaLabel", type: "string", description: "Accessible name for that menu."},
        ],
    },
    MenuItemType: {
        name: "MenuItemType",
        description: "One entry in a Menu - a link, an action, or both.",
        fields: [
            {name: "label", type: "RenderableElements", required: true, description: "The entry's text."},
            {name: "href", type: "string", description: "Target URL, making this entry a link."},
            {name: "spa", type: "boolean", defaultValue: "false", description: "Client-side route change rather than a page load, for an href inside an SPA."},
            {name: "onClick", type: "() => void", description: "Called when the entry is chosen. May be combined with href."},
            {name: "keepOpen", type: "boolean", defaultValue: "false", description: "Leaves the menu, and any submenu the entry sits in, open after the click. For an entry that acts in place rather than navigating - a theme or density switch - where closing takes the control away at the moment it takes effect."},
            {name: "selected", type: "boolean | (() => boolean)", description: "Marks this entry as the chosen one among the checkable entries of its own list, giving it role=\"menuitemradio\" and a tick. Set it on two or more siblings to make them a radio group; Menu moves the selection itself on a click, so the tick follows without a rebuild. Pass a function when something outside the menu can change the same setting - it is re-read every time the menu opens, so the indicator cannot go stale."},
            {name: "disabled", type: "boolean", defaultValue: "false", description: "Renders the entry unavailable and ignores clicks."},
            {name: "children", type: "MenuItemType[]", description: "Nested entries. An entry with children opens a submenu beside itself rather than acting, so its own href and onClick are ignored."},
            {name: "dividerBefore", type: "boolean", defaultValue: "false", description: "Draws a divider immediately above this entry, separating it from what came before. Ignored on the first entry, so a group's first item can carry it unconditionally."},
        ],
    },
    StepType: {
        name: "StepType",
        description: "One step in a Steps sequence.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this step."},
            {name: "title", type: "RenderableElements", required: true, description: "The step's name."},
            {name: "description", type: "RenderableElements", description: "Supporting text below the title."},
        ],
    },
    TabType: {
        name: "TabType",
        description: "One tab and the panel it reveals.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this tab."},
            {name: "label", type: "RenderableElements", required: true, description: "Content of the tab button."},
            {name: "content", type: "RenderableElements", required: true, description: "The panel. Every panel is built up front and stays mounted, so a tab keeps its state while another is shown."},
        ],
    },
    ListItemType: {
        name: "ListItemType",
        description: "One row of a List.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this row."},
            {name: "title", type: "RenderableElements", required: true, description: "The row's primary text."},
            {name: "description", type: "RenderableElements", description: "Secondary text below the title."},
            {name: "leading", type: "RenderableElements", description: "Content before the text, e.g. an Avatar."},
            {name: "trailing", type: "RenderableElements", description: "Content after the text, e.g. a Badge."},
            {name: "href", type: "string", description: "Makes the whole row a link."},
            {name: "onSelect", type: "() => void", description: "Makes the whole row a JS-driven action instead."},
        ],
    },
    TimelineItemType: {
        name: "TimelineItemType",
        description: "One event on a Timeline.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this event."},
            {name: "title", type: "RenderableElements", required: true, description: "The event's primary text."},
            {name: "description", type: "RenderableElements", description: "Supporting text below the title."},
            {name: "type", type: '"primary" | "secondary" | "warning" | "danger" | "neutral"', defaultValue: "neutral", description: "Colour of the event's dot."},
        ],
    },
    TreeNodeType: {
        name: "TreeNodeType",
        description: "One node of a Tree, which may hold its own children.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this node, across the whole tree and not just among its siblings - the open/close methods address nodes by it."},
            {name: "label", type: "RenderableElements", required: true, description: "The node's content. A Link or NavLink here owns its own click, provided onSelect is left unset."},
            {name: "children", type: "TreeNodeType[]", description: "Child nodes. A node with none renders as a leaf."},
            {name: "defaultOpen", type: "boolean", defaultValue: "false", description: "Whether this node starts expanded."},
            {name: "leading", type: "RenderableElements", description: "Content shown before the label - an Icon, a Badge, an Avatar."},
            {name: "trailing", type: "RenderableElements", description: "Content shown after the label, pushed to the trailing edge - a count, a status dot."},
        ],
    },
    ContextMenuItemType: {
        name: "ContextMenuItemType",
        description: "One entry in a ContextMenu.",
        fields: [
            {name: "label", type: "RenderableElements", required: true, description: "The entry's text."},
            {name: "onClick", type: "() => void", description: "Called when the entry is chosen."},
            {name: "disabled", type: "boolean", defaultValue: "false", description: "Renders the entry unavailable and ignores clicks."},
        ],
    },
    ComboboxOptionType: {
        name: "ComboboxOptionType",
        description: "One suggestion offered by a Combobox.",
        fields: [
            {name: "value", type: "string", required: true, description: "The value written into the input when chosen."},
            {name: "label", type: "string", defaultValue: "the value", description: "Text shown in the list, when it should differ from the value."},
        ],
    },
    SelectOptionType: {
        name: "SelectOptionType",
        description: "One option in a Select.",
        fields: [
            {name: "value", type: "string", required: true, description: "The option's submitted value."},
            {name: "label", type: "RenderableElements", required: true, description: "Text shown for the option."},
            {name: "disabled", type: "boolean", defaultValue: "false", description: "Renders the option unselectable."},
        ],
    },
    CommandItemType: {
        name: "CommandItemType",
        description: "One command in a Command palette.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this command."},
            {name: "label", type: "RenderableElements", required: true, description: "Text shown in the list."},
            {name: "searchText", type: "string", defaultValue: "the label, when it is a plain string", description: "Text the search matches against. Set it when the label is markup rather than a string, or when it should match on more than it displays."},
            {name: "onSelect", type: "() => void", required: true, description: "Called when the command is chosen."},
        ],
    },
    TableColumnType: {
        name: "TableColumnType",
        description: "One column of a Table.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this column."},
            {name: "header", type: "RenderableElements", required: true, description: "Content of the column's header cell."},
            {name: "render", type: "(row: RowType) => RenderableElements", required: true, description: "Renders a row's value for this column."},
            {name: "align", type: '"start" | "center" | "end"', defaultValue: "start", description: "Text alignment for this column's cells."},
            {name: "width", type: "number | string", description: "Column width - a number is px, a string any CSS length. Setting it on any column switches the table to fixed layout."},
            {name: "sortDirection", type: '"asc" | "desc"', description: "Shows a sort indicator in the header. Table holds no sort state - sorting rows is the caller's job."},
            {name: "onSortClick", type: "() => void", description: "Makes the header clickable, called to request a sort change."},
        ],
    },
    DataTableColumnType: {
        name: "DataTableColumnType",
        description: "One column of a DataTable, which computes over rows it already holds.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this column."},
            {name: "header", type: "RenderableElements", required: true, description: "Content of the column's header cell."},
            {name: "render", type: "(row: RowType) => RenderableElements", required: true, description: "Renders a row's value for this column."},
            {name: "sortValue", type: "(row: RowType) => string | number", description: "Makes the column sortable, returning the value to sort on. Return the raw value rather than the rendered string, or money sorts as text and 1,000 lands before 9."},
            {name: "filterValue", type: "(row: RowType) => string", description: "Makes the column searchable, returning the text to match against."},
            {name: "align", type: '"start" | "center" | "end"', defaultValue: "start", description: "Text alignment for this column's cells."},
            {name: "width", type: "number", description: "Starting width in px. Every column can still be resized by dragging."},
            {name: "minWidth", type: "number", defaultValue: "60", description: "Smallest width in px a drag can reach."},
            {name: "hideable", type: "boolean", defaultValue: "true", description: "Whether the column-visibility control may hide this column. false shows it there as a disabled, checked entry rather than omitting it."},
            {name: "resizable", type: "boolean", defaultValue: "true", description: "Whether this column's width can be dragged, regardless of the table's resizableColumns."},
        ],
    },
    AsyncDataTableColumnType: {
        name: "AsyncDataTableColumnType",
        description: "One column of an AsyncDataTable, where the server does the work.",
        fields: [
            {name: "key", type: "string", required: true, description: "Unique key identifying this column. Sent to load() as sortKey when the column is sorted."},
            {name: "header", type: "RenderableElements", required: true, description: "Content of the column's header cell."},
            {name: "render", type: "(row: RowType) => RenderableElements", required: true, description: "Renders a row's value for this column."},
            {name: "sortable", type: "boolean", defaultValue: "false", description: "Makes the header clickable, asking load() to sort. A flag rather than a sortValue function, because the sorting happens on the server - only set it where the endpoint can actually sort."},
            {name: "align", type: '"start" | "center" | "end"', defaultValue: "start", description: "Text alignment for this column's cells."},
            {name: "width", type: "number", description: "Starting width in px. Every column can still be resized by dragging."},
            {name: "minWidth", type: "number", defaultValue: "60", description: "Smallest width in px a drag can reach."},
            {name: "hideable", type: "boolean", defaultValue: "true", description: "Whether the column-visibility control may hide this column."},
            {name: "resizable", type: "boolean", defaultValue: "true", description: "Whether this column's width can be dragged."},
        ],
    },
    AsyncDataTableQuery: {
        name: "AsyncDataTableQuery",
        description: "What the table asks load() for.",
        fields: [
            {name: "search", type: "string", required: true, description: "The current search text, already trimmed. Empty when the box is empty."},
            {name: "sortKey", type: "string", description: "key of the column to sort by, or unset for the loader's own default order."},
            {name: "sortDirection", type: '"asc" | "desc"', description: "Direction for sortKey."},
            {name: "page", type: "number", required: true, description: "Which page to return, 1-indexed."},
            {name: "pageSize", type: "number", required: true, description: "How many rows the page should hold."},
        ],
    },
    AsyncDataTableResult: {
        name: "AsyncDataTableResult",
        description: "What load() gives back.",
        fields: [
            {name: "rows", type: "RowType[]", required: true, description: "This page's rows."},
            {name: "total", type: "number", description: "Rows matching the query across every page. Given, the footer shows numbered pagination; omitted, it falls back to prev/next. Omitting it is a fair choice - a count over a large filtered set often costs more than the page query itself."},
            {name: "truncated", type: "boolean", defaultValue: "false", description: "Set when the backend capped the result rather than returning everything that matched, so a short list is not mistaken for a complete one."},
        ],
    },
    ChartPointType: {
        name: "ChartPointType",
        description: "One category on a chart's axis, with a value per series.",
        fields: [
            {name: "label", type: "string", required: true, description: "The category's name, drawn on the axis."},
            {name: "values", type: "Record<string, number | undefined>", required: true, description: "One entry per series, keyed by that series' key. A missing or undefined value leaves a gap rather than plotting zero."},
        ],
    },
    ChartSeriesType: {
        name: "ChartSeriesType",
        description: "One series plotted across every category.",
        fields: [
            {name: "key", type: "string", required: true, description: "Matches the key used in each point's values."},
            {name: "label", type: "string", defaultValue: "the key", description: "Name shown in the legend and tooltip."},
            {name: "color", type: "string", defaultValue: "its slot in ChartThemeOptions.seriesColors", description: "Overrides the palette for this series. Prefer the palette - a literal looks right in one theme and wrong in the other."},
        ],
    },
    PieSliceType: {
        name: "PieSliceType",
        description: "One slice of a PieChart.",
        fields: [
            {name: "label", type: "string", required: true, description: "The slice's name."},
            {name: "value", type: "number", required: true, description: "Its size, as a share of the total of every slice."},
            {name: "color", type: "string", defaultValue: "its slot in ChartThemeOptions.seriesColors", description: "Overrides the palette for this slice."},
        ],
    },
    GaugeBandType: {
        name: "GaugeBandType",
        description: "A tinted range on a Gauge's track.",
        fields: [
            {name: "from", type: "number", required: true, description: "Where the band starts, in the gauge's own units."},
            {name: "to", type: "number", required: true, description: "Where it ends."},
            {name: "color", type: "string", required: true, description: "The band's colour."},
        ],
    },
}

/** Which named types each component's page documents, in the order they matter */
const componentTypes: Record<string, string[]> = {
    Accordion: ["AccordionItemType"],
    TableOfContents: ["TableOfContentsItemType"],
    Breadcrumbs: ["BreadcrumbItemType"],
    Sidebar: ["SidebarItemType", "SidebarProfileType", "MenuItemType"],
    Menu: ["MenuItemType"],
    Steps: ["StepType"],
    Tabs: ["TabType"],
    List: ["ListItemType"],
    Timeline: ["TimelineItemType"],
    Tree: ["TreeNodeType"],
    ContextMenu: ["ContextMenuItemType"],
    Combobox: ["ComboboxOptionType"],
    Select: ["SelectOptionType"],
    Command: ["CommandItemType"],
    Table: ["TableColumnType"],
    DataTable: ["DataTableColumnType"],
    AsyncDataTable: ["AsyncDataTableColumnType", "AsyncDataTableQuery", "AsyncDataTableResult"],
    LineChart: ["ChartPointType", "ChartSeriesType"],
    AreaChart: ["ChartPointType", "ChartSeriesType"],
    BarChart: ["ChartPointType", "ChartSeriesType"],
    PieChart: ["PieSliceType"],
    Gauge: ["GaugeBandType"],
}

/**
 * The overridable theme-option objects each component reads.
 *
 * These were referenced by name in Default columns - BreadcrumbsThemeOptions.collapseSymbol -
 * with nothing on the page saying what that object was or how to change it. Documented with the
 * same columns as an attribute table, and shared by every component that reads them, so the two
 * tables and the six charts each point at one definition.
 *
 * CommonThemeOptions is listed first on every page that inherits from it, because it is the
 * object a consumer usually wants: a Default column reading CommonThemeOptions.closeSymbol is
 * only useful next to a table saying what that is and which other components follow it.
 */
const themeOptionDefinitions: Record<string, TypeDoc> = {
    CommonThemeOptions: {
        name: "CommonThemeOptions",
        description: "The symbols more than one component means the same thing by. Every per-component field below that names one of these falls back to it live, so assigning here reaches each component that has not been given an override of its own.",
        fields: [
            {name: "closeSymbol", type: "ThemeSymbol", defaultValue: "✕", description: "Dismisses or removes the thing it sits on. Read by Alert, Toast, Tag, Modal and Drawer."},
            {name: "cancelSymbol", type: "ThemeSymbol", defaultValue: "a multiplication sign", description: "Rejects a pending action. Read by Modal's footer, Popconfirm, and an in-progress inline edit."},
            {name: "confirmSymbol", type: "ThemeSymbol", defaultValue: "a check mark", description: "Accepts a pending action, or marks one already done. Read by Popconfirm, an inline edit, and a completed Steps step."},
            {name: "emptySymbol", type: "ThemeSymbol", defaultValue: "the U+2205 glyph", description: "Stands in for content that isn't there. Read by Empty, both tables and every chart."},
            {name: "collapseSymbol", type: "ThemeSymbol", defaultValue: "the U+2026 ellipsis", description: "Marks items omitted from a sequence. Read by Breadcrumbs' expander and Pagination's gap."},
            {name: "prevSymbol", type: "ThemeSymbol", defaultValue: "a single-guillemet left", description: "Steps one back through a sequence. Read by Pagination, both calendars, Carousel and AsyncDataTable's pager."},
            {name: "nextSymbol", type: "ThemeSymbol", defaultValue: "a single-guillemet right", description: "Steps one forward through a sequence. Read by the same five."},
        ],
    },
    ButtonThemeOptions: {
        name: "ButtonThemeOptions",
        description: "What a Button shows while it is loading.",
        fields: [
            {name: "loadingSymbol", type: "ThemeSymbol", defaultValue: "a Spinner sized 1em", description: "Shown in place of the button's content once onClick starts loading, until it calls doneLoading(). Nothing else in the package draws a loading indicator, so this one stays local."},
        ],
    },
    AlertThemeOptions: {
        name: "AlertThemeOptions",
        description: "The Alert's dismiss control.",
        fields: [
            {name: "closeSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.closeSymbol", description: "Content of the dismiss button, shown only when onDismiss is set."},
        ],
    },
    ToastThemeOptions: {
        name: "ToastThemeOptions",
        description: "The toast's dismiss control.",
        fields: [
            {name: "closeSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.closeSymbol", description: "Content of the dismiss button on each toast."},
        ],
    },
    EmptyThemeOptions: {
        name: "EmptyThemeOptions",
        description: "The illustration an Empty state shows.",
        fields: [
            {name: "emptySymbol", type: "ThemeSymbol", defaultValue: "the shared empty symbol in a 2.5em span", description: "Shown above the title. The whole visual, 2.5em sizing included, so a real illustration is not stuck inside that span. Set CommonThemeOptions.emptySymbol to change the glyph alone, here and in both tables and every chart."},
        ],
    },
    TagThemeOptions: {
        name: "TagThemeOptions",
        description: "The Tag's remove control.",
        fields: [
            {name: "closeSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.closeSymbol", description: "Content of the remove button, shown only when onRemove is set."},
        ],
    },
    BreadcrumbsThemeOptions: {
        name: "BreadcrumbsThemeOptions",
        description: "The expander a collapsed trail shows.",
        fields: [
            {name: "collapseSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.collapseSymbol", description: "Content of the expander that reveals the crumbs hidden by maxItems."},
        ],
    },
    PaginationThemeOptions: {
        name: "PaginationThemeOptions",
        description: "Pagination's previous and next controls.",
        fields: [
            {name: "prevSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.prevSymbol", description: "Content of the previous-page button."},
            {name: "nextSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.nextSymbol", description: "Content of the next-page button."},
        ],
    },
    ModalThemeOptions: {
        name: "ModalThemeOptions",
        description: "The Modal's close and cancel controls.",
        fields: [
            {name: "closeSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.closeSymbol", description: "Content of the corner close button."},
            {name: "cancelSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.cancelSymbol", description: "Content of the cancel button in the footer."},
        ],
    },
    DrawerThemeOptions: {
        name: "DrawerThemeOptions",
        description: "The Drawer's close control.",
        fields: [
            {name: "closeSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.closeSymbol", description: "Content of the corner close button."},
        ],
    },
    MenuThemeOptions: {
        name: "MenuThemeOptions",
        description: "The tick Menu draws beside the selected entry of a checkable group.",
        fields: [
            {name: "confirmSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.confirmSymbol", description: "Marks the selected entry."},
        ],
    },
    PopconfirmThemeOptions: {
        name: "PopconfirmThemeOptions",
        description: "Popconfirm's confirm and cancel controls.",
        fields: [
            {name: "confirmSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.confirmSymbol", description: "Content of the confirm button."},
            {name: "cancelSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.cancelSymbol", description: "Content of the cancel button."},
        ],
    },
    TextFormFieldThemeOptions: {
        name: "TextFormFieldThemeOptions",
        description: "The glyphs the editable text fields use.",
        fields: [
            {name: "confirmSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.confirmSymbol", description: "Confirms an inline edit."},
            {name: "cancelSymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.cancelSymbol", description: "Cancels an inline edit."},
            {name: "editSymbol", type: "ThemeSymbol", defaultValue: "a pencil", description: "Starts an inline edit. No counterpart elsewhere in the package, so it stays local."},
        ],
    },
    DataTableThemeOptions: {
        name: "DataTableThemeOptions",
        description: "Shared by both tables, so a change reaches them together.",
        fields: [
            {name: "columnsSymbol", type: "ThemeSymbol", defaultValue: "the U+25A5 glyph", description: "Content of the column-visibility button. Only the tables draw this, so it stays local."},
            {name: "emptySymbol", type: "ThemeSymbol", defaultValue: "the shared empty symbol in a 2em span", description: "Shown in place of the rows when the table has none. The whole visual, 2em sizing included, so a real illustration is not stuck inside that span. Set CommonThemeOptions.emptySymbol to change the glyph alone, here and in Empty and every chart."},
        ],
    },
    ChartThemeOptions: {
        name: "ChartThemeOptions",
        description: "Shared by every chart, which is what keeps a dashboard's series colours consistent.",
        fields: [
            {name: "seriesColors", type: "string[]", defaultValue: "eight slots built from the theme's four hues at two lightness steps", description: "The palette each series is drawn from, in order. Never a hex literal in a chart itself - a literal looks right in one theme and wrong in the other."},
            {name: "emptySymbol", type: "ThemeSymbol", defaultValue: "CommonThemeOptions.emptySymbol", description: "Shown when a chart has nothing to draw. The glyph alone, with no sizing of its own - unlike Empty's and both tables', which wrap it in a sized span. It follows CommonThemeOptions.emptySymbol exactly, so setting that changes this too."},
        ],
    },
}

/** Which theme-option objects each component's page documents */
const componentThemeOptions: Record<string, string[]> = {
    Button: ["ButtonThemeOptions"],
    Alert: ["CommonThemeOptions", "AlertThemeOptions"],
    Toast: ["CommonThemeOptions", "ToastThemeOptions"],
    Empty: ["CommonThemeOptions", "EmptyThemeOptions"],
    Tag: ["CommonThemeOptions", "TagThemeOptions"],
    Breadcrumbs: ["CommonThemeOptions", "BreadcrumbsThemeOptions"],
    Pagination: ["CommonThemeOptions", "PaginationThemeOptions"],
    Modal: ["CommonThemeOptions", "ModalThemeOptions"],
    Drawer: ["CommonThemeOptions", "DrawerThemeOptions"],
    Menu: ["CommonThemeOptions", "MenuThemeOptions"],
    Popconfirm: ["CommonThemeOptions", "PopconfirmThemeOptions"],
    TextFormField: ["CommonThemeOptions", "TextFormFieldThemeOptions"],
    TextEditableField: ["CommonThemeOptions", "TextFormFieldThemeOptions"],
    TextNonEditableField: ["CommonThemeOptions", "TextFormFieldThemeOptions"],
    DataTable: ["CommonThemeOptions", "DataTableThemeOptions"],
    AsyncDataTable: ["CommonThemeOptions", "DataTableThemeOptions"],
    LineChart: ["CommonThemeOptions", "ChartThemeOptions"],
    AreaChart: ["CommonThemeOptions", "ChartThemeOptions"],
    BarChart: ["CommonThemeOptions", "ChartThemeOptions"],
    PieChart: ["CommonThemeOptions", "ChartThemeOptions"],
    Gauge: ["CommonThemeOptions", "ChartThemeOptions"],
    Sparkline: ["CommonThemeOptions", "ChartThemeOptions"],
    Calendar: ["CommonThemeOptions"],
    Combobox: ["CommonThemeOptions"],
    Command: ["CommonThemeOptions"],
    CalendarRange: ["CommonThemeOptions"],
    Carousel: ["CommonThemeOptions"],
    Steps: ["CommonThemeOptions"],
}

const attrTables: Record<string, AttrDoc[]> = {
    Button: [
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger" | "text"', defaultValue: "primary", description: "Sets the color."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the button."},
        {name: "loadingOnClick", type: "boolean", defaultValue: "false", description: "Shows a spinner and blocks re-clicks until onClick calls doneLoading()."},
        {name: "onClick", type: "(event, doneLoading?) => void", description: "Click handler."},
    ],
    ButtonGroup: [
        {name: "orientation", type: '"horizontal" | "vertical"', defaultValue: "horizontal", description: "Direction to lay out the buttons."},
    ],
    RadioButton: [
        {name: "name", type: "string", required: true, description: "Name of the radio group this button participates in."},
        {name: "checked", type: "boolean", defaultValue: "false", description: "Is this option selected?"},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the radio button."},
        {name: "value", type: "string | number", description: "Value submitted for this option in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    Checkbox: [
        {name: "name", type: "string", description: "Name for the underlying <input>."},
        {name: "checked", type: "boolean", defaultValue: "false", description: "Is the checkbox checked?"},
        {name: "indeterminate", type: "boolean", defaultValue: "false", description: "Shows the visual indeterminate state (neither checked nor unchecked)."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the checkbox."},
        {name: "value", type: "string | number", description: "Value submitted in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    Toggle: [
        {name: "name", type: "string", description: "Name for the underlying <input>."},
        {name: "checked", type: "boolean", defaultValue: "false", description: "Is the toggle switched on?"},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the toggle."},
        {name: "value", type: "string | number", description: "Value submitted in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    TextBox: [
        {name: "type", type: '"text" | "email" | "phone" | "password" | "new-password"', required: true, description: "Input type."},
        {name: "name", type: "string", description: "Name for the underlying <input>."},
        {name: "value", type: "string | number", description: "Current value."},
        {name: "placeholder", type: "string", description: "Placeholder text."},
        {name: "required", type: "boolean", defaultValue: "false", description: "Marks the field required in a <form>."},
        {name: "clearable", type: "boolean", defaultValue: "false", description: "Adds a control that empties the field, shown only while it has a value. Off by default: this component covers every kind of field, and on one typed once and submitted a clear button is noise - on a password field, worse. It earns its place on a search or filter box, which knows who it is. Turning it on wraps the input, so the root becomes a <span> with the <input> inside; target .vtd-text-box for the input either way."},
        {name: "clearLabel", type: "string", description: "Accessible name for that control, which is a glyph and so has no name of its own."},
        {name: "onInput", type: "(event) => void", description: "Called on every keystroke, and when the clear control empties the field."},
        {name: "onChange", type: "(event) => void", description: "Called when the field is committed - on blur, or when the clear control empties it."},
    ],
    Textarea: [
        {name: "name", type: "string", description: "Name for the underlying <textarea>."},
        {name: "value", type: "string", description: "Current value."},
        {name: "placeholder", type: "string", description: "Placeholder text."},
        {name: "rows", type: "number", defaultValue: "3", description: "Visible text lines."},
        {name: "maxLength", type: "number", description: "Maximum accepted characters."},
        {name: "resize", type: '"none" | "vertical" | "horizontal" | "both"', defaultValue: "vertical", description: "User resize behavior."},
        {name: "required", type: "boolean", defaultValue: "false", description: "Marks the field required in a <form>."},
    ],
    Select: [
        {name: "options", type: "SelectOptionType[]", required: true, description: "The selectable options."},
        {name: "value", type: "string", description: "Currently selected value."},
        {name: "placeholder", type: "string", description: "First option shown until a value is chosen."},
        {name: "placeholderDisabled", type: "boolean", defaultValue: "false", description: "Prevents re-selecting the placeholder once a real option is chosen, so the selection can't be cleared through the UI."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the select."},
        {name: "required", type: "boolean", defaultValue: "false", description: "Marks the field required in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    SelectMenu: [
        {name: "options", type: "OptionType[]", required: true, description: "The selectable options, in display order."},
        {name: "getValue", type: "(option: OptionType) => string", required: true, description: "Extracts the value used to identify, select, and submit each option; must be unique per option."},
        {name: "renderOption", type: "(option: OptionType) => RenderableElements", required: true, description: "Renders one option's content - used for each entry in the open panel, and (unless renderValue is given) the trigger's display of the current selection too."},
        {name: "renderValue", type: "(option: OptionType) => RenderableElements", description: "Renders the trigger's display of the current selection, when it should differ from renderOption's full content."},
        {name: "value", type: "string", description: "Value of the initially-selected option."},
        {name: "placeholder", type: "RenderableElements", description: "Content shown in the trigger when no option is selected."},
        {name: "isOptionDisabled", type: "(option: OptionType) => boolean", description: "Marks an option as unselectable."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the whole control."},
        {name: "name", type: "string", description: "Name for a hidden <input> mirroring the selected value, for <form> submission."},
        {name: "onChange", type: "(option: OptionType, value: string) => void", description: "Called with the newly selected option whenever the user picks one."},
    ],
    TextNonEditableField: [
        {name: "value", type: "string", required: true, description: "The read-only value shown."},
    ],
    TextFormField: [
        {name: "field", type: "RenderBasic<string>", required: true, description: "The bound reactive value."},
        {name: "type", type: "TextBoxType", defaultValue: "text", description: "Input type."},
        {name: "required", type: "boolean", defaultValue: "false", description: "Marks the field required in a <form>."},
        {name: "updateOnInput", type: "boolean", defaultValue: "true", description: "Update field.value on every keystroke."},
        {name: "updateOnChange", type: "boolean", defaultValue: "false", description: "Update field.value on change/blur."},
    ],
    TextEditableField: [
        {name: "field", type: "RenderBasic<string>", required: true, description: "The bound reactive value."},
        {name: "type", type: "TextBoxType", defaultValue: "text", description: "Input type while editing."},
        {name: "fieldName", type: "string", description: "Name for the underlying <input> while editing."},
    ],
    NavLink: [
        {name: "to", type: "string", required: true, description: "Target URL."},
        {name: "exact", type: "boolean", defaultValue: "true", description: "Match only the exact pathname vs. any path starting with to."},
        {name: "activeClass", type: "string", defaultValue: '"vtd-nav-link-active"', description: "CSS class added when active."},
        {name: "spa", type: "boolean", defaultValue: "false", description: "Client-side route change via History.changeLocation, no page reload. Set true for an SPA; leave false for a multi-page site, where a click should be a real navigation."},
    ],
    Link: [
        {name: "to", type: "string", required: true, description: "Target URL."},
        {name: "spa", type: "boolean", defaultValue: "false", description: "Client-side route change via History.changeLocation, no page reload. Set true for an SPA; leave false for a multi-page site, or for a genuinely external target, where a click should be a real navigation - which also keeps open-in-new-tab, copy-link-address and drag-to-bookmark working."},
    ],
    Breadcrumbs: [
        {name: "items", type: "BreadcrumbItemType[]", required: true, description: "The trail of crumbs, root to current."},
        {name: "separator", type: "RenderableElements", defaultValue: '"/"', description: "Content shown between crumbs."},
        {name: "ariaLabel", type: "string", description: "Accessible label for the nav landmark."},
        {name: "spa", type: "boolean", defaultValue: "false", description: "Makes every crumb a client-side route change via History.changeLocation rather than a page reload. Set true inside an SPA; leave false on a multi-page site, where a crumb should be a real navigation."},
        {name: "maxItems", type: "number", description: "The most crumbs to show before the middle of the trail collapses behind an expander. A longer trail renders as the first crumb, the expander, and the last maxItems - 2 crumbs, so the root and the current page always survive. Unset, every crumb shows. Values below 3 are treated as 3."},
        {name: "expandButtonChildren", type: "RenderableElements", defaultValue: "BreadcrumbsThemeOptions.collapseSymbol", description: "Content of the expander that reveals the collapsed crumbs. The default is a plain … glyph, not English text."},
        {name: "expandLabel", type: "string", description: "Accessible name for the expander. Worth setting: its content is a glyph, so the control is otherwise unnamed."},
    ],
    Pagination: [
        {name: "page", type: "number", required: true, description: "Currently selected page, 1-indexed."},
        {name: "totalPages", type: "number", required: true, description: "Total number of pages."},
        {name: "onPageChange", type: "(page) => void", required: true, description: "Called with the newly selected page."},
        {name: "siblingCount", type: "number", defaultValue: "2", description: "Pages shown on each side of the current page."},
        {name: "prevButtonChildren", type: "RenderableElements", defaultValue: "PaginationThemeOptions.prevSymbol", description: "Content of the previous-page button. The default is a plain ‹ glyph, not English text."},
        {name: "nextButtonChildren", type: "RenderableElements", defaultValue: "PaginationThemeOptions.nextSymbol", description: "Content of the next-page button. The default is a plain › glyph, not English text."},
        {name: "ariaLabel", type: "string", description: "Accessible label for the nav landmark."},
    ],
    Navbar: [
        {name: "brand", type: "RenderableElements", description: "Content shown on the left."},
    ],
    Sidebar: [
        {name: "items", type: "SidebarItemType[]", required: true, description: "The entries to list. An entry with children becomes a collapsible group."},
        {name: "header", type: "RenderableElements", description: "Content shown above the list - a search box, a section title. It survives setItems, which is what lets a search box live here."},
        {name: "collapsedHeader", type: "RenderableElements", description: "What the header shows once collapsed to the rail - a search icon standing in for a search box. Setting it also keeps the header's height, so collapsing moves the entries sideways rather than up; left unset the header folds away instead."},
        {name: "footer", type: "RenderableElements", description: "Content pinned below the list, above the profile row and the collapse control."},
        {name: "profile", type: "SidebarProfileType", description: "An account row at the very foot, which opens a Menu when clicked."},
        {name: "ariaLabel", type: "string", description: "Accessible label for the nav landmark."},
        {name: "spa", type: "boolean", defaultValue: "false", description: "Makes every item a client-side route change via History.changeLocation rather than a page reload. Set true inside an SPA; leave false on a multi-page site, where an item should be a real navigation."},
        {name: "exact", type: "boolean", defaultValue: "true", description: "Forwarded to each entry's NavLink. Set false when an entry's to is a section root with pages beneath it."},
        {name: "collapsible", type: "boolean", defaultValue: "false", description: "Adds a control that shrinks the sidebar to a rail of icons, which floats back out over the page on hover or keyboard focus."},
        {name: "defaultCollapsed", type: "boolean", defaultValue: "false", description: "Start collapsed. Only meaningful alongside collapsible."},
        {name: "onCollapsedChange", type: "(collapsed) => void", description: "Called when the reader collapses or expands it. Persist the value here if you want it remembered - the component does not store anything itself."},
        {name: "collapseLabel", type: "string", description: "Accessible name for the collapse control, which is an icon and so has no name of its own."},
        {name: "resizable", type: "boolean", defaultValue: "false", description: "Lets the reader drag the trailing edge."},
        {name: "defaultWidth", type: "number", defaultValue: "250", description: "Starting width in px."},
        {name: "minWidth", type: "number", defaultValue: "180", description: "Smallest width a drag can reach, in px."},
        {name: "maxWidth", type: "number", defaultValue: "480", description: "Largest width a drag can reach, in px."},
        {name: "onWidthChange", type: "(width) => void", description: "Called as a resize drag settles. Persist the value here if you want it remembered."},
    ],
    TableOfContents: [
        {name: "items", type: "TableOfContentsItemType[]", required: true, description: "The entries to list, in the order they appear on the page: {id, label, level?}. id is the anchor target, and level (1 being top) sets the indent."},
        {name: "header", type: "RenderableElements", description: "Content shown above the list, e.g. \"On this page\"."},
        {name: "topOffset", type: "number", defaultValue: "0", description: "How far from the top of the viewport a section counts as current. Set it to the height of a sticky header, or the section sitting behind that header reads as the current one."},
        {name: "ariaLabel", type: "string", description: "Accessible label for the nav landmark. Worth setting, since a page usually has more than one nav."},
    ],
    Menu: [
        {name: "trigger", type: "RenderableElements", required: true, description: "Content that opens the menu when clicked."},
        {name: "items", type: "MenuItemType[]", required: true, description: "The entries to show - each with label, and either href (+ optional spa) and/or onClick."},
        {name: "closeOnOutsideClick", type: "boolean", defaultValue: "true", description: "Closes the menu on an outside click."},
    ],
    Steps: [
        {name: "steps", type: "StepType[]", required: true, description: "The steps, in order."},
        {name: "current", type: "number", required: true, description: "0-indexed position of the current step."},
    ],
    Alert: [
        {name: "type", type: '"info" | "success" | "warning" | "danger"', defaultValue: "info", description: "Sets the color."},
        {name: "title", type: "RenderableElements", description: "Optional title shown above the body."},
        {name: "onDismiss", type: "() => void", description: "If set, shows a dismiss button."},
        {name: "dismissLabel", type: "string", description: "Accessible label for the dismiss button, when shown."},
    ],
    Toast: [
        {name: "message", type: "RenderableElements", required: true, description: "The toast's content."},
        {name: "options.type", type: '"info" | "success" | "warning" | "danger"', defaultValue: "info", description: "Sets the color."},
        {name: "options.duration", type: "number", defaultValue: "4000", description: "Milliseconds before auto-dismiss; 0 disables it."},
        {name: "options.dismissLabel", type: "string", description: "Accessible label for the dismiss button."},
    ],
    Tooltip: [
        {name: "content", type: "RenderableElements", required: true, description: "Content shown inside the bubble."},
        {name: "placement", type: '"top" | "bottom" | "left" | "right"', defaultValue: "top", description: "Side of the trigger to show the bubble on."},
    ],
    Spinner: [
        {name: "size", type: "string", defaultValue: '"1em"', description: "CSS size."},
        {name: "label", type: "string", description: "Accessible label announced by screen readers."},
    ],
    Progress: [
        {name: "value", type: "number", required: true, description: "Current value."},
        {name: "max", type: "number", defaultValue: "100", description: "Maximum value."},
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger"', description: "Sets the color."},
        {name: "showLabel", type: "boolean", defaultValue: "false", description: "Shows a \"{percent}%\" label next to the bar."},
    ],
    Skeleton: [
        {name: "variant", type: '"text" | "circular" | "rectangular"', defaultValue: "text", description: "Placeholder shape."},
        {name: "width", type: "string", description: "CSS width of the placeholder."},
        {name: "height", type: "string", description: "CSS height of the placeholder."},
        {name: "lines", type: "number", defaultValue: "1", description: "Number of lines for the text variant."},
    ],
    Empty: [
        {name: "title", type: "RenderableElements", description: "Main message. Only the ∅ icon shows unless you set one."},
        {name: "description", type: "RenderableElements", description: "Smaller supporting text."},
    ],
    Modal: [
        {name: "title", type: "RenderableElements", required: true, description: "Title content."},
        {name: "confirmButtonChildren", type: "RenderableElements", required: true, description: "Confirm button content."},
        {name: "cancelButtonChildren", type: "RenderableElements", defaultValue: "ModalThemeOptions.cancelSymbol", description: "Cancel button content. A plain \"x\", not English text."},
        {name: "confirmButtonOnClick", type: "(doneLoading) => void", description: "Called when confirm is clicked."},
        {name: "startConfirmDisabled", type: "boolean", defaultValue: "false", description: "Starts the confirm button disabled."},
    ],
    Drawer: [
        {name: "title", type: "RenderableElements", description: "Title content."},
        {name: "placement", type: '"left" | "right" | "top" | "bottom"', defaultValue: "left", description: "Which edge of the viewport the drawer is anchored to."},
        {name: "enterFrom", type: '"left" | "right" | "top" | "bottom"', defaultValue: "same as placement", description: "Which direction the entrance animation slides in from."},
    ],
    Popover: [
        {name: "trigger", type: "RenderableElements", required: true, description: "Content that opens the popover when clicked - can be a real Button."},
        {name: "content", type: "RenderableElements", required: true, description: "Content shown inside the bubble."},
        {name: "placement", type: '"top" | "bottom" | "left" | "right"', defaultValue: "bottom", description: "Side of the trigger."},
        {name: "closeOnOutsideClick", type: "boolean", defaultValue: "true", description: "Closes the popover on an outside click."},
    ],
    Popconfirm: [
        {name: "title", type: "RenderableElements", required: true, description: "Confirmation message."},
        {name: "onConfirm", type: "() => void", required: true, description: "Called when confirmed."},
        {name: "confirmButtonChildren", type: "RenderableElements", defaultValue: "PopconfirmThemeOptions.confirmSymbol", description: "Content of the confirm button. The default is a plain ✓ glyph, not English text."},
        {name: "cancelButtonChildren", type: "RenderableElements", defaultValue: "PopconfirmThemeOptions.cancelSymbol", description: "Content of the cancel button. The default is a plain ✕ glyph, not English text."},
        {name: "closeOnOutsideClick", type: "boolean", defaultValue: "true", description: "Closes the bubble on an outside click."},
    ],
    ContextMenu: [
        {name: "items", type: "ContextMenuItemType[]", required: true, description: "The entries to show."},
    ],
    Command: [
        {name: "items", type: "CommandItemType[]", required: true, description: "The full set of items, filtered client-side."},
        {name: "placeholder", type: "string", description: "Placeholder for the search input."},
        {name: "noMatchMessage", type: "RenderableElements", defaultValue: "CommonThemeOptions.emptySymbol", description: "Shown in the list when the query matches none of the items."},
    ],
    Badge: [
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger" | "neutral"', defaultValue: "neutral", description: "Sets the color."},
    ],
    Card: [
        {name: "header", type: "RenderableElements", description: "Content for the region above the body. Unset, no header is drawn."},
        {name: "footer", type: "RenderableElements", description: "Content for the region below the body. Unset, no footer is drawn."},
    ],
    CodeBlock: [
        {name: "code", type: "string", required: true, description: "The source to display, verbatim. Rendered as text nodes, never as markup, so a snippet containing tags shows those tags instead of rendering them."},
        {name: "language", type: "CodeLanguage", defaultValue: "tsx", description: "Grammar to highlight with: tsx | css | plain. tsx also covers TypeScript, JavaScript and JSON; plain opts out of highlighting, which is the right answer for a shell session or a language this doesn't know."},
        {name: "showLineNumbers", type: "boolean", defaultValue: "false", description: "Show a gutter of line numbers down the left. The numbers are a CSS counter rather than text, so selecting the block copies the code alone."},
        {name: "wrap", type: "boolean", defaultValue: "false", description: "Wrap long lines instead of scrolling them. Off by default because code's line breaks are meaningful - a wrapped line reads as two statements."},
        {name: "ariaLabel", type: "string", description: "Accessible name for the block's scroll region. Worth setting: a horizontally scrollable region is focusable, so it reaches keyboard users unnamed otherwise."},
    ],
    Avatar: [
        {name: "src", type: "string", description: "Image URL."},
        {name: "initials", type: "string", description: "Fallback shown when there's no image (or it fails to load)."},
        {name: "alt", type: "string", description: "Alt text for the image."},
        {name: "size", type: "string", defaultValue: '"2.5em"', description: "CSS size."},
        {name: "type", type: "AvatarType", defaultValue: '"primary"', description: "Which theme colour the initials fallback is drawn in. A colour name rather than a colour, so the palette supplies a light and a dark value for each and the contrast holds in both themes. An avatar showing an image covers its own background anyway."},
    ],
    TimeAgo: [
        {name: "timestamp", type: "Date | string", required: true, description: "The moment to format, relative to now."},
        {name: "numeric", type: '"always" | "auto"', defaultValue: '"always"', description: 'Whether to always use a number. "always" gives "1 day ago"; "auto" lets the browser say "yesterday" where the reader\'s locale has a word for it.'},
        {name: "timeStyle", type: '"long" | "short" | "narrow"', defaultValue: '"long"', description: 'How verbose the formatted string is: "3 minutes ago", "3 min. ago", or "3m ago" - per the reader\'s locale.'},
    ],
    Divider: [
        {name: "orientation", type: '"horizontal" | "vertical"', defaultValue: "horizontal", description: "Direction of the line."},
    ],
    Tabs: [
        {name: "tabs", type: "TabType[]", required: true, description: "The tabs to render."},
        {name: "initialKey", type: "string", defaultValue: "first tab", description: "Key of the tab that starts active."},
    ],
    Accordion: [
        {name: "items", type: "AccordionItemType[]", required: true, description: "The sections to render."},
        {name: "exclusive", type: "boolean", defaultValue: "false", description: "Opening one section closes any other open section."},
    ],
    Tag: [
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger" | "neutral"', defaultValue: "neutral", description: "Sets the color."},
        {name: "onRemove", type: "() => void", description: "If set, shows a remove button."},
        {name: "removeLabel", type: "string", description: "Accessible label for the remove button, when shown."},
    ],
    Collapse: [
        {name: "header", type: "RenderableElements", required: true, description: "Header content."},
        {name: "defaultOpen", type: "boolean", defaultValue: "false", description: "Starts expanded."},
    ],
    Statistic: [
        {name: "title", type: "RenderableElements", required: true, description: "Label shown above the value."},
        {name: "value", type: "string | number", required: true, description: "The value to display."},
        {name: "prefix", type: "RenderableElements", description: "Content shown immediately before the value, e.g. a currency symbol."},
        {name: "suffix", type: "RenderableElements", description: "Content shown immediately after the value, e.g. a unit."},
    ],
    List: [
        {name: "items", type: "ListItemType[]", required: true, description: "The entries to show - each with title, description, leading, trailing, and optionally href/onSelect."},
        {name: "zebra", type: "boolean", defaultValue: "false", description: "Alternate item background colors for readability."},
        {name: "highlightOnHover", type: "boolean", defaultValue: "false", description: "Highlight an item's background on hover."},
    ],
    Timeline: [
        {name: "items", type: "TimelineItemType[]", required: true, description: "The events, in order - each with a title, description, and dot type."},
    ],
    AspectRatio: [
        {name: "ratio", type: "number", defaultValue: "1", description: "Width divided by height, e.g. 16/9."},
    ],
    ScrollArea: [
        {name: "maxHeight", type: "string", description: "CSS max-height of the scrollable region."},
    ],
    Table: [
        {name: "columns", type: "TableColumnType<RowType>[]", required: true, description: "Column definitions, each with a render(row) function. A column may also carry align, width, and sortDirection/onSortClick to show a sort indicator."},
        {name: "rows", type: "RowType[]", required: true, description: "The rows to display."},
        {name: "columns[].width", type: "number | string", description: "Column width - a number is px, a string is any CSS length, so \"15%\" and \"12em\" work. Setting it on any column switches the whole table to fixed layout, which is what makes a declared width bind rather than lose to a wide cell; the columns that declare none share what is left."},
    ],
    DataTable: [
        {name: "columns", type: "DataTableColumnType<RowType>[]", required: true, description: "Column definitions - add sortValue/filterValue/width/hideable/resizable to opt each column into those features."},
        {name: "rows", type: "RowType[]", required: true, description: "The full set of rows; filtering/sorting/pagination all happen client-side over this set."},
        {name: "pageSize", type: "number", defaultValue: "10", description: "Rows per page. 0 disables pagination."},
        {name: "pageSizeOptions", type: "number[]", defaultValue: "[10, 25, 50, 100]", description: "Options offered by the page-size control, when shown."},
        {name: "showPageSizeControl", type: "boolean", defaultValue: "false", description: "Shows a control letting the user change how many rows are displayed per page."},
        {name: "resizableColumns", type: "boolean", defaultValue: "true", description: "Whether columns can be resized by dragging, unless overridden per-column via resizable."},
        {name: "showColumnToggle", type: "boolean", defaultValue: "true", description: "Shows the column-visibility customizer button."},
        {name: "columnToggleChildren", type: "RenderableElements", defaultValue: "DataTableThemeOptions.columnsSymbol, the ▥ glyph", description: "Content of that button. Pass your own word for it, or override the theme option once for your whole app. The library never defaults visible text to a language."},
        {name: "columnToggleLabel", type: "string", description: "Accessible name for the column-visibility button. Set it whenever the button's content is a symbol rather than words, or it has no name at all."},
        {name: "pageSizeLabel", type: "RenderableElements", description: "Caption beside the page-size control. Nothing iconographic means \"rows per page\", so the library renders no caption rather than assuming English."},
        {name: "emptyMessage", type: "RenderableElements", defaultValue: "DataTableThemeOptions.emptySymbol, the ∅ glyph", description: "Shown in place of the rows when nothing matches."},
        {name: "searchable", type: "boolean", defaultValue: "false", description: "Shows a search box filtering rows via each column's filterValue. Any column whose render() returns plain text highlights its matched characters automatically."},
        {name: "searchPlaceholder", type: "string", description: "Placeholder for the search input."},
        {name: "zebra", type: "boolean", defaultValue: "false", description: "Alternate row background colors for readability."},
        {name: "highlightOnHover", type: "boolean", defaultValue: "true", description: "Highlight a row's background on hover."},
        {name: "rowHref", type: "(row) => string | undefined", description: "Wraps a row's first visible column in a real, full-width link. Takes priority over onRowSelect."},
        {name: "onRowSelect", type: "(row) => void", description: "Makes a row a JS-driven full-width \"select\" action (a stretched button) instead of a link."},
    ],
    AsyncDataTable: [
        {name: "columns", type: "AsyncDataTableColumnType<RowType>[]", required: true, description: "Column definitions. Note sortable: true rather than sortValue/filterValue - the server does both, and sorting a single page in the browser would reorder only the rows that happened to come back."},
        {name: "load", type: "(query) => Promise<{rows, total?, truncated?}>", required: true, description: "Fetches one page. Called on mount and on every search, sort, page and page-size change. Give total for numbered pagination; omit it for prev/next. Set truncated when the backend capped the result, and the table says so instead of looking complete."},
        {name: "pageSize", type: "number", defaultValue: "25", description: "Rows per page."},
        {name: "pageSizeOptions", type: "number[]", defaultValue: "[10, 25, 50, 100]", description: "Options offered by the page-size control, when shown."},
        {name: "showPageSizeControl", type: "boolean", defaultValue: "false", description: "Shows a control letting the user change how many rows are requested per page."},
        {name: "searchable", type: "boolean", defaultValue: "true", description: "Shows the search box."},
        {name: "searchPlaceholder", type: "string", description: "Placeholder for the search input."},
        {name: "debounceMs", type: "number", defaultValue: "200", description: "How long to wait after the last keystroke before calling load."},
        {name: "emptyMessage", type: "RenderableElements", defaultValue: "DataTableThemeOptions.emptySymbol, the ∅ glyph", description: "Shown when the loader returns nothing and the search box is empty - \"there is nothing here\"."},
        {name: "columnToggleChildren", type: "RenderableElements", defaultValue: "DataTableThemeOptions.columnsSymbol, the ▥ glyph", description: "Content of the column-visibility button."},
        {name: "columnToggleLabel", type: "string", description: "Accessible name for the column-visibility button. Set it whenever the button's content is a symbol rather than words, or it has no name at all."},
        {name: "pageSizeLabel", type: "RenderableElements", description: "Caption beside the page-size control. Nothing iconographic means \"rows per page\", so the library renders no caption rather than assuming English."},
        {name: "noMatchMessage", type: "RenderableElements", defaultValue: "same as emptyMessage", description: "Shown when a non-empty search returns nothing. Kept separate from emptyMessage because an empty collection and a search that matched nothing are different facts."},
        {name: "renderError", type: "(error) => RenderableElements", description: "Rendered when load rejects. Without it a failed load looks like a convincing empty table."},
        {name: "loadingLabel", type: "string", description: "Accessible label for the loading spinner. The library doesn't assume a language."},
        {name: "truncatedMessage", type: "RenderableElements", description: "Shown in the footer when a result comes back with truncated: true."},
        {name: "showColumnToggle", type: "boolean", defaultValue: "true", description: "Shows the column-visibility customizer button."},
        {name: "zebra", type: "boolean", defaultValue: "false", description: "Alternate row background colors for readability."},
        {name: "highlightOnHover", type: "boolean", defaultValue: "true", description: "Highlight a row's background on hover."},
        {name: "rowHref", type: "(row) => string | undefined", description: "Wraps a row's first visible column in a real, full-width link. Takes priority over onRowSelect."},
        {name: "onRowSelect", type: "(row) => void", description: "Makes a row a JS-driven full-width \"select\" action (a stretched button) instead of a link."},
    ],
    Heading: [
        {name: "level", type: "1 | 2 | 3 | 4 | 5 | 6", required: true, description: "Which heading level, rendered as the matching h1-h6. Required on purpose: a default would quietly produce a second h1 on a page that already has one."},
        {name: "type", type: "TextType", description: "Semantic colour: muted | primary | secondary | warning | danger. Unset is the page's own text colour."},
    ],
    Text: [
        {name: "type", type: "TextType", description: "Semantic colour: muted | primary | secondary | warning | danger."},
        {name: "strong", type: "boolean", defaultValue: "false", description: "Renders the text bold."},
        {name: "italic", type: "boolean", defaultValue: "false", description: "Renders the text italic."},
        {name: "underline", type: "boolean", defaultValue: "false", description: "Underlines the text."},
        {name: "strike", type: "boolean", defaultValue: "false", description: "Strikes the text through."},
        {name: "numeric", type: "boolean", defaultValue: "false", description: "Tabular figures, so digits line up in a column and a changing value does not shift its neighbours."},
        {name: "code", type: "boolean", defaultValue: "false", description: "Renders a real <code> element rather than a <span>, with monospace and a subtle fill."},
    ],
    Paragraph: [
        {name: "type", type: "TextType", description: "Semantic colour: muted | primary | secondary | warning | danger. Unset is the page's own text colour, which is right for most prose."},
    ],
    Stack: [
        {name: "direction", type: '"row" | "column"', defaultValue: "row", description: "Lay children out in a row or a column."},
        {name: "gap", type: "GapSize | string", defaultValue: "md", description: "Space between children: none | xs | sm | md | lg | xl, or any CSS length. The scale is in em, so a gap scales with its container's type."},
        {name: "align", type: "AlignItems", description: "start | center | end | stretch | baseline. A column stretches by default - pass start for content-sized children like badges."},
        {name: "justify", type: "JustifyContent", description: "start | center | end | between | around."},
        {name: "wrap", type: "boolean", defaultValue: "true for a row, never for a column", description: "Let children wrap onto further lines."},
        {name: "inline", type: "boolean", defaultValue: "false", description: "Flow inline with surrounding text rather than taking a line of its own."},
    ],
    Grid: [
        {name: "minColumnWidth", type: "string", defaultValue: "16em", description: "Fit as many columns as will hold this width, then share the remainder. This is the responsive default - it reflows without a media query."},
        {name: "columns", type: "number", description: "A fixed number of equal columns instead. Prefer minColumnWidth unless the count itself is meaningful - a fixed count has to be re-chosen at every breakpoint."},
        {name: "gap", type: "GapSize | string", defaultValue: "md", description: "Space between cells."},
        {name: "align", type: "AlignItems", description: "How cells line up within their row."},
    ],
    LineChart: [
        {name: "title", type: "string", description: "A heading shown above the drawing. Also becomes the accessible name when ariaLabel is not set, so a visible title and a spoken one cannot disagree. Rendered as a div, not a heading element - the chart cannot know what level it sits at."},
        {name: "data", type: "ChartPointType[]", required: true, description: "One entry per category: {label, values: {seriesKey: number}}."},
        {name: "series", type: "ChartSeriesType[]", required: true, description: "The series to plot: {key, label?, color?}. Their order picks their palette slots."},
        {name: "area", type: "boolean", defaultValue: "false", description: "Fills under each line. AreaChart is this component with it set."},
        {name: "stacked", type: "boolean", defaultValue: "false", description: "Stacks series on top of each other rather than overlaying them."},
        {name: "showDots", type: "boolean", defaultValue: "true below 40 points", description: "A dot at each point."},
        {name: "beginAtZero", type: "boolean", defaultValue: "true", description: "Starts the value axis at zero rather than the data's own minimum."},
        {name: "height", type: "number", defaultValue: "220", description: "Drawing height in px, excluding the legend. Width always fills the container."},
        {name: "formatValue", type: "(n: number) => string", defaultValue: "String", description: "Formats axis ticks and tooltip values."},
        {name: "ariaLabel", type: "string", description: "Accessible name, used as the caption of the visually-hidden data table a screen reader reads in place of the drawing. The chart never sets an SVG <title>, so it triggers no native browser tooltip."},
        {name: "emptyMessage", type: "string", defaultValue: "ChartThemeOptions.emptySymbol, the U+2205 glyph", description: "Shown when there is nothing to draw."},
        {name: "hideLegend", type: "boolean", defaultValue: "false", description: "Hides the legend even with more than one series. A single series never gets one."},
    ],
    AreaChart: [
        {name: "title", type: "string", description: "A heading shown above the drawing. Also becomes the accessible name when ariaLabel is not set, so a visible title and a spoken one cannot disagree. Rendered as a div, not a heading element - the chart cannot know what level it sits at."},
        {name: "data", type: "ChartPointType[]", required: true, description: "One entry per category: {label, values: {seriesKey: number}}."},
        {name: "series", type: "ChartSeriesType[]", required: true, description: "The series to plot: {key, label?, color?}. Their order picks their palette slots."},
        {name: "stacked", type: "boolean", defaultValue: "false", description: "Stacks series on top of each other rather than overlaying them. This is the one to reach for: stacking is what makes an area chart say \"these parts add up to this total\" rather than \"these two filled shapes happen to overlap\"."},
        {name: "showDots", type: "boolean", defaultValue: "true below 40 points", description: "A dot at each point."},
        {name: "beginAtZero", type: "boolean", defaultValue: "true", description: "Starts the value axis at zero rather than the data's own minimum."},
        {name: "height", type: "number", defaultValue: "220", description: "Drawing height in px, excluding the legend. Width always fills the container."},
        {name: "formatValue", type: "(n: number) => string", defaultValue: "String", description: "Formats axis ticks and tooltip values."},
        {name: "ariaLabel", type: "string", description: "Accessible name, used as the caption of the visually-hidden data table a screen reader reads in place of the drawing. The chart never sets an SVG <title>, so it triggers no native browser tooltip."},
        {name: "emptyMessage", type: "string", defaultValue: "ChartThemeOptions.emptySymbol, the U+2205 glyph", description: "Shown when there is nothing to draw."},
        {name: "hideLegend", type: "boolean", defaultValue: "false", description: "Hides the legend even with more than one series. A single series never gets one."},
    ],
    BarChart: [
        {name: "title", type: "string", description: "A heading shown above the drawing. Also becomes the accessible name when ariaLabel is not set, so a visible title and a spoken one cannot disagree. Rendered as a div, not a heading element - the chart cannot know what level it sits at."},
        {name: "data", type: "ChartPointType[]", required: true, description: "One entry per category."},
        {name: "series", type: "ChartSeriesType[]", required: true, description: "The series to plot."},
        {name: "horizontal", type: "boolean", defaultValue: "false", description: "Bars run left-to-right. Worth reaching for when category labels are words rather than dates - each label gets a full line instead of being rotated."},
        {name: "stacked", type: "boolean", defaultValue: "false", description: "Stacks each category's series into one bar."},
        {name: "height", type: "number", defaultValue: "220", description: "Drawing height in px."},
    ],
    PieChart: [
        {name: "title", type: "string", description: "A heading shown above the drawing. Also becomes the accessible name when ariaLabel is not set, so a visible title and a spoken one cannot disagree. Rendered as a div, not a heading element - the chart cannot know what level it sits at."},
        {name: "data", type: "PieSliceType[]", required: true, description: "The slices: {label, value, color?}, drawn from 12 o'clock in the order given."},
        {name: "donut", type: "number", defaultValue: "0", description: "Hole size as a fraction of the radius, 0-0.9. 0.6 is the usual donut."},
        {name: "centerLabel", type: "string", description: "Content for the middle of a donut."},
        {name: "centerSubLabel", type: "string", description: "Smaller text under centerLabel."},
        {name: "showPercent", type: "boolean", defaultValue: "true", description: "Shows each slice's share in the tooltip."},
    ],
    Gauge: [
        {name: "title", type: "string", description: "A heading shown above the drawing. Also becomes the accessible name when ariaLabel is not set, so a visible title and a spoken one cannot disagree. Rendered as a div, not a heading element - the chart cannot know what level it sits at."},
        {name: "value", type: "number", required: true, description: "The value to show."},
        {name: "min", type: "number", defaultValue: "0", description: "The low end of the range the value is read against."},
        {name: "max", type: "number", defaultValue: "100", description: "The high end of the range the value is read against."},
        {name: "sweep", type: "number", defaultValue: "240", description: "How much of a circle the track spans, in degrees. 180 is a half-circle for a wide, short tile."},
        {name: "bands", type: "GaugeBandType[]", description: "Ranges to tint: {from, to, color}. The value arc is inset so the bands stay visible, and takes the colour of the band it lands in."},
        {name: "label", type: "string", defaultValue: "the formatted value", description: "Text shown in the centre of the dial."},
        {name: "subLabel", type: "string", description: "Smaller text under the centre label."},
        {name: "showRange", type: "boolean", defaultValue: "true", description: "Draws min and max at the ends of the track."},
    ],
    Sparkline: [
        {name: "values", type: "number[]", required: true, description: "The values, oldest first."},
        {name: "variant", type: '"line" | "area" | "bar"', defaultValue: "line", description: "How to draw them."},
        {name: "width", type: "number", defaultValue: "120", description: "Fixed width in px. A sparkline does not resize with its container - it is a glyph, not a chart."},
        {name: "height", type: "number", defaultValue: "28", description: "Fixed height in px."},
        {name: "color", type: "string", defaultValue: "var(--primary)", description: "CSS colour for the stroke or fill."},
        {name: "showLast", type: "boolean", defaultValue: "true for line/area", description: "A dot on the most recent value."},
        {name: "ariaLabel", type: "string", description: "Accessible name. Unset, the sparkline is aria-hidden, which is right when the number it illustrates is already in the text beside it."},
    ],
    Carousel: [
        {name: "slides", type: "RenderableElements[]", required: true, description: "The slides to cycle through."},
        {name: "showDots", type: "boolean", defaultValue: "true", description: "Shows numbered dot indicators."},
        {name: "getDotLabel", type: "(index) => string", description: "Builds a dot's accessible label from its 0-indexed slide index."},
        {name: "autoplay", type: "boolean", defaultValue: "false", description: "Automatically advance on a timer; stops for good on the first user-driven navigation."},
        {name: "autoplayFirstDelay", type: "number", defaultValue: "same as autoplayDelay", description: "Delay in ms before the very first automatic advance."},
        {name: "autoplayDelay", type: "number", defaultValue: "5000", description: "Flat delay in ms between each automatic advance after the first."},
        {name: "autoplaySlideDelays", type: "Record<number, number>", description: "Per-slide delay overrides in ms, keyed by the currently-shown slide's index."},
    ],
    Calendar: [
        {name: "value", type: "Date", defaultValue: "today", description: "Currently selected date."},
        {name: "onSelectDate", type: "(date) => void", description: "Called when a day cell is clicked."},
    ],
    CalendarRange: [
        {name: "value", type: "{start?: Date, end?: Date}", description: "Currently selected range."},
        {name: "onSelectRange", type: "(range) => void", description: "Called after picking the start, and again after picking the end."},
    ],
    Tree: [
        {name: "nodes", type: "TreeNodeType[]", required: true, description: "The root nodes - each optionally with children."},
        {name: "onSelect", type: "(node) => void", description: "Called when a node's label is clicked. Leaving it unset is meaningful: a leaf then renders as a plain container rather than something claiming to be a button, which is what lets a link in the label own its own click."},
        {name: "onToggle", type: "(node, open) => void", description: "Called after a branch has opened or closed, from a click or from setOpen. It runs after the change, so reading getOpenKeys() inside it is safe."},
        {name: "ariaLabel", type: "string", description: "Accessible name for the tree as a whole."},
    ],
    DatePicker: [
        {name: "value", type: "string", description: 'Current value, as an "YYYY-MM-DD" string.'},
        {name: "min", type: "string", description: "Earliest selectable date."},
        {name: "max", type: "string", description: "Latest selectable date."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the input."},
        {name: "required", type: "boolean", defaultValue: "false", description: "Marks the field required in a <form>."},
    ],
    DateTimePicker: [
        {name: "value", type: "string", description: 'Current value, as an "YYYY-MM-DDTHH:mm" string.'},
        {name: "min", type: "string", description: "Earliest selectable date-time."},
        {name: "max", type: "string", description: "Latest selectable date-time."},
        {name: "step", type: "number", defaultValue: "60, i.e. no seconds field", description: "Time granularity in seconds."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the input."},
        {name: "required", type: "boolean", defaultValue: "false", description: "Marks the field required in a <form>."},
    ],
    DateTimeRangePicker: [
        {name: "value", type: "{start?: string, end?: string}", description: 'Currently selected range, each as an "YYYY-MM-DDTHH:mm" string.'},
        {name: "min", type: "string", description: "Earliest selectable date-time, applied to both fields."},
        {name: "max", type: "string", description: "Latest selectable date-time, applied to both fields."},
        {name: "onChange", type: "(range) => void", description: "Called with the updated range whenever either field changes."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables both inputs."},
    ],
    Slider: [
        {name: "value", type: "number", description: "Current value."},
        {name: "min", type: "number", defaultValue: "0", description: "Lowest selectable value."},
        {name: "max", type: "number", defaultValue: "100", description: "Highest selectable value."},
        {name: "step", type: "number", defaultValue: "1", description: "Step size."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the slider."},
        {name: "onInput", type: "(event) => void", description: "Called continuously as the handle is dragged."},
        {name: "onChange", type: "(event) => void", description: "Called once, when the handle is released."},
    ],
    InputNumber: [
        {name: "value", type: "number", description: "Current value."},
        {name: "min", type: "number", description: "Lowest accepted value."},
        {name: "max", type: "number", description: "Highest accepted value."},
        {name: "step", type: "number", description: "How much the spinner buttons and arrow keys move the value by."},
        {name: "placeholder", type: "string", description: "Placeholder text."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the input."},
    ],
    ColorPicker: [
        {name: "value", type: "string", description: 'Current value, as a "#rrggbb" hex string.'},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the input."},
    ],
    Combobox: [
        {name: "options", type: "ComboboxOptionType[]", required: true, description: "Suggested options."},
        {name: "value", type: "string", description: "Current value."},
        {name: "placeholder", type: "string", description: "Placeholder text."},
        {name: "noMatchMessage", type: "RenderableElements", defaultValue: "CommonThemeOptions.emptySymbol", description: "Shown in the panel when the query matches none of the options."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the combobox."},
    ],
    Upload: [
        {name: "accept", type: "string", description: 'Accepted file types, e.g. "image/*".'},
        {name: "multiple", type: "boolean", defaultValue: "false", description: "Allow selecting more than one file."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the control."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    Rate: [
        {name: "value", type: "number", description: "Currently selected value."},
        {name: "count", type: "number", defaultValue: "5", description: "Number of stars."},
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger"', defaultValue: "warning", description: "Sets the filled-star color."},
        {name: "disabled", type: "boolean", defaultValue: "false", description: "Disables the control."},
        {name: "getStarLabel", type: "(value, count) => string", description: "Builds one star's accessible label."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    Form: [
        {name: "onSubmit", type: "(event) => void", description: "Called on submit, after preventDefault() (Form)."},
        {name: "label", type: "RenderableElements", description: "The field's label (FormField)."},
        {name: "error", type: "RenderableElements", description: "Validation message shown below the field (FormField)."},
        {name: "required", type: "boolean", defaultValue: "false", description: "Shows a required marker next to the label (FormField)."},
    ],
    Icon: [
        {name: "i", type: "string", required: true, description: "The key of a registered icon."},
    ],
}

/*
 * CodeBlock's own examples need source to display. Kept as constants rather than inline so the
 * `code:` snippet beside each one stays about the component ({source}) instead of burying the
 * attrs under a screenful of sample text.
 */
const CODE_SAMPLE_TSX = `import { Badge } from "@velotype/velodesign"

// A count, coloured by the theme rather than by a literal
export function OpenCount(attrs: {items: string[]}) {
    const total = attrs.items.length
    return <Badge type="primary">{total} open</Badge>
}`

const CODE_SAMPLE_CSS = `/* Token colours only - never a literal */
.vtd-code-block {
    background-color: var(--background-1);
    border: 1px solid var(--background-4);
    padding: 1em;
}`

const CODE_SAMPLE_PLAIN = `$ deno task bundle
Bundled 98 modules in 328ms
  build/main.js    458.45KB`

/*
 * Sample data for the examples of components whose whole subject is a dataset. Named the way a
 * consumer would name them, because the `code:` snippets beside those examples refer to these
 * names rather than inlining a screenful of rows.
 */
const monthlyRevenue = [
    {label: "Jan", values: {revenue: 12, costs: 8}},
    {label: "Feb", values: {revenue: 19, costs: 11}},
    {label: "Mar", values: {revenue: 15, costs: 10}},
    {label: "Apr", values: {revenue: 27, costs: 15}},
    {label: "May", values: {revenue: 22, costs: 13}},
]
const revenueSeries = [{key: "revenue", label: "Revenue"}, {key: "costs", label: "Costs"}]
// Four series, which is what shows the palette doing its job - and the point at which a legend
// stops being decoration and starts being the only way to read the plot
const quarterlyChannels = [
    {label: "Q1", values: {direct: 31, partner: 18, organic: 24, paid: 12}},
    {label: "Q2", values: {direct: 38, partner: 22, organic: 21, paid: 17}},
    {label: "Q3", values: {direct: 34, partner: 29, organic: 27, paid: 14}},
    {label: "Q4", values: {direct: 45, partner: 26, organic: 33, paid: 21}},
]
const channelSeries = [
    {key: "direct", label: "Direct"}, {key: "partner", label: "Partner"},
    {key: "organic", label: "Organic"}, {key: "paid", label: "Paid"},
]
const spendByTeam = [
    {label: "Platform", value: 24}, {label: "Growth", value: 18},
    {label: "Infra", value: 12}, {label: "Design", value: 7},
]
const weeklySignups = [4, 7, 5, 11, 9, 14, 12, 18, 15, 21]

type Person = {name: string, role: string}
const directory: Person[] = [
    {name: "Ada Lovelace", role: "Engineering"}, {name: "Grace Hopper", role: "Engineering"},
    {name: "Alan Turing", role: "Research"}, {name: "Katherine Johnson", role: "Research"},
    {name: "Jean Bartik", role: "Operations"},
]

const row = {display: "flex", gap: "0.75em", flexWrap: "wrap", alignItems: "center"} as const
const col = {display: "flex", flexDirection: "column", gap: "0.75em"} as const

const textFormFieldValue = new RenderBasic<string>("editable value")
const textEditableFieldValue = new RenderBasic<string>("click edit to change me")
const selectMenuSelection = new RenderBasic<string>("Jamie Rivera")

/**
 * Calendar (like Carousel/DataTable/every other stateful `Component` in the library - see each
 * one's own doc comment) reads `value` once at construction and has no way to pick up a changed
 * attr on an already-mounted instance, so a docs example that just does
 * `<Calendar value={someDate} onSelectDate={...}/>` with a fixed `someDate` never visibly
 * reacts to a click - the selected-day highlight never moves, which reads as "doesn't let you
 * select a date" even though `onSelectDate` is in fact firing. This wrapper holds the selected
 * date as its own state and `refresh()`es to hand Calendar a fresh `value` on every pick -
 * safe here specifically because Calendar takes no consumer children of its own to lose.
 */
class CalendarDemo extends Component<EmptyAttrs> {
    #selected: Date = new Date()
    override render(): RenderableElements {
        return <Calendar value={this.#selected} onSelectDate={(date) => { this.#selected = date; this.refresh() }}/>
    }
}

/** Same "read-once, refresh() to hand it a fresh value" wiring as `CalendarDemo` above - see
 * its doc comment - `CalendarRange` has the identical limitation. */
class CalendarRangeDemo extends Component<EmptyAttrs> {
    #range: {start?: Date, end?: Date} = {}
    override render(): RenderableElements {
        return <CalendarRange value={this.#range} onSelectRange={(range) => { this.#range = range; this.refresh() }}/>
    }
}

/** A long option list for Combobox, so its search/filter behavior actually has something to filter */
const comboboxCountryOptions = [
    "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia",
    "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "India", "Indonesia", "Ireland",
    "Israel", "Italy", "Japan", "Kenya", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand",
    "Nigeria", "Norway", "Peru", "Philippines", "Poland", "Portugal", "Singapore", "South Africa",
    "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine",
    "United Kingdom", "United States", "Vietnam",
].map(name => ({value: name}))

/**
 * Labeled variants shown on each component's page - a spread of the states a real app would
 * actually use, not an exhaustive combination of every attribute. A component missing here just
 * gets no "Examples" section (falls back to an empty array below).
 */
const examplesByName: Record<string, ExampleDoc[]> = {
    // --- Form ---
    Button: [
        {label: "Types", node: () => <div style={row}>
            <Button type="primary">Primary</Button>
            <Button type="secondary">Secondary</Button>
            <Button type="warning">Warning</Button>
            <Button type="danger">Danger</Button>
            <Button type="text">Text</Button>
        </div>, code: `<Button type="primary">Primary</Button>
<Button type="secondary">Secondary</Button>
<Button type="warning">Warning</Button>
<Button type="danger">Danger</Button>
<Button type="text">Text</Button>`},
        {label: "Disabled", node: () => <Button type="primary" disabled>Disabled</Button>, code: `<Button type="primary" disabled>Disabled</Button>`},
    ],
    ButtonGroup: [
        {label: "Horizontal", node: () => <ButtonGroup>
            <Button type="secondary">Left</Button>
            <Button type="secondary">Middle</Button>
            <Button type="secondary">Right</Button>
        </ButtonGroup>, code: `<ButtonGroup>
    <Button type="secondary">Left</Button>
    <Button type="secondary">Middle</Button>
    <Button type="secondary">Right</Button>
</ButtonGroup>`},
        {label: "Mixed types", node: () => <ButtonGroup>
            <Button type="primary">Save</Button>
            <Button type="danger">Delete</Button>
        </ButtonGroup>, code: `<ButtonGroup>
    <Button type="primary">Save</Button>
    <Button type="danger">Delete</Button>
</ButtonGroup>`},
        {label: "Vertical", node: () => <ButtonGroup orientation="vertical">
            <Button type="secondary">Top</Button>
            <Button type="secondary">Middle</Button>
            <Button type="secondary">Bottom</Button>
        </ButtonGroup>, code: `<ButtonGroup orientation="vertical">
    <Button type="secondary">Top</Button>
    <Button type="secondary">Middle</Button>
    <Button type="secondary">Bottom</Button>
</ButtonGroup>`},
    ],
    RadioButton: [
        {label: "Group", node: () => <div style={row}>
            <RadioButton name="doc-radio" checked>One</RadioButton>
            <RadioButton name="doc-radio">Two</RadioButton>
            <RadioButton name="doc-radio">Three</RadioButton>
        </div>, code: `<RadioButton name="doc-radio" checked>One</RadioButton>
<RadioButton name="doc-radio">Two</RadioButton>
<RadioButton name="doc-radio">Three</RadioButton>`},
        {label: "Disabled", node: () => <RadioButton name="doc-radio-disabled" disabled>Disabled</RadioButton>, code: `<RadioButton name="doc-radio-disabled" disabled>Disabled</RadioButton>`},
    ],
    Checkbox: [
        {label: "States", node: () => <div style={row}>
            <Checkbox>Unchecked</Checkbox>
            <Checkbox checked>Checked</Checkbox>
            <Checkbox indeterminate>Indeterminate</Checkbox>
            <Checkbox disabled>Disabled</Checkbox>
        </div>, code: `<Checkbox>Unchecked</Checkbox>
<Checkbox checked>Checked</Checkbox>
<Checkbox indeterminate>Indeterminate</Checkbox>
<Checkbox disabled>Disabled</Checkbox>`},
    ],
    Toggle: [
        {label: "States", node: () => <div style={row}>
            <Toggle>Off</Toggle>
            <Toggle checked>On</Toggle>
            <Toggle disabled>Disabled</Toggle>
        </div>, code: `<Toggle>Off</Toggle>
<Toggle checked>On</Toggle>
<Toggle disabled>Disabled</Toggle>`},
    ],
    TextBox: [
        {label: "Types", node: () => <div style={col}>
            <TextBox type="text" placeholder="Text"/>
            <TextBox type="email" placeholder="Email"/>
            <TextBox type="phone" placeholder="Phone"/>
            <TextBox type="password" placeholder="Password"/>
        </div>, code: `<TextBox type="text" placeholder="Text"/>
<TextBox type="email" placeholder="Email"/>
<TextBox type="phone" placeholder="Phone"/>
<TextBox type="password" placeholder="Password"/>`},
        {label: "Clearable - for a field edited repeatedly, like a filter", node: () => <TextBox
            type="text"
            clearable
            clearLabel="Clear"
            value="something typed"
            placeholder="Search..."/>, code: `<TextBox type="text" clearable clearLabel="Clear" placeholder="Search..."/>`},
    ],
    Textarea: [
        {label: "Default", node: () => <Textarea placeholder="Type something..." rows={3}/>, code: `<Textarea placeholder="Type something..." rows={3}/>`},
    ],
    Select: [
        {label: "Default", node: () => <Select value="a" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}, {value: "c", label: "Option C"}]}/>, code: `<Select value="a" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}, {value: "c", label: "Option C"}]}/>`},
        {label: "Placeholder", node: () => <Select placeholder="Choose one" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}]}/>, code: `<Select placeholder="Choose one" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}]}/>`},
        {label: "Clearable (placeholder stays selectable)", node: () => <Select value="a" placeholder="Choose one" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}]}/>, code: `<Select value="a" placeholder="Choose one" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}]}/>`},
        {label: "Disabled", node: () => <Select value="a" disabled options={[{value: "a", label: "Option A"}]}/>, code: `<Select value="a" disabled options={[{value: "a", label: "Option A"}]}/>`},
    ],
    SelectMenu: [
        {label: "Rich options (avatar + role) - pick one to update the selection below", node: () => <span style={{display: "flex", flexDirection: "column", gap: "0.5em", alignItems: "flex-start"}}>
            <SelectMenu<{id: string, name: string, role: string}>
                value="jamie"
                options={[
                    {id: "jamie", name: "Jamie Rivera", role: "Engineer"},
                    {id: "alex", name: "Alex Baker", role: "Designer"},
                    {id: "casey", name: "Casey Diaz", role: "Support"},
                ]}
                getValue={option => option.id}
                renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.6em"}}>
                    <Avatar initials={option.name.split(" ").map(part => part[0]).join("")} size="1.75em"/>
                    <span style={{display: "flex", flexDirection: "column", lineHeight: "1.2"}}>
                        <span>{option.name}</span>
                        <span style={{fontSize: "0.8em", opacity: "0.65"}}>{option.role}</span>
                    </span>
                </span>}
                onChange={option => { selectMenuSelection.value = option.name }}/>
            <span style={{fontSize: "0.85em", opacity: "0.7"}}>Selected: {selectMenuSelection}</span>
        </span>, code: `<span style={{display: "flex", flexDirection: "column", gap: "0.5em", alignItems: "flex-start"}}>
    <SelectMenu<{id: string, name: string, role: string}>
        value="jamie"
        options={[
            {id: "jamie", name: "Jamie Rivera", role: "Engineer"},
            {id: "alex", name: "Alex Baker", role: "Designer"},
            {id: "casey", name: "Casey Diaz", role: "Support"},
        ]}
        getValue={option => option.id}
        renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.6em"}}>
            <Avatar initials={option.name.split(" ").map(part => part[0]).join("")} size="1.75em"/>
            <span style={{display: "flex", flexDirection: "column", lineHeight: "1.2"}}>
                <span>{option.name}</span>
                <span style={{fontSize: "0.8em", opacity: "0.65"}}>{option.role}</span>
            </span>
        </span>}
        onChange={option => { selectMenuSelection.value = option.name }}/>
    <span style={{fontSize: "0.85em", opacity: "0.7"}}>Selected: {selectMenuSelection}</span>
</span>`},
        {label: "Placeholder", node: () => <SelectMenu<{id: string, name: string}>
            placeholder="Assign to..."
            options={[{id: "a", name: "Jamie Rivera"}, {id: "b", name: "Alex Baker"}]}
            getValue={option => option.id}
            renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.5em"}}><Avatar initials={option.name[0]} size="1.5em"/>{option.name}</span>}/>, code: `<SelectMenu<{id: string, name: string}>
placeholder="Assign to..."
options={[{id: "a", name: "Jamie Rivera"}, {id: "b", name: "Alex Baker"}]}
getValue={option => option.id}
renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.5em"}}><Avatar initials={option.name[0]} size="1.5em"/>{option.name}</span>}/>`},
        {label: "Disabled", node: () => <SelectMenu<{id: string, name: string}>
            value="a"
            disabled
            options={[{id: "a", name: "Jamie Rivera"}]}
            getValue={option => option.id}
            renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.5em"}}><Avatar initials={option.name[0]} size="1.5em"/>{option.name}</span>}/>, code: `<SelectMenu<{id: string, name: string}>
value="a"
disabled
options={[{id: "a", name: "Jamie Rivera"}]}
getValue={option => option.id}
renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.5em"}}><Avatar initials={option.name[0]} size="1.5em"/>{option.name}</span>}/>`},
    ],
    TextNonEditableField: [
        {label: "Default", node: () => <TextNonEditableField value="example value">Label:</TextNonEditableField>, code: `<TextNonEditableField value="example value">Label:</TextNonEditableField>`},
    ],
    TextFormField: [
        {label: "Default", node: () => <TextFormField field={textFormFieldValue}>Label:</TextFormField>, code: `<TextFormField field={textFormFieldValue}>Label:</TextFormField>`},
    ],
    TextEditableField: [
        {label: "Default", node: () => <TextEditableField field={textEditableFieldValue}>Label:</TextEditableField>, code: `<TextEditableField field={textEditableFieldValue}>Label:</TextEditableField>`},
    ],
    Form: [
        {label: "Basic form", node: () => <Form onSubmit={() => {}}>
            <FormField label="Name" required><TextBox type="text"/></FormField>
            <FormField label="Email" error="Enter a valid email address"><TextBox type="email"/></FormField>
            <Button type="primary">Submit</Button>
        </Form>, code: `<Form onSubmit={() => {}}>
    <FormField label="Name" required><TextBox type="text"/></FormField>
    <FormField label="Email" error="Enter a valid email address"><TextBox type="email"/></FormField>
    <Button type="primary">Submit</Button>
</Form>`},
    ],

    // --- Navigation ---
    NavLink: [
        {label: "Default", node: () => <div style={row}><NavLink to="/" spa>Home</NavLink><NavLink to="/docs" spa>Docs</NavLink></div>, code: `<NavLink to="/" spa>Home</NavLink>
<NavLink to="/docs" spa>Docs</NavLink>`},
    ],
    Link: [
        {label: "Default", node: () => <Link to="/somewhere" spa>Click me</Link>, code: `<Link to="/somewhere" spa>Click me</Link>`},
    ],
    Breadcrumbs: [
        {label: "Default", node: () => <Breadcrumbs spa items={[{label: "Home", to: "/"}, {label: "Library", to: "/library"}, {label: "Current page"}]}/>, code: `<Breadcrumbs spa items={[{label: "Home", to: "/"}, {label: "Library", to: "/library"}, {label: "Current page"}]}/>`},
        {label: "With an avatar beside a crumb", node: () => <Breadcrumbs items={[
            {label: "Home", to: "#"},
            {label: "Acme", to: "#", leading: <Avatar initials="AC" size="1.3em"/>},
            {label: "Settings"},
        ]}/>, code: `<Breadcrumbs items={[
    {label: "Home", to: "/"},
    {label: "Acme", to: "/acme", leading: <Avatar initials="AC" size="1.3em"/>},
    {label: "Settings"},
]}/>`},
        {label: "A long trail collapses its middle", node: () => <Breadcrumbs maxItems={4} expandLabel="Show the rest of the trail" items={[
            {label: "Home", to: "#"},
            {label: "Level two", to: "#"},
            {label: "Level three", to: "#"},
            {label: "Level four", to: "#"},
            {label: "Level five", to: "#"},
            {label: "Current page"},
        ]}/>, code: `// One slot for the root and one for the expander, so the last two crumbs survive
<Breadcrumbs
    maxItems={4}
    expandLabel="Show the rest of the trail"
    items={[
        {label: "Home", to: "/"},
        {label: "Level two", to: "/two"},
        {label: "Level three", to: "/two/three"},
        {label: "Level four", to: "/two/three/four"},
        {label: "Level five", to: "/two/three/four/five"},
        {label: "Current page"},
    ]}/>`},
    ],
    Pagination: [
        {label: "First page", node: () => <Pagination page={1} totalPages={10} onPageChange={() => {}}/>, code: `<Pagination page={1} totalPages={10} onPageChange={() => {}}/>`},
        {label: "Middle page", node: () => <Pagination page={5} totalPages={10} onPageChange={() => {}}/>, code: `<Pagination page={5} totalPages={10} onPageChange={() => {}}/>`},
        {label: "Last page", node: () => <Pagination page={10} totalPages={10} onPageChange={() => {}}/>, code: `<Pagination page={10} totalPages={10} onPageChange={() => {}}/>`},
    ],
    Navbar: [
        {label: "Default", node: () => <Navbar brand="My App"><NavLink to="/" spa>Home</NavLink><NavLink to="/docs" spa>Docs</NavLink></Navbar>, code: `<Navbar brand="My App"><NavLink to="/" spa>Home</NavLink><NavLink to="/docs" spa>Docs</NavLink></Navbar>`},
    ],
    Sidebar: [
        {label: "Default", node: () => <div style={{display: "flex", height: "150px"}}><Sidebar spa header="Sections" items={[{label: "Overview", to: "/"}, {label: "Settings", to: "/settings"}]}/></div>, code: `<Sidebar spa header="Sections" items={[
    {label: "Overview", to: "/"},
    {label: "Settings", to: "/settings"}
]}/>`},
        {label: "Groups, a collapsible rail, a draggable edge and an account row", node: () => <div style={{display: "flex", height: "260px"}}><Sidebar
            spa collapsible resizable
            header="Workspace"
            ariaLabel="Workspace"
            collapseLabel="Collapse or expand the sidebar"
            defaultWidth={210}
            items={[
                {key: "reports", label: "Reports", icon: "▤", defaultOpen: true, trailing: <Badge type="neutral">2</Badge>, children: [
                    {label: "Daily", to: "/daily"},
                    {label: "Weekly", to: "/weekly"},
                ]},
                {key: "people", label: "People", icon: "◔", children: [{label: "Members", to: "/members"}]},
                {key: "settings", label: "Settings", icon: "◧", to: "/settings"},
            ]}
            profile={{
                avatar: <Avatar initials="VD" size="1.9em"/>,
                name: "Velo Designer",
                detail: "design@velotype.dev",
                menuAriaLabel: "Account",
                menuItems: [
                    {label: "Profile", onClick: () => {}},
                    {label: "Appearance", children: [{label: "Light", onClick: () => {}}, {label: "Dark", onClick: () => {}}]},
                    {label: "Sign out", dividerBefore: true, onClick: () => {}},
                ],
            }}/></div>, code: `<Sidebar
    spa collapsible resizable
    header="Workspace"
    collapseLabel="Collapse or expand the sidebar"
    items={[
        {key: "reports", label: "Reports", icon: <I i="reports"/>, defaultOpen: true,
            trailing: <Badge type="neutral">2</Badge>, children: [
            {label: "Daily", to: "/daily"},
            {label: "Weekly", to: "/weekly"}
        ]},
        {key: "settings", label: "Settings", icon: <I i="settings"/>, to: "/settings"}
    ]}
    profile={{
        avatar: <Avatar initials="VD"/>,
        name: "Velo Designer",
        detail: "design@velotype.dev",
        menuAriaLabel: "Account",
        menuItems: [
            {label: "Profile", onClick: () => {}},
            {label: "Appearance", children: [
                {label: "Light", onClick: () => {}},
                {label: "Dark", onClick: () => {}}
            ]},
            {label: "Sign out", dividerBefore: true, onClick: () => {}}
        ]
    }}/>`},
    ],
    Menu: [
        {label: "Default", node: () => <Menu trigger="Actions" items={[{label: "Do a thing", onClick: () => {}}, {label: "Disabled", disabled: true}]}/>, code: `<Menu trigger="Actions" items={[{label: "Do a thing", onClick: () => {}}, {label: "Disabled", disabled: true}]}/>`},
    ],
    Steps: [
        {label: "Just started", node: () => <Steps current={0} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>, code: `<Steps current={0} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>`},
        {label: "In progress", node: () => <Steps current={1} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>, code: `<Steps current={1} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>`},
        {label: "Complete", node: () => <Steps current={2} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>, code: `<Steps current={2} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>`},
    ],

    TableOfContents: [
        {label: "With the current section highlighted", node: () => <div style={{display: "flex", gap: "1.5em", alignItems: "flex-start", width: "100%"}}>
            <div style={{flexGrow: 1, minWidth: 0}}>
                <Heading id="toc-demo-install" level={4}>Installation</Heading>
                <Paragraph type="muted">Scroll this page and the entry for the section you are reading lights up.</Paragraph>
                <Heading id="toc-demo-usage" level={4}>Usage</Heading>
                <Paragraph type="muted">Each entry is a real in-page anchor, so it is linkable and works with the back button.</Paragraph>
            </div>
            <div style={{width: "12em", flexShrink: 0}}>
                <TableOfContents header="On this page" ariaLabel="Example contents" items={[
                    {id: "toc-demo-install", label: "Installation", level: 1},
                    {id: "toc-demo-usage", label: "Usage", level: 1},
                ]}/>
            </div>
        </div>, code: `<TableOfContents
    header="On this page"
    ariaLabel="On this page"
    topOffset={60}
    items={[
        {id: "install", label: "Installation", level: 1},
        {id: "install-deno", label: "With Deno", level: 2},
        {id: "usage", label: "Usage", level: 1},
    ]}/>`},
    ],

    // --- Feedback ---
    Alert: [
        {label: "Types", node: () => <div style={col}>
            <Alert type="info" title="Info">Heads up, this is informational.</Alert>
            <Alert type="success" title="Success">Everything worked.</Alert>
            <Alert type="warning" title="Warning">Double check this.</Alert>
            <Alert type="danger" title="Danger">Something went wrong.</Alert>
        </div>, code: `<Alert type="info" title="Info">Heads up, this is informational.</Alert>
<Alert type="success" title="Success">Everything worked.</Alert>
<Alert type="warning" title="Warning">Double check this.</Alert>
<Alert type="danger" title="Danger">Something went wrong.</Alert>`},
        {label: "Dismissible", node: () => <Alert type="info" onDismiss={() => {}}>Click the x to dismiss.</Alert>, code: `<Alert type="info" onDismiss={() => {}}>Click the x to dismiss.</Alert>`},
    ],
    Toast: [
        {label: "Trigger", node: () => <Button type="secondary" onClick={() => showToast("Hello from a toast", {type: "success"})}>Show toast</Button>, code: `<Button type="secondary" onClick={() => showToast("Hello from a toast", {type: "success"})}>Show toast</Button>`},
    ],
    Tooltip: [
        {label: "Default", node: () => <Tooltip content="More info"><Button type="secondary">Hover me</Button></Tooltip>, code: `<Tooltip content="More info"><Button type="secondary">Hover me</Button></Tooltip>`},
    ],
    Spinner: [
        {label: "Sizes", node: () => <div style={row}><Spinner size="1em"/><Spinner size="2em"/><Spinner size="3em"/></div>, code: `<Spinner size="1em"/>
<Spinner size="2em"/>
<Spinner size="3em"/>`},
    ],
    Progress: [
        {label: "Values", node: () => <div style={col}>
            <Progress value={25} showLabel/>
            <Progress value={65} showLabel/>
            <Progress value={100} showLabel/>
        </div>, code: `<Progress value={25} showLabel/>
<Progress value={65} showLabel/>
<Progress value={100} showLabel/>`},
        {label: "Types", node: () => <div style={col}>
            <Progress value={60} type="primary"/>
            <Progress value={60} type="secondary"/>
            <Progress value={60} type="warning"/>
            <Progress value={60} type="danger"/>
        </div>, code: `<Progress value={60} type="primary"/>
<Progress value={60} type="secondary"/>
<Progress value={60} type="warning"/>
<Progress value={60} type="danger"/>`},
    ],
    Skeleton: [
        {label: "Text", node: () => <Skeleton lines={3}/>, code: `<Skeleton lines={3}/>`},
        {label: "Circular / rectangular", node: () => <div style={row}><Skeleton variant="circular"/><Skeleton variant="rectangular" width="10em" height="4em"/></div>, code: `<Skeleton variant="circular"/>
<Skeleton variant="rectangular" width="10em" height="4em"/>`},
    ],
    Empty: [
        {label: "Default (icon only - no default text)", node: () => <Empty/>, code: `<Empty/>`},
        {label: "With title", node: () => <Empty title="No data"/>, code: `<Empty title="No data"/>`},
        {label: "With action", node: () => <Empty title="No results" description="Try adjusting your filters"><Button type="secondary">Create one</Button></Empty>, code: `<Empty title="No results" description="Try adjusting your filters"><Button type="secondary">Create one</Button></Empty>`},
    ],

    // --- Overlays ---
    Modal: [
        {label: "Trigger", node: () => <ButtonModal
            openButtonText="Open modal"
            modalAttrs={{title: "Confirm action", confirmButtonChildren: "Confirm", cancelButtonChildren: "Cancel", confirmButtonOnClick: (doneLoading) => doneLoading()}}>
            Modal body content goes here.
        </ButtonModal>, code: `<ButtonModal
    openButtonText="Open modal"
    modalAttrs={{title: "Confirm action", confirmButtonChildren: "Confirm", cancelButtonChildren: "Cancel", confirmButtonOnClick: (doneLoading) => doneLoading()}}>
    Modal body content goes here.
</ButtonModal>`},
    ],
    Drawer: [
        {label: "Trigger", node: () => {
            const drawer = <Drawer title="Settings">Drawer body content goes here.</Drawer>
            return <span style={{display: "contents"}}>{drawer}<Button type="secondary" onClick={() => drawer.showModal()}>Open drawer</Button></span>
        }, code: `// <Drawer/> evaluates to the <dialog> element itself, so showModal()/close() are
// called on it directly
const drawer = <Drawer title="Settings">Drawer body content goes here.</Drawer>

return <div>
    {drawer}
    <Button type="secondary" onClick={() => drawer.showModal()}>Open drawer</Button>
</div>`},        {label: "Placed on one edge, entering from another", node: () => {
            const drawer = <Drawer title="Notifications" placement="bottom" enterFrom="right">Anchored to the bottom edge, but slides in from the right.</Drawer>
            return <span style={{display: "contents"}}>{drawer}<Button type="secondary" onClick={() => drawer.showModal()}>Open drawer</Button></span>
        }, code: `const drawer = <Drawer title="Notifications" placement="bottom" enterFrom="right">
    Anchored to the bottom edge, but slides in from the right.
</Drawer>

return <div>
    {drawer}
    <Button type="secondary" onClick={() => drawer.showModal()}>Open drawer</Button>
</div>`},    ],
    Popover: [
        {label: "Trigger", node: () => <Popover trigger={<Button type="secondary">Click me</Button>} content="Rich popover content, shown on click."/>, code: `<Popover trigger={<Button type="secondary">Click me</Button>} content="Rich popover content, shown on click."/>`},
    ],
    Popconfirm: [
        {label: "Trigger", node: () => <Popconfirm title="Delete this item?" onConfirm={() => {}}><Button type="danger">Delete</Button></Popconfirm>, code: `<Popconfirm title="Delete this item?" onConfirm={() => {}}><Button type="danger">Delete</Button></Popconfirm>`},
    ],
    ContextMenu: [
        {label: "Trigger area", node: () => <ContextMenu items={[{label: "Copy", onClick: () => {}}, {label: "Paste", onClick: () => {}}, {label: "Delete", disabled: true}]}>
            <div style={{padding: "2em", border: "1px dashed var(--background-5)", borderRadius: "0.25rem"}}>Right-click here</div>
        </ContextMenu>, code: `<ContextMenu items={[{label: "Copy", onClick: () => {}}, {label: "Paste", onClick: () => {}}, {label: "Delete", disabled: true}]}>
    <div style={{padding: "2em", border: "1px dashed var(--background-5)", borderRadius: "0.25rem"}}>Right-click here</div>
</ContextMenu>`},
    ],
    Command: [
        {label: "Trigger", node: () => {
            // getComponent gets the real Command instance - the JSX itself evaluates to the
            // raw <dialog> element, which has its own native showModal() under the same name
            // that would otherwise be silently called instead of Command's own (which resets
            // the search query and populates the list before opening).
            const command = getComponent<Command>(<Command placeholder="Search commands..." items={[
                {key: "new-file", label: "New file", searchText: "new file create", onSelect: () => {}},
                {key: "open-settings", label: "Open settings", searchText: "open settings preferences", onSelect: () => {}},
            ]}/>)
            return <span style={{display: "contents"}}>{command}<Button type="secondary" onClick={() => command.showModal()}>Open command palette</Button></span>
        }, code: `// getComponent gets the real Command instance - the JSX evaluates to the raw <dialog>,
// whose own native showModal() would otherwise be called instead of Command's (which
// resets the query and populates the list before opening)
const command = getComponent<Command>(<Command placeholder="Search commands..." items={[
    {key: "new-file", label: "New file", searchText: "new file create", onSelect: () => {}},
    {key: "open-settings", label: "Open settings", searchText: "open settings preferences", onSelect: () => {}},
]}/>)

return <div>
    {command}
    <Button type="secondary" onClick={() => command.showModal()}>Open command palette</Button>
</div>`},    ],

    Heading: [
        {label: "Every level", node: () => <div style={col}>
            <Heading level={1}>Heading level 1</Heading>
            <Heading level={2}>Heading level 2</Heading>
            <Heading level={3}>Heading level 3</Heading>
            <Heading level={4}>Heading level 4</Heading>
            <Heading level={5}>Heading level 5</Heading>
            <Heading level={6}>Heading level 6</Heading>
        </div>, code: `<Heading level={1}>Heading level 1</Heading>
<Heading level={2}>Heading level 2</Heading>
<Heading level={3}>Heading level 3</Heading>
<Heading level={4}>Heading level 4</Heading>
<Heading level={5}>Heading level 5</Heading>
<Heading level={6}>Heading level 6</Heading>`},
        {label: "With a semantic colour", node: () => <Heading level={3} type="danger">Something went wrong</Heading>, code: `<Heading level={3} type="danger">Something went wrong</Heading>`},
    ],
    Text: [
        {label: "Semantic colours", node: () => <div style={row}>
            <Text>Default</Text>
            <Text type="muted">Muted</Text>
            <Text type="primary">Primary</Text>
            <Text type="secondary">Secondary</Text>
            <Text type="warning">Warning</Text>
            <Text type="danger">Danger</Text>
        </div>, code: `<Text>Default</Text>
<Text type="muted">Muted</Text>
<Text type="primary">Primary</Text>
<Text type="secondary">Secondary</Text>
<Text type="warning">Warning</Text>
<Text type="danger">Danger</Text>`},
        {label: "Modifiers", node: () => <div style={row}>
            <Text strong>Strong</Text>
            <Text italic>Italic</Text>
            <Text underline>Underline</Text>
            <Text strike>Strike</Text>
            <Text numeric>1,234.50</Text>
            <Text code>npm install</Text>
        </div>, code: `<Text strong>Strong</Text>
<Text italic>Italic</Text>
<Text underline>Underline</Text>
<Text strike>Strike</Text>
<Text numeric>1,234.50</Text>
<Text code>npm install</Text>`},
    ],
    Paragraph: [
        {label: "Prose", node: () => <div>
            <Paragraph>Paragraphs carry the package's line height and spacing, so two blocks of prose set side by side agree about their rhythm.</Paragraph>
            <Paragraph type="muted">A muted paragraph, for supporting text that should read as secondary. The last paragraph in a container drops its bottom margin.</Paragraph>
        </div>, code: `<Paragraph>Paragraphs carry the package's line height and spacing, so two blocks of
prose set side by side agree about their rhythm.</Paragraph>
<Paragraph type="muted">A muted paragraph, for supporting text that should read as
secondary. The last paragraph in a container drops its bottom margin.</Paragraph>`},
    ],
    Stack: [
        {label: "A row of actions", node: () => <Stack gap="sm">
            <Button type="primary">Save</Button>
            <Button type="secondary">Cancel</Button>
            <Button type="text">Reset</Button>
        </Stack>, code: `<Stack gap="sm">
    <Button type="primary">Save</Button>
    <Button type="secondary">Cancel</Button>
    <Button type="text">Reset</Button>
</Stack>`},
        {label: "A column, content-sized with align=\"start\"", node: () => <Stack direction="column" gap="xs" align="start">
            <Badge type="primary">First</Badge>
            <Badge type="secondary">Second</Badge>
            <Badge type="neutral">Third</Badge>
        </Stack>, code: `// A column stretches its children by default - align="start" sizes them to their content
<Stack direction="column" gap="xs" align="start">
    <Badge type="primary">First</Badge>
    <Badge type="secondary">Second</Badge>
    <Badge type="neutral">Third</Badge>
</Stack>`},
        {label: "Pushed apart with justify", node: () => <Stack justify="between" align="center" style={{width: "100%"}}>
            <Heading level={4}>A view header</Heading>
            <Button type="primary">New thing</Button>
        </Stack>, code: `<Stack justify="between" align="center">
    <Heading level={4}>A view header</Heading>
    <Button type="primary">New thing</Button>
</Stack>`},
    ],
    Grid: [
        {label: "Auto-fill, the responsive default", node: () => <Grid minColumnWidth="10em" gap="md" style={{width: "100%"}}>
            <Card>One</Card><Card>Two</Card><Card>Three</Card><Card>Four</Card>
        </Grid>, code: `// Fits as many 10em columns as will hold, reflowing with no media query
<Grid minColumnWidth="10em" gap="md">
    <Card>One</Card>
    <Card>Two</Card>
    <Card>Three</Card>
    <Card>Four</Card>
</Grid>`},
        {label: "A fixed column count", node: () => <Grid columns={2} gap="md" style={{width: "100%"}}>
            <Card>One</Card><Card>Two</Card><Card>Three</Card><Card>Four</Card>
        </Grid>, code: `<Grid columns={2} gap="md">
    <Card>One</Card>
    <Card>Two</Card>
    <Card>Three</Card>
    <Card>Four</Card>
</Grid>`},
    ],

    // --- Data Display ---
    CodeBlock: [
        {label: "tsx (the default)", node: () => <CodeBlock ariaLabel="A tsx example" code={CODE_SAMPLE_TSX}/>, code: `<CodeBlock ariaLabel="A tsx example" code={source}/>`},
        {label: "With line numbers", node: () => <CodeBlock showLineNumbers ariaLabel="A numbered example" code={CODE_SAMPLE_TSX}/>, code: `<CodeBlock showLineNumbers ariaLabel="A numbered example" code={source}/>`},
        {label: "css", node: () => <CodeBlock language="css" ariaLabel="A css example" code={CODE_SAMPLE_CSS}/>, code: `<CodeBlock language="css" ariaLabel="A css example" code={source}/>`},
        {label: "plain - no highlighting", node: () => <CodeBlock language="plain" ariaLabel="A shell session" code={CODE_SAMPLE_PLAIN}/>, code: `<CodeBlock language="plain" ariaLabel="A shell session" code={source}/>`},
    ],

    Badge: [
        {label: "Types", node: () => <div style={row}>
            <Badge type="primary">primary</Badge>
            <Badge type="secondary">secondary</Badge>
            <Badge type="warning">warning</Badge>
            <Badge type="danger">danger</Badge>
            <Badge type="neutral">neutral</Badge>
        </div>, code: `<Badge type="primary">primary</Badge>
<Badge type="secondary">secondary</Badge>
<Badge type="warning">warning</Badge>
<Badge type="danger">danger</Badge>
<Badge type="neutral">neutral</Badge>`},
    ],
    Card: [
        {label: "Default", node: () => <Card header="Card title">Some card body content.</Card>, code: `<Card header="Card title">Some card body content.</Card>`},
        {label: "With footer (defaults flush right)", node: () => <Card header="Card title" footer={<span style={{display: "contents"}}>
            <Button type="secondary">Cancel</Button>
            <Button type="primary">Confirm</Button>
        </span>}>Some card body content.</Card>, code: `<Card header="Card title" footer={<span style={{display: "contents"}}>
    <Button type="secondary">Cancel</Button>
    <Button type="primary">Confirm</Button>
</span>}>Some card body content.</Card>`},
    ],
    Avatar: [
        {label: "Sizes", node: () => <div style={row}><Avatar initials="JR" size="1.5em"/><Avatar initials="JR"/><Avatar initials="JR" size="3.5em"/></div>, code: `<Avatar initials="JR" size="1.5em"/>
<Avatar initials="JR"/>
<Avatar initials="JR" size="3.5em"/>`},
        {label: "Colors", node: () => <div style={row}>
            <Avatar initials="PR"/>
            <Avatar initials="SE" type="secondary"/>
            <Avatar initials="WA" type="warning"/>
            <Avatar initials="DA" type="danger"/>
            <Avatar initials="NE" type="neutral"/>
        </div>, code: `<Avatar initials="PR"/>
<Avatar initials="SE" type="secondary"/>
<Avatar initials="WA" type="warning"/>
<Avatar initials="DA" type="danger"/>
<Avatar initials="NE" type="neutral"/>`},
        {label: "Image (falls back to initials if it fails to load)", node: () => <Avatar src="https://placehold.co/64x64" alt="Placeholder" initials="JR"/>, code: `<Avatar src="https://placehold.co/64x64" alt="Placeholder" initials="JR"/>`},
    ],
    TimeAgo: [
        {label: "Various times", node: () => <div style={col}>
            <div><TimeAgo timestamp={new Date(Date.now() - 30 * 1000)}/></div>
            <div><TimeAgo timestamp={new Date(Date.now() - 5 * 60000)}/></div>
            <div><TimeAgo timestamp={new Date(Date.now() - 3 * 3600000)}/></div>
            <div><TimeAgo timestamp={new Date(Date.now() - 2 * 86400000)}/></div>
        </div>, code: `<div><TimeAgo timestamp={new Date(Date.now() - 30 * 1000)}/></div>
<div><TimeAgo timestamp={new Date(Date.now() - 5 * 60000)}/></div>
<div><TimeAgo timestamp={new Date(Date.now() - 3 * 3600000)}/></div>
<div><TimeAgo timestamp={new Date(Date.now() - 2 * 86400000)}/></div>`},
    ],
    Divider: [
        {label: "Horizontal", node: () => <div>Above<Divider/>Below</div>, code: `<div>Above<Divider/>Below</div>`},
        {label: "Vertical", node: () => <div style={{display: "flex", height: "2em", alignItems: "center"}}>Left<Divider orientation="vertical"/>Right</div>, code: `<div style={{display: "flex", height: "2em", alignItems: "center"}}>Left<Divider orientation="vertical"/>Right</div>`},
    ],
    Tabs: [
        {label: "Default", node: () => <Tabs tabs={[
            {key: "overview", label: "Overview", content: "High-level summary content goes here."},
            {key: "team", label: "Team Members", content: "Manage who has access to this project."},
            {key: "billing", label: "Billing & Invoices", content: "Payment history and upcoming charges."},
            {key: "notifications", label: "Notification Settings", content: "Choose what you get notified about."},
            {key: "danger", label: "Danger Zone", content: "Irreversible and destructive actions."},
        ]}/>, code: `<Tabs tabs={[
    {key: "overview", label: "Overview", content: "High-level summary content goes here."},
    {key: "team", label: "Team Members", content: "Manage who has access to this project."},
    {key: "billing", label: "Billing & Invoices", content: "Payment history and upcoming charges."},
    {key: "notifications", label: "Notification Settings", content: "Choose what you get notified about."},
    {key: "danger", label: "Danger Zone", content: "Irreversible and destructive actions."},
]}/>`},
    ],
    Accordion: [
        {label: "Independent", node: () => <Accordion items={[{header: "Section one", content: "Content one.", defaultOpen: true}, {header: "Section two", content: "Content two."}]}/>, code: `<Accordion items={[{header: "Section one", content: "Content one.", defaultOpen: true}, {header: "Section two", content: "Content two."}]}/>`},
        {label: "Exclusive", node: () => <Accordion exclusive items={[{header: "Section one", content: "Content one.", defaultOpen: true}, {header: "Section two", content: "Content two."}]}/>, code: `<Accordion exclusive items={[{header: "Section one", content: "Content one.", defaultOpen: true}, {header: "Section two", content: "Content two."}]}/>`},
    ],
    Tag: [
        {label: "Types", node: () => <div style={row}>
            <Tag type="primary">primary</Tag>
            <Tag type="secondary">secondary</Tag>
            <Tag type="warning">warning</Tag>
            <Tag type="danger">danger</Tag>
            <Tag type="neutral">neutral</Tag>
        </div>, code: `<Tag type="primary">primary</Tag>
<Tag type="secondary">secondary</Tag>
<Tag type="warning">warning</Tag>
<Tag type="danger">danger</Tag>
<Tag type="neutral">neutral</Tag>`},
        {label: "Removable", node: () => <Tag type="primary" onRemove={() => {}}>removable</Tag>, code: `<Tag type="primary" onRemove={() => {}}>removable</Tag>`},
    ],
    Collapse: [
        {label: "Default", node: () => <Collapse header="Click to expand">Hidden content revealed on expand.</Collapse>, code: `<Collapse header="Click to expand">Hidden content revealed on expand.</Collapse>`},
    ],
    Statistic: [
        {label: "Examples", node: () => <div style={row}>
            <Statistic title="Active users" value={1284}/>
            <Statistic title="Revenue" value="12,480" prefix="$"/>
            <Statistic title="Uptime" value="99.98" suffix="%"/>
        </div>, code: `<Statistic title="Active users" value={1284}/>
<Statistic title="Revenue" value="12,480" prefix="$"/>
<Statistic title="Uptime" value="99.98" suffix="%"/>`},
    ],
    List: [
        {label: "Default", node: () => <List items={[
            {key: "1", leading: <Avatar initials="JR"/>, title: "Jamie Rivera", description: "jamie@example.com"},
            {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com"},
        ]}/>, code: `<List items={[
    {key: "1", leading: <Avatar initials="JR"/>, title: "Jamie Rivera", description: "jamie@example.com"},
    {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com"},
]}/>`},
        {label: "Zebra striping, hover highlight, and per-item links (click a name)", node: () => <List
            zebra
            highlightOnHover
            items={[
                {key: "1", leading: <Avatar initials="JR"/>, title: "Jamie Rivera", description: "jamie@example.com", href: "#jamie-rivera"},
                {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com", href: "#alex-baker"},
                {key: "3", leading: <Avatar initials="CD"/>, title: "Casey Diaz", description: "casey@example.com", href: "#casey-diaz"},
            ]}/>, code: `<List
    zebra
    highlightOnHover
    items={[
        {key: "1", leading: <Avatar initials="JR"/>, title: "Jamie Rivera", description: "jamie@example.com", href: "#jamie-rivera"},
        {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com", href: "#alex-baker"},
        {key: "3", leading: <Avatar initials="CD"/>, title: "Casey Diaz", description: "casey@example.com", href: "#casey-diaz"},
    ]}/>`},
    ],
    Timeline: [
        {label: "Default", node: () => <Timeline items={[
            {key: "1", title: "Order placed", type: "secondary"},
            {key: "2", title: "Shipped", type: "primary"},
            {key: "3", title: "Delivered"},
        ]}/>, code: `<Timeline items={[
    {key: "1", title: "Order placed", type: "secondary"},
    {key: "2", title: "Shipped", type: "primary"},
    {key: "3", title: "Delivered"},
]}/>`},
    ],
    AspectRatio: [
        {label: "16:9", node: () => <AspectRatio ratio={16 / 9} style={{maxWidth: "280px"}}>
            <div style={{background: "var(--primary-3)", display: "flex", alignItems: "center", justifyContent: "center"}}>16:9</div>
        </AspectRatio>, code: `<AspectRatio ratio={16 / 9} style={{maxWidth: "280px"}}>
    <div style={{background: "var(--primary-3)", display: "flex", alignItems: "center", justifyContent: "center"}}>16:9</div>
</AspectRatio>`},
    ],
    ScrollArea: [
        {label: "Default", node: () => <ScrollArea maxHeight="8em" style={{maxWidth: "260px", border: "1px solid var(--background-4)", borderRadius: "0.25rem", padding: "8px"}}>
            {Array.from({length: 12}).map((_, i) => <div style={{padding: "4px 0"}}>Row {i + 1}</div>)}
        </ScrollArea>, code: `<ScrollArea maxHeight="8em" style={{maxWidth: "260px", border: "1px solid var(--background-4)", borderRadius: "0.25rem", padding: "8px"}}>
    {Array.from({length: 12}).map((_, i) => <div style={{padding: "4px 0"}}>Row {i + 1}</div>)}
</ScrollArea>`},
    ],
    Table: [
        {label: "Default", node: () => <Table
            columns={[
                {key: "name", header: "Name", render: (row: {name: string, role: string}) => row.name},
                {key: "role", header: "Role", render: (row: {name: string, role: string}) => row.role},
            ]}
            rows={[{name: "Jamie Rivera", role: "Engineer"}, {name: "Alex Baker", role: "Designer"}]}/>, code: `<Table
    columns={[
        {key: "name", header: "Name", render: (row: {name: string, role: string}) => row.name},
        {key: "role", header: "Role", render: (row: {name: string, role: string}) => row.role},
    ]}
    rows={[{name: "Jamie Rivera", role: "Engineer"}, {name: "Alex Baker", role: "Designer"}]}/>`},
    ],
    DataTable: [
        {label: "Sortable, searchable, paginated, resizable, with hideable columns", node: () => <DataTable
            searchable
            searchPlaceholder="Search people..."
            pageSize={4}
            showPageSizeControl
            pageSizeOptions={[4, 8, 16]}
            columns={[
                {key: "name", header: "Name", render: (row: {name: string, role: string, department: string, status: string}) => row.name, sortValue: (row) => row.name, filterValue: (row) => row.name, hideable: false},
                {key: "role", header: "Role", render: (row: {name: string, role: string, department: string, status: string}) => row.role, sortValue: (row) => row.role, filterValue: (row) => row.role},
                {key: "department", header: "Department", render: (row: {name: string, role: string, department: string, status: string}) => row.department, sortValue: (row) => row.department, filterValue: (row) => row.department},
                {key: "status", header: "Status", render: (row: {name: string, role: string, department: string, status: string}) => row.status, align: "end", width: 110, minWidth: 90, resizable: false},
            ]}
            rows={[
                {name: "Jamie Rivera", role: "Engineer", department: "Platform", status: "active"},
                {name: "Alex Baker", role: "Designer", department: "Growth", status: "active"},
                {name: "Casey Diaz", role: "Support", department: "Success", status: "inactive"},
                {name: "Morgan Lee", role: "Manager", department: "Infra", status: "active"},
                {name: "Riley Chen", role: "Analyst", department: "Growth", status: "active"},
                {name: "Jordan Smith", role: "Engineer", department: "Platform", status: "inactive"},
                {name: "Taylor Kim", role: "Designer", department: "Design", status: "active"},
                {name: "Sam Patel", role: "Support", department: "Success", status: "active"},
                {name: "Drew Nguyen", role: "Manager", department: "Infra", status: "active"},
            ]}/>, code: `<DataTable
    searchable
    searchPlaceholder="Search people..."
    pageSize={4}
    showPageSizeControl
    pageSizeOptions={[4, 8, 16]}
    columns={[
        {key: "name", header: "Name", render: (row: {name: string, role: string, department: string, status: string}) => row.name, sortValue: (row) => row.name, filterValue: (row) => row.name, hideable: false},
        {key: "role", header: "Role", render: (row: {name: string, role: string, department: string, status: string}) => row.role, sortValue: (row) => row.role, filterValue: (row) => row.role},
        {key: "department", header: "Department", render: (row: {name: string, role: string, department: string, status: string}) => row.department, sortValue: (row) => row.department, filterValue: (row) => row.department},
        {key: "status", header: "Status", render: (row: {name: string, role: string, department: string, status: string}) => row.status, align: "end", width: 110, minWidth: 90, resizable: false},
    ]}
    rows={[
        {name: "Jamie Rivera", role: "Engineer", department: "Platform", status: "active"},
        {name: "Alex Baker", role: "Designer", department: "Growth", status: "active"},
        {name: "Casey Diaz", role: "Support", department: "Success", status: "inactive"},
        {name: "Morgan Lee", role: "Manager", department: "Infra", status: "active"},
        {name: "Riley Chen", role: "Analyst", department: "Growth", status: "active"},
        {name: "Jordan Smith", role: "Engineer", department: "Platform", status: "inactive"},
        {name: "Taylor Kim", role: "Designer", department: "Design", status: "active"},
        {name: "Sam Patel", role: "Support", department: "Success", status: "active"},
        {name: "Drew Nguyen", role: "Manager", department: "Infra", status: "active"},
    ]}/>`},
        {label: "Zebra striping, hover highlight, and a per-row link (click a name)", node: () => <DataTable
            zebra
            highlightOnHover
            showColumnToggle={false}
            rowHref={(row: {name: string, role: string}) => `#${row.name.toLowerCase().replace(/\s+/g, "-")}`}
            columns={[
                {key: "name", header: "Name", render: (row: {name: string, role: string}) => row.name},
                {key: "role", header: "Role", render: (row: {name: string, role: string}) => row.role},
            ]}
            rows={[
                {name: "Jamie Rivera", role: "Engineer"},
                {name: "Alex Baker", role: "Designer"},
                {name: "Casey Diaz", role: "Support"},
                {name: "Morgan Lee", role: "Manager"},
            ]}/>, code: `<DataTable
    zebra
    highlightOnHover
    showColumnToggle={false}
    rowHref={(row: {name: string, role: string}) => \`#\${row.name.toLowerCase().replace(/\\s+/g, "-")}\`}
    columns={[
        {key: "name", header: "Name", render: (row: {name: string, role: string}) => row.name},
        {key: "role", header: "Role", render: (row: {name: string, role: string}) => row.role},
    ]}
    rows={[
        {name: "Jamie Rivera", role: "Engineer"},
        {name: "Alex Baker", role: "Designer"},
        {name: "Casey Diaz", role: "Support"},
        {name: "Morgan Lee", role: "Manager"},
    ]}/>`},
    ],
    Carousel: [
        {label: "Default", node: () => <Carousel slides={[
            <div style={{padding: "2.5em", textAlign: "center", background: "var(--primary-3)"}}>Slide 1</div>,
            <div style={{padding: "2.5em", textAlign: "center", background: "var(--secondary-3)"}}>Slide 2</div>,
            <div style={{padding: "2.5em", textAlign: "center", background: "var(--warning-3)"}}>Slide 3</div>,
        ]}/>, code: `<Carousel slides={[
    <div style={{padding: "2.5em", textAlign: "center", background: "var(--primary-3)"}}>Slide 1</div>,
    <div style={{padding: "2.5em", textAlign: "center", background: "var(--secondary-3)"}}>Slide 2</div>,
    <div style={{padding: "2.5em", textAlign: "center", background: "var(--warning-3)"}}>Slide 3</div>,
]}/>`},
        {label: "Autoplay (stops once you click prev/next/a dot)", node: () => <Carousel
            autoplay
            autoplayFirstDelay={1500}
            autoplayDelay={2000}
            slides={[
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--primary-3)"}}>Slide 1</div>,
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--secondary-3)"}}>Slide 2</div>,
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--warning-3)"}}>Slide 3</div>,
            ]}/>, code: `<Carousel
    autoplay
    autoplayFirstDelay={1500}
    autoplayDelay={2000}
    slides={[
        <div style={{padding: "2.5em", textAlign: "center", background: "var(--primary-3)"}}>Slide 1</div>,
        <div style={{padding: "2.5em", textAlign: "center", background: "var(--secondary-3)"}}>Slide 2</div>,
        <div style={{padding: "2.5em", textAlign: "center", background: "var(--warning-3)"}}>Slide 3</div>,
    ]}/>`},
    ],
    Calendar: [
        {label: "Default (pick a day)", node: () => <CalendarDemo/>, code: `<CalendarDemo/>`},
    ],
    CalendarRange: [
        {label: "Default (pick a start, then an end)", node: () => <CalendarRangeDemo/>, code: `<CalendarRangeDemo/>`},
    ],
    Tree: [
        {label: "Default", node: () => <Tree ariaLabel="Project files" nodes={[
            {key: "src", label: "src", defaultOpen: true, children: [
                {key: "components", label: "components", children: [{key: "button", label: "button.tsx"}]},
                {key: "index", label: "index.ts"},
            ]},
            {key: "readme", label: "readme.md"},
        ]}/>, code: `<Tree nodes={[
    {key: "src", label: "src", defaultOpen: true, children: [
        {key: "components", label: "components", children: [{key: "button", label: "button.tsx"}]},
        {key: "index", label: "index.ts"},
    ]},
    {key: "readme", label: "readme.md"},
]}/>`},
    ],

    LineChart: [
        {label: "Two series", node: () => <LineChart data={monthlyRevenue} series={revenueSeries} height={200} ariaLabel="Revenue and costs by month" formatValue={(n: number) => `$${n}k`}/>, code: `<LineChart
    data={monthlyRevenue}
    series={revenueSeries}
    height={200}
    ariaLabel="Revenue and costs by month"
    formatValue={(n) => \`$\${n}k\`}/>`},
        {label: "Titled, and four series", node: () => <LineChart title="Bookings by channel" data={quarterlyChannels} series={channelSeries} height={220} formatValue={(n: number) => `$${n}k`}/>, code: `// A title is also the accessible name when ariaLabel is not set, so the
// visible heading and the one a screen reader announces cannot drift apart
<LineChart
    title="Bookings by channel"
    data={quarterlyChannels}
    series={channelSeries}
    height={220}
    formatValue={(n) => \`$\${n}k\`}/>`},
        {label: "No dots, and no legend", node: () => <LineChart title="Revenue trend" data={monthlyRevenue} series={revenueSeries} showDots={false} hideLegend height={180} formatValue={(n: number) => `$${n}k`}/>, code: `// showDots off and the legend hidden: a single trend line reads as a shape
// rather than as a series of readings
<LineChart
    title="Revenue trend"
    data={monthlyRevenue}
    series={revenueSeries}
    showDots={false}
    hideLegend
    height={180}
    formatValue={(n) => \`$\${n}k\`}/>`},
    ],
    AreaChart: [
        {label: "Stacked, so the parts add up", node: () => <AreaChart data={monthlyRevenue} series={revenueSeries} stacked height={200} ariaLabel="Revenue and costs by month, stacked" formatValue={(n: number) => `$${n}k`}/>, code: `// Stacking is what makes an area chart say "these parts add up to this total"
<AreaChart
    data={monthlyRevenue}
    series={revenueSeries}
    stacked
    height={200}
    ariaLabel="Revenue and costs by month, stacked"
    formatValue={(n) => \`$\${n}k\`}/>`},
        {label: "Four series stacked, with a title", node: () => <AreaChart title="Bookings by channel" data={quarterlyChannels} series={channelSeries} stacked height={220} formatValue={(n: number) => `$${n}k`}/>, code: `<AreaChart
    title="Bookings by channel"
    data={quarterlyChannels}
    series={channelSeries}
    stacked
    height={220}
    formatValue={(n) => \`$\${n}k\`}/>`},
    ],
    BarChart: [
        {label: "Grouped", node: () => <BarChart data={monthlyRevenue} series={revenueSeries} height={200} ariaLabel="Revenue and costs by month"/>, code: `<BarChart data={monthlyRevenue} series={revenueSeries} height={200}
    ariaLabel="Revenue and costs by month"/>`},
        {label: "Horizontal, for word labels", node: () => <BarChart data={monthlyRevenue} series={revenueSeries} horizontal height={200} ariaLabel="Revenue and costs by month, horizontal"/>, code: `// Each category label gets a full line instead of being rotated
<BarChart data={monthlyRevenue} series={revenueSeries} horizontal height={200}
    ariaLabel="Revenue and costs by month, horizontal"/>`},
        {label: "Grouped, four series, titled", node: () => <BarChart title="Bookings by channel" data={quarterlyChannels} series={channelSeries} height={220} formatValue={(n: number) => `$${n}k`}/>, code: `<BarChart
    title="Bookings by channel"
    data={quarterlyChannels}
    series={channelSeries}
    height={220}
    formatValue={(n) => \`$\${n}k\`}/>`},
    ],
    PieChart: [
        {label: "Slices", node: () => <PieChart data={spendByTeam} height={200} ariaLabel="Spend by team"/>, code: `<PieChart data={spendByTeam} height={200} ariaLabel="Spend by team"/>`},
        {label: "As a donut, with a centre label", node: () => <PieChart data={spendByTeam} donut={0.6} height={200} centerLabel="61" centerSubLabel="total" ariaLabel="Spend by team"/>, code: `<PieChart
    data={spendByTeam}
    donut={0.6}
    height={200}
    centerLabel="61"
    centerSubLabel="total"
    ariaLabel="Spend by team"/>`},
    ],
    Gauge: [
        {label: "One value against a range", node: () => <Gauge value={72} height={180} subLabel="of quota" ariaLabel="72 percent of quota"/>, code: `<Gauge value={72} height={180} subLabel="of quota" ariaLabel="72 percent of quota"/>`},
    ],
    Sparkline: [
        {label: "Inline in a sentence", node: () => <Stack inline gap="sm" align="center">
            <Text>Signups this quarter</Text>
            <Sparkline values={weeklySignups}/>
            <Text strong numeric>21</Text>
        </Stack>, code: `<Stack inline gap="sm" align="center">
    <Text>Signups this quarter</Text>
    <Sparkline values={weeklySignups}/>
    <Text strong numeric>21</Text>
</Stack>`},
        {label: "Every variant", node: () => <div style={row}>
            <Sparkline values={weeklySignups} variant="line"/>
            <Sparkline values={weeklySignups} variant="area"/>
            <Sparkline values={weeklySignups} variant="bar"/>
        </div>, code: `<Sparkline values={weeklySignups} variant="line"/>
<Sparkline values={weeklySignups} variant="area"/>
<Sparkline values={weeklySignups} variant="bar"/>`},
    ],

    AsyncDataTable: [
        {label: "Server-side search and paging", node: () => <AsyncDataTable<Person>
            columns={[
                {key: "name", header: "Name", render: (person: Person) => person.name},
                {key: "role", header: "Role", render: (person: Person) => person.role},
            ]}
            pageSize={3}
            searchPlaceholder="Search people"
            columnToggleLabel="Choose columns"
            loadingLabel="Loading people"
            emptyMessage="No people yet"
            noMatchMessage="No people match that search"
            load={(query) => {
                // Stands in for a real endpoint: the filtering and slicing a server would do.
                // Not `async` - there is nothing to await, and `load` is typed as returning a
                // Promise, which a plain resolved one satisfies
                const matched = directory.filter(person =>
                    person.name.toLowerCase().includes(query.search.toLowerCase()))
                const from = (query.page - 1) * query.pageSize
                return Promise.resolve({rows: matched.slice(from, from + query.pageSize), total: matched.length})
            }}/>, code: `<AsyncDataTable<Person>
columns={[
    {key: "name", header: "Name", render: (person) => person.name},
    {key: "role", header: "Role", render: (person) => person.role},
]}
pageSize={3}
searchPlaceholder="Search people"
columnToggleLabel="Choose columns"
loadingLabel="Loading people"
emptyMessage="No people yet"
noMatchMessage="No people match that search"
load={async (query) => {
    // The search, the page and the sort are all the server's job - which is the whole
    // reason to reach for this over DataTable
    const response = await api.listPeople({
        search: query.search,
        limit: query.pageSize,
        offset: (query.page - 1) * query.pageSize,
    })
    return {rows: response.people, total: response.total}
}}/>`},
    ],

    // --- Data Entry ---
    DatePicker: [
        {label: "Default", node: () => <DatePicker value="2026-01-15"/>, code: `<DatePicker value="2026-01-15"/>`},
        {label: "Disabled", node: () => <DatePicker value="2026-01-15" disabled/>, code: `<DatePicker value="2026-01-15" disabled/>`},
    ],
    DateTimePicker: [
        {label: "Default", node: () => <DateTimePicker value="2026-01-15T09:30"/>, code: `<DateTimePicker value="2026-01-15T09:30"/>`},
        {label: "Disabled", node: () => <DateTimePicker value="2026-01-15T09:30" disabled/>, code: `<DateTimePicker value="2026-01-15T09:30" disabled/>`},
    ],
    DateTimeRangePicker: [
        {label: "Default", node: () => <DateTimeRangePicker value={{start: "2026-01-15T09:30", end: "2026-01-17T17:00"}} onChange={() => {}}/>, code: `<DateTimeRangePicker value={{start: "2026-01-15T09:30", end: "2026-01-17T17:00"}} onChange={() => {}}/>`},
    ],
    Slider: [
        {label: "Values", node: () => <div style={col}>
            <Slider value={20} style={{width: "12em"}}/>
            <Slider value={60} style={{width: "12em"}}/>
            <Slider value={90} style={{width: "12em"}}/>
        </div>, code: `<Slider value={20} style={{width: "12em"}}/>
<Slider value={60} style={{width: "12em"}}/>
<Slider value={90} style={{width: "12em"}}/>`},
    ],
    InputNumber: [
        {label: "Default", node: () => <InputNumber value={5}/>, code: `<InputNumber value={5}/>`},
        {label: "With bounds", node: () => <InputNumber value={5} min={0} max={10} step={1}/>, code: `<InputNumber value={5} min={0} max={10} step={1}/>`},
    ],
    ColorPicker: [
        {label: "Values", node: () => <div style={row}><ColorPicker value="#66b2ff"/><ColorPicker value="#c6ff9e"/><ColorPicker value="#ff6666"/></div>, code: `<ColorPicker value="#66b2ff"/>
<ColorPicker value="#c6ff9e"/>
<ColorPicker value="#ff6666"/>`},
    ],
    Combobox: [
        {label: "Default (44 options - try typing to search)", node: () => <Combobox placeholder="Choose a country" options={comboboxCountryOptions}/>, code: `<Combobox placeholder="Choose a country" options={comboboxCountryOptions}/>`},
    ],
    Upload: [
        {label: "Default", node: () => <Upload accept="image/*">Click or drag a file here</Upload>, code: `<Upload accept="image/*">Click or drag a file here</Upload>`},
        {label: "Disabled", node: () => <Upload disabled>Disabled</Upload>, code: `<Upload disabled>Disabled</Upload>`},
    ],
    Rate: [
        {label: "Values", node: () => <div style={col}><Rate value={2}/><Rate value={4}/></div>, code: `<Rate value={2}/>
<Rate value={4}/>`},
        {label: "Types", node: () => <div style={col}>
            <Rate value={4} type="primary"/>
            <Rate value={4} type="secondary"/>
            <Rate value={4} type="warning"/>
            <Rate value={4} type="danger"/>
        </div>, code: `<Rate value={4} type="primary"/>
<Rate value={4} type="secondary"/>
<Rate value={4} type="warning"/>
<Rate value={4} type="danger"/>`},
        {label: "Disabled", node: () => <Rate value={3} disabled/>, code: `<Rate value={3} disabled/>`},
    ],

    // --- Utility ---
    Icon: [
        {label: "Default", node: () => <I i="gear" style={{height: "2em"}}/>, code: `<I i="gear" style={{height: "2em"}}/>`},
    ],
}

/** Converts a PascalCase story name to a kebab-case URL slug, e.g. "ContextMenu" -> "context-menu" */
function slugify(name: string): string {
    return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

/** Every documented component, in the same order as the Explorer's `stories` */
export const componentDocs: ComponentDoc[] = stories.map(story => ({
    ...story,
    slug: slugify(story.name),
    description: descriptions[story.name] ?? "",
    kind: functionDocs[story.name] ? "function" : "component",
    signature: functionDocs[story.name],
    attrs: attrTables[story.name] ?? [],
    methods: methodDocs[story.name],
    types: (componentTypes[story.name] ?? []).map(name => typeDefinitions[name]),
    themeOptions: (componentThemeOptions[story.name] ?? []).map(name => themeOptionDefinitions[name]),
    children: childrenDocs[story.name],
    examples: examplesByName[story.name] ?? [],
}))

/** Display order for sidebar/nav groups */
export const groupOrder = ["Typography", "Layout", "Form", "Navigation", "Feedback", "Overlays", "Data Display", "Charts", "Data Entry"]

/** `componentDocs`, bucketed by group and ordered per `groupOrder` */
export function groupedDocs(): {group: string, docs: ComponentDoc[]}[] {
    return groupOrder
        .map(group => ({group, docs: componentDocs.filter(doc => doc.group == group)}))
        .filter(bucket => bucket.docs.length > 0)
}

/** Looks up a single component's doc by its URL slug */
export function docBySlug(slug: string): ComponentDoc | undefined {
    return componentDocs.find(doc => doc.slug == slug)
}

/** Converts a group name to a URL-safe slug, e.g. "Data Display" -> "data-display" */
export function groupSlug(group: string): string {
    return group.toLowerCase().replace(/\s+/g, "-")
}

/** Looks up a single group's bucket by its URL slug */
export function groupByGroupSlug(slug: string): {group: string, docs: ComponentDoc[]} | undefined {
    return groupedDocs().find(bucket => groupSlug(bucket.group) == slug)
}
