import type { EmptyAttrs, RenderableElements } from "@velotype/velotype"
import { Component, getComponent, RenderBasic } from "@velotype/velotype"

import { stories } from "../../../tests/test_modules/explorer-schema.tsx"
import type { ComponentStory } from "../../../tests/test_modules/explorer-schema.tsx"

import {
    Accordion, Alert, AspectRatio, Avatar, Badge, Breadcrumbs, Button, ButtonGroup, ButtonModal,
    Calendar, CalendarRange, Card, Carousel, Checkbox, Collapse, ColorPicker, Combobox, Command, ContextMenu,
    DatePicker, DateTimePicker, DateTimeRangePicker, Divider, Drawer, Empty, Form, FormField, I, InputNumber, Link, List, Menu, Modal,
    Navbar, NavLink, Pagination, Popconfirm, Popover, Progress, RadioButton, Rate, ScrollArea, Select, SelectMenu,
    showToast, Sidebar, Skeleton, Slider, Spinner, Statistic, Steps, Table, DataTable, Tabs, Tag, TextBox,
    Textarea, TextEditableField, TextFormField, TextNonEditableField, TimeAgo, Timeline, Toggle,
    Tooltip, Tree, Upload,
} from "../../../src/index.ts"

/** One row in a component's prop reference table */
export type PropDoc = {
    name: string
    type: string
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
}

