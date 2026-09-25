/**
 * Measures what a consumer actually downloads for the whole of velodesign.
 *
 * `src/index.ts` is the package's only entrypoint, so bundling it minified is the honest ceiling:
 * every component, every stylesheet string, no tree-shaking a real app would get. The gzip figure
 * is the one that matters over the wire and is what the showcase leads with.
 *
 * **Two figures, because velotype's bytes are not velodesign's.** In production velotype is its own
 * module import, shared with everything else built on it - the showcase loads it through an import
 * map for exactly that reason - so a bundle with velotype folded inside reports a size no consumer
 * pays velodesign. `own` is velodesign alone, held out with `--external`; `raw`/`gzip` are the whole
 * graph with velotype inlined, which is what a plain `deno bundle` produces.
 *
 * Both `--external "@velotype/velotype"` and `--external "@velotype/velotype/jsx-runtime"` are
 * passed. The first alone is enough today - it covers the subpath too, byte for byte - but naming
 * both says what is meant and does not depend on that.
 *
 * ⚠️ **The externalized bundle must contain exactly two import statements**, and that is asserted
 * rather than assumed. esbuild emits one per source module that imports the package and never
 * merges them, so velodesign routes every velotype name through `src/core/velotype.ts` and its
 * `jsx-runtime.ts` sibling; a third statement here means a module has gone around the barrel and
 * is quietly costing every consumer bundle an import statement it cannot tree-shake away. This
 * check replaced a transform that collapsed the duplicates after the fact, which fixed the
 * measurement while leaving consumers to pay the bytes.
 *
 * Three ways to run it:
 *   deno task size            - print a human summary
 *   deno task size --json     - emit JSON, which the pull-request workflow diffs
 *   deno task size --write    - regenerate showcase/src/data/bundle-size.ts
 *
 * The showcase regenerates this on every `deno task bundle`, so the number on the home page is
 * measured from the source it was built with rather than from a value someone remembered to update.
 */

type BundleSizes = {
    raw: number
    gzip: number
    ownRaw: number
    ownGzip: number
    velotypeRaw: number
    velotypeGzip: number
}

const root = new URL("../", import.meta.url).pathname
const entrypoint = `${root}src/index.ts`

const velotypeSpecifiers = ["@velotype/velotype", "@velotype/velotype/jsx-runtime"]

/** Bundles one entrypoint the way a browser consumer would and returns the text */
async function bundleText(entry: string, external: string[]): Promise<string> {
    const outFile = await Deno.makeTempFile({suffix: ".js"})
    try {
        const args = ["bundle", "--minify", "--platform", "browser", "--quiet"]
        for (const specifier of external) {
            args.push("--external", specifier)
        }
        args.push("-o", outFile, entry)
        const bundle = new Deno.Command(Deno.execPath(), {args, cwd: root, stdout: "piped", stderr: "piped"})
        const result = await bundle.output()
        if (!result.success) {
            throw new Error(`deno bundle failed:\n${new TextDecoder().decode(result.stderr)}`)
        }
        return await Deno.readTextFile(outFile)
    } finally {
        await Deno.remove(outFile).catch(() => {})
    }
}

/**
 * Asserts that holding velotype out leaves exactly one import statement per specifier.
 *
 * Nothing in `src/` may import `@velotype/velotype` except `src/core/velotype.ts` and
 * `src/core/jsx-runtime.ts`, so a correct bundle has two statements and no more. The failure this
 * catches is invisible otherwise: an import that goes around the barrel still compiles, still
 * renders, and only shows up as bytes - and it shows up in *every* consumer bundle, because esbuild
 * keeps an external import statement for every module it scanned whether or not that module
 * survived tree-shaking. It was 150 statements and 9,415 bytes before the barrel, on a Button-only
 * bundle as much as on the whole library.
 */
function assertBarrelled(text: string): void {
    const statements = text.match(/import(?:\{[^}]*\}from)?"@velotype\/velotype(?:\/jsx-runtime)?";?/g) ?? []
    if (statements.length != 2) {
        throw new Error(`expected 2 velotype import statements in the externalized bundle, found ${statements.length}.` +
            ` Something in src/ imports "@velotype/velotype" directly instead of through src/core/velotype.ts.`)
    }
}

/**
 * The whole of velotype, bundled as its own module.
 *
 * This is the figure that belongs beside velodesign's, because it is the other thing a consumer
 * downloads: two modules, two requests, which is exactly how the showcase loads them. It is *not*
 * `raw - ownRaw` - that difference is only the part of velotype velodesign happens to reach, after
 * tree-shaking, and no such file is ever served.
 *
 * The entrypoint is written out rather than named, because `deno bundle` resolves an entrypoint as
 * a file path and not through the import map, so pointing at velotype directly would mean writing
 * the pinned version into this script and keeping it in step with `deno.json` by hand. A one-line
 * module resolves the ordinary way. It has to live under the repo root for the root config - and
 * so the import map - to apply.
 */
