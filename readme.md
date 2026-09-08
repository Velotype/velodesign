# velodesign

A themed UI component library for [Velotype](https://jsr.io/@velotype/velotype) - Deno's TSX
framework. Every component is built from real, native HTML elements wherever one exists (a real
`<input>`, `<button>`, `<details>`, `<dialog>`, ...) rather than a reimplemented widget, so
keyboard support, form participation, and browser autofill all come from the platform for free.
Colors read from a small set of CSS custom properties (`--text`, `--background`, `--primary`,
`--secondary`, `--warning`, `--accent`, each with a light↔dark mix ramp), so a consumer can
re-theme the whole library - including automatic light/dark switching via
`[data-theme="light"|"dark"]` - without touching component code.

## Install

```
deno add jsr:@velotype/velodesign
```

## Usage

```tsx
import { Button, Checkbox, Theme } from "@velotype/velodesign"
import { replaceElementWithRoot } from "@velotype/velotype"

Theme.injectStyles()

replaceElementWithRoot(
    <div>
        <Checkbox>Enable notifications</Checkbox>
        <Button type="primary" onClick={() => console.log("clicked")}>Save</Button>
    </div>,
    document.getElementById("app")!,
)
```

`Theme.injectStyles()` needs to run once, before any component renders, to set up the CSS custom
property palette every component reads from.

## Components

**Form** - Button, ButtonGroup, Checkbox, RadioButton, Toggle, TextBox, Textarea, Select,
SelectMenu, TextFormField, TextNonEditableField, TextEditableField, Form, FormField

**Navigation** - Link, NavLink, PageSelector, Breadcrumbs, Pagination, Navbar, Sidebar, Menu, Steps

**Feedback** - Alert, Tooltip, Spinner, Progress, Skeleton, Empty, Toast (`showToast`)

**Overlays** - Modal, ButtonModal, Drawer, Popover, Popconfirm, ContextMenu, Command

**Data Display** - Badge, Card, Tabs, Divider, Accordion, Collapse, Avatar, Tag, Statistic, List,
Timeline, AspectRatio, ScrollArea, Table, DataTable, Carousel, Calendar, CalendarRange, Tree,
TimeAgo

**Data Entry** - DatePicker, DateTimePicker, DateTimeRangePicker, Slider, InputNumber, ColorPicker,
Combobox, Upload, Rate

**Utility** - Icon (`I`, `registerIcon`), Resizable

Every component's own file (`src/<name>.tsx`) documents its full prop type and any non-obvious
design decisions inline. For a live, browsable reference with every component's variants, props,
and interactive examples, run the showcase site locally:

```
cd showcase && deno task dev
```

## Development

From the repository root:

- `deno check src/index.ts` - type-check the library
- `deno task test` - bundle every test module and run the full component test suite (headless
  Chrome via Astral)
- `deno task test-manual` - bundle every test module and serve the gallery pages locally, for
  manually clicking through each component's states

See `CLAUDE.md` for the conventions every component follows (attrs type shape, styling, when to
use `FunctionComponent` vs. a class `Component`, testing/showcase fan-out for a new component,
and a running list of non-obvious framework gotchas) - read it before adding or modifying a
component.

## License

MIT
