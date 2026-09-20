import {replaceElementWithRoot, Component} from "@velotype/velotype"
import type {EmptyAttrs} from "@velotype/velotype"

import { CodeBlock, Heading, setThemeOnSelector, Theme } from "../../src/index.ts"
import { TestModulePage } from "./module-page.tsx"

const tsxSample = `import { Button, Stack } from "@velotype/velodesign"

// A row of actions, gap drawn from the shared scale
export function SaveBar(attrs: {onSave: () => void}) {
    const count = 3
    return <Stack gap="sm" align="center">
        <Button type="primary" onClick={attrs.onSave}>Save all {count}</Button>
        <Button type="text">Cancel</Button>
    </Stack>
}`

const cssSample = `/* Token colours only - never a literal */
.vtd-code-block {
    background-color: var(--background-1);
    border: 1px solid var(--background-4);
    padding: 1em;
    font-size: 0.85em;
}`

const plainSample = `$ deno task bundle
Bundled 98 modules in 328ms
  build/main.js    458.45KB`

/* A multi-line block comment and a template literal both straddle newlines - the case the
   line-number regrouping has to split rather than assume tokens and lines line up. */
const straddlingSample = `/*
 * A comment that spans
 * three source lines.
 */
const greeting = \`hello
world\``

/*
 * Prose between JSX tags, plus a generic and an arrow function - the three cases that each made the
 * highlighter treat code as text or text as code. "so two blocks of prose set side by side" holds
 * `of`, `set` and `as`, all real TypeScript keywords; "package's" is a lone apostrophe that must
 * not open a string; `getComponent<Command>` is a generic, not a tag; and the `=>` inside an
 * attribute must not end the tag it sits in.
 */
/*
 * The element sits directly against the words on both sides, and there is a generic on the last
 * line that must still NOT be read as a tag. Both halves matter: fixing one by deleting the guard
 * breaks the other.
 */
const voidTagSample = `<div>Above<Divider/>Below</div>
const tree = getComponent<Tree>(<Tree nodes={nodes}/>)`

const jsxTextSample = `const palette = getComponent<Command>(<Command items={[]}/>)

return <div>
    <Paragraph>Paragraphs carry the package's line height, so two blocks of
    prose set side by side agree about their rhythm.</Paragraph>
    <Button onClick={() => palette.showModal()}>Open</Button>
</div>`

class CodeBlockGallery extends Component<EmptyAttrs> {
    override render() {
        return <div style={{marginTop: "10px", maxWidth: "620px"}}>
            <Heading level={3}>tsx (the default)</Heading>
            <div id="code-tsx"><CodeBlock code={tsxSample} ariaLabel="A tsx example"/></div>

            <Heading level={3}>With line numbers</Heading>
            <div id="code-numbered"><CodeBlock code={tsxSample} showLineNumbers ariaLabel="A numbered tsx example"/></div>

            <Heading level={3}>A token straddling a newline, numbered</Heading>
            <div id="code-straddle"><CodeBlock code={straddlingSample} showLineNumbers ariaLabel="A multi-line comment example"/></div>

            <Heading level={3}>css</Heading>
            <div id="code-css"><CodeBlock code={cssSample} language="css" ariaLabel="A css example"/></div>

            <Heading level={3}>plain - no highlighting</Heading>
            <div id="code-plain"><CodeBlock code={plainSample} language="plain" ariaLabel="A shell session"/></div>

            <Heading level={3}>A long line scrolls rather than wrapping</Heading>
            <div id="code-scroll"><CodeBlock code={`const wide = ["${"alpha, beta, gamma, delta, epsilon, zeta, eta, theta".repeat(3)}"]`} ariaLabel="A long line"/></div>

            <Heading level={3}>The same line, wrapped</Heading>
            <div id="code-wrapped"><CodeBlock wrap code={`const wide = ["${"alpha, beta, gamma, delta, epsilon, zeta, eta, theta".repeat(3)}"]`} ariaLabel="A long wrapped line"/></div>

            <Heading level={3}>Prose between tags is not code</Heading>
            <div id="code-jsx-text"><CodeBlock code={jsxTextSample} ariaLabel="A JSX text example"/></div>

            <Heading level={3}>Markup is shown, never rendered</Heading>
            {/* An element butting straight up against the text beside it, with no space - the case
                the opening-tag guard used to reject, taking the element depth with it */}
            <div id="code-void-tag"><CodeBlock code={voidTagSample} ariaLabel="A self-closing tag inside text"/></div>

            <div id="code-escaped"><CodeBlock code={`<script>alert(1)</script>\n<b>not bold</b>`} ariaLabel="Markup shown as text"/></div>
        </div>
    }
}

class CodeBlockPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{display: "flex"}}>
            <div id="showcase-theme-light" data-theme="light" style={{padding:"8px",flexGrow: 1,minHeight: "100vh"}}><CodeBlockGallery/></div>
            <div id="showcase-theme-dark" data-theme="dark" style={{padding:"8px",flexGrow: 1}}><CodeBlockGallery/></div>
        </div>
    }
}

Theme.injectStyles()
setThemeOnSelector("#showcase-theme-light")
setThemeOnSelector("#showcase-theme-dark")

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<TestModulePage><CodeBlockPage/></TestModulePage>, mainPage)
}