async function bundleVelotype(): Promise<string> {
    const entryFile = `${root}.velotype-size-entry.ts`
    await Deno.writeTextFile(entryFile, `export * from "@velotype/velotype"\n`)
    try {
        return await bundleText(entryFile, [])
    } finally {
        await Deno.remove(entryFile).catch(() => {})
    }
}

async function measure(): Promise<BundleSizes> {
    const encoder = new TextEncoder()
    const inlined = encoder.encode(await bundleText(entrypoint, []))
    const ownText = await bundleText(entrypoint, velotypeSpecifiers)
    assertBarrelled(ownText)
    const own = encoder.encode(ownText)
    const velotype = encoder.encode(await bundleVelotype())
    return {
        raw: inlined.byteLength,
        gzip: await gzipSize(inlined),
        ownRaw: own.byteLength,
        ownGzip: await gzipSize(own),
        velotypeRaw: velotype.byteLength,
        velotypeGzip: await gzipSize(velotype),
    }
}

/**
 * Compressed size, which is what a consumer's browser actually pulls down.
 *
 * Worth knowing before comparing two of these: gzip output is **not** byte-identical across
 * machines - the same bundle measured 43497 here and 43496 on an ubuntu-24.04 runner, because the
 * zlib behind `CompressionStream` differs. `raw` is deterministic. So compare gzip only between
 * two measurements taken on the same machine, which is what the pull-request workflow does, and
 * never assert it against a committed value.
 */
async function gzipSize(bytes: Uint8Array): Promise<number> {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("gzip"))
    let total = 0
    for await (const chunk of stream) {
        total += (chunk as Uint8Array).byteLength
    }
    return total
}

/** Bytes as the showcase and the pull-request comment both spell them */
export function formatBytes(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KB`
}

const generatedFile = `${root}showcase/src/data/bundle-size.ts`

async function writeGenerated(sizes: BundleSizes) {
    const contents = `/**
 * Generated by \`deno task size --write\`, which the showcase's own bundle task runs first - do not
 * edit by hand.
 *
 * The whole package bundled from its single entrypoint, minified, with nothing tree-shaken away.
 *
 * \`ownRaw\`/\`ownGzip\` are velodesign by itself, with velotype held out of the bundle the way the
 * showcase's import map holds it out at runtime. \`raw\`/\`gzip\` have velotype folded in, which is
 * what a plain \`deno bundle\` produces and is not what a consumer pays velodesign.
 *
 * \`velotypeRaw\`/\`velotypeGzip\` are the whole of velotype as its own module - the second file a
 * consumer downloads, and the figure that pairs with \`own\`. Larger than \`raw - ownRaw\`, which is
 * only the part of velotype velodesign reaches once tree-shaken and is not a file anyone serves.
 *
 * Deliberately carries no timestamp. A generated file that changes every day cannot be checked
 * against a fresh measurement in CI, because the check would start failing the next morning for
 * reasons that have nothing to do with the bundle.
 */
export const bundleSize: {
    raw: number
    gzip: number
    ownRaw: number
    ownGzip: number
    velotypeRaw: number
    velotypeGzip: number
} = {
    raw: ${sizes.raw},
    gzip: ${sizes.gzip},
    ownRaw: ${sizes.ownRaw},
    ownGzip: ${sizes.ownGzip},
    velotypeRaw: ${sizes.velotypeRaw},
    velotypeGzip: ${sizes.velotypeGzip}
}
`
    await Deno.writeTextFile(generatedFile, contents)
}

const sizes = await measure()
if (Deno.args.includes("--json")) {
    console.log(JSON.stringify(sizes))
} else {
    if (Deno.args.includes("--write")) {
        await writeGenerated(sizes)
    }
    console.log(`velodesign bundled from src/index.ts, minified`)
    console.log(`  velodesign alone   raw ${formatBytes(sizes.ownRaw)}  gzip ${formatBytes(sizes.ownGzip)}`)
    console.log(`  velotype inlined   raw ${formatBytes(sizes.raw)}  gzip ${formatBytes(sizes.gzip)}`)
    console.log(`  velotype's share   raw ${formatBytes(sizes.raw - sizes.ownRaw)}  gzip ${formatBytes(sizes.gzip - sizes.ownGzip)}`)
    console.log(`  velotype module    raw ${formatBytes(sizes.velotypeRaw)}  gzip ${formatBytes(sizes.velotypeGzip)}`)
}
