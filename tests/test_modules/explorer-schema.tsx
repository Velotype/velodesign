import { RenderBasic } from "@velotype/velotype"
import type { RenderableElements } from "@velotype/velotype"

import {
    Accordion,
    addLicense,
    Alert, type AlertType,
    Avatar,
    Badge, type BadgeType,
    Breadcrumbs,
    Button, type ButtonType,
    ButtonModal,
    Card,
    Checkbox,
    Divider,
    I, Icon, registerIcon,
    Link,
    Menu,
    Navbar,
    NavLink,
    Pagination,
    RadioButton,
    Select,
    Sidebar,
    showToast, type ToastType,
    Spinner,
    Tabs,
    TextBox, type TextBoxTypeType,
    Textarea,
    TextEditableField,
    TextFormField,
    TextNonEditableField,
    TimeAgo,
    Toggle,
    Tooltip, type TooltipPlacement,
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
        defaultProps: {value: "a", placeholder: "Choose one", disabled: false, required: false},
        controls: {
            value: {kind: "select", label: "value", options: ["a", "b", "c"]},
            placeholder: {kind: "text", label: "placeholder"},
            disabled: {kind: "boolean", label: "disabled"},
            required: {kind: "boolean", label: "required"},
        },
        render: (props) => <Select
            options={[{value: "a", label: "Option A"}, {value: "b", label: "Option B"}, {value: "c", label: "Option C"}]}
            value={props.value as string}
            placeholder={props.placeholder as string}
            disabled={props.disabled as boolean}
            required={props.required as boolean}/>,
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
        render: (props) => <NavLink to={props.to as string} exact={props.exact as boolean}>{props.children as string}</NavLink>,
    },
    {
        name: "Link", group: "Navigation",
        defaultProps: {to: "/somewhere", children: "Click me"},
        controls: {
            to: {kind: "text", label: "to"},
            children: {kind: "text", label: "children"},
        },
        render: (props) => <Link to={props.to as string}>{props.children as string}</Link>,
    },
    {
        name: "Breadcrumbs", group: "Navigation",
        defaultProps: {separator: "/"},
        controls: {
            separator: {kind: "text", label: "separator"},
        },
        render: (props) => <Breadcrumbs
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
            <NavLink to="/">Home</NavLink>
            <NavLink to="/docs">Docs</NavLink>
        </Navbar>,
    },
    {
        name: "Sidebar", group: "Navigation",
        defaultProps: {header: "Sections"},
        controls: {
            header: {kind: "text", label: "header"},
        },
        render: (props) => <Sidebar
            header={props.header as string}
            items={[{label: "Overview", to: "/"}, {label: "Settings", to: "/settings"}]}/>,
    },
    {
        name: "Menu", group: "Navigation",
        defaultProps: {trigger: "Actions", clicks: 0},
        controls: {
            trigger: {kind: "text", label: "trigger"},
        },
        render: (props, setProp) => {
            const clicks = props.clicks as number
            return <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                <Menu trigger={props.trigger as string} items={[
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
        defaultProps: {initials: "JW", src: "", size: "2.5em"},
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
