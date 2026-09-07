import { stories } from "../../../tests/test_modules/explorer-schema.tsx"
import type { ComponentStory } from "../../../tests/test_modules/explorer-schema.tsx"

/** One row in a component's prop reference table */
export type PropDoc = {
    name: string
    type: string
    description: string
}

/** A `ComponentStory` (from the Explorer) augmented with showcase-only documentation */
export type ComponentDoc = ComponentStory & {
    /** URL-safe id, e.g. "context-menu" for "ContextMenu" */
    slug: string
    /** One-sentence summary shown at the top of the component's page */
    description: string
    /** Prop reference table rows */
    props: PropDoc[]
}

const descriptions: Record<string, string> = {
    // Form
    Button: "A clickable action trigger with themed color variants and an optional loading state.",
    RadioButton: "A single option in a mutually-exclusive group, wrapping a native radio input.",
    Checkbox: "A tri-state (checked/unchecked/indeterminate) toggle, wrapping a native checkbox input.",
    Toggle: "A switch-style boolean control, wrapping a native checkbox input styled as a track and thumb.",
    TextBox: "A single-line text input supporting text, email, phone, and password variants.",
    Textarea: "A multi-line text input with a configurable row count and resize behavior.",
    Select: "A themed dropdown for choosing one of a fixed set of options, wrapping a native select.",
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
    Carousel: "A single-slide-at-a-time carousel with prev/next arrows and optional dot indicators.",
    Calendar: "A month-grid date picker with prev/next month navigation and a selectable day.",
    Tree: "A hierarchical, expandable/collapsible list built on nested native details/summary pairs.",
    // Data Entry
    DatePicker: "A themed date input, wrapping a native <input type=\"date\">.",
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
        {name: "placeholder", type: "string", description: "Disabled first option shown until a value is chosen."},
        {name: "disabled", type: "boolean", description: "Disables the select."},
        {name: "required", type: "boolean", description: "Marks the field required in a <form>."},
        {name: "onChange", type: "(event) => void", description: "Change handler."},
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
    ],
    Link: [
        {name: "to", type: "string", description: "Target URL (required)."},
        {name: "children", type: "RenderableElements", description: "Link content."},
    ],
    Breadcrumbs: [
        {name: "items", type: "BreadcrumbItemType[]", description: "The trail of crumbs, root to current (required)."},
        {name: "separator", type: "RenderableElements", description: 'Content shown between crumbs (default: "/").'},
    ],
    Pagination: [
        {name: "page", type: "number", description: "Currently selected page, 1-indexed (required)."},
        {name: "totalPages", type: "number", description: "Total number of pages (required)."},
        {name: "onPageChange", type: "(page) => void", description: "Called with the newly selected page (required)."},
        {name: "siblingCount", type: "number", description: "Pages shown on each side of the current page (default: 2)."},
    ],
    Navbar: [
        {name: "brand", type: "RenderableElements", description: "Content shown on the left."},
        {name: "children", type: "RenderableElements", description: "Typically a row of NavLinks."},
    ],
    Sidebar: [
        {name: "items", type: "SidebarItemType[]", description: "The entries to list (required)."},
        {name: "header", type: "RenderableElements", description: "Content shown above the list."},
    ],
    Menu: [
        {name: "trigger", type: "RenderableElements", description: "Content that opens the menu when clicked (required)."},
        {name: "items", type: "MenuItemType[]", description: "The entries to show (required)."},
    ],
    Steps: [
        {name: "steps", type: "StepType[]", description: "The steps, in order (required)."},
        {name: "current", type: "number", description: "0-indexed position of the current step (required)."},
    ],
    Alert: [
        {name: "type", type: '"info" | "success" | "warning" | "danger"', description: "Sets the color (default: info)."},
        {name: "title", type: "RenderableElements", description: "Optional title shown above the body."},
        {name: "onDismiss", type: "() => void", description: "If set, shows a dismiss button."},
        {name: "children", type: "RenderableElements", description: "Body content."},
    ],
    Toast: [
        {name: "showToast(message, options)", type: "function", description: "Imperative call - not placed in your JSX tree."},
        {name: "options.type", type: '"info" | "success" | "warning" | "danger"', description: "Sets the color (default: info)."},
        {name: "options.duration", type: "number", description: "Milliseconds before auto-dismiss; 0 disables it (default: 4000)."},
    ],
    Tooltip: [
        {name: "content", type: "RenderableElements", description: "Content shown inside the bubble (required)."},
        {name: "placement", type: '"top" | "bottom" | "left" | "right"', description: "Side of the trigger to show the bubble on (default: top)."},
        {name: "children", type: "RenderableElements", description: "The trigger."},
    ],
    Spinner: [
        {name: "size", type: "string", description: 'CSS size (default: "1em").'},
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
        {name: "title", type: "RenderableElements", description: 'Main message (default: "No data").'},
        {name: "description", type: "RenderableElements", description: "Smaller supporting text."},
        {name: "children", type: "RenderableElements", description: "A follow-up action, e.g. a Button."},
    ],
    Modal: [
        {name: "title", type: "RenderableElements", description: "Title content (required)."},
        {name: "confirmButtonChildren", type: "RenderableElements", description: "Confirm button content (required)."},
        {name: "cancelButtonChildren", type: "RenderableElements", description: 'Cancel button content (default: "cancel").'},
        {name: "confirmButtonOnClick", type: "(doneLoading) => void", description: "Called when confirm is clicked."},
        {name: "startConfirmDisabled", type: "boolean", description: "Starts the confirm button disabled."},
        {name: "showModal() / close()", type: "method", description: "Imperative open/close (the <dialog>'s own native methods)."},
    ],
    Drawer: [
        {name: "title", type: "RenderableElements", description: "Title content."},
        {name: "placement", type: '"left" | "right" | "top" | "bottom"', description: "Edge to slide in from (default: right)."},
        {name: "children", type: "RenderableElements", description: "Body content."},
        {name: "showModal() / close()", type: "method", description: "Imperative open/close."},
    ],
    Popover: [
        {name: "trigger", type: "RenderableElements", description: "Content that opens the popover when clicked (required) - can be a real Button."},
        {name: "content", type: "RenderableElements", description: "Content shown inside the bubble (required)."},
        {name: "placement", type: '"top" | "bottom" | "left" | "right"', description: "Side of the trigger (default: bottom)."},
    ],
    Popconfirm: [
        {name: "title", type: "RenderableElements", description: "Confirmation message (required)."},
        {name: "onConfirm", type: "() => void", description: "Called when confirmed (required)."},
        {name: "confirmButtonChildren / cancelButtonChildren", type: "RenderableElements", description: 'Defaults: "Confirm" / "Cancel".'},
        {name: "children", type: "RenderableElements", description: "The trigger, typically a Button."},
    ],
    ContextMenu: [
        {name: "items", type: "ContextMenuItemType[]", description: "The entries to show (required)."},
        {name: "children", type: "RenderableElements", description: "The area that opens the menu on right-click."},
    ],
    Command: [
        {name: "items", type: "CommandItemType[]", description: "The full set of items, filtered client-side (required)."},
        {name: "placeholder", type: "string", description: "Placeholder for the search input."},
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
        {name: "items", type: "ListItemType[]", description: "The entries to show (required) - each with title, description, leading, trailing."},
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
    Carousel: [
        {name: "slides", type: "RenderableElements[]", description: "The slides to cycle through (required)."},
        {name: "showDots", type: "boolean", description: "Shows numbered dot indicators (default: true)."},
    ],
    Calendar: [
        {name: "value", type: "Date", description: "Currently selected date."},
        {name: "onSelectDate", type: "(date) => void", description: "Called when a day cell is clicked."},
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
        {name: "disabled", type: "boolean", description: "Disables the control."},
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
