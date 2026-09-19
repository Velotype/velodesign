import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Badge, Button, Card, Grid, Heading, Stack, Statistic, TextBox, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class LayoutGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop: "10px", maxWidth: "620px"}}>
            <Heading level={3}>Stack - a row of actions</Heading>
            <div id="row-stack"><Stack gap="sm">
                <Button type="primary">Save</Button>
                <Button type="secondary">Cancel</Button>
                <Button type="text">Reset</Button>
            </Stack></div>

            <Heading level={3}>Stack - a column stretches its children</Heading>
            <div id="column-stack"><Stack direction="column" gap="xs">
                <Badge type="primary">First</Badge>
                <Badge type="secondary">Second</Badge>
                <Badge type="neutral">Third</Badge>
            </Stack></div>

            <Heading level={3}>Stack - a column with align="start", for content-sized children</Heading>
            <div id="column-start-stack"><Stack direction="column" gap="xs" align="start">
                <Badge type="primary">First</Badge>
                <Badge type="secondary">Second</Badge>
                <Badge type="neutral">Third</Badge>
            </Stack></div>

            <Heading level={3}>Stack - justify between, align center</Heading>
            <div id="between-stack"><Stack justify="between" align="center">
                <Heading level={4}>A view header</Heading>
                <Button type="primary">New thing</Button>
            </Stack></div>

            <Heading level={3}>Stack - every gap on the scale</Heading>
            <Stack direction="column" gap="sm">
                {["none", "xs", "sm", "md", "lg", "xl"].map(size =>
                    <Stack gap={size} align="center">
                        <Badge type="neutral">{size}</Badge>
                        <Badge type="primary">a</Badge><Badge type="primary">b</Badge><Badge type="primary">c</Badge>
                    </Stack>)}
            </Stack>

            <Heading level={3}>Grid - auto-fill, reflows on its own</Heading>
            <div id="auto-grid"><Grid minColumnWidth="9em" gap="sm">
                <Card>One</Card><Card>Two</Card><Card>Three</Card>
                <Card>Four</Card><Card>Five</Card><Card>Six</Card>
            </Grid></div>

            <Heading level={3}>Grid - a fixed three columns</Heading>
            <div id="fixed-grid"><Grid columns={3} gap="sm">
                <Statistic title="Revenue" value="$38k"/>
                <Statistic title="Costs" value="$19k"/>
                <Statistic title="Margin" value="50%"/>
            </Grid></div>

            <Heading level={3}>Grid - a form</Heading>
            <div id="form-grid"><Grid minColumnWidth="12em" gap="md">
                <TextBox type="text" placeholder="First name"/>
                <TextBox type="text" placeholder="Last name"/>
                <TextBox type="email" placeholder="Email"/>
                <TextBox type="phone" placeholder="Phone"/>
            </Grid></div>
        </div>
    }
}

class LayoutPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><LayoutGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><LayoutGallery/></div>
        </div>
    }
}

Theme.injectStyles()
setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><LayoutPage/></TestModulePage>, mainPage)
}
