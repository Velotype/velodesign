import { getComponent, RenderBasic } from "@velotype/velotype"
import type { RenderableElements } from "@velotype/velotype"

import {
    CodeBlock, type CodeLanguage,
    TableOfContents,
    Accordion,
    addLicense,
    Alert, type AlertType,
    AspectRatio,
    Avatar,
    Badge, type BadgeType,
    Breadcrumbs,
    Button, type ButtonType,
    ButtonGroup,
    ButtonModal,
    Calendar,
    CalendarRange,
    Card,
    Carousel,
    Checkbox,
    Collapse,
    ColorPicker,
    Combobox,
    Command,
    ContextMenu,
    DatePicker,
    DateTimePicker,
    DateTimeRangePicker,
    Divider,
    Drawer,
    Empty,
    Form,
    FormField,
    I, Icon, registerIcon,
    InputNumber,
    Link,
    List,
    Menu,
    Navbar,
    NavLink,
    Pagination,
    Popconfirm,
    Popover, type PopoverPlacement,
    Progress, type ProgressType,
    RadioButton,
    Rate, type RateType,
    Resizable,
    ScrollArea,
    Select,
    SelectMenu,
    showToast, type ToastType,
    Sidebar,
    Skeleton,
    Slider,
    Spinner,
    Statistic,
    Steps,
    Table,
    DataTable,
    AsyncDataTable,
    Heading,
    Text,
    Paragraph,
    Stack,
    Grid,
    LineChart,
    AreaChart,
    BarChart,
    PieChart,
    Gauge,
    Sparkline,
    Tabs,
    Tag, type TagType,
    TextBox, type TextBoxTypeType,
    Textarea,
    TextEditableField,
    TextFormField,
    TextNonEditableField,
    TimeAgo,
    Timeline,
    Toggle,
    Tooltip, type TooltipPlacement,
    Tree,
    Upload,
} from "../../src/index.ts"

/** A single editable control shown in the Explorer's Controls panel */
export type ControlDef =
    | {kind: "text"; label: string}
    | {kind: "number"; label: string}
    | {kind: "boolean"; label: string}
    | {kind: "select"; label: string; options: string[]}

/** One browsable component in the Explorer, analogous to a Storybook "story" */
export type ComponentStory = {
    /** Display name, and the value used in `?story=` deep links */
    name: string
    /** Sidebar section this story is grouped under */
    group: string
    /** Starting values for every control (and any other attrs `render` reads) */
    defaultAttrs: Record<string, unknown>
    /** Only genuinely scalar attrs get controls - arrays/objects/callbacks stay fixed in `render` */
    controls: Record<string, ControlDef>
    /**
     * Builds the live preview from the current attrs. `setAttr` lets a story handle its own
     * internal interaction (e.g. Pagination's page buttons) through the same update path as
     * the Controls panel, so both stay in sync.
     */
    render: (attrs: Record<string, unknown>, setAttr: (key: string, value: unknown) => void) => RenderableElements
}

addLicense("font-awesome", `// Icon font SVG paths provided by Font Awesome
Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com
License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
Copyright 2024 Fonticons, Inc.`)
registerIcon("gear", new Icon(512, 512, "M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"))

const textFormFieldValue = new RenderBasic<string>("editable value")
const textEditableFieldValue = new RenderBasic<string>("click edit to change me")

const comboboxCountryOptions = [
    "Argentina", "Australia", "Austria", "Belgium", "Brazil", "Canada", "Chile", "China", "Colombia",
    "Denmark", "Egypt", "Finland", "France", "Germany", "Greece", "India", "Indonesia", "Ireland",
    "Israel", "Italy", "Japan", "Kenya", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand",
    "Nigeria", "Norway", "Peru", "Philippines", "Poland", "Portugal", "Singapore", "South Africa",
    "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine",
    "United Kingdom", "United States", "Vietnam",
].map(name => ({value: name}))
const commandLastPicked = new RenderBasic<string>("none")

const chartMonths = [
    {label: "Jan", values: {revenue: 12, costs: 8}},
    {label: "Feb", values: {revenue: 19, costs: 11}},
    {label: "Mar", values: {revenue: 15, costs: 10}},
    {label: "Apr", values: {revenue: 27, costs: 15}},
    {label: "May", values: {revenue: 24, costs: 14}},
    {label: "Jun", values: {revenue: 31, costs: 17}},
]
const chartSeries = [{key: "revenue", label: "Revenue"}, {key: "costs", label: "Costs"}]
const chartShare = [
    {label: "Platform", value: 24}, {label: "Growth", value: 18},
    {label: "Infra", value: 12}, {label: "Design", value: 7},
]

