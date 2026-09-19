import { Component, setStylesheet } from "@velotype/velotype"
import type { RenderableElements } from "@velotype/velotype"

import { Badge, Breadcrumbs, CodeBlock, Heading, Link, Paragraph, Stack, Table, Text } from "../../../src/index.ts"
import { componentDocs, type ComponentDoc, type AttrDoc, type MethodDoc } from "../data/docs.tsx"

export type ComponentPageAttrsType = {
    doc: ComponentDoc
}

let areComponentPageStylesMounted = false

/**
 * A single component's documentation page: breadcrumb, title, description, a gallery of
 * labeled example variants (the different common states/uses of the component - e.g. Button's
 * "Types" and "Disabled" examples), an attribute reference table, and prev/next navigation through
 * the full component list.
 */
/**
 * Splits a dotted path so it can wrap at its dots.
 *
 * `ModalThemeOptions.cancelSymbol` has no space in it, so a narrow column breaks it wherever the
 * line happens to end - "ModalThem / eOptions.c / ancelSymbo / l". A `<wbr/>` after each dot gives
 * the browser a break opportunity it prefers, and unlike a zero-width space it adds no character
 * to what gets copied out of the cell.
 */
function breakAtDots(value: string): RenderableElements {
    const parts = value.split(".")
    if (parts.length < 2) {
        return value
    }
    return <span>{parts.map((part, index) => index == 0 ? part : <span>.<wbr/>{part}</span>)}</span>
}

