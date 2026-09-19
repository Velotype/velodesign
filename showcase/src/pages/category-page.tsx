import { Component, setStylesheet } from "@velotype/velotype"
import type { RenderableElements } from "@velotype/velotype"

import { Breadcrumbs, Heading, Link, Paragraph, Stack } from "../../../src/index.ts"
import { groupSlug, type ComponentDoc } from "../data/docs.tsx"

export type CategoryPageAttrsType = {
    group: string
    docs: ComponentDoc[]
}

let areCategoryPageStylesMounted = false

/**
 * A category overview page: every component in one group (e.g. "Form", "Data Display"), each
 * with its name (linking through to the full component page) and a live preview of at least
 * its first documented example - some components' examples already bundle several variants
 * into one preview (e.g. Badge's "Types" row), so a single example can show more than one state.
 */
export class CategoryPage extends Component<CategoryPageAttrsType> {
    constructor(attrs: CategoryPageAttrsType, children: RenderableElements[]) {
        super(attrs, children)
        if (!areCategoryPageStylesMounted) {
            areCategoryPageStylesMounted = true
            setStylesheet(`
.vtd-showcase-category-page{padding:2em;max-width:56em;}
/* Target Heading's own class, not the tag it happens to render */
.vtd-showcase-category-page .vtd-heading-1{margin-block:0.4em 0.2em;}
/* Paragraph carries the colour; this is the page lede's own size and spacing */
.vtd-showcase-category-page-description{font-size:1.05em;margin-block-end:2em;}
/* Stack lays the header out; this is only its spacing below */
.vtd-showcase-category-entry-header{margin-block-end:0.5em;}
.vtd-showcase-category-entry-header .vtd-heading{margin:0;}
.vtd-showcase-category-entry-link{color:inherit;text-decoration:none;font-size:0.9em;}
.vtd-showcase-category-entry-link:hover{color:var(--primary-8);}
.vtd-showcase-category-entry-description{font-size:0.9em;margin-block-end:0.6em;}
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
`, "velodesign-showcase/CategoryPage")
        }
    }

    override render(attrs: CategoryPageAttrsType): RenderableElements {
        return <div class="vtd-showcase-category-page">
            <Breadcrumbs spa items={[{label: "Home", to: "/"}, {label: attrs.group}]}/>
            <Heading level={1}>{attrs.group}</Heading>
            <Paragraph type="muted">{attrs.docs.length} component{attrs.docs.length == 1 ? "" : "s"} in this category.</Paragraph>

            <Stack direction="column" gap="xl">
                {attrs.docs.map(doc => {
                    // `example.node` is a factory (see the ExampleDoc doc comment), so calling
                    // it here builds this page's own independent instance rather than reusing
                    // one shared with ComponentPage - each place an example is shown gets one
                    // that's actually mounted where it's being displayed.
                    const preview = doc.examples.length > 0 ? doc.examples[0].node() : doc.render(doc.defaultAttrs, () => {})
                    return <div>
                        <Stack justify="between" align="center" class="vtd-showcase-category-entry-header">
                            <Heading level={2}>{doc.name}</Heading>
                            <Link spa to={`/components/${doc.slug}`} class="vtd-showcase-category-entry-link">View details →</Link>
                        </Stack>
                        <Paragraph type="muted">{doc.description}</Paragraph>
                        <div class="vtd-showcase-example-preview">{preview}</div>
                    </div>
                })}
            </Stack>
        </div>
    }
}

/** URL for a category's overview page */
export function categoryPageUrl(group: string): string {
    return `/category/${groupSlug(group)}`
}
