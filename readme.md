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

**Typography** - Heading, Text, Paragraph

**Layout** - Stack, Grid

**Form** - Button, ButtonGroup, Checkbox, RadioButton, Toggle, TextBox, Textarea, Select,
SelectMenu, TextFormField, TextNonEditableField, TextEditableField

**Navigation** - Link, NavLink, PageSelector, Breadcrumbs, Pagination, Navbar, Sidebar,
TableOfContents, Menu, Steps

**Feedback** - Alert, Tooltip, Spinner, Progress, Skeleton, Empty, Toast (`showToast`)

**Overlays** - Modal, ButtonModal, Drawer, Popover, Popconfirm, ContextMenu, Command

**Data Display** - Badge, Card, CodeBlock, Tabs, Divider, Accordion, Collapse, Avatar, Tag,
Statistic, List, Timeline, AspectRatio, ScrollArea, Table, DataTable, AsyncDataTable, Carousel,
Calendar, CalendarRange, Tree, TimeAgo, Resizable

**Data Entry** - DatePicker, DateTimePicker, DateTimeRangePicker, Slider, InputNumber, ColorPicker,
Combobox, Upload, Rate, Form, FormField

**Charts** - LineChart, AreaChart, BarChart, PieChart, Gauge, Sparkline

**Utility** - Icon (`I`, `registerIcon`)

Every component's own file (`src/<name>.tsx`) documents its full prop type and any non-obvious
design decisions inline. For a live, browsable reference with every component's variants, props,
and interactive examples, run the showcase site locally:

```
cd showcase && deno task dev
```

## Development

From the repository root:

- `deno check src/index.ts` - type-check the library
- `deno lint` - a CI gate; `jsx-key` is excluded in `deno.json` because velotype's JSX has no
  `key` prop
- `deno task test` - bundle every test module and run the full component test suite (headless
  Chrome via Astral)
- `deno task test-manual` - bundle every test module and serve the gallery pages locally, for
  manually clicking through each component's states
- `deno task size` - measure the whole library bundled and minified, raw and gzipped

⚠️ The test suite's summary line always reads `0 passed | 0 failed` whatever happened, because
something in its teardown calls `Deno.exit(0)`. Its **exit code** is honest, so `deno task test` is
a real gate - count the `... ok (` lines if you want a number.

### Changes go through a pull request

`main` is protected: no direct pushes, no force-pushes. Since there is no second developer, the
required checks *are* the review - a pull request merges itself once they pass and sits open until
they do.

```sh
git switch -c my-change
# ...
git push -u origin my-change
gh pr create --fill          # auto-merge arms itself; CI decides
```

Each pull request also gets a comment reporting what it does to the library's bundle size, measured
against the base branch. The same measurement drives the figure on the showcase's home page.

### Before 1.0, consistency beats compatibility

Nothing is published against these names yet, so an inconsistency gets renamed rather than
preserved - class names, exported symbols, attributes and theme-option fields alike. That inverts
at 1.0, after which a rename needs a deprecation path.

See `CLAUDE.md` for the conventions every component follows (attrs type shape, styling, when to
use `FunctionComponent` vs. a class `Component`, testing/showcase fan-out for a new component,
and a running list of non-obvious framework gotchas) - read it before adding or modifying a
component.

## License

MIT
