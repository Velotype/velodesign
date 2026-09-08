import { Component, setStylesheet } from "@velotype/velotype"
import type { RenderableElements } from "@velotype/velotype"

import { Breadcrumbs, History, Table } from "../../../src/index.ts"
import { componentDocs, type ComponentDoc, type PropDoc } from "../data/docs.tsx"

export type ComponentPageAttrsType = {
    doc: ComponentDoc
}

let areComponentPageStylesMounted = false

/**
 * A single component's documentation page: breadcrumb, title, description, a gallery of
 * labeled example variants (the different common states/uses of the component - e.g. Button's
 * "Types" and "Disabled" examples), a prop reference table, and prev/next navigation through
 * the full component list.
 */
export class ComponentPage extends Component<ComponentPageAttrsType> {
    constructor(attrs: ComponentPageAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!areComponentPageStylesMounted) {
            areComponentPageStylesMounted = true
            setStylesheet(`
.vtd-showcase-doc{padding:2em;max-width:56em;}
.vtd-showcase-doc h1{margin-block:0.4em 0.2em;}
.vtd-showcase-doc-description{color:var(--background-9);font-size:1.05em;margin-block-end:1.5em;}
.vtd-showcase-doc h2{margin-block-end:0.75em;}
.vtd-showcase-examples{display:flex;flex-direction:column;gap:1.25em;margin-block-end:2em;}
.vtd-showcase-example-label{font-size:0.85em;font-weight:bold;color:var(--background-9);margin-block-end:0.5em;}
.vtd-showcase-example-preview{
border:1px solid var(--background-4);
border-radius:0.5rem;
padding:2em;
display:flex;
align-items:center;
min-height:3em;
background-image:radial-gradient(color-mix(in srgb, var(--background-4) 35%, transparent) 1px, transparent 1px);
background-size:16px 16px;
}
.vtd-showcase-props{margin-block-end:2em;}
.vtd-showcase-page-nav{
display:flex;
justify-content:space-between;
border-block-start:1px solid var(--background-4);
padding-block-start:1.5em;
}
.vtd-showcase-page-nav a{color:inherit;text-decoration:none;font-weight:bold;}
.vtd-showcase-page-nav a:hover{color:var(--primary-8);}
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
            <h1>{doc.name}</h1>
            <p class="vtd-showcase-doc-description">{doc.description}</p>

            {doc.examples.length > 0 ? <div class="vtd-showcase-examples">
                {doc.examples.map(example => <div>
                    <div class="vtd-showcase-example-label">{example.label}</div>
                    <div class="vtd-showcase-example-preview">{example.node()}</div>
                </div>)}
            </div> : <div class="vtd-showcase-example-preview" style={{marginBlockEnd: "2em"}}>{doc.render(doc.defaultProps, () => {})}</div>}

            {doc.props.length > 0 ? <div class="vtd-showcase-props">
                <h2>Props</h2>
                <Table<PropDoc>
                    columns={[
                        {key: "name", header: "Prop", render: (row: PropDoc) => row.name},
                        {key: "type", header: "Type", render: (row: PropDoc) => row.type},
                        {key: "description", header: "Description", render: (row: PropDoc) => row.description},
                    ]}
                    rows={doc.props}/>
            </div> : null}

            <div class="vtd-showcase-page-nav">
                {prev ? <a href={`/components/${prev.slug}`} onClick={(event: Event) => { event.preventDefault(); History.changeLocation(`/components/${prev.slug}`) }}>← {prev.name}</a> : <span/>}
                {next ? <a href={`/components/${next.slug}`} onClick={(event: Event) => { event.preventDefault(); History.changeLocation(`/components/${next.slug}`) }}>{next.name} →</a> : <span/>}
            </div>
        </div>
    }
}