export const stories: ComponentStory[] = [
    // --- Form ---
    {
        name: "Button", group: "Form",
        defaultAttrs: {type: "primary", disabled: false, loadingOnClick: false, children: "Example button"},
        controls: {
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger", "text"]},
            disabled: {kind: "boolean", label: "disabled"},
            loadingOnClick: {kind: "boolean", label: "loadingOnClick"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <Button
            type={attrs.type as ButtonType}
            disabled={attrs.disabled as boolean}
            loadingOnClick={attrs.loadingOnClick as boolean}
            onClick={(_event, doneLoading) => { if (doneLoading) { globalThis.setTimeout(doneLoading, 1200) } }}>{attrs.children as string}</Button>,
    },
    {
        name: "ButtonGroup", group: "Form",
        defaultAttrs: {orientation: "horizontal"},
        controls: {
            orientation: {kind: "select", label: "orientation", options: ["horizontal", "vertical"]},
        },
        render: (attrs) => <ButtonGroup orientation={attrs.orientation as "horizontal" | "vertical"}>
            <Button type="secondary">Left</Button>
            <Button type="secondary">Middle</Button>
            <Button type="secondary">Right</Button>
        </ButtonGroup>,
    },
    {
        name: "RadioButton", group: "Form",
        defaultAttrs: {checked: false, disabled: false, children: "Option"},
        controls: {
            checked: {kind: "boolean", label: "checked"},
            disabled: {kind: "boolean", label: "disabled"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <RadioButton name="explorer-radio" checked={attrs.checked as boolean} disabled={attrs.disabled as boolean}>{attrs.children as string}</RadioButton>,
    },
    {
        name: "Checkbox", group: "Form",
        defaultAttrs: {checked: false, disabled: false, indeterminate: false, children: "Checkbox label"},
        controls: {
            checked: {kind: "boolean", label: "checked"},
            disabled: {kind: "boolean", label: "disabled"},
            indeterminate: {kind: "boolean", label: "indeterminate"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <Checkbox checked={attrs.checked as boolean} disabled={attrs.disabled as boolean} indeterminate={attrs.indeterminate as boolean}>{attrs.children as string}</Checkbox>,
    },
    {
        name: "Toggle", group: "Form",
        defaultAttrs: {checked: false, disabled: false, children: "Toggle label"},
        controls: {
            checked: {kind: "boolean", label: "checked"},
            disabled: {kind: "boolean", label: "disabled"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <Toggle checked={attrs.checked as boolean} disabled={attrs.disabled as boolean}>{attrs.children as string}</Toggle>,
    },
    {
        name: "TextBox", group: "Form",
        defaultAttrs: {type: "text", placeholder: "Type something...", required: false},
        controls: {
            type: {kind: "select", label: "type", options: ["text", "email", "phone", "password", "new-password"]},
            placeholder: {kind: "text", label: "placeholder"},
            required: {kind: "boolean", label: "required"},
        },
        render: (attrs) => <TextBox type={attrs.type as TextBoxTypeType} placeholder={attrs.placeholder as string} required={attrs.required as boolean}/>,
    },
    {
        name: "Textarea", group: "Form",
        defaultAttrs: {placeholder: "Type something...", rows: 3, required: false, resize: "vertical"},
        controls: {
            placeholder: {kind: "text", label: "placeholder"},
            rows: {kind: "number", label: "rows"},
            resize: {kind: "select", label: "resize", options: ["none", "vertical", "horizontal", "both"]},
            required: {kind: "boolean", label: "required"},
        },
        render: (attrs) => <Textarea placeholder={attrs.placeholder as string} rows={attrs.rows as number} resize={attrs.resize as "none" | "vertical" | "horizontal" | "both"} required={attrs.required as boolean}/>,
    },
    {
        name: "Select", group: "Form",
        defaultAttrs: {value: "a", placeholder: "Choose one", placeholderDisabled: false, disabled: false, required: false},
        controls: {
            value: {kind: "select", label: "value", options: ["a", "b", "c"]},
            placeholder: {kind: "text", label: "placeholder"},
            placeholderDisabled: {kind: "boolean", label: "placeholderDisabled"},
            disabled: {kind: "boolean", label: "disabled"},
            required: {kind: "boolean", label: "required"},
        },
        render: (attrs) => <Select
            options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}, {value: "c", label: "Option C"}]}
            value={attrs.value as string}
            placeholder={attrs.placeholder as string}
            placeholderDisabled={attrs.placeholderDisabled as boolean}
            disabled={attrs.disabled as boolean}
            required={attrs.required as boolean}/>,
    },
    {
        name: "SelectMenu", group: "Form",
        defaultAttrs: {value: "a", placeholder: "Assign to...", disabled: false},
        controls: {
            value: {kind: "select", label: "value", options: ["a", "b", "c"]},
            placeholder: {kind: "text", label: "placeholder"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs) => <SelectMenu<{id: string, name: string}>
            options={[{id: "a", name: "Jamie Rivera"}, {id: "b", name: "Alex Baker"}, {id: "c", name: "Casey Diaz"}]}
            getValue={option => option.id}
            renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.5em"}}><Avatar initials={option.name[0]} size="1.5em"/>{option.name}</span>}
            value={attrs.value as string}
            placeholder={attrs.placeholder as string}
            disabled={attrs.disabled as boolean}/>,
    },
    {
        name: "TextNonEditableField", group: "Form",
        defaultAttrs: {value: "example value", children: "Label:"},
        controls: {
            value: {kind: "text", label: "value"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <TextNonEditableField value={attrs.value as string}>{attrs.children as string}</TextNonEditableField>,
    },
    {
        name: "TextFormField", group: "Form",
        defaultAttrs: {type: "text", required: false, children: "Label:"},
        controls: {
            type: {kind: "select", label: "type", options: ["text", "email", "phone", "password", "new-password"]},
            required: {kind: "boolean", label: "required"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <TextFormField type={attrs.type as TextBoxTypeType} required={attrs.required as boolean} field={textFormFieldValue}>{attrs.children as string}</TextFormField>,
    },
    {
        name: "TextEditableField", group: "Form",
        defaultAttrs: {type: "text", children: "Label:"},
        controls: {
            type: {kind: "select", label: "type", options: ["text", "email", "phone", "password", "new-password"]},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <TextEditableField type={attrs.type as TextBoxTypeType} field={textEditableFieldValue}>{attrs.children as string}</TextEditableField>,
    },

    // --- Navigation ---
    {
        name: "NavLink", group: "Navigation",
        defaultAttrs: {to: "/", exact: true, children: "Home"},
        controls: {
            to: {kind: "text", label: "to"},
            exact: {kind: "boolean", label: "exact"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <NavLink to={attrs.to as string} exact={attrs.exact as boolean} spa>{attrs.children as string}</NavLink>,
    },
    {
        name: "Link", group: "Navigation",
        defaultAttrs: {to: "/somewhere", children: "Click me"},
        controls: {
            to: {kind: "text", label: "to"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <Link to={attrs.to as string} spa>{attrs.children as string}</Link>,
    },
    {
        name: "Breadcrumbs", group: "Navigation",
        defaultAttrs: {separator: "/"},
        controls: {
            separator: {kind: "text", label: "separator"},
        },
        render: (attrs) => <Breadcrumbs
            spa
            separator={attrs.separator as string}
            items={[{label: "Home", to: "/"}, {label: "Library", to: "/library"}, {label: "Current page"}]}/>,
    },
    {
        name: "Pagination", group: "Navigation",
        defaultAttrs: {page: 1, totalPages: 10, siblingCount: 2},
        controls: {
            totalPages: {kind: "number", label: "totalPages"},
            siblingCount: {kind: "number", label: "siblingCount"},
        },
        render: (attrs, setAttr) => <Pagination
            page={attrs.page as number}
            totalPages={attrs.totalPages as number}
            siblingCount={attrs.siblingCount as number}
            onPageChange={(page) => setAttr("page", page)}/>,
    },
    {
        name: "Navbar", group: "Navigation",
        defaultAttrs: {brand: "My App"},
        controls: {
            brand: {kind: "text", label: "brand"},
        },
        render: (attrs) => <Navbar brand={attrs.brand as string}>
            <NavLink to="/" spa>Home</NavLink>
            <NavLink to="/docs" spa>Docs</NavLink>
        </Navbar>,
    },
    {
        name: "Sidebar", group: "Navigation",
        defaultAttrs: {header: "Sections"},
        controls: {
            header: {kind: "text", label: "header"},
        },
        render: (attrs) => <Sidebar
            spa
            header={attrs.header as string}
            items={[{label: "Overview", to: "/"}, {label: "Settings", to: "/settings"}]}/>,
    },
    {
        name: "TableOfContents", group: "Navigation",
        defaultAttrs: {header: "On this page", topOffset: 0},
        controls: {
            header: {kind: "text", label: "header"},
            topOffset: {kind: "number", label: "topOffset"},
        },
        // Renders its own targets: the component observes real elements by id, so a story with
        // nothing to point at would show a list that never highlights
        render: (attrs) => <div style={{display: "flex", gap: "1.5em", alignItems: "flex-start"}}>
            <div style={{flexGrow: 1, minWidth: 0}}>
                {[["toc-story-one", "Getting started", 2], ["toc-story-two", "Configuration", 2], ["toc-story-three", "Options", 3]].map(
                    ([id, label]) => <div>
                        <Heading id={id as string} level={3}>{label as string}</Heading>
                        <Paragraph>Section content for {label as string}.</Paragraph>
                    </div>)}
            </div>
            <div style={{width: "12em", flexShrink: 0}}>
                <TableOfContents
                    header={attrs.header as string}
                    topOffset={attrs.topOffset as number}
                    ariaLabel="On this page"
                    items={[
                        {id: "toc-story-one", label: "Getting started", level: 1},
                        {id: "toc-story-two", label: "Configuration", level: 1},
                        {id: "toc-story-three", label: "Options", level: 2},
                    ]}/>
            </div>
        </div>,
    },
    {
        name: "Menu", group: "Navigation",
        defaultAttrs: {trigger: "Actions", clicks: 0, closeOnOutsideClick: true},
        controls: {
            trigger: {kind: "text", label: "trigger"},
            closeOnOutsideClick: {kind: "boolean", label: "closeOnOutsideClick"},
        },
        render: (attrs, setAttr) => {
            const clicks = attrs.clicks as number
            return <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                <Menu trigger={attrs.trigger as string} closeOnOutsideClick={attrs.closeOnOutsideClick as boolean} items={[
                    {label: "Do a thing", onClick: () => setAttr("clicks", clicks + 1)},
                    {label: "Disabled", disabled: true},
                ]}/>
                <span>clicked {clicks} times</span>
            </div>
        },
    },

    // --- Feedback ---
    {
        name: "Alert", group: "Feedback",
        defaultAttrs: {type: "info", title: "Heads up", children: "This is an alert message.", dismissible: false},
        controls: {
            type: {kind: "select", label: "type", options: ["info", "success", "warning", "danger"]},
            title: {kind: "text", label: "title"},
            children: {kind: "text", label: "children"},
            dismissible: {kind: "boolean", label: "dismissible"},
        },
        render: (attrs) => <Alert
            type={attrs.type as AlertType}
            title={attrs.title as string}
            onDismiss={attrs.dismissible ? () => {} : undefined}>{attrs.children as string}</Alert>,
    },
    {
        name: "Toast", group: "Feedback",
        defaultAttrs: {type: "info", message: "Hello from the Explorer", duration: 4000},
        controls: {
            type: {kind: "select", label: "type", options: ["info", "success", "warning", "danger"]},
            message: {kind: "text", label: "message"},
            duration: {kind: "number", label: "duration"},
        },
        render: (attrs) => <Button
            type="secondary"
            onClick={() => showToast(attrs.message as string, {type: attrs.type as ToastType, duration: attrs.duration as number})}>Show toast</Button>,
    },
    {
        name: "Tooltip", group: "Feedback",
        defaultAttrs: {content: "More info", placement: "top", children: "Hover me"},
        controls: {
            content: {kind: "text", label: "content"},
            placement: {kind: "select", label: "placement", options: ["top", "bottom", "left", "right"]},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <Tooltip content={attrs.content as string} placement={attrs.placement as TooltipPlacement}>
            <span style={{padding: "0.5em 1em", border: "1px dashed var(--background-5)", borderRadius: "0.25rem", display: "inline-block"}}>{attrs.children as string}</span>
        </Tooltip>,
    },
    {
        name: "Spinner", group: "Feedback",
        defaultAttrs: {size: "2em"},
        controls: {
            size: {kind: "text", label: "size"},
        },
        render: (attrs) => <Spinner size={attrs.size as string}/>,
    },

    // --- Overlays ---
    {
        name: "Modal", group: "Overlays",
        defaultAttrs: {openButtonText: "Open modal", title: "Confirm action", confirmButtonChildren: "Confirm", cancelButtonChildren: "Cancel", startConfirmDisabled: false},
        controls: {
            openButtonText: {kind: "text", label: "openButtonText"},
            title: {kind: "text", label: "modalAttrs.title"},
            confirmButtonChildren: {kind: "text", label: "modalAttrs.confirmButtonChildren"},
            cancelButtonChildren: {kind: "text", label: "modalAttrs.cancelButtonChildren"},
            startConfirmDisabled: {kind: "boolean", label: "modalAttrs.startConfirmDisabled"},
        },
        render: (attrs) => <ButtonModal
            openButtonText={attrs.openButtonText as string}
            modalAttrs={{
                title: attrs.title as string,
                confirmButtonChildren: attrs.confirmButtonChildren as string,
                cancelButtonChildren: attrs.cancelButtonChildren as string,
                startConfirmDisabled: attrs.startConfirmDisabled as boolean,
                confirmButtonOnClick: (doneLoading) => { globalThis.setTimeout(doneLoading, 600) },
            }}>Modal body content goes here.</ButtonModal>,
    },

    // --- Data Display ---
    {
        name: "Badge", group: "Data Display",
        defaultAttrs: {type: "primary", children: "Badge"},
        controls: {
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger", "neutral"]},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <Badge type={attrs.type as BadgeType}>{attrs.children as string}</Badge>,
    },
    {
        name: "Card", group: "Data Display",
        defaultAttrs: {header: "Card title", footer: "Footer actions", children: "Some card body content."},
        controls: {
            header: {kind: "text", label: "header"},
            footer: {kind: "text", label: "footer"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <Card header={attrs.header as string} footer={attrs.footer as string}>{attrs.children as string}</Card>,
    },
    {
        name: "CodeBlock", group: "Data Display",
        defaultAttrs: {
            code: 'const total = items.length\nreturn <Badge type="primary">{total} open</Badge>',
            language: "tsx", showLineNumbers: false, wrap: false,
        },
        controls: {
            code: {kind: "text", label: "code"},
            language: {kind: "select", label: "language", options: ["tsx", "css", "plain"]},
            showLineNumbers: {kind: "boolean", label: "showLineNumbers"},
            wrap: {kind: "boolean", label: "wrap"},
        },
        render: (attrs) => <CodeBlock
            code={attrs.code as string}
            language={attrs.language as CodeLanguage}
            showLineNumbers={attrs.showLineNumbers as boolean}
            wrap={attrs.wrap as boolean}
            ariaLabel="Example source"/>,
    },
    {
        name: "Avatar", group: "Data Display",
        defaultAttrs: {initials: "JR", src: "", size: "2.5em"},
        controls: {
            initials: {kind: "text", label: "initials"},
            src: {kind: "text", label: "src"},
            size: {kind: "text", label: "size"},
        },
        render: (attrs) => <Avatar initials={attrs.initials as string} src={(attrs.src as string) || undefined} size={attrs.size as string}/>,
    },
    {
        name: "TimeAgo", group: "Data Display",
        defaultAttrs: {minutesAgo: 5, numeric: "always", timestyle: "long"},
        controls: {
            minutesAgo: {kind: "number", label: "minutesAgo"},
            numeric: {kind: "select", label: "numeric", options: ["always", "auto"]},
            timestyle: {kind: "select", label: "timestyle", options: ["long", "short", "narrow"]},
        },
        render: (attrs) => <TimeAgo
            timestamp={new Date(Date.now() - (attrs.minutesAgo as number) * 60000)}
            numeric={attrs.numeric as "always" | "auto"}
            timestyle={attrs.timestyle as "long" | "short" | "narrow"}/>,
    },
    {
        name: "Divider", group: "Data Display",
        defaultAttrs: {orientation: "horizontal"},
        controls: {
            orientation: {kind: "select", label: "orientation", options: ["horizontal", "vertical"]},
        },
        render: (attrs) => {
            const orientation = attrs.orientation as "horizontal" | "vertical"
            if (orientation === "vertical") {
                return <div style={{display: "flex", height: "3em", alignItems: "center"}}>Left<Divider orientation="vertical"/>Right</div>
            }
            return <div>Above<Divider orientation="horizontal"/>Below</div>
        },
    },
    {
        name: "Tabs", group: "Data Display",
        defaultAttrs: {initialKey: "a"},
        controls: {
            initialKey: {kind: "select", label: "initialKey", options: ["a", "b", "c"]},
        },
        render: (attrs) => <Tabs
            initialKey={attrs.initialKey as string}
            tabs={[{key: "a", label: "A", content: "Panel A content."}, {key: "b", label: "B", content: "Panel B content."}, {key: "c", label: "C", content: "Panel C content."}]}/>,
    },
    {
        name: "Accordion", group: "Data Display",
        defaultAttrs: {exclusive: true},
        controls: {
            exclusive: {kind: "boolean", label: "exclusive"},
        },
        render: (attrs) => <Accordion
            exclusive={attrs.exclusive as boolean}
            items={[
                {header: "Section one", content: "Content one.", defaultOpen: true},
                {header: "Section two", content: "Content two."},
                {header: "Section three", content: "Content three."},
            ]}/>,
    },

    // --- Data Entry ---
    {
        name: "DatePicker", group: "Data Entry",
        defaultAttrs: {value: "2026-01-15", disabled: false},
        controls: {
            value: {kind: "text", label: "value"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs) => <DatePicker value={attrs.value as string} disabled={attrs.disabled as boolean}/>,
    },
    {
        name: "DateTimePicker", group: "Data Entry",
        defaultAttrs: {value: "2026-01-15T09:30", disabled: false},
        controls: {
            value: {kind: "text", label: "value"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs) => <DateTimePicker value={attrs.value as string} disabled={attrs.disabled as boolean}/>,
    },
    {
        name: "DateTimeRangePicker", group: "Data Entry",
        defaultAttrs: {start: "2026-01-15T09:30", end: "2026-01-17T17:00", disabled: false},
        controls: {
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs, setAttr) => <DateTimeRangePicker
            value={{start: attrs.start as string, end: attrs.end as string}}
            disabled={attrs.disabled as boolean}
            onChange={(range) => {
                setAttr("start", range.start ?? "")
                setAttr("end", range.end ?? "")
            }}/>,
    },
    {
        name: "Slider", group: "Data Entry",
        defaultAttrs: {value: 40, min: 0, max: 100, step: 1, disabled: false},
        controls: {
            min: {kind: "number", label: "min"},
            max: {kind: "number", label: "max"},
            step: {kind: "number", label: "step"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs, setAttr) => <Slider
            value={attrs.value as number}
            min={attrs.min as number}
            max={attrs.max as number}
            step={attrs.step as number}
            disabled={attrs.disabled as boolean}
            onInput={(event) => setAttr("value", Number((event.target as HTMLInputElement).value))}/>,
    },
    {
        name: "InputNumber", group: "Data Entry",
        defaultAttrs: {value: 5, disabled: false},
        controls: {
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs) => <InputNumber value={attrs.value as number} disabled={attrs.disabled as boolean}/>,
    },
    {
        name: "ColorPicker", group: "Data Entry",
        defaultAttrs: {value: "#66b2ff", disabled: false},
        controls: {
            value: {kind: "text", label: "value"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs) => <ColorPicker value={attrs.value as string} disabled={attrs.disabled as boolean}/>,
    },
    {
        name: "Combobox", group: "Data Entry",
        defaultAttrs: {placeholder: "Choose a country", disabled: false},
        controls: {
            placeholder: {kind: "text", label: "placeholder"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs) => <Combobox
            placeholder={attrs.placeholder as string}
            disabled={attrs.disabled as boolean}
            options={comboboxCountryOptions}/>,
    },
    {
        name: "Upload", group: "Data Entry",
        defaultAttrs: {disabled: false, children: "Click or drag a file here"},
        controls: {
            disabled: {kind: "boolean", label: "disabled"},
            children: {kind: "text", label: "children"},
        },
        render: (attrs) => <Upload disabled={attrs.disabled as boolean}>{attrs.children as string}</Upload>,
    },
    {
        name: "Rate", group: "Data Entry",
        defaultAttrs: {value: 3, count: 5, type: "warning", disabled: false},
        controls: {
            count: {kind: "number", label: "count"},
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger"]},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (attrs, setAttr) => <Rate
            value={attrs.value as number}
            count={attrs.count as number}
            type={attrs.type as RateType}
            disabled={attrs.disabled as boolean}
            onChange={(event) => setAttr("value", Number((event.target as HTMLInputElement).value))}/>,
    },
    {
        name: "Form", group: "Data Entry",
        defaultAttrs: {},
        controls: {},
        render: () => <Form onSubmit={() => {}}>
            <FormField label="Name" required><TextBox type="text"/></FormField>
            <FormField label="Email" error="Enter a valid email address"><TextBox type="email"/></FormField>
            <Button type="primary">Submit</Button>
        </Form>,
    },

    // --- Navigation ---
    {
        name: "Steps", group: "Navigation",
        defaultAttrs: {current: 1},
        controls: {
            current: {kind: "number", label: "current"},
        },
        render: (attrs) => <Steps
            current={attrs.current as number}
            steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>,
    },

    // --- Feedback ---
    {
        name: "Progress", group: "Feedback",
        defaultAttrs: {value: 65, type: "primary", showLabel: true},
        controls: {
            value: {kind: "number", label: "value"},
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger"]},
            showLabel: {kind: "boolean", label: "showLabel"},
        },
        render: (attrs) => <Progress value={attrs.value as number} type={attrs.type as ProgressType} showLabel={attrs.showLabel as boolean}/>,
    },
    {
        name: "Skeleton", group: "Feedback",
        defaultAttrs: {variant: "text", lines: 2},
        controls: {
            variant: {kind: "select", label: "variant", options: ["text", "circular", "rectangular"]},
            lines: {kind: "number", label: "lines"},
        },
        render: (attrs) => <Skeleton variant={attrs.variant as "text" | "circular" | "rectangular"} lines={attrs.lines as number}/>,
    },
    {
        name: "Empty", group: "Feedback",
        defaultAttrs: {title: "No data", description: "Try adjusting your filters"},
        controls: {
            title: {kind: "text", label: "title"},
            description: {kind: "text", label: "description"},
        },
        render: (attrs) => <Empty title={attrs.title as string} description={attrs.description as string}/>,
    },

    // --- Overlays ---
    {
        name: "Drawer", group: "Overlays",
        defaultAttrs: {title: "Settings", placement: "left", enterFrom: "left"},
        controls: {
            title: {kind: "text", label: "title"},
            placement: {kind: "select", label: "placement", options: ["left", "right", "top", "bottom"]},
            enterFrom: {kind: "select", label: "enterFrom", options: ["left", "right", "top", "bottom"]},
        },
        render: (attrs) => {
            const drawer = <Drawer
                title={attrs.title as string}
                placement={attrs.placement as "left" | "right" | "top" | "bottom"}
                enterFrom={attrs.enterFrom as "left" | "right" | "top" | "bottom"}>Drawer body content goes here.</Drawer>
            return <span style={{display: "contents"}}>{drawer}<Button type="secondary" onClick={() => drawer.showModal()}>Open drawer</Button></span>
        },
    },
    {
        name: "Popover", group: "Overlays",
        defaultAttrs: {content: "Rich popover content, shown on click.", placement: "bottom"},
        controls: {
            content: {kind: "text", label: "content"},
            placement: {kind: "select", label: "placement", options: ["top", "bottom", "left", "right"]},
        },
        render: (attrs) => <Popover
            trigger={<Button type="secondary">Click me</Button>}
            content={attrs.content as string}
            placement={attrs.placement as PopoverPlacement}/>,
    },
    {
        name: "Popconfirm", group: "Overlays",
        defaultAttrs: {title: "Delete this item?"},
        controls: {
            title: {kind: "text", label: "title"},
        },
        render: (attrs) => <Popconfirm title={attrs.title as string} onConfirm={() => {}}><Button type="danger">Delete</Button></Popconfirm>,
    },
    {
        name: "ContextMenu", group: "Overlays",
        defaultAttrs: {},
        controls: {},
        render: () => <ContextMenu items={[{label: "Copy", onClick: () => {}}, {label: "Paste", onClick: () => {}}, {label: "Delete", disabled: true}]}>
            <div style={{padding: "2em", border: "1px dashed var(--background-5)", borderRadius: "0.25rem"}}>Right-click here</div>
        </ContextMenu>,
    },
    {
        name: "Command", group: "Overlays",
        defaultAttrs: {},
        controls: {},
        render: () => {
            // getComponent gets the real Command instance - the JSX itself evaluates to the
            // raw <dialog> element, which has its own native showModal() under the same name
            // that would otherwise be silently called instead of Command's own (see the same
            // note in tests/test_modules/command.tsx).
            const command = getComponent<Command>(<Command placeholder="Search commands..." items={[
                {key: "new-file", label: "New file", searchText: "new file create", onSelect: () => { commandLastPicked.value = "New file" }},
                {key: "open-settings", label: "Open settings", searchText: "open settings preferences", onSelect: () => { commandLastPicked.value = "Open settings" }},
            ]}/>)
            return <span style={{display: "contents"}}>
                {command}
                <Button type="secondary" onClick={() => command.showModal()}>Open command palette</Button>
                <span style={{marginInlineStart: "1em"}}>Last picked: {commandLastPicked}</span>
            </span>
        },
    },

    // --- Data Display ---
    {
        name: "Tag", group: "Data Display",
        defaultAttrs: {type: "primary", children: "Tag", removable: false},
        controls: {
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger", "neutral"]},
            children: {kind: "text", label: "children"},
            removable: {kind: "boolean", label: "removable"},
        },
        render: (attrs) => <Tag type={attrs.type as TagType} onRemove={attrs.removable ? () => {} : undefined}>{attrs.children as string}</Tag>,
    },
    {
        name: "Collapse", group: "Data Display",
        defaultAttrs: {header: "Click to expand", defaultOpen: false},
        controls: {
            header: {kind: "text", label: "header"},
            defaultOpen: {kind: "boolean", label: "defaultOpen"},
        },
        render: (attrs) => <Collapse header={attrs.header as string} defaultOpen={attrs.defaultOpen as boolean}>Hidden content revealed on expand.</Collapse>,
    },
    {
        name: "Statistic", group: "Data Display",
        defaultAttrs: {title: "Active users", value: 1284, prefix: "", suffix: ""},
        controls: {
            title: {kind: "text", label: "title"},
            value: {kind: "text", label: "value"},
            prefix: {kind: "text", label: "prefix"},
            suffix: {kind: "text", label: "suffix"},
        },
        render: (attrs) => <Statistic title={attrs.title as string} value={attrs.value as string} prefix={(attrs.prefix as string) || undefined} suffix={(attrs.suffix as string) || undefined}/>,
    },
    {
        name: "List", group: "Data Display",
        defaultAttrs: {},
        controls: {},
        render: () => <List items={[
            {key: "1", leading: <Avatar initials="JR"/>, title: "Jamie Rivera", description: "jamie@example.com"},
            {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com"},
        ]}/>,
    },
    {
        name: "Timeline", group: "Data Display",
        defaultAttrs: {},
        controls: {},
        render: () => <Timeline items={[
            {key: "1", title: "Order placed", type: "secondary"},
            {key: "2", title: "Shipped", type: "primary"},
            {key: "3", title: "Delivered"},
        ]}/>,
    },
    {
        name: "AspectRatio", group: "Data Display",
        defaultAttrs: {ratio: 16 / 9},
        controls: {
            ratio: {kind: "number", label: "ratio"},
        },
        render: (attrs) => <AspectRatio ratio={attrs.ratio as number} style={{maxWidth: "320px"}}>
            <div style={{background: "var(--primary-3)", display: "flex", alignItems: "center", justifyContent: "center"}}>{(attrs.ratio as number).toFixed(2)}</div>
        </AspectRatio>,
    },
    {
        name: "ScrollArea", group: "Data Display",
        defaultAttrs: {maxHeight: "8em"},
        controls: {
            maxHeight: {kind: "text", label: "maxHeight"},
        },
        render: (attrs) => <ScrollArea maxHeight={attrs.maxHeight as string} style={{maxWidth: "260px", border: "1px solid var(--background-4)", borderRadius: "0.25rem", padding: "8px"}}>
            {Array.from({length: 20}).map((_, i) => <div style={{padding: "4px 0"}}>Row {i + 1}</div>)}
        </ScrollArea>,
    },
    {
        name: "Table", group: "Data Display",
        defaultAttrs: {},
        controls: {},
        render: () => <Table
            columns={[
                {key: "name", header: "Name", render: (row: {name: string, role: string}) => row.name},
                {key: "role", header: "Role", render: (row: {name: string, role: string}) => row.role},
            ]}
            rows={[{name: "Jamie Rivera", role: "Engineer"}, {name: "Alex Baker", role: "Designer"}]}/>,
    },
    {
        name: "DataTable", group: "Data Display",
        defaultAttrs: {},
        controls: {},
        render: () => <DataTable
            searchable
            pageSize={5}
            showPageSizeControl
            columnToggleChildren="Columns"
            columnToggleLabel="Choose columns"
            pageSizeLabel="Rows per page:"
            emptyMessage="No results"
            columns={[
                {key: "name", header: "Name", render: (row: {name: string, role: string, status: string}) => row.name, sortValue: (row) => row.name, filterValue: (row) => row.name, hideable: false},
                {key: "role", header: "Role", render: (row: {name: string, role: string, status: string}) => row.role, sortValue: (row) => row.role, filterValue: (row) => row.role},
                {key: "status", header: "Status", render: (row: {name: string, role: string, status: string}) => row.status, align: "end"},
            ]}
            rows={[
                {name: "Jamie Rivera", role: "Engineer", status: "active"},
                {name: "Alex Baker", role: "Designer", status: "active"},
                {name: "Casey Diaz", role: "Support", status: "inactive"},
                {name: "Morgan Lee", role: "Manager", status: "active"},
                {name: "Riley Chen", role: "Analyst", status: "active"},
                {name: "Jordan Smith", role: "Engineer", status: "inactive"},
            ]}/>,
    },
    {
        name: "AsyncDataTable", group: "Data Display",
        defaultAttrs: {},
        controls: {},
        render: () => <AsyncDataTable
            pageSize={3}
            showPageSizeControl
            pageSizeOptions={[3, 5, 10]}
            loadingLabel="Loading"
            searchPlaceholder="Search people"
            columnToggleChildren="Columns"
            columnToggleLabel="Choose columns"
            pageSizeLabel="Rows per page:"
            noMatchMessage="Nothing matched that search"
            columns={[
                {key: "name", header: "Name", render: (row: {name: string, role: string, status: string}) => row.name, sortable: true, hideable: false},
                {key: "role", header: "Role", render: (row: {name: string, role: string, status: string}) => row.role, sortable: true},
                {key: "status", header: "Status", render: (row: {name: string, role: string, status: string}) => row.status, align: "end"},
            ]}
            // Stands in for a server: the point of this component is that filtering, sorting and
            // paging happen *there*, so the story does that work in the loader rather than
            // handing the table an array to compute over.
            load={(query) => {
                const all = [
                    {name: "Jamie Rivera", role: "Engineer", status: "active"},
                    {name: "Alex Baker", role: "Designer", status: "active"},
                    {name: "Casey Diaz", role: "Support", status: "inactive"},
                    {name: "Morgan Lee", role: "Manager", status: "active"},
                    {name: "Riley Chen", role: "Analyst", status: "active"},
                    {name: "Jordan Smith", role: "Engineer", status: "inactive"},
                ]
                const needle = query.search.toLowerCase()
                let rows = needle ? all.filter(r => `${r.name} ${r.role} ${r.status}`.toLowerCase().includes(needle)) : all
                if (query.sortKey) {
                    const direction = query.sortDirection === "desc" ? -1 : 1
                    const key = query.sortKey as "name" | "role" | "status"
                    rows = [...rows].sort((a, b) => a[key] < b[key] ? -direction : (a[key] > b[key] ? direction : 0))
                }
                const start = (query.page - 1) * query.pageSize
                return new Promise(resolve => setTimeout(() => resolve({rows: rows.slice(start, start + query.pageSize), total: rows.length}), 200))
            }}/>,
    },
    {
        name: "LineChart", group: "Charts",
        defaultAttrs: {stacked: false, area: false, showDots: true},
        controls: {
            stacked: {kind: "boolean", label: "stacked"},
            area: {kind: "boolean", label: "area"},
            showDots: {kind: "boolean", label: "showDots"},
        },
        render: (attrs) => <LineChart
            data={chartMonths} series={chartSeries} height={220}
            ariaLabel="Revenue and costs by month"
            formatValue={(n: number) => `$${n}k`}
            stacked={attrs.stacked as boolean}
            area={attrs.area as boolean}
            showDots={attrs.showDots as boolean}/>,
    },
    {
        name: "AreaChart", group: "Charts",
        defaultAttrs: {stacked: true},
        controls: {stacked: {kind: "boolean", label: "stacked"}},
        render: (attrs) => <AreaChart
            data={chartMonths} series={chartSeries} height={220}
            ariaLabel="Revenue and costs by month"
            formatValue={(n: number) => `$${n}k`}
            stacked={attrs.stacked as boolean}/>,
    },
    {
        name: "BarChart", group: "Charts",
        defaultAttrs: {stacked: false, horizontal: false},
        controls: {
            stacked: {kind: "boolean", label: "stacked"},
            horizontal: {kind: "boolean", label: "horizontal"},
        },
        render: (attrs) => <BarChart
            data={chartMonths} series={chartSeries} height={220}
            ariaLabel="Revenue and costs by month"
            formatValue={(n: number) => `$${n}k`}
            stacked={attrs.stacked as boolean}
            horizontal={attrs.horizontal as boolean}/>,
    },
    {
        name: "PieChart", group: "Charts",
        defaultAttrs: {donut: 0, showPercent: true},
        controls: {
            donut: {kind: "number", label: "donut"},
            showPercent: {kind: "boolean", label: "showPercent"},
        },
        render: (attrs) => <PieChart
            data={chartShare} height={240}
            ariaLabel="Headcount share by department"
            donut={attrs.donut as number}
            showPercent={attrs.showPercent as boolean}/>,
    },
    {
        name: "Gauge", group: "Charts",
        defaultAttrs: {value: 72, sweep: 240, showRange: true},
        controls: {
            value: {kind: "number", label: "value"},
            sweep: {kind: "number", label: "sweep"},
            showRange: {kind: "boolean", label: "showRange"},
        },
        render: (attrs) => <Gauge
            height={200} subLabel="of quota"
            formatValue={(n: number) => `${n}%`}
            ariaLabel="Percent of quota"
            value={attrs.value as number}
            sweep={attrs.sweep as number}
            showRange={attrs.showRange as boolean}/>,
    },
    {
        name: "Sparkline", group: "Charts",
        defaultAttrs: {variant: "line", showLast: true},
        controls: {
            variant: {kind: "select", label: "variant", options: ["line", "area", "bar"]},
            showLast: {kind: "boolean", label: "showLast"},
        },
        render: (attrs) => <Sparkline
            values={[4, 9, 6, 12, 8, 15, 11, 19, 14, 22]}
            width={200} height={44}
            variant={attrs.variant as "line" | "area" | "bar"}
            showLast={attrs.showLast as boolean}/>,
    },
    {
        name: "Heading", group: "Typography",
        defaultAttrs: {level: 2, type: ""},
        controls: {
            level: {kind: "number", label: "level"},
            type: {kind: "select", label: "type", options: ["", "muted", "primary", "secondary", "warning", "danger"]},
        },
        render: (attrs) => <Heading
            level={Math.min(6, Math.max(1, attrs.level as number)) as 1 | 2 | 3 | 4 | 5 | 6}
            type={(attrs.type as string || undefined) as undefined}>A heading at this level</Heading>,
    },
    {
        name: "Text", group: "Typography",
        defaultAttrs: {type: "muted", strong: false, italic: false, numeric: false, code: false},
        controls: {
            type: {kind: "select", label: "type", options: ["", "muted", "primary", "secondary", "warning", "danger"]},
            strong: {kind: "boolean", label: "strong"},
            italic: {kind: "boolean", label: "italic"},
            numeric: {kind: "boolean", label: "numeric"},
            code: {kind: "boolean", label: "code"},
        },
        render: (attrs) => <Text
            type={(attrs.type as string || undefined) as undefined}
            strong={attrs.strong as boolean}
            italic={attrs.italic as boolean}
            numeric={attrs.numeric as boolean}
            code={attrs.code as boolean}>Inline text, 1,234,567</Text>,
    },
    {
        name: "Paragraph", group: "Typography",
        defaultAttrs: {type: ""},
        controls: {
            type: {kind: "select", label: "type", options: ["", "muted", "primary", "secondary", "warning", "danger"]},
        },
        render: (attrs) => <Paragraph type={(attrs.type as string || undefined) as undefined}>
            A block of prose with the package's own line height and spacing. The last paragraph in a
            container drops its bottom margin, so a card does not end with a band of dead space.
        </Paragraph>,
    },
    {
        name: "Stack", group: "Layout",
        defaultAttrs: {direction: "row", gap: "md", wrap: true},
        controls: {
            direction: {kind: "select", label: "direction", options: ["row", "column"]},
            gap: {kind: "select", label: "gap", options: ["none", "xs", "sm", "md", "lg", "xl"]},
            wrap: {kind: "boolean", label: "wrap"},
        },
        render: (attrs) => <Stack
            direction={attrs.direction as "row" | "column"}
            gap={attrs.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}
            wrap={attrs.wrap as boolean}>
            <Badge type="primary">One</Badge>
            <Badge type="secondary">Two</Badge>
            <Badge type="warning">Three</Badge>
            <Badge type="neutral">Four</Badge>
        </Stack>,
    },
    {
        name: "Grid", group: "Layout",
        defaultAttrs: {minColumnWidth: "10em", gap: "md"},
        controls: {
            minColumnWidth: {kind: "text", label: "minColumnWidth"},
            gap: {kind: "select", label: "gap", options: ["none", "xs", "sm", "md", "lg", "xl"]},
        },
        render: (attrs) => <Grid
            minColumnWidth={attrs.minColumnWidth as string}
            gap={attrs.gap as "none" | "xs" | "sm" | "md" | "lg" | "xl"}>
            <Card>One</Card>
            <Card>Two</Card>
            <Card>Three</Card>
            <Card>Four</Card>
            <Card>Five</Card>
            <Card>Six</Card>
        </Grid>,
    },
    {
        name: "Carousel", group: "Data Display",
        defaultAttrs: {showDots: true},
        controls: {
            showDots: {kind: "boolean", label: "showDots"},
        },
        render: (attrs) => <Carousel
            showDots={attrs.showDots as boolean}
            slides={[
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--primary-3)"}}>Slide 1</div>,
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--secondary-3)"}}>Slide 2</div>,
                <div style={{padding: "2.5em", textAlign: "center", background: "var(--warning-3)"}}>Slide 3</div>,
            ]}/>,
    },
    {
        name: "Calendar", group: "Data Display",
        // Stored as `Date.toDateString()` (e.g. "Thu Jan 15 2026") rather than an ISO
        // "YYYY-MM-DD" string - `new Date("YYYY-MM-DD")` parses as UTC midnight, which can
        // shift a day backward once re-read with local getters (getFullYear/getMonth/getDate,
        // as Calendar's own rendering does) in a negative-UTC-offset timezone; toDateString()'s
        // format parses back as local midnight instead, so it round-trips exactly.
        defaultAttrs: {selected: new Date(2026, 0, 15).toDateString()},
        controls: {},
        render: (attrs, setAttr) => <Calendar value={new Date(attrs.selected as string)} onSelectDate={(date) => setAttr("selected", date.toDateString())}/>,
    },
    {
        name: "CalendarRange", group: "Data Display",
        defaultAttrs: {start: new Date(2026, 0, 10).toDateString(), end: new Date(2026, 0, 15).toDateString()},
        controls: {},
        render: (attrs, setAttr) => <CalendarRange
            value={{
                start: new Date(attrs.start as string),
                end: attrs.end ? new Date(attrs.end as string) : undefined,
            }}
            onSelectRange={(range) => {
                if (range.start) { setAttr("start", range.start.toDateString()) }
                if (range.end) { setAttr("end", range.end.toDateString()) }
            }}/>,
    },
    {
        name: "Tree", group: "Data Display",
        defaultAttrs: {},
        controls: {},
        render: () => <Tree nodes={[
            {key: "src", label: "src", defaultOpen: true, children: [
                {key: "components", label: "components", children: [
                    {key: "button", label: "button.tsx"},
                    {key: "card", label: "card.tsx"},
                ]},
                {key: "index", label: "index.ts"},
            ]},
            {key: "readme", label: "readme.md"},
        ]}/>,
    },

    // --- Utility ---
    {
        name: "Icon", group: "Utility",
        defaultAttrs: {size: "2em"},
        controls: {
            size: {kind: "text", label: "size (style.height)"},
        },
        render: (attrs) => <I i="gear" style={{height: attrs.size as string}}/>,
    },
]
