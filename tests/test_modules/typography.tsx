import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { Card, Heading, Paragraph, Text, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

class TypographyGallery extends Component<EmptyAttrs> {
    override render() {
        return <div id="typography-gallery" style={{marginTop: "10px", maxWidth: "540px"}}>
            <Heading level={1}>Heading level 1</Heading>
            <Heading level={2}>Heading level 2</Heading>
            <Heading level={3}>Heading level 3</Heading>
            <Heading level={4}>Heading level 4</Heading>
            <Heading level={5}>Heading level 5</Heading>
            <Heading level={6}>Heading level 6</Heading>

            <Paragraph>
                A paragraph of body text, with the package's line height. The last paragraph in a
                container drops its bottom margin.
            </Paragraph>
            <Paragraph type="muted">A muted paragraph, for supporting prose.</Paragraph>

            <Heading level={3}>Text types</Heading>
            <Paragraph>
                <Text>default</Text>{" · "}
                <Text id="muted-text" type="muted">muted</Text>{" · "}
                <Text type="primary">primary</Text>{" · "}
                <Text type="secondary">secondary</Text>{" · "}
                <Text type="warning">warning</Text>{" · "}
                <Text type="danger">danger</Text>
            </Paragraph>

            <Heading level={3}>Modifiers</Heading>
            <Paragraph>
                <Text strong>strong</Text>{" · "}
                <Text italic>italic</Text>{" · "}
                <Text underline>underline</Text>{" · "}
                <Text strike>strike</Text>{" · "}
                <Text id="code-text" code>code</Text>{" · "}
                <Text id="numeric-text" numeric>1,234,567</Text>
            </Paragraph>

            <Heading level={3}>Inside a Card, the last paragraph has no trailing gap</Heading>
            <Card header="A card">
                <Paragraph>First paragraph.</Paragraph>
                <Paragraph id="last-paragraph" type="muted">Last paragraph - no bottom margin.</Paragraph>
            </Card>
        </div>
    }
}

class TypographyPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><TypographyGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><TypographyGallery/></div>
        </div>
    }
}

Theme.injectStyles()
setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><TypographyPage/></TestModulePage>, mainPage)
}
