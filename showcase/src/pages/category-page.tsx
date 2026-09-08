import { Component, setStylesheet } from "@velotype/velotype"
import type { RenderableElements } from "@velotype/velotype"

import { Breadcrumbs, History } from "../../../src/index.ts"
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
.vtd-showcase-category-page h1{margin-block:0.4em 0.2em;}
.vtd-showcase-category-page-description{color:var(--background-9);font-size:1.05em;margin-block-end:2em;}
.vtd-showcase-category-entries{display:flex;flex-direction:column;gap:1.75em;}
.vtd-showcase-category-entry-header{display:flex;align-items:baseline;justify-content:space-between;margin-block-end:0.5em;}
.vtd-showcase-category-entry-header h2{margin:0;}
.vtd-showcase-category-entry-link{color:inherit;text-decoration:none;font-size:0.9em;}
.vtd-showcase-category-entry-link:hover{color:var(--primary-8);}
.vtd-showcase-category-entry-description{color:var(--background-9);font-size:0.9em;margin-block-end:0.6em;}
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
            <h1>{attrs.group}</h1>
            <p class="vtd-showcase-category-page-description">{attrs.docs.length} component{attrs.docs.length == 1 ? "" : "s"} in this category.</p>

            <div class="vtd-showcase-category-entries">
                {attrs.docs.map(doc => {
                    // `example.node` is a factory (see the ExampleDoc doc comment), so calling
                    // it here builds this page's own independent instance rather than reusing
                    // one shared with ComponentPage - each place an example is shown gets one
                    // that's actually mounted where it's being displayed.
                    const preview = doc.examples.length > 0 ? doc.examples[0].node() : doc.render(doc.defaultProps, () => {})
                    return <div>
                        <div class="vtd-showcase-category-entry-header">
                            <h2>{doc.name}</h2>
                            <a
                                class="vtd-showcase-category-entry-link"
                                href={`/components/${doc.slug}`}
                                onClick={(event: Event) => { event.preventDefault(); History.changeLocation(`/components/${doc.slug}`) }}>View details →</a>
                        </div>
                        <p class="vtd-showcase-category-entry-description">{doc.description}</p>
                        <div class="vtd-showcase-example-preview">{preview}</div>
                    </div>
                })}
            </div>
        </div>
    }
}

/** URL for a category's overview page */
export function categoryPageUrl(group: string): string {
    return `/category/${groupSlug(group)}`
}