/** A `ComponentStory` (from the Explorer) augmented with showcase-only documentation */
export type ComponentDoc = ComponentStory & {
    /** URL-safe id, e.g. "context-menu" for "ContextMenu" */
    slug: string
    /** One-sentence summary shown at the top of the component's page */
    description: string
    /** Prop reference table rows */
    props: PropDoc[]
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
    Breadcrumbs: "A navigational trail showing where the current page sits in the site hierarchy.",
    Pagination: "A control for navigating between pages of results, with a windowed page-number list.",
    Navbar: "A themed top navigation bar with a brand slot and a row of children (typically NavLinks).",
    Sidebar: "A themed vertical navigation list, with the current page highlighted automatically.",
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
    Avatar: "A small circular image (or initials fallback) representing a person or entity.",
    TimeAgo: "Formats a timestamp as a localized relative time string, e.g. \"5 minutes ago\".",
    Divider: "A thin themed line used to visually separate content, horizontal or vertical.",
    Tabs: "A set of labeled panels where only one panel is shown at a time.",
    Accordion: "A list of collapsible sections built on native details/summary, optionally grouped so only one stays open at a time.",
    Tag: "A small inline label like Badge, but optionally removable - for filter chips and multi-select values.",
    Collapse: "A single collapsible section, for one independently-toggleable disclosure widget (Accordion renders a whole list).",
    Statistic: "A labeled numeric stat tile, for dashboards and KPI summaries.",
    List: "A styled list of items, each with optional leading/trailing slots.",
    Timeline: "A vertical list of dated/ordered events, each with a dot marker on a connecting line.",
    AspectRatio: "Constrains its children to a fixed width:height ratio, via pure CSS.",
    ScrollArea: "A scrollable container with a themed thin scrollbar.",
    Table: "A themed data table wrapping a native <table>, generic over the row type.",
    DataTable: "A batteries-included data table: sortable and resizable columns, user-toggleable column visibility, an optional search box, and built-in pagination via Pagination.",
    Carousel: "A single-slide-at-a-time carousel with prev/next arrows and optional dot indicators.",
    Calendar: "A month-grid date picker with prev/next month navigation and a selectable day.",
    CalendarRange: "A month-grid date-*range* picker: click a start day, then an end day, and the span between them highlights.",
    Tree: "A hierarchical, expandable/collapsible list built on nested native details/summary pairs.",
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

const propTables: Record<string, PropDoc[]> = {
    Button: [
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger" | "text"', description: "Sets the color (default: primary)."},
        {name: "disabled", type: "boolean", description: "Disables the button."},
        {name: "loadingOnClick", type: "boolean", description: "Shows a spinner and blocks re-clicks until onClick calls doneLoading()."},
        {name: "onClick", type: "(event, doneLoading?) => void", description: "Click handler."},
        {name: "children", type: "RenderableElements", description: "Button content."},
    ],
    ButtonGroup: [
        {name: "orientation", type: '"horizontal" | "vertical"', description: "Direction to lay out the buttons (default: horizontal)."},
        {name: "children", type: "RenderableElements", description: "The Buttons to join together."},
    ],
    RadioButton: [
        {name: "name", type: "string", description: "Name of the radio group this button participates in (required)."},
        {name: "checked", type: "boolean", description: "Is this option selected?"},
        {name: "disabled", type: "boolean", description: "Disables the radio button."},
        {name: "value", type: "string | number", description: "Value submitted for this option in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    Checkbox: [
        {name: "name", type: "string", description: "Name for the underlying <input>."},
        {name: "checked", type: "boolean", description: "Is the checkbox checked?"},
        {name: "indeterminate", type: "boolean", description: "Shows the visual indeterminate state (neither checked nor unchecked)."},
        {name: "disabled", type: "boolean", description: "Disables the checkbox."},
        {name: "value", type: "string | number", description: "Value submitted in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    Toggle: [
        {name: "name", type: "string", description: "Name for the underlying <input>."},
        {name: "checked", type: "boolean", description: "Is the toggle switched on?"},
        {name: "disabled", type: "boolean", description: "Disables the toggle."},
        {name: "value", type: "string | number", description: "Value submitted in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    TextBox: [
        {name: "type", type: '"text" | "email" | "phone" | "password" | "new-password"', description: "Input type (required)."},
        {name: "name", type: "string", description: "Name for the underlying <input>."},
        {name: "value", type: "string | number", description: "Current value."},
        {name: "placeholder", type: "string", description: "Placeholder text."},
        {name: "required", type: "boolean", description: "Marks the field required in a <form>."},
        {name: "onInput / onChange", type: "(event) => void", description: "Input/change handlers."},
    ],
    Textarea: [
        {name: "name", type: "string", description: "Name for the underlying <textarea>."},
        {name: "value", type: "string", description: "Current value."},
        {name: "placeholder", type: "string", description: "Placeholder text."},
        {name: "rows", type: "number", description: "Visible text lines (default: 3)."},
        {name: "maxLength", type: "number", description: "Maximum accepted characters."},
        {name: "resize", type: '"none" | "vertical" | "horizontal" | "both"', description: "User resize behavior (default: vertical)."},
        {name: "required", type: "boolean", description: "Marks the field required in a <form>."},
    ],
    Select: [
        {name: "options", type: "SelectOptionType[]", description: "The selectable options (required)."},
        {name: "value", type: "string", description: "Currently selected value."},
        {name: "placeholder", type: "string", description: "First option shown until a value is chosen."},
        {name: "placeholderDisabled", type: "boolean", description: "Prevents re-selecting the placeholder once a real option is chosen, so the selection can't be cleared through the UI (default: false)."},
        {name: "disabled", type: "boolean", description: "Disables the select."},
        {name: "required", type: "boolean", description: "Marks the field required in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    SelectMenu: [
        {name: "options", type: "OptionType[]", description: "The selectable options, in display order (required)."},
        {name: "getValue", type: "(option: OptionType) => string", description: "Extracts the value used to identify, select, and submit each option; must be unique per option (required)."},
        {name: "renderOption", type: "(option: OptionType) => RenderableElements", description: "Renders one option's content - used for each entry in the open panel, and (unless renderValue is given) the trigger's display of the current selection too (required)."},
        {name: "renderValue", type: "(option: OptionType) => RenderableElements", description: "Renders the trigger's display of the current selection, when it should differ from renderOption's full content."},
        {name: "value", type: "string", description: "Value of the initially-selected option."},
        {name: "placeholder", type: "RenderableElements", description: "Content shown in the trigger when no option is selected."},
        {name: "isOptionDisabled", type: "(option: OptionType) => boolean", description: "Marks an option as unselectable."},
        {name: "disabled", type: "boolean", description: "Disables the whole control."},
        {name: "name", type: "string", description: "Name for a hidden <input> mirroring the selected value, for <form> submission."},
        {name: "onChange", type: "(option: OptionType, value: string) => void", description: "Called with the newly selected option whenever the user picks one."},
    ],
    TextNonEditableField: [
        {name: "value", type: "string", description: "The read-only value shown (required)."},
        {name: "children", type: "RenderableElements", description: "Label content."},
    ],
    TextFormField: [
        {name: "field", type: "RenderBasic<string>", description: "The bound reactive value (required)."},
        {name: "type", type: "TextBoxTypeType", description: "Input type (default: text)."},
        {name: "required", type: "boolean", description: "Marks the field required in a <form>."},
        {name: "updateOnInput", type: "boolean", description: "Update field.value on every keystroke (default: true)."},
        {name: "updateOnChange", type: "boolean", description: "Update field.value on change/blur (default: false)."},
        {name: "children", type: "RenderableElements", description: "Label content."},
    ],
    TextEditableField: [
        {name: "field", type: "RenderBasic<string>", description: "The bound reactive value (required)."},
        {name: "type", type: "TextBoxTypeType", description: "Input type while editing (default: text)."},
        {name: "fieldName", type: "string", description: "Name for the underlying <input> while editing."},
        {name: "children", type: "RenderableElements", description: "Label content."},
    ],
    NavLink: [
        {name: "to", type: "string", description: "Target URL (required)."},
        {name: "exact", type: "boolean", description: "Match only the exact pathname vs. any path starting with to (default: true)."},
        {name: "activeClass", type: "string", description: 'CSS class added when active (default: "vtd-navlink-active").'},
        {name: "spa", type: "boolean", description: "Client-side route change via History.changeLocation, no page reload (default: false). Set true for an SPA; leave false for a multi-page site, where a click should be a real navigation."},
    ],
    Link: [
        {name: "to", type: "string", description: "Target URL (required)."},
        {name: "children", type: "RenderableElements", description: "Link content."},
        {name: "spa", type: "boolean", description: "Same meaning as NavLink's spa (default: false)."},
    ],
    Breadcrumbs: [
        {name: "items", type: "BreadcrumbItemType[]", description: "The trail of crumbs, root to current (required)."},
        {name: "separator", type: "RenderableElements", description: 'Content shown between crumbs (default: "/").'},
        {name: "ariaLabel", type: "string", description: "Accessible label for the nav landmark. No default text."},
        {name: "spa", type: "boolean", description: "Forwarded to every crumb's Link (default: false)."},
    ],
    Pagination: [
        {name: "page", type: "number", description: "Currently selected page, 1-indexed (required)."},
        {name: "totalPages", type: "number", description: "Total number of pages (required)."},
        {name: "onPageChange", type: "(page) => void", description: "Called with the newly selected page (required)."},
        {name: "siblingCount", type: "number", description: "Pages shown on each side of the current page (default: 2)."},
        {name: "prevButtonChildren / nextButtonChildren", type: "RenderableElements", description: "Prev/next button content (default: PaginationThemeOptions.prevSymbol/nextSymbol - plain ‹ / › glyphs, not English text)."},
        {name: "ariaLabel", type: "string", description: "Accessible label for the nav landmark. No default text."},
    ],
    Navbar: [
        {name: "brand", type: "RenderableElements", description: "Content shown on the left."},
        {name: "children", type: "RenderableElements", description: "Typically a row of NavLinks."},
    ],
    Sidebar: [
        {name: "items", type: "SidebarItemType[]", description: "The entries to list (required)."},
        {name: "header", type: "RenderableElements", description: "Content shown above the list."},
        {name: "ariaLabel", type: "string", description: "Accessible label for the nav landmark. No default text."},
        {name: "spa", type: "boolean", description: "Forwarded to every item's NavLink (default: false)."},
    ],
    Menu: [
        {name: "trigger", type: "RenderableElements", description: "Content that opens the menu when clicked (required)."},
        {name: "items", type: "MenuItemType[]", description: "The entries to show (required) - each with label, and either href (+ optional spa) and/or onClick."},
        {name: "closeOnOutsideClick", type: "boolean", description: "Closes the menu on an outside click (default: true)."},
    ],
    Steps: [
        {name: "steps", type: "StepType[]", description: "The steps, in order (required)."},
        {name: "current", type: "number", description: "0-indexed position of the current step (required)."},
    ],
    Alert: [
        {name: "type", type: '"info" | "success" | "warning" | "danger"', description: "Sets the color (default: info)."},
        {name: "title", type: "RenderableElements", description: "Optional title shown above the body."},
        {name: "onDismiss", type: "() => void", description: "If set, shows a dismiss button."},
        {name: "dismissLabel", type: "string", description: "Accessible label for the dismiss button, when shown. No default text."},
        {name: "children", type: "RenderableElements", description: "Body content."},
    ],
    Toast: [
        {name: "showToast(message, options)", type: "function", description: "Imperative call - not placed in your JSX tree."},
        {name: "options.type", type: '"info" | "success" | "warning" | "danger"', description: "Sets the color (default: info)."},
        {name: "options.duration", type: "number", description: "Milliseconds before auto-dismiss; 0 disables it (default: 4000)."},
        {name: "options.dismissLabel", type: "string", description: "Accessible label for the dismiss button. No default text."},
    ],
    Tooltip: [
        {name: "content", type: "RenderableElements", description: "Content shown inside the bubble (required)."},
        {name: "placement", type: '"top" | "bottom" | "left" | "right"', description: "Side of the trigger to show the bubble on (default: top)."},
        {name: "children", type: "RenderableElements", description: "The trigger."},
    ],
    Spinner: [
        {name: "size", type: "string", description: 'CSS size (default: "1em").'},
        {name: "label", type: "string", description: "Accessible label announced by screen readers. No default text."},
    ],
    Progress: [
        {name: "value", type: "number", description: "Current value (required)."},
        {name: "max", type: "number", description: "Maximum value (default: 100)."},
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger"', description: "Sets the color."},
        {name: "showLabel", type: "boolean", description: "Shows a \"{percent}%\" label next to the bar."},
    ],
    Skeleton: [
        {name: "variant", type: '"text" | "circular" | "rectangular"', description: "Placeholder shape (default: text)."},
        {name: "width / height", type: "string", description: "CSS size."},
        {name: "lines", type: "number", description: "Number of lines for the text variant (default: 1)."},
    ],
    Empty: [
        {name: "title", type: "RenderableElements", description: "Main message. No default text - only the ∅ icon shows unless you set one."},
        {name: "description", type: "RenderableElements", description: "Smaller supporting text."},
        {name: "children", type: "RenderableElements", description: "A follow-up action, e.g. a Button."},
    ],
    Modal: [
        {name: "title", type: "RenderableElements", description: "Title content (required)."},
        {name: "confirmButtonChildren", type: "RenderableElements", description: "Confirm button content (required)."},
        {name: "cancelButtonChildren", type: "RenderableElements", description: "Cancel button content (default: ModalThemeOptions.cancelSymbol - a plain \"x\", not English text)."},
        {name: "confirmButtonOnClick", type: "(doneLoading) => void", description: "Called when confirm is clicked."},
        {name: "startConfirmDisabled", type: "boolean", description: "Starts the confirm button disabled."},
        {name: "showModal() / close()", type: "method", description: "Imperative open/close (the <dialog>'s own native methods)."},
    ],
    Drawer: [
        {name: "title", type: "RenderableElements", description: "Title content."},
        {name: "placement", type: '"left" | "right" | "top" | "bottom"', description: "Which edge of the viewport the drawer is anchored to (default: left)."},
        {name: "enterFrom", type: '"left" | "right" | "top" | "bottom"', description: "Which direction the entrance animation slides in from (default: same as placement)."},
        {name: "children", type: "RenderableElements", description: "Body content."},
        {name: "showModal() / close()", type: "method", description: "Imperative open/close."},
    ],
    Popover: [
        {name: "trigger", type: "RenderableElements", description: "Content that opens the popover when clicked (required) - can be a real Button."},
        {name: "content", type: "RenderableElements", description: "Content shown inside the bubble (required)."},
        {name: "placement", type: '"top" | "bottom" | "left" | "right"', description: "Side of the trigger (default: bottom)."},
        {name: "closeOnOutsideClick", type: "boolean", description: "Closes the popover on an outside click (default: true)."},
    ],
    Popconfirm: [
        {name: "title", type: "RenderableElements", description: "Confirmation message (required)."},
        {name: "onConfirm", type: "() => void", description: "Called when confirmed (required)."},
        {name: "confirmButtonChildren / cancelButtonChildren", type: "RenderableElements", description: "Defaults: PopconfirmThemeOptions.confirmSymbol/cancelSymbol - plain ✓ / ✕ glyphs, not English text."},
        {name: "closeOnOutsideClick", type: "boolean", description: "Closes the bubble on an outside click (default: true)."},
        {name: "children", type: "RenderableElements", description: "The trigger, typically a Button."},
    ],
    ContextMenu: [
        {name: "items", type: "ContextMenuItemType[]", description: "The entries to show (required)."},
        {name: "children", type: "RenderableElements", description: "The area that opens the menu on right-click."},
    ],
    Command: [
        {name: "items", type: "CommandItemType[]", description: "The full set of items, filtered client-side (required)."},
        {name: "placeholder", type: "string", description: "Placeholder for the search input. No default text."},
        {name: "showModal() / close()", type: "method", description: "Imperative open/close."},
    ],
    Badge: [
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger" | "neutral"', description: "Sets the color (default: neutral)."},
        {name: "children", type: "RenderableElements", description: "Badge content."},
    ],
    Card: [
        {name: "header / footer", type: "RenderableElements", description: "Optional header/footer regions."},
        {name: "children", type: "RenderableElements", description: "Body content."},
    ],
    Avatar: [
        {name: "src", type: "string", description: "Image URL."},
        {name: "initials", type: "string", description: "Fallback shown when there's no image (or it fails to load)."},
        {name: "alt", type: "string", description: "Alt text for the image."},
        {name: "size", type: "string", description: 'CSS size (default: "2.5em").'},
    ],
    TimeAgo: [
        {name: "timestamp", type: "Date | string", description: "The moment to format, relative to now (required)."},
        {name: "numeric", type: '"always" | "auto"', description: 'Force numeric phrasing vs. allow "yesterday" etc.'},
        {name: "timestyle", type: '"long" | "short" | "narrow"', description: "Verbosity of the formatted string."},
    ],
    Divider: [
        {name: "orientation", type: '"horizontal" | "vertical"', description: "Direction of the line (default: horizontal)."},
    ],
    Tabs: [
        {name: "tabs", type: "TabType[]", description: "The tabs to render (required)."},
        {name: "initialKey", type: "string", description: "Key of the tab that starts active (default: first tab)."},
    ],
    Accordion: [
        {name: "items", type: "AccordionItemType[]", description: "The sections to render (required)."},
        {name: "exclusive", type: "boolean", description: "Opening one section closes any other open section."},
    ],
    Tag: [
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger" | "neutral"', description: "Sets the color (default: neutral)."},
        {name: "onRemove", type: "() => void", description: "If set, shows a remove button."},
        {name: "removeLabel", type: "string", description: "Accessible label for the remove button, when shown. No default text."},
        {name: "children", type: "RenderableElements", description: "Tag content."},
    ],
    Collapse: [
        {name: "header", type: "RenderableElements", description: "Header content (required)."},
        {name: "defaultOpen", type: "boolean", description: "Starts expanded."},
        {name: "children", type: "RenderableElements", description: "Content shown when expanded."},
    ],
    Statistic: [
        {name: "title", type: "RenderableElements", description: "Label shown above the value (required)."},
        {name: "value", type: "string | number", description: "The value to display (required)."},
        {name: "prefix / suffix", type: "RenderableElements", description: "Content before/after the value."},
    ],
    List: [
        {name: "items", type: "ListItemType[]", description: "The entries to show (required) - each with title, description, leading, trailing, and optionally href/onSelect."},
        {name: "zebra", type: "boolean", description: "Alternate item background colors for readability (default: false)."},
        {name: "highlightOnHover", type: "boolean", description: "Highlight an item's background on hover (default: false)."},
    ],
    Timeline: [
        {name: "items", type: "TimelineItemType[]", description: "The events, in order (required) - each with a title, description, and dot type."},
    ],
    AspectRatio: [
        {name: "ratio", type: "number", description: "Width divided by height, e.g. 16/9 (default: 1)."},
        {name: "children", type: "RenderableElements", description: "Typically a single image/video/iframe."},
    ],
    ScrollArea: [
        {name: "maxHeight", type: "string", description: "CSS max-height of the scrollable region."},
        {name: "children", type: "RenderableElements", description: "Scrollable content."},
    ],
    Table: [
        {name: "columns", type: "TableColumnType<RowType>[]", description: "Column definitions, each with a render(row) function (required)."},
        {name: "rows", type: "RowType[]", description: "The rows to display (required)."},
    ],
    DataTable: [
        {name: "columns", type: "DataTableColumnType<RowType>[]", description: "Column definitions - add sortValue/filterValue/width/hideable/resizable to opt each column into those features (required)."},
        {name: "rows", type: "RowType[]", description: "The full set of rows; filtering/sorting/pagination all happen client-side over this set (required)."},
        {name: "pageSize", type: "number", description: "Rows per page. 0 disables pagination (default: 10)."},
        {name: "pageSizeOptions", type: "number[]", description: "Options offered by the page-size control, when shown (default: [10, 25, 50, 100])."},
        {name: "showPageSizeControl", type: "boolean", description: "Shows a control letting the user change how many rows are displayed per page (default: false)."},
        {name: "resizableColumns", type: "boolean", description: "Whether columns can be resized by dragging, unless overridden per-column via resizable (default: true)."},
        {name: "showColumnToggle", type: "boolean", description: "Shows the column-visibility customizer button (default: true)."},
        {name: "searchable", type: "boolean", description: "Shows a search box filtering rows via each column's filterValue (default: false). Any column whose render() returns plain text highlights its matched characters automatically."},
        {name: "searchPlaceholder", type: "string", description: "Placeholder for the search input. No default text."},
        {name: "zebra", type: "boolean", description: "Alternate row background colors for readability (default: false)."},
        {name: "highlightOnHover", type: "boolean", description: "Highlight a row's background on hover (default: true)."},
        {name: "rowHref", type: "(row) => string | undefined", description: "Wraps a row's first visible column in a real, full-width link. Takes priority over onRowSelect."},
        {name: "onRowSelect", type: "(row) => void", description: "Makes a row a JS-driven full-width \"select\" action (a stretched button) instead of a link."},
    ],
    Carousel: [
        {name: "slides", type: "RenderableElements[]", description: "The slides to cycle through (required)."},
        {name: "showDots", type: "boolean", description: "Shows numbered dot indicators (default: true)."},
        {name: "getDotLabel", type: "(index) => string", description: "Builds a dot's accessible label from its 0-indexed slide index. No default text."},
        {name: "autoplay", type: "boolean", description: "Automatically advance on a timer; stops for good on the first user-driven navigation (default: false)."},
        {name: "autoplayFirstDelay", type: "number", description: "Delay in ms before the very first automatic advance (default: same as autoplayDelay)."},
        {name: "autoplayDelay", type: "number", description: "Flat delay in ms between each automatic advance after the first (default: 5000)."},
        {name: "autoplaySlideDelays", type: "Record<number, number>", description: "Per-slide delay overrides in ms, keyed by the currently-shown slide's index."},
    ],
    Calendar: [
        {name: "value", type: "Date", description: "Currently selected date."},
        {name: "onSelectDate", type: "(date) => void", description: "Called when a day cell is clicked."},
    ],
    CalendarRange: [
        {name: "value", type: "{start?: Date, end?: Date}", description: "Currently selected range."},
        {name: "onSelectRange", type: "(range) => void", description: "Called after picking the start, and again after picking the end."},
    ],
    Tree: [
        {name: "nodes", type: "TreeNodeType[]", description: "The root nodes (required) - each optionally with children."},
        {name: "onSelect", type: "(node) => void", description: "Called when a node's label is clicked."},
    ],
    DatePicker: [
        {name: "value", type: "string", description: 'Current value, as an "YYYY-MM-DD" string.'},
        {name: "min / max", type: "string", description: "Selectable date bounds."},
        {name: "disabled", type: "boolean", description: "Disables the input."},
        {name: "required", type: "boolean", description: "Marks the field required in a <form>."},
    ],
    DateTimePicker: [
        {name: "value", type: "string", description: 'Current value, as an "YYYY-MM-DDTHH:mm" string.'},
        {name: "min / max", type: "string", description: "Selectable date-time bounds."},
        {name: "step", type: "number", description: "Time granularity in seconds (default: 60, i.e. no seconds field)."},
        {name: "disabled", type: "boolean", description: "Disables the input."},
        {name: "required", type: "boolean", description: "Marks the field required in a <form>."},
    ],
    DateTimeRangePicker: [
        {name: "value", type: "{start?: string, end?: string}", description: 'Currently selected range, each as an "YYYY-MM-DDTHH:mm" string.'},
        {name: "min / max", type: "string", description: "Selectable date-time bounds, for both fields."},
        {name: "onChange", type: "(range) => void", description: "Called with the updated range whenever either field changes."},
        {name: "disabled", type: "boolean", description: "Disables both inputs."},
    ],
    Slider: [
        {name: "value", type: "number", description: "Current value."},
        {name: "min / max", type: "number", description: "Bounds (default: 0 / 100)."},
        {name: "step", type: "number", description: "Step size (default: 1)."},
        {name: "disabled", type: "boolean", description: "Disables the slider."},
        {name: "onInput / onChange", type: "(event) => void", description: "Input/change handlers."},
    ],
    InputNumber: [
        {name: "value", type: "number", description: "Current value."},
        {name: "min / max / step", type: "number", description: "Numeric bounds and step."},
        {name: "placeholder", type: "string", description: "Placeholder text."},
        {name: "disabled", type: "boolean", description: "Disables the input."},
    ],
    ColorPicker: [
        {name: "value", type: "string", description: 'Current value, as a "#rrggbb" hex string.'},
        {name: "disabled", type: "boolean", description: "Disables the input."},
    ],
    Combobox: [
        {name: "options", type: "ComboboxOptionType[]", description: "Suggested options (required)."},
        {name: "value", type: "string", description: "Current value."},
        {name: "placeholder", type: "string", description: "Placeholder text."},
        {name: "disabled", type: "boolean", description: "Disables the combobox."},
    ],
    Upload: [
        {name: "accept", type: "string", description: 'Accepted file types, e.g. "image/*".'},
        {name: "multiple", type: "boolean", description: "Allow selecting more than one file."},
        {name: "disabled", type: "boolean", description: "Disables the control."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
        {name: "children", type: "RenderableElements", description: "Drop-zone content."},
    ],
    Rate: [
        {name: "value", type: "number", description: "Currently selected value."},
        {name: "count", type: "number", description: "Number of stars (default: 5)."},
        {name: "type", type: '"primary" | "secondary" | "warning" | "danger"', description: "Sets the filled-star color (default: warning)."},
        {name: "disabled", type: "boolean", description: "Disables the control."},
        {name: "getStarLabel", type: "(value, count) => string", description: "Builds one star's accessible label. No default text."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
    ],
    Form: [
        {name: "onSubmit", type: "(event) => void", description: "Called on submit, after preventDefault() (Form)."},
        {name: "children", type: "RenderableElements", description: "Typically a stack of FormFields (Form)."},
        {name: "label / error", type: "RenderableElements", description: "Field label and validation message (FormField)."},
        {name: "required", type: "boolean", description: "Shows a required marker next to the label (FormField)."},
    ],
    Icon: [
        {name: "i", type: "string", description: "The key of a registered icon (required)."},
    ],
}

const row = {display: "flex", gap: "0.75em", flexWrap: "wrap", alignItems: "center"} as const
const col = {display: "flex", flexDirection: "column", gap: "0.75em"} as const

const textFormFieldValue = new RenderBasic<string>("editable value")
const textEditableFieldValue = new RenderBasic<string>("click edit to change me")
const selectMenuSelection = new RenderBasic<string>("Jamie Rivera")

/**
 * Calendar (like Carousel/DataTable/every other stateful `Component` in the library - see each
 * one's own doc comment) reads `value` once at construction and has no way to pick up a changed
 * prop on an already-mounted instance, so a docs example that just does
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
 * actually use, not an exhaustive combination of every prop. A component missing here just
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
        </div>},
        {label: "Disabled", node: () => <Button type="primary" disabled>Disabled</Button>},
    ],
    ButtonGroup: [
        {label: "Horizontal", node: () => <ButtonGroup>
            <Button type="secondary">Left</Button>
            <Button type="secondary">Middle</Button>
            <Button type="secondary">Right</Button>
        </ButtonGroup>},
        {label: "Mixed types", node: () => <ButtonGroup>
            <Button type="primary">Save</Button>
            <Button type="danger">Delete</Button>
        </ButtonGroup>},
        {label: "Vertical", node: () => <ButtonGroup orientation="vertical">
            <Button type="secondary">Top</Button>
            <Button type="secondary">Middle</Button>
            <Button type="secondary">Bottom</Button>
        </ButtonGroup>},
    ],
    RadioButton: [
        {label: "Group", node: () => <div style={row}>
            <RadioButton name="doc-radio" checked>One</RadioButton>
            <RadioButton name="doc-radio">Two</RadioButton>
            <RadioButton name="doc-radio">Three</RadioButton>
        </div>},
        {label: "Disabled", node: () => <RadioButton name="doc-radio-disabled" disabled>Disabled</RadioButton>},
    ],
    Checkbox: [
        {label: "States", node: () => <div style={row}>
            <Checkbox>Unchecked</Checkbox>
            <Checkbox checked>Checked</Checkbox>
            <Checkbox indeterminate>Indeterminate</Checkbox>
            <Checkbox disabled>Disabled</Checkbox>
        </div>},
    ],
    Toggle: [
        {label: "States", node: () => <div style={row}>
            <Toggle>Off</Toggle>
            <Toggle checked>On</Toggle>
            <Toggle disabled>Disabled</Toggle>
        </div>},
    ],
    TextBox: [
        {label: "Types", node: () => <div style={col}>
            <TextBox type="text" placeholder="Text"/>
            <TextBox type="email" placeholder="Email"/>
            <TextBox type="phone" placeholder="Phone"/>
            <TextBox type="password" placeholder="Password"/>
        </div>},
    ],
    Textarea: [
        {label: "Default", node: () => <Textarea placeholder="Type something..." rows={3}/>},
    ],
    Select: [
        {label: "Default", node: () => <Select value="a" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}, {value: "c", label: "Option C"}]}/>},
        {label: "Placeholder", node: () => <Select placeholder="Choose one" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}]}/>},
        {label: "Clearable (placeholder stays selectable)", node: () => <Select value="a" placeholder="Choose one" options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}]}/>},
        {label: "Disabled", node: () => <Select value="a" disabled options={[{value: "a", label: "Option A"}]}/>},
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
        </span>},
        {label: "Placeholder", node: () => <SelectMenu<{id: string, name: string}>
            placeholder="Assign to..."
            options={[{id: "a", name: "Jamie Rivera"}, {id: "b", name: "Alex Baker"}]}
            getValue={option => option.id}
            renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.5em"}}><Avatar initials={option.name[0]} size="1.5em"/>{option.name}</span>}/>},
        {label: "Disabled", node: () => <SelectMenu<{id: string, name: string}>
            value="a"
            disabled
            options={[{id: "a", name: "Jamie Rivera"}]}
            getValue={option => option.id}
            renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.5em"}}><Avatar initials={option.name[0]} size="1.5em"/>{option.name}</span>}/>},
    ],
    TextNonEditableField: [
        {label: "Default", node: () => <TextNonEditableField value="example value">Label:</TextNonEditableField>},
    ],
    TextFormField: [
        {label: "Default", node: () => <TextFormField field={textFormFieldValue}>Label:</TextFormField>},
    ],
    TextEditableField: [
        {label: "Default", node: () => <TextEditableField field={textEditableFieldValue}>Label:</TextEditableField>},
    ],
    Form: [
        {label: "Basic form", node: () => <Form onSubmit={() => {}}>
            <FormField label="Name" required><TextBox type="text"/></FormField>
            <FormField label="Email" error="Enter a valid email address"><TextBox type="email"/></FormField>
            <Button type="primary">Submit</Button>
        </Form>},
    ],

    // --- Navigation ---
    NavLink: [
        {label: "Default", node: () => <div style={row}><NavLink to="/" spa>Home</NavLink><NavLink to="/docs" spa>Docs</NavLink></div>},
    ],
    Link: [
        {label: "Default", node: () => <Link to="/somewhere" spa>Click me</Link>},
    ],
    Breadcrumbs: [
        {label: "Default", node: () => <Breadcrumbs spa items={[{label: "Home", to: "/"}, {label: "Library", to: "/library"}, {label: "Current page"}]}/>},
    ],
    Pagination: [
        {label: "First page", node: () => <Pagination page={1} totalPages={10} onPageChange={() => {}}/>},
        {label: "Middle page", node: () => <Pagination page={5} totalPages={10} onPageChange={() => {}}/>},
        {label: "Last page", node: () => <Pagination page={10} totalPages={10} onPageChange={() => {}}/>},
    ],
    Navbar: [
        {label: "Default", node: () => <Navbar brand="My App"><NavLink to="/" spa>Home</NavLink><NavLink to="/docs" spa>Docs</NavLink></Navbar>},
    ],
    Sidebar: [
        {label: "Default", node: () => <Sidebar spa header="Sections" items={[{label: "Overview", to: "/"}, {label: "Settings", to: "/settings"}]}/>},
    ],
    Menu: [
        {label: "Default", node: () => <Menu trigger="Actions" items={[{label: "Do a thing", onClick: () => {}}, {label: "Disabled", disabled: true}]}/>},
    ],
    Steps: [
        {label: "Just started", node: () => <Steps current={0} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>},
        {label: "In progress", node: () => <Steps current={1} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>},
        {label: "Complete", node: () => <Steps current={2} steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>},
    ],

    // --- Feedback ---
    Alert: [
        {label: "Types", node: () => <div style={col}>
            <Alert type="info" title="Info">Heads up, this is informational.</Alert>
            <Alert type="success" title="Success">Everything worked.</Alert>
            <Alert type="warning" title="Warning">Double check this.</Alert>
            <Alert type="danger" title="Danger">Something went wrong.</Alert>
        </div>},
        {label: "Dismissible", node: () => <Alert type="info" onDismiss={() => {}}>Click the x to dismiss.</Alert>},
    ],
    Toast: [
        {label: "Trigger", node: () => <Button type="secondary" onClick={() => showToast("Hello from a toast", {type: "success"})}>Show toast</Button>},
    ],
    Tooltip: [
        {label: "Default", node: () => <Tooltip content="More info"><Button type="secondary">Hover me</Button></Tooltip>},
    ],
    Spinner: [
        {label: "Sizes", node: () => <div style={row}><Spinner size="1em"/><Spinner size="2em"/><Spinner size="3em"/></div>},
    ],
    Progress: [
        {label: "Values", node: () => <div style={col}>
            <Progress value={25} showLabel/>
            <Progress value={65} showLabel/>
            <Progress value={100} showLabel/>
        </div>},
        {label: "Types", node: () => <div style={col}>
            <Progress value={60} type="primary"/>
            <Progress value={60} type="secondary"/>
            <Progress value={60} type="warning"/>
            <Progress value={60} type="danger"/>
        </div>},
    ],
    Skeleton: [
        {label: "Text", node: () => <Skeleton lines={3}/>},
        {label: "Circular / rectangular", node: () => <div style={row}><Skeleton variant="circular"/><Skeleton variant="rectangular" width="10em" height="4em"/></div>},
    ],
    Empty: [
        {label: "Default (icon only - no default text)", node: () => <Empty/>},
        {label: "With title", node: () => <Empty title="No data"/>},
        {label: "With action", node: () => <Empty title="No results" description="Try adjusting your filters"><Button type="secondary">Create one</Button></Empty>},
    ],

    // --- Overlays ---
    Modal: [
        {label: "Trigger", node: () => <ButtonModal
            openButtonText="Open modal"
            modalAttrs={{title: "Confirm action", confirmButtonChildren: "Confirm", cancelButtonChildren: "Cancel", confirmButtonOnClick: (doneLoading) => doneLoading()}}>
            Modal body content goes here.
        </ButtonModal>},
    ],
    Drawer: [
        {label: "Trigger", node: () => {
            const drawer = <Drawer title="Settings">Drawer body content goes here.</Drawer>
            return <span style={{display: "contents"}}>{drawer}<Button type="secondary" onClick={() => drawer.showModal()}>Open drawer</Button></span>
        }},
        {label: "Placed on one edge, entering from another", node: () => {
            const drawer = <Drawer title="Notifications" placement="bottom" enterFrom="right">Anchored to the bottom edge, but slides in from the right.</Drawer>
            return <span style={{display: "contents"}}>{drawer}<Button type="secondary" onClick={() => drawer.showModal()}>Open drawer</Button></span>
        }},
    ],
    Popover: [
        {label: "Trigger", node: () => <Popover trigger={<Button type="secondary">Click me</Button>} content="Rich popover content, shown on click."/>},
    ],
    Popconfirm: [
        {label: "Trigger", node: () => <Popconfirm title="Delete this item?" onConfirm={() => {}}><Button type="danger">Delete</Button></Popconfirm>},
    ],
    ContextMenu: [
        {label: "Trigger area", node: () => <ContextMenu items={[{label: "Copy", onClick: () => {}}, {label: "Paste", onClick: () => {}}, {label: "Delete", disabled: true}]}>
            <div style={{padding: "2em", border: "1px dashed var(--background-5)", borderRadius: "0.25rem"}}>Right-click here</div>
        </ContextMenu>},
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
        }},
    ],

    // --- Data Display ---
    Badge: [
        {label: "Types", node: () => <div style={row}>
            <Badge type="primary">primary</Badge>
            <Badge type="secondary">secondary</Badge>
            <Badge type="warning">warning</Badge>
            <Badge type="danger">danger</Badge>
            <Badge type="neutral">neutral</Badge>
        </div>},
    ],
    Card: [
        {label: "Default", node: () => <Card header="Card title">Some card body content.</Card>},
        {label: "With footer (defaults flush right)", node: () => <Card header="Card title" footer={<span style={{display: "contents"}}>
            <Button type="secondary">Cancel</Button>
            <Button type="primary">Confirm</Button>
        </span>}>Some card body content.</Card>},
    ],
    Avatar: [
        {label: "Sizes", node: () => <div style={row}><Avatar initials="JR" size="1.5em"/><Avatar initials="JR"/><Avatar initials="JR" size="3.5em"/></div>},
        {label: "Image (falls back to initials if it fails to load)", node: () => <Avatar src="https://placehold.co/64x64" alt="Placeholder" initials="JR"/>},
    ],
    TimeAgo: [
        {label: "Various times", node: () => <div style={col}>
            <div><TimeAgo timestamp={new Date(Date.now() - 30 * 1000)}/></div>
            <div><TimeAgo timestamp={new Date(Date.now() - 5 * 60000)}/></div>
            <div><TimeAgo timestamp={new Date(Date.now() - 3 * 3600000)}/></div>
            <div><TimeAgo timestamp={new Date(Date.now() - 2 * 86400000)}/></div>
        </div>},
    ],
    Divider: [
        {label: "Horizontal", node: () => <div>Above<Divider/>Below</div>},
        {label: "Vertical", node: () => <div style={{display: "flex", height: "2em", alignItems: "center"}}>Left<Divider orientation="vertical"/>Right</div>},
    ],
    Tabs: [
        {label: "Default", node: () => <Tabs tabs={[
            {key: "overview", label: "Overview", content: "High-level summary content goes here."},
            {key: "team", label: "Team Members", content: "Manage who has access to this project."},
            {key: "billing", label: "Billing & Invoices", content: "Payment history and upcoming charges."},
            {key: "notifications", label: "Notification Settings", content: "Choose what you get notified about."},
            {key: "danger", label: "Danger Zone", content: "Irreversible and destructive actions."},
        ]}/>},
    ],
    Accordion: [
        {label: "Independent", node: () => <Accordion items={[{header: "Section one", content: "Content one.", defaultOpen: true}, {header: "Section two", content: "Content two."}]}/>},
        {label: "Exclusive", node: () => <Accordion exclusive items={[{header: "Section one", content: "Content one.", defaultOpen: true}, {header: "Section two", content: "Content two."}]}/>},
    ],
    Tag: [
        {label: "Types", node: () => <div style={row}>
            <Tag type="primary">primary</Tag>
            <Tag type="secondary">secondary</Tag>
            <Tag type="warning">warning</Tag>
            <Tag type="danger">danger</Tag>
            <Tag type="neutral">neutral</Tag>
        </div>},
        {label: "Removable", node: () => <Tag type="primary" onRemove={() => {}}>removable</Tag>},
    ],
    Collapse: [
        {label: "Default", node: () => <Collapse header="Click to expand">Hidden content revealed on expand.</Collapse>},
    ],
    Statistic: [
        {label: "Examples", node: () => <div style={row}>
            <Statistic title="Active users" value={1284}/>
            <Statistic title="Revenue" value="12,480" prefix="$"/>
            <Statistic title="Uptime" value="99.98" suffix="%"/>
        </div>},
    ],
    List: [
        {label: "Default", node: () => <List items={[
            {key: "1", leading: <Avatar initials="JR"/>, title: "Jamie Rivera", description: "jamie@example.com"},
            {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com"},
        ]}/>},
        {label: "Zebra striping, hover highlight, and per-item links (click a name)", node: () => <List
            zebra
            highlightOnHover
            items={[
                {key: "1", leading: <Avatar initials="JR"/>, title: "Jamie Rivera", description: "jamie@example.com", href: "#jamie-rivera"},
                {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com", href: "#alex-baker"},
                {key: "3", leading: <Avatar initials="CD"/>, title: "Casey Diaz", description: "casey@example.com", href: "#casey-diaz"},
            ]}/>},
    ],
    Timeline: [
        {label: "Default", node: () => <Timeline items={[
            {key: "1", title: "Order placed", type: "secondary"},
            {key: "2", title: "Shipped", type: "primary"},
            {key: "3", title: "Delivered"},
        ]}/>},
    ],
    AspectRatio: [
        {label: "16:9", node: () => <AspectRatio ratio={16 / 9} style={{maxWidth: "280px"}}>
            <div style={{background: "var(--primary-3)", display: "flex", alignItems: "center", justifyContent: "center"}}>16:9</div>
        </AspectRatio>},
    ],
    ScrollArea: [
        {label: "Default", node: () => <ScrollArea maxHeight="8em" style={{maxWidth: "260px", border: "1px solid var(--background-4)", borderRadius: "0.25rem", padding: "8px"}}>
            {Array.from({length: 12}).map((_, i) => <div style={{padding: "4px 0"}}>Row {i + 1}</div>)}
        </ScrollArea>},
    ],
    Table: [
        {label: "Default", node: () => <Table
            columns={[
                {key: "name", header: "Name", render: (row: {name: string, role: string}) => row.name},
                {key: "role", header: "Role", render: (row: {name: string, role: string}) => row.role},
            ]}
            rows={[{name: "Jamie Rivera", role: "Engineer"}, {name: "Alex Baker", role: "Designer"}]}/>},
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
            ]}/>},
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
            ]}/>},
    ],
    Carousel: [
        {label: "Default", node: () => <Carousel slides={[
            <div style={{padding: "2.5em", textAlign: "center", background: "var(--primary-3)"}}>Slide 1</div>,
            <div style={{padding: "2.5em", textAlign: "center", background: "var(--secondary-3)"}}>Slide 2</div>,
            <div style={{padding: "2.5em", textAlign: "center", background: "var(--warning-3)"}}>Slide 3</div>,
        ]}/>},
        {label: "Autoplay (stops once you click prev/next/a dot)", node: () => <Carousel
            autoplay
            autoplayFirstDelay={1500}
            autoplayDelay={2000}
            slides={[
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--primary-3)"}}>Slide 1</div>,
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--secondary-3)"}}>Slide 2</div>,
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--warning-3)"}}>Slide 3</div>,
            ]}/>},
    ],
    Calendar: [
        {label: "Default (pick a day)", node: () => <CalendarDemo/>},
    ],
    CalendarRange: [
        {label: "Default (pick a start, then an end)", node: () => <CalendarRangeDemo/>},
    ],
    Tree: [
        {label: "Default", node: () => <Tree nodes={[
            {key: "src", label: "src", defaultOpen: true, children: [
                {key: "components", label: "components", children: [{key: "button", label: "button.tsx"}]},
                {key: "index", label: "index.ts"},
            ]},
            {key: "readme", label: "readme.md"},
        ]}/>},
    ],

    // --- Data Entry ---
    DatePicker: [
        {label: "Default", node: () => <DatePicker value="2026-01-15"/>},
        {label: "Disabled", node: () => <DatePicker value="2026-01-15" disabled/>},
    ],
    DateTimePicker: [
        {label: "Default", node: () => <DateTimePicker value="2026-01-15T09:30"/>},
        {label: "Disabled", node: () => <DateTimePicker value="2026-01-15T09:30" disabled/>},
    ],
    DateTimeRangePicker: [
        {label: "Default", node: () => <DateTimeRangePicker value={{start: "2026-01-15T09:30", end: "2026-01-17T17:00"}} onChange={() => {}}/>},
    ],
    Slider: [
        {label: "Values", node: () => <div style={col}>
            <Slider value={20} style={{width: "12em"}}/>
            <Slider value={60} style={{width: "12em"}}/>
            <Slider value={90} style={{width: "12em"}}/>
        </div>},
    ],
    InputNumber: [
        {label: "Default", node: () => <InputNumber value={5}/>},
        {label: "With bounds", node: () => <InputNumber value={5} min={0} max={10} step={1}/>},
    ],
    ColorPicker: [
        {label: "Values", node: () => <div style={row}><ColorPicker value="#66b2ff"/><ColorPicker value="#c6ff9e"/><ColorPicker value="#ff6666"/></div>},
    ],
    Combobox: [
        {label: "Default (44 options - try typing to search)", node: () => <Combobox placeholder="Choose a country" options={comboboxCountryOptions}/>},
    ],
    Upload: [
        {label: "Default", node: () => <Upload accept="image/*">Click or drag a file here</Upload>},
        {label: "Disabled", node: () => <Upload disabled>Disabled</Upload>},
    ],
    Rate: [
        {label: "Values", node: () => <div style={col}><Rate value={2}/><Rate value={4}/></div>},
        {label: "Types", node: () => <div style={col}>
            <Rate value={4} type="primary"/>
            <Rate value={4} type="secondary"/>
            <Rate value={4} type="warning"/>
            <Rate value={4} type="danger"/>
        </div>},
        {label: "Disabled", node: () => <Rate value={3} disabled/>},
    ],

    // --- Utility ---
    Icon: [
        {label: "Default", node: () => <I i="gear" style={{height: "2em"}}/>},
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
    props: propTables[story.name] ?? [],
    examples: examplesByName[story.name] ?? [],
}))

/** Display order for sidebar/nav groups */
export const groupOrder = ["Form", "Navigation", "Feedback", "Overlays", "Data Display", "Data Entry", "Utility"]

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