export class ComponentPage extends Component<ComponentPageAttrsType> {
    constructor(attrs: ComponentPageAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!areComponentPageStylesMounted) {
            areComponentPageStylesMounted = true
            setStylesheet(`
/*
 * Wider than the 56em the other pages use, because this one is carrying a four-column reference
 * table rather than prose. At 56em the Attribute column could not hold "confirmButtonChildren"
 * without breaking it mid-word. The lede paragraph below is capped separately so the prose itself
 * still reads at a sane measure.
 */
.vtd-showcase-doc{padding:2em;max-width:62em;}
/* Paragraph supplies the colour; this only sizes and spaces the page's lede */
.vtd-showcase-doc-description{font-size:1.05em;margin-block-end:1.5em;max-width:44em;}
.vtd-showcase-examples{margin-block-end:2em;}
/* Text carries the colour and weight; this is the label's own size and spacing */
.vtd-showcase-example-label{font-size:0.85em;margin-block-end:0.5em;}
.vtd-showcase-example-preview{
border:1px solid var(--background-4);
/* Square off the edge the code block butts against - the two read as one unit */
border-radius:0.5rem 0.5rem 0 0;
border-block-end:none;
padding:2em;
display:flex;
align-items:center;
min-height:3em;
background-image:radial-gradient(color-mix(in srgb, var(--background-4) 35%, transparent) 1px, transparent 1px);
background-size:16px 16px;
}
/* CodeBlock draws the panel; this only joins it to the preview sitting directly above */
.vtd-showcase-example-code{border-radius:0 0 0.5rem 0.5rem;}
.vtd-showcase-attrs{margin-block-end:2em;}
.vtd-showcase-methods{margin-block-end:2em;}
.vtd-showcase-children{margin-block-end:2em;}
.vtd-showcase-signature{margin-block-end:2em;}
.vtd-showcase-page-nav{border-block-start:1px solid var(--background-4);padding-block-start:1.5em;}
.vtd-showcase-page-nav .vtd-link{color:inherit;text-decoration:none;font-weight:bold;}
.vtd-showcase-page-nav .vtd-link:hover{color:var(--primary-8);}
`, "velodesign-showcase/ComponentPage")
        }
    }

    override render(attrs: ComponentPageAttrsType): RenderableElements {
        const doc = attrs.doc
        const index = componentDocs.findIndex(candidate => candidate.slug == doc.slug)
        const prev = index > 0 ? componentDocs[index - 1] : undefined
        const next = index >= 0 && index < componentDocs.length - 1 ? componentDocs[index + 1] : undefined

        return <div class="vtd-showcase-doc">
            <Breadcrumbs spa items={[{label: "Home", to: "/"}, {label: doc.group}, {label: doc.name}]}/>
            <Stack align="center" gap="sm">
                <Heading level={1}>{doc.name}</Heading>
                {doc.kind == "function" ? <Badge type="secondary">Function</Badge> : null}
            </Stack>
            <Paragraph type="muted" class="vtd-showcase-doc-description">{doc.description}</Paragraph>

            {doc.signature ? <div class="vtd-showcase-signature">
                <Heading level={2}>Signature</Heading>
                <CodeBlock code={doc.signature} ariaLabel={`How to call ${doc.name}`}/>
            </div> : null}

            {doc.examples.length > 0 ? <Stack direction="column" gap="lg" class="vtd-showcase-examples">
                {doc.examples.map(example => <div>
                    <div class="vtd-showcase-example-label"><Text type="muted" strong>{example.label}</Text></div>
                    <div class="vtd-showcase-example-preview">{example.node()}</div>
                    <CodeBlock
                        class="vtd-showcase-example-code"
                        code={example.code}
                        ariaLabel={`${doc.name} - ${example.label} source`}/>
                </div>)}
            </Stack> : <div class="vtd-showcase-example-preview" style={{marginBlockEnd: "2em"}}>{doc.render(doc.defaultAttrs, () => {})}</div>}

            {doc.attrs.length > 0 ? <div class="vtd-showcase-attrs">
                <Heading level={2}>{doc.kind == "function" ? "Parameters" : "Attributes"}</Heading>
                <Table<AttrDoc>
                    columns={[
                        {key: "name", header: doc.kind == "function" ? "Parameter" : "Attribute", width: "23%", render: (row: AttrDoc) =>
                            // Only required is marked. Optional is the default state - it is how
                            // every attrs type is written (`foo?: string`) and it is 282 of 341
                            // rows, so a marker on those would be noise the eye has to filter.
                            row.required
                                ? <Stack inline gap="xs" align="center"><Text>{row.name}</Text><Badge type="warning">required</Badge></Stack>
                                : <Text>{row.name}</Text>},
                        {key: "type", header: "Type", width: "22%", render: (row: AttrDoc) => row.type},
                        {key: "default", header: "Default", width: "15%", render: (row: AttrDoc) => {
                            // One representation for "there is no default", whatever the reason -
                            // the attr is required, or the component deliberately falls back to
                            // nothing. Those were once an em dash and the word "none" separately,
                            // which read as a distinction the reader then had to work out.
                            if (!row.defaultValue) {
                                return <Text type="muted">—</Text>
                            }
                            // A conditional default ("true for a row, never for a column") is
                            // prose. Monospacing it would claim it is something you could pass.
                            const isLiteral = !/\s/.test(row.defaultValue) || /^\[.*\]$/.test(row.defaultValue)
                            return isLiteral ? <Text code>{breakAtDots(row.defaultValue)}</Text> : <Text>{row.defaultValue}</Text>
                        }},
                        {key: "description", header: "Description", render: (row: AttrDoc) => row.description},
                    ]}
                    rows={doc.attrs}/>
            </div> : null}

            {doc.methods && doc.methods.length > 0 ? <div class="vtd-showcase-methods">
                <Heading level={2}>Methods</Heading>
                <Paragraph type="muted">Called on the component, not passed to it.</Paragraph>
                <Table<MethodDoc>
                    columns={[
                        {key: "name", header: "Method", width: "25%", render: (row: MethodDoc) => <Text code>{row.name}</Text>},
                        {key: "description", header: "Description", render: (row: MethodDoc) => row.description},
                    ]}
                    rows={doc.methods}/>
            </div> : null}

            {doc.children ? <div class="vtd-showcase-children">
                <Heading level={2}>Children</Heading>
                <Paragraph>{doc.children}</Paragraph>
            </div> : null}

            <Stack justify="between" class="vtd-showcase-page-nav">
                {prev ? <Link spa to={`/components/${prev.slug}`}>← {prev.name}</Link> : <span/>}
                {next ? <Link spa to={`/components/${next.slug}`}>{next.name} →</Link> : <span/>}
            </Stack>
        </div>
    }
}
