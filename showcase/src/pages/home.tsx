import { Component, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs } from "@velotype/velotype"

import { Badge, Button, Card, History, Statistic } from "../../../src/index.ts"
import { componentDocs, groupedDocs } from "../data/docs.ts"

let areHomeStylesMounted = false

/** The landing page: hero, library stats, and a grid of category cards linking into the sidebar's groups */
export class HomePage extends Component<EmptyAttrs> {
    override render() {
        if (!areHomeStylesMounted) {
            areHomeStylesMounted = true
            setStylesheet(`
.vtd-showcase-hero{
padding:4em 2em 3em 2em;
text-align:center;
border-block-end:1px solid var(--background-4);
}
.vtd-showcase-hero h1{font-size:2.5em;margin-block-end:0.25em;}
.vtd-showcase-hero p{font-size:1.15em;color:var(--background-9);max-width:34em;margin:0 auto 1.5em auto;}
.vtd-showcase-hero-actions{display:flex;justify-content:center;gap:1em;}
.vtd-showcase-stats{
display:flex;
justify-content:center;
gap:3em;
padding:2em;
border-block-end:1px solid var(--background-4);
flex-wrap:wrap;
}
.vtd-showcase-section{padding:2em;}
.vtd-showcase-section h2{margin-block-end:1em;}
.vtd-showcase-category-grid{
display:grid;
grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));
gap:1em;
}
.vtd-showcase-category-card{cursor:pointer;height:100%;}
.vtd-showcase-category-card:hover{border-color:var(--primary-6);}
.vtd-showcase-category-names{color:var(--background-9);font-size:0.9em;margin-block-start:0.5em;}
`, "velodesign-showcase/HomePage")
        }

        const groups = groupedDocs()

        return <div>
            <section class="vtd-showcase-hero">
                <h1>velodesign</h1>
                <p>A themed UI component library for Velotype that wraps native HTML elements instead of
                    reimplementing them - {componentDocs.length} components across {groups.length} categories,
                    with zero JavaScript UI framework dependency.</p>
                <div class="vtd-showcase-hero-actions">
                    <Button type="primary" onClick={() => History.changeLocation(`/components/${componentDocs[0].slug}`)}>Browse components</Button>
                    <Button type="secondary" onClick={() => History.changeLocation(`/components/${groups[0].docs[0].slug}`)}>Get started</Button>
                </div>
            </section>

            <section class="vtd-showcase-stats">
                <Statistic title="Components" value={componentDocs.length}/>
                <Statistic title="Categories" value={groups.length}/>
                <Statistic title="Runtime dependencies" value={0}/>
            </section>

            <section class="vtd-showcase-section">
                <h2>Browse by category</h2>
                <div class="vtd-showcase-category-grid">
                    {groups.map(bucket => <div class="vtd-showcase-category-card" onClick={() => History.changeLocation(`/components/${bucket.docs[0].slug}`)}>
                        <Card header={<span>{bucket.group} <Badge type="neutral">{bucket.docs.length}</Badge></span>}>
                            <div class="vtd-showcase-category-names">{bucket.docs.map(doc => doc.name).join(", ")}</div>
                        </Card>
                    </div>)}
                </div>
            </section>
        </div>
    }
}
