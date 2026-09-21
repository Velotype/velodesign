import { Component, setStylesheet } from "@velotype/velotype"
import type { EmptyAttrs } from "@velotype/velotype"

import { Badge, Button, Card, Grid, Heading, History, I, Paragraph, Stack, Statistic, Text } from "@velotype/velodesign"
import { componentDocs, groupedDocs } from "../data/docs.tsx"
import { bundleSize } from "../data/bundle-size.ts"
import { categoryPageUrl } from "./category-page.tsx"
import { categoryIconKey } from "../data/category-icons.ts"

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
/* Stack handles the row itself; this is the section's own framing */
.vtd-showcase-stats{padding:2em;border-block-end:1px solid var(--background-4);}
/* The hero's prose is centred and measured - a job for the page, not for Paragraph */
.vtd-showcase-hero .vtd-paragraph{font-size:1.15em;max-width:34em;margin:0 auto 1.5em auto;}
.vtd-showcase-section{padding:2em;}
.vtd-showcase-section .vtd-heading-2{margin-block-end:1em;}
/*
 * The wrapper is the click target, so it has to end where the card does. As a grid item it was
 * stretched to the tallest card in its row while the Card inside stayed content-height, leaving a
 * band of invisible clickable space below every short card - align="start" on the Grid sizes each
 * cell to its own content instead.
 */
.vtd-showcase-category-card{cursor:pointer;}
/* Bigger than the line it sits on, the way the sidebar's rail draws it - the icon is the card's
   subject here, not punctuation in a sentence */
.vtd-showcase-category-icon{font-size:1.3em;color:var(--primary-7);}
/* The border belongs to the Card, so the hover has to reach it rather than the bare wrapper */
.vtd-showcase-category-card:hover .vtd-card{border-color:var(--primary-6);}
`, "velodesign-showcase/HomePage")
        }

        const groups = groupedDocs()

        return <div>
            <section class="vtd-showcase-hero">
                <Heading level={1}>velodesign</Heading>
                <Paragraph type="muted">A themed UI component library for Velotype that wraps native HTML elements instead of
                    reimplementing them - {componentDocs.length} components across {groups.length} categories,
                    with zero JavaScript UI framework dependency.</Paragraph>
                <Stack justify="center" gap="lg">
                    <Button type="primary" onClick={() => History.changeLocation(`/components/${componentDocs[0].slug}`)}>Browse components</Button>
                    <Button type="secondary" onClick={() => History.changeLocation("/theme")}>Customize theme</Button>
                </Stack>
            </section>

            <section class="vtd-showcase-stats">
                <Stack justify="center" gap="xl" align="center">
                    <Statistic title="Components" value={componentDocs.length}/>
                    <Statistic title="Categories" value={groups.length}/>
                    <Statistic title="Runtime dependencies" value={0}/>
                    {/*
                      * Measured, not claimed: scripts/bundle-size.ts bundles src/index.ts minified
                      * and this page's own build task regenerates the figure first, so it cannot
                      * drift from the source it was built with. gzip is what a browser pulls down,
                      * which is why it leads and the raw size is the suffix.
                      */}
                    {/* ownGzip, not gzip: the second has velotype folded in, and a consumer does not
                        pay that to velodesign - velotype is its own module import, which is exactly
                        how this page is loading it, through the import map in showcase/server.ts */}
                    <Statistic title="Whole library, gzipped" value={(bundleSize.ownGzip / 1024).toFixed(1)} suffix={<Text type="muted"> KB</Text>}/>
                </Stack>
            </section>

            <section class="vtd-showcase-section">
                <Heading level={2}>Browse by category</Heading>
                <Grid minColumnWidth="15em" gap="md" align="start">
                    {groups.map(bucket => <div class="vtd-showcase-category-card" onClick={() => History.changeLocation(categoryPageUrl(bucket.group))}>
                        <Card header={<Stack inline gap="sm" align="center">
                            {/* The same glyph the sidebar draws for this category, so a reader who
                                learns it in one place recognises it in the other */}
                            <I i={categoryIconKey(bucket.group)} class="vtd-showcase-category-icon"/>
                            {bucket.group}
                            <Badge type="neutral">{bucket.docs.length}</Badge>
                        </Stack>}>
                            <Text type="muted">{bucket.docs.map(doc => doc.name).join(", ")}</Text>
                        </Card>
                    </div>)}
                </Grid>
            </section>
        </div>
    }
}
