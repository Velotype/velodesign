import { getComponent, RenderBasic } from "@velotype/velotype"
import type { RenderableElements } from "@velotype/velotype"

import {
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
    /** Starting values for every control (and any other props `render` reads) */
    defaultProps: Record<string, unknown>
    /** Only genuinely scalar props get controls - arrays/objects/callbacks stay fixed in `render` */
    controls: Record<string, ControlDef>
    /**
     * Builds the live preview from the current props. `setProp` lets a story handle its own
     * internal interaction (e.g. Pagination's page buttons) through the same update path as
     * the Controls panel, so both stay in sync.
     */
    render: (props: Record<string, unknown>, setProp: (key: string, value: unknown) => void) => RenderableElements
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

export const stories: ComponentStory[] = [
    // --- Form ---
    {
        name: "Button", group: "Form",
        defaultProps: {type: "primary", disabled: false, loadingOnClick: false, children: "Example button"},
        controls: {
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger", "text"]},
            disabled: {kind: "boolean", label: "disabled"},
            loadingOnClick: {kind: "boolean", label: "loadingOnClick"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Button
            type={props.type as ButtonType}
            disabled={props.disabled as boolean}
            loadingOnClick={props.loadingOnClick as boolean}
            onClick={(_event, doneLoading) => { if (doneLoading) { globalThis.setTimeout(doneLoading, 1200) } }}>{props.children as string}</Button>,
    },
    {
        name: "ButtonGroup", group: "Form",
        defaultProps: {orientation: "horizontal"},
        controls: {
            orientation: {kind: "select", label: "orientation", options: ["horizontal", "vertical"]},
        },
        render: (props) => <ButtonGroup orientation={props.orientation as "horizontal" | "vertical"}>
            <Button type="secondary">Left</Button>
            <Button type="secondary">Middle</Button>
            <Button type="secondary">Right</Button>
        </ButtonGroup>,
    },
    {
        name: "RadioButton", group: "Form",
        defaultProps: {checked: false, disabled: false, children: "Option"},
        controls: {
            checked: {kind: "boolean", label: "checked"},
            disabled: {kind: "boolean", label: "disabled"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <RadioButton name="explorer-radio" checked={props.checked as boolean} disabled={props.disabled as boolean}>{props.children as string}</RadioButton>,
    },
    {
        name: "Checkbox", group: "Form",
        defaultProps: {checked: false, disabled: false, indeterminate: false, children: "Checkbox label"},
        controls: {
            checked: {kind: "boolean", label: "checked"},
            disabled: {kind: "boolean", label: "disabled"},
            indeterminate: {kind: "boolean", label: "indeterminate"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Checkbox checked={props.checked as boolean} disabled={props.disabled as boolean} indeterminate={props.indeterminate as boolean}>{props.children as string}</Checkbox>,
    },
    {
        name: "Toggle", group: "Form",
        defaultProps: {checked: false, disabled: false, children: "Toggle label"},
        controls: {
            checked: {kind: "boolean", label: "checked"},
            disabled: {kind: "boolean", label: "disabled"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Toggle checked={props.checked as boolean} disabled={props.disabled as boolean}>{props.children as string}</Toggle>,
    },
    {
        name: "TextBox", group: "Form",
        defaultProps: {type: "text", placeholder: "Type something...", required: false},
        controls: {
            type: {kind: "select", label: "type", options: ["text", "email", "phone", "password", "new-password"]},
            placeholder: {kind: "text", label: "placeholder"},
            required: {kind: "boolean", label: "required"},
        },
        render: (props) => <TextBox type={props.type as TextBoxTypeType} placeholder={props.placeholder as string} required={props.required as boolean}/>,
    },
    {
        name: "Textarea", group: "Form",
        defaultProps: {placeholder: "Type something...", rows: 3, required: false, resize: "vertical"},
        controls: {
            placeholder: {kind: "text", label: "placeholder"},
            rows: {kind: "number", label: "rows"},
            resize: {kind: "select", label: "resize", options: ["none", "vertical", "horizontal", "both"]},
            required: {kind: "boolean", label: "required"},
        },
        render: (props) => <Textarea placeholder={props.placeholder as string} rows={props.rows as number} resize={props.resize as "none" | "vertical" | "horizontal" | "both"} required={props.required as boolean}/>,
    },
    {
        name: "Select", group: "Form",
        defaultProps: {value: "a", placeholder: "Choose one", placeholderDisabled: false, disabled: false, required: false},
        controls: {
            value: {kind: "select", label: "value", options: ["a", "b", "c"]},
            placeholder: {kind: "text", label: "placeholder"},
            placeholderDisabled: {kind: "boolean", label: "placeholderDisabled"},
            disabled: {kind: "boolean", label: "disabled"},
            required: {kind: "boolean", label: "required"},
        },
        render: (props) => <Select
            options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}, {value: "c", label: "Option C"}]}
            value={props.value as string}
            placeholder={props.placeholder as string}
            placeholderDisabled={props.placeholderDisabled as boolean}
            disabled={props.disabled as boolean}
            required={props.required as boolean}/>,
    },
    {
        name: "SelectMenu", group: "Form",
        defaultProps: {value: "a", placeholder: "Assign to...", disabled: false},
        controls: {
            value: {kind: "select", label: "value", options: ["a", "b", "c"]},
            placeholder: {kind: "text", label: "placeholder"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props) => <SelectMenu<{id: string, name: string}>
            options={[{id: "a", name: "Jamie Rivera"}, {id: "b", name: "Alex Baker"}, {id: "c", name: "Casey Diaz"}]}
            getValue={option => option.id}
            renderOption={option => <span style={{display: "flex", alignItems: "center", gap: "0.5em"}}><Avatar initials={option.name[0]} size="1.5em"/>{option.name}</span>}
            value={props.value as string}
            placeholder={props.placeholder as string}
            disabled={props.disabled as boolean}/>,
    },
    {
        name: "TextNonEditableField", group: "Form",
        defaultProps: {value: "example value", children: "Label:"},
        controls: {
            value: {kind: "text", label: "value"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <TextNonEditableField value={props.value as string}>{props.children as string}</TextNonEditableField>,
    },
    {
        name: "TextFormField", group: "Form",
        defaultProps: {type: "text", required: false, children: "Label:"},
        controls: {
            type: {kind: "select", label: "type", options: ["text", "email", "phone", "password", "new-password"]},
            required: {kind: "boolean", label: "required"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <TextFormField type={props.type as TextBoxTypeType} required={props.required as boolean} field={textFormFieldValue}>{props.children as string}</TextFormField>,
    },
    {
        name: "TextEditableField", group: "Form",
        defaultProps: {type: "text", children: "Label:"},
        controls: {
            type: {kind: "select", label: "type", options: ["text", "email", "phone", "password", "new-password"]},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <TextEditableField type={props.type as TextBoxTypeType} field={textEditableFieldValue}>{props.children as string}</TextEditableField>,
    },

    // --- Navigation ---
    {
        name: "NavLink", group: "Navigation",
        defaultProps: {to: "/", exact: true, children: "Home"},
        controls: {
            to: {kind: "text", label: "to"},
            exact: {kind: "boolean", label: "exact"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <NavLink to={props.to as string} exact={props.exact as boolean} spa>{props.children as string}</NavLink>,
    },
    {
        name: "Link", group: "Navigation",
        defaultProps: {to: "/somewhere", children: "Click me"},
        controls: {
            to: {kind: "text", label: "to"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Link to={props.to as string} spa>{props.children as string}</Link>,
    },
    {
        name: "Breadcrumbs", group: "Navigation",
        defaultProps: {separator: "/"},
        controls: {
            separator: {kind: "text", label: "separator"},
        },
        render: (props) => <Breadcrumbs
            spa
            separator={props.separator as string}
            items={[{label: "Home", to: "/"}, {label: "Library", to: "/library"}, {label: "Current page"}]}/>,
    },
    {
        name: "Pagination", group: "Navigation",
        defaultProps: {page: 1, totalPages: 10, siblingCount: 2},
        controls: {
            totalPages: {kind: "number", label: "totalPages"},
            siblingCount: {kind: "number", label: "siblingCount"},
        },
        render: (props, setProp) => <Pagination
            page={props.page as number}
            totalPages={props.totalPages as number}
            siblingCount={props.siblingCount as number}
            onPageChange={(page) => setProp("page", page)}/>,
    },
    {
        name: "Navbar", group: "Navigation",
        defaultProps: {brand: "My App"},
        controls: {
            brand: {kind: "text", label: "brand"},
        },
        render: (props) => <Navbar brand={props.brand as string}>
            <NavLink to="/" spa>Home</NavLink>
            <NavLink to="/docs" spa>Docs</NavLink>
        </Navbar>,
    },
    {
        name: "Sidebar", group: "Navigation",
        defaultProps: {header: "Sections"},
        controls: {
            header: {kind: "text", label: "header"},
        },
        render: (props) => <Sidebar
            spa
            header={props.header as string}
            items={[{label: "Overview", to: "/"}, {label: "Settings", to: "/settings"}]}/>,
    },
    {
        name: "Menu", group: "Navigation",
        defaultProps: {trigger: "Actions", clicks: 0, closeOnOutsideClick: true},
        controls: {
            trigger: {kind: "text", label: "trigger"},
            closeOnOutsideClick: {kind: "boolean", label: "closeOnOutsideClick"},
        },
        render: (props, setProp) => {
            const clicks = props.clicks as number
            return <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                <Menu trigger={props.trigger as string} closeOnOutsideClick={props.closeOnOutsideClick as boolean} items={[
                    {label: "Do a thing", onClick: () => setProp("clicks", clicks + 1)},
                    {label: "Disabled", disabled: true},
                ]}/>
                <span>clicked {clicks} times</span>
            </div>
        },
    },

    // --- Feedback ---
    {
        name: "Alert", group: "Feedback",
        defaultProps: {type: "info", title: "Heads up", children: "This is an alert message.", dismissible: false},
        controls: {
            type: {kind: "select", label: "type", options: ["info", "success", "warning", "danger"]},
            title: {kind: "text", label: "title"},
            children: {kind: "text", label: "children"},
            dismissible: {kind: "boolean", label: "dismissible"},
        },
        render: (props) => <Alert
            type={props.type as AlertType}
            title={props.title as string}
            onDismiss={props.dismissible ? () => {} : undefined}>{props.children as string}</Alert>,
    },
    {
        name: "Toast", group: "Feedback",
        defaultProps: {type: "info", message: "Hello from the Explorer", duration: 4000},
        controls: {
            type: {kind: "select", label: "type", options: ["info", "success", "warning", "danger"]},
            message: {kind: "text", label: "message"},
            duration: {kind: "number", label: "duration"},
        },
        render: (props) => <Button
            type="secondary"
            onClick={() => showToast(props.message as string, {type: props.type as ToastType, duration: props.duration as number})}>Show toast</Button>,
    },
    {
        name: "Tooltip", group: "Feedback",
        defaultProps: {content: "More info", placement: "top", children: "Hover me"},
        controls: {
            content: {kind: "text", label: "content"},
            placement: {kind: "select", label: "placement", options: ["top", "bottom", "left", "right"]},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Tooltip content={props.content as string} placement={props.placement as TooltipPlacement}>
            <span style={{padding: "0.5em 1em", border: "1px dashed var(--background-5)", borderRadius: "0.25rem", display: "inline-block"}}>{props.children as string}</span>
        </Tooltip>,
    },
    {
        name: "Spinner", group: "Feedback",
        defaultProps: {size: "2em"},
        controls: {
            size: {kind: "text", label: "size"},
        },
        render: (props) => <Spinner size={props.size as string}/>,
    },

    // --- Overlays ---
    {
        name: "Modal", group: "Overlays",
        defaultProps: {openButtonText: "Open modal", title: "Confirm action", confirmButtonChildren: "Confirm", cancelButtonChildren: "Cancel", startConfirmDisabled: false},
        controls: {
            openButtonText: {kind: "text", label: "openButtonText"},
            title: {kind: "text", label: "modalAttrs.title"},
            confirmButtonChildren: {kind: "text", label: "modalAttrs.confirmButtonChildren"},
            cancelButtonChildren: {kind: "text", label: "modalAttrs.cancelButtonChildren"},
            startConfirmDisabled: {kind: "boolean", label: "modalAttrs.startConfirmDisabled"},
        },
        render: (props) => <ButtonModal
            openButtonText={props.openButtonText as string}
            modalAttrs={{
                title: props.title as string,
                confirmButtonChildren: props.confirmButtonChildren as string,
                cancelButtonChildren: props.cancelButtonChildren as string,
                startConfirmDisabled: props.startConfirmDisabled as boolean,
                confirmButtonOnClick: (doneLoading) => { globalThis.setTimeout(doneLoading, 600) },
            }}>Modal body content goes here.</ButtonModal>,
    },

    // --- Data Display ---
    {
        name: "Badge", group: "Data Display",
        defaultProps: {type: "primary", children: "Badge"},
        controls: {
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger", "neutral"]},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Badge type={props.type as BadgeType}>{props.children as string}</Badge>,
    },
    {
        name: "Card", group: "Data Display",
        defaultProps: {header: "Card title", footer: "Footer actions", children: "Some card body content."},
        controls: {
            header: {kind: "text", label: "header"},
            footer: {kind: "text", label: "footer"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Card header={props.header as string} footer={props.footer as string}>{props.children as string}</Card>,
    },
    {
        name: "Avatar", group: "Data Display",
        defaultProps: {initials: "JR", src: "", size: "2.5em"},
        controls: {
            initials: {kind: "text", label: "initials"},
            src: {kind: "text", label: "src"},
            size: {kind: "text", label: "size"},
        },
        render: (props) => <Avatar initials={props.initials as string} src={(props.src as string) || undefined} size={props.size as string}/>,
    },
    {
        name: "TimeAgo", group: "Data Display",
        defaultProps: {minutesAgo: 5, numeric: "always", timestyle: "long"},
        controls: {
            minutesAgo: {kind: "number", label: "minutesAgo"},
            numeric: {kind: "select", label: "numeric", options: ["always", "auto"]},
            timestyle: {kind: "select", label: "timestyle", options: ["long", "short", "narrow"]},
        },
        render: (props) => <TimeAgo
            timestamp={new Date(Date.now() - (props.minutesAgo as number) * 60000)}
            numeric={props.numeric as "always" | "auto"}
            timestyle={props.timestyle as "long" | "short" | "narrow"}/>,
    },
    {
        name: "Divider", group: "Data Display",
        defaultProps: {orientation: "horizontal"},
        controls: {
            orientation: {kind: "select", label: "orientation", options: ["horizontal", "vertical"]},
        },
        render: (props) => {
            const orientation = props.orientation as "horizontal" | "vertical"
            if (orientation === "vertical") {
                return <div style={{display: "flex", height: "3em", alignItems: "center"}}>Left<Divider orientation="vertical"/>Right</div>
            }
            return <div>Above<Divider orientation="horizontal"/>Below</div>
        },
    },
    {
        name: "Tabs", group: "Data Display",
        defaultProps: {initialKey: "a"},
        controls: {
            initialKey: {kind: "select", label: "initialKey", options: ["a", "b", "c"]},
        },
        render: (props) => <Tabs
            initialKey={props.initialKey as string}
            tabs={[{key: "a", label: "A", content: "Panel A content."}, {key: "b", label: "B", content: "Panel B content."}, {key: "c", label: "C", content: "Panel C content."}]}/>,
    },
    {
        name: "Accordion", group: "Data Display",
        defaultProps: {exclusive: true},
        controls: {
            exclusive: {kind: "boolean", label: "exclusive"},
        },
        render: (props) => <Accordion
            exclusive={props.exclusive as boolean}
            items={[
                {header: "Section one", content: "Content one.", defaultOpen: true},
                {header: "Section two", content: "Content two."},
                {header: "Section three", content: "Content three."},
            ]}/>,
    },

    // --- Data Entry ---
    {
        name: "DatePicker", group: "Data Entry",
        defaultProps: {value: "2026-01-15", disabled: false},
        controls: {
            value: {kind: "text", label: "value"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props) => <DatePicker value={props.value as string} disabled={props.disabled as boolean}/>,
    },
    {
        name: "DateTimePicker", group: "Data Entry",
        defaultProps: {value: "2026-01-15T09:30", disabled: false},
        controls: {
            value: {kind: "text", label: "value"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props) => <DateTimePicker value={props.value as string} disabled={props.disabled as boolean}/>,
    },
    {
        name: "DateTimeRangePicker", group: "Data Entry",
        defaultProps: {start: "2026-01-15T09:30", end: "2026-01-17T17:00", disabled: false},
        controls: {
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props, setProp) => <DateTimeRangePicker
            value={{start: props.start as string, end: props.end as string}}
            disabled={props.disabled as boolean}
            onChange={(range) => {
                setProp("start", range.start ?? "")
                setProp("end", range.end ?? "")
            }}/>,
    },
    {
        name: "Slider", group: "Data Entry",
        defaultProps: {value: 40, min: 0, max: 100, step: 1, disabled: false},
        controls: {
            min: {kind: "number", label: "min"},
            max: {kind: "number", label: "max"},
            step: {kind: "number", label: "step"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props, setProp) => <Slider
            value={props.value as number}
            min={props.min as number}
            max={props.max as number}
            step={props.step as number}
            disabled={props.disabled as boolean}
            onInput={(event) => setProp("value", Number((event.target as HTMLInputElement).value))}/>,
    },
    {
        name: "InputNumber", group: "Data Entry",
        defaultProps: {value: 5, disabled: false},
        controls: {
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props) => <InputNumber value={props.value as number} disabled={props.disabled as boolean}/>,
    },
    {
        name: "ColorPicker", group: "Data Entry",
        defaultProps: {value: "#66b2ff", disabled: false},
        controls: {
            value: {kind: "text", label: "value"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props) => <ColorPicker value={props.value as string} disabled={props.disabled as boolean}/>,
    },
    {
        name: "Combobox", group: "Data Entry",
        defaultProps: {placeholder: "Choose a country", disabled: false},
        controls: {
            placeholder: {kind: "text", label: "placeholder"},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props) => <Combobox
            placeholder={props.placeholder as string}
            disabled={props.disabled as boolean}
            options={comboboxCountryOptions}/>,
    },
    {
        name: "Upload", group: "Data Entry",
        defaultProps: {disabled: false, children: "Click or drag a file here"},
        controls: {
            disabled: {kind: "boolean", label: "disabled"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Upload disabled={props.disabled as boolean}>{props.children as string}</Upload>,
    },
    {
        name: "Rate", group: "Data Entry",
        defaultProps: {value: 3, count: 5, type: "warning", disabled: false},
        controls: {
            count: {kind: "number", label: "count"},
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger"]},
            disabled: {kind: "boolean", label: "disabled"},
        },
        render: (props, setProp) => <Rate
            value={props.value as number}
            count={props.count as number}
            type={props.type as RateType}
            disabled={props.disabled as boolean}
            onChange={(event) => setProp("value", Number((event.target as HTMLInputElement).value))}/>,
    },
    {
        name: "Form", group: "Data Entry",
        defaultProps: {},
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
        defaultProps: {current: 1},
        controls: {
            current: {kind: "number", label: "current"},
        },
        render: (props) => <Steps
            current={props.current as number}
            steps={[{key: "a", title: "Account"}, {key: "b", title: "Profile"}, {key: "c", title: "Confirm"}]}/>,
    },

    // --- Feedback ---
    {
        name: "Progress", group: "Feedback",
        defaultProps: {value: 65, type: "primary", showLabel: true},
        controls: {
            value: {kind: "number", label: "value"},
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger"]},
            showLabel: {kind: "boolean", label: "showLabel"},
        },
        render: (props) => <Progress value={props.value as number} type={props.type as ProgressType} showLabel={props.showLabel as boolean}/>,
    },
    {
        name: "Skeleton", group: "Feedback",
        defaultProps: {variant: "text", lines: 2},
        controls: {
            variant: {kind: "select", label: "variant", options: ["text", "circular", "rectangular"]},
            lines: {kind: "number", label: "lines"},
        },
        render: (props) => <Skeleton variant={props.variant as "text" | "circular" | "rectangular"} lines={props.lines as number}/>,
    },
    {
        name: "Empty", group: "Feedback",
        defaultProps: {title: "No data", description: "Try adjusting your filters"},
        controls: {
            title: {kind: "text", label: "title"},
            description: {kind: "text", label: "description"},
        },
        render: (props) => <Empty title={props.title as string} description={props.description as string}/>,
    },

    // --- Overlays ---
    {
        name: "Drawer", group: "Overlays",
        defaultProps: {title: "Settings", placement: "left", enterFrom: "left"},
        controls: {
            title: {kind: "text", label: "title"},
            placement: {kind: "select", label: "placement", options: ["left", "right", "top", "bottom"]},
            enterFrom: {kind: "select", label: "enterFrom", options: ["left", "right", "top", "bottom"]},
        },
        render: (props) => {
            const drawer = <Drawer
                title={props.title as string}
                placement={props.placement as "left" | "right" | "top" | "bottom"}
                enterFrom={props.enterFrom as "left" | "right" | "top" | "bottom"}>Drawer body content goes here.</Drawer>
            return <span style={{display: "contents"}}>{drawer}<Button type="secondary" onClick={() => drawer.showModal()}>Open drawer</Button></span>
        },
    },
    {
        name: "Popover", group: "Overlays",
        defaultProps: {content: "Rich popover content, shown on click.", placement: "bottom"},
        controls: {
            content: {kind: "text", label: "content"},
            placement: {kind: "select", label: "placement", options: ["top", "bottom", "left", "right"]},
        },
        render: (props) => <Popover
            trigger={<Button type="secondary">Click me</Button>}
            content={props.content as string}
            placement={props.placement as PopoverPlacement}/>,
    },
    {
        name: "Popconfirm", group: "Overlays",
        defaultProps: {title: "Delete this item?"},
        controls: {
            title: {kind: "text", label: "title"},
        },
        render: (props) => <Popconfirm title={props.title as string} onConfirm={() => {}}><Button type="danger">Delete</Button></Popconfirm>,
    },
    {
        name: "ContextMenu", group: "Overlays",
        defaultProps: {},
        controls: {},
        render: () => <ContextMenu items={[{label: "Copy", onClick: () => {}}, {label: "Paste", onClick: () => {}}, {label: "Delete", disabled: true}]}>
            <div style={{padding: "2em", border: "1px dashed var(--background-5)", borderRadius: "0.25rem"}}>Right-click here</div>
        </ContextMenu>,
    },
    {
        name: "Command", group: "Overlays",
        defaultProps: {},
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
        defaultProps: {type: "primary", children: "Tag", removable: false},
        controls: {
            type: {kind: "select", label: "type", options: ["primary", "secondary", "warning", "danger", "neutral"]},
            children: {kind: "text", label: "children"},
            removable: {kind: "boolean", label: "removable"},
        },
        render: (props) => <Tag type={props.type as TagType} onRemove={props.removable ? () => {} : undefined}>{props.children as string}</Tag>,
    },
    {
        name: "Collapse", group: "Data Display",
        defaultProps: {header: "Click to expand", defaultOpen: false},
        controls: {
            header: {kind: "text", label: "header"},
            defaultOpen: {kind: "boolean", label: "defaultOpen"},
        },
        render: (props) => <Collapse header={props.header as string} defaultOpen={props.defaultOpen as boolean}>Hidden content revealed on expand.</Collapse>,
    },
    {
        name: "Statistic", group: "Data Display",
        defaultProps: {title: "Active users", value: 1284, prefix: "", suffix: ""},
        controls: {
            title: {kind: "text", label: "title"},
            value: {kind: "text", label: "value"},
            prefix: {kind: "text", label: "prefix"},
            suffix: {kind: "text", label: "suffix"},
        },
        render: (props) => <Statistic title={props.title as string} value={props.value as string} prefix={(props.prefix as string) || undefined} suffix={(props.suffix as string) || undefined}/>,
    },
    {
        name: "List", group: "Data Display",
        defaultProps: {},
        controls: {},
        render: () => <List items={[
            {key: "1", leading: <Avatar initials="JR"/>, title: "Jamie Rivera", description: "jamie@example.com"},
            {key: "2", leading: <Avatar initials="AB"/>, title: "Alex Baker", description: "alex@example.com"},
        ]}/>,
    },
    {
        name: "Timeline", group: "Data Display",
        defaultProps: {},
        controls: {},
        render: () => <Timeline items={[
            {key: "1", title: "Order placed", type: "secondary"},
            {key: "2", title: "Shipped", type: "primary"},
            {key: "3", title: "Delivered"},
        ]}/>,
    },
    {
        name: "AspectRatio", group: "Data Display",
        defaultProps: {ratio: 16 / 9},
        controls: {
            ratio: {kind: "number", label: "ratio"},
        },
        render: (props) => <AspectRatio ratio={props.ratio as number} style={{maxWidth: "320px"}}>
            <div style={{background: "var(--primary-3)", display: "flex", alignItems: "center", justifyContent: "center"}}>{(props.ratio as number).toFixed(2)}</div>
        </AspectRatio>,
    },
    {
        name: "ScrollArea", group: "Data Display",
        defaultProps: {maxHeight: "8em"},
        controls: {
            maxHeight: {kind: "text", label: "maxHeight"},
        },
        render: (props) => <ScrollArea maxHeight={props.maxHeight as string} style={{maxWidth: "260px", border: "1px solid var(--background-4)", borderRadius: "0.25rem", padding: "8px"}}>
            {Array.from({length: 20}).map((_, i) => <div style={{padding: "4px 0"}}>Row {i + 1}</div>)}
        </ScrollArea>,
    },
    {
        name: "Table", group: "Data Display",
        defaultProps: {},
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
        defaultProps: {},
        controls: {},
        render: () => <DataTable
            searchable
            pageSize={5}
            showPageSizeControl
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
        name: "Carousel", group: "Data Display",
        defaultProps: {showDots: true},
        controls: {
            showDots: {kind: "boolean", label: "showDots"},
        },
        render: (props) => <Carousel
            showDots={props.showDots as boolean}
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
        defaultProps: {selected: new Date(2026, 0, 15).toDateString()},
        controls: {},
        render: (props, setProp) => <Calendar value={new Date(props.selected as string)} onSelectDate={(date) => setProp("selected", date.toDateString())}/>,
    },
    {
        name: "CalendarRange", group: "Data Display",
        defaultProps: {start: new Date(2026, 0, 10).toDateString(), end: new Date(2026, 0, 15).toDateString()},
        controls: {},
        render: (props, setProp) => <CalendarRange
            value={{
                start: new Date(props.start as string),
                end: props.end ? new Date(props.end as string) : undefined,
            }}
            onSelectRange={(range) => {
                if (range.start) { setProp("start", range.start.toDateString()) }
                if (range.end) { setProp("end", range.end.toDateString()) }
            }}/>,
    },
    {
        name: "Tree", group: "Data Display",
        defaultProps: {},
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
        defaultProps: {size: "2em"},
        controls: {
            size: {kind: "text", label: "size (style.height)"},
        },
        render: (props) => <I i="gear" style={{height: props.size as string}}/>,
    },
]
