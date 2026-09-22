/**
 * Runs the Astral suite over every gallery module, or over a chosen few.
 *
 * ⚠️ **Not named `test.ts`, and that is not cosmetic.** Deno's test discovery matches
 * `**\/test.{ts,js,...}` as well as `*.test.ts` and `*_test.ts`, so a file called `scripts/test.ts`
 * is picked up and *run as a test module* by a bare `deno test`. This script spawns `deno test` at
 * module scope, so that run discovered it again, which spawned another - deno processes multiplying
 * at about two a second until the machine ran out of memory. It looks like a leak from the outside
 * and it is a fork bomb.
 *
 * The full suite is the gate and nothing here weakens it - `deno task test` still bundles and drives
 * all of them. What this adds is a way to iterate without paying for the other seventy:
 *
 *   deno task test                     everything (what CI runs)
 *   deno task test:only button tabs    those modules, bundled and tested
 *   deno task test:changed             whatever the working tree touches, worked out from git
 *
 * Both subset modes narrow the *bundling* and the *tests* together, from one list, so a test can
 * never run against a module that was not rebuilt.
 */
import { allModules, bundleModules } from "../tests/bundle.ts"

const root = new URL("../", import.meta.url).pathname

/**
 * Modules a test navigates to directly, beyond the one its `itWrap` names.
 *
 * Read out of the test source rather than listed here, because a list would be one more thing to
 * keep in step - and the failure mode if it drifted is the worst kind: the page 404s, the selector
 * is missing, and the test fails for a reason that has nothing to do with the change being made.
 */
async function companionModules(): Promise<string[]> {
    const source = await Deno.readTextFile(`${root}tests/basic_tests.test.ts`)
    return [...source.matchAll(/\$\{baseUrl\}\/([a-z-]+)/g)].map(match => match[1])
}

/** Everything that always forces the whole suite, because it reaches most of the package */
function isCrossCutting(path: string): boolean {
    return path.startsWith("src/core/")
        || path === "src/index.ts"
        || path.startsWith("tests/basic_tests")
        || /src\/.*\/(data-table-view|disclosure-view|chart-common|chart-frame|typography-common|spacing)\.tsx?$/.test(path)
}

/**
 * Maps a changed file onto the gallery modules that exercise it.
 *
 * Returns `undefined` to mean "everything", which is the answer whenever the change is shared or
 * cannot be placed - guessing narrowly here would hand back a green subset that never ran the test
 * for the thing that changed.
 */
function modulesForChange(path: string, known: Set<string>): string[] | undefined {
    if (isCrossCutting(path)) {
        return undefined
    }
    const match = path.match(/^(?:src|tests\/test_modules)\/(?:([a-z-]+)\/)?([a-z0-9-]+)\.tsx?$/)
    if (!match) {
        return undefined
    }
    const [, category, stem] = match
    if (known.has(stem)) {
        return [stem]
    }
    // A component with no gallery page of its own is covered by its category's page
    const byCategory: Record<string, string> = {charts: "charts", typography: "typography", layout: "layout"}
    const fallback = category ? byCategory[category] : undefined
    return fallback && known.has(fallback) ? [fallback] : undefined
}

async function changedModules(known: Set<string>): Promise<string[] | undefined> {
    const git = await new Deno.Command("git", {
        args: ["status", "--porcelain", "--untracked-files=all"], cwd: root, stdout: "piped", stderr: "null",
    }).output()
    if (!git.success) {
        console.log("git said nothing useful, so running everything")
        return undefined
    }
    const paths = new TextDecoder().decode(git.stdout).split("\n")
        .map(line => line.slice(3).trim()).filter(line => line.length > 0)
    if (paths.length === 0) {
        console.log("nothing changed")
        return []
    }
    const selected = new Set<string>()
    for (const path of paths) {
        const modules = modulesForChange(path, known)
        if (modules === undefined) {
            console.log(`${path} reaches the whole package, so running everything`)
            return undefined
        }
        for (const module of modules) {
            selected.add(module)
        }
    }
    return [...selected].sort()
}

const known = new Set(await allModules())
const args = Deno.args.filter(arg => !arg.startsWith("--"))
const wantsChanged = Deno.args.includes("--changed")

let selection: string[] | undefined
if (wantsChanged) {
    selection = await changedModules(known)
} else if (args.length > 0) {
    selection = args
}

if (selection !== undefined && selection.length === 0) {
    console.log("no modules to test")
    Deno.exit(0)
}

// Bundle exactly what will be driven, plus whatever the tests navigate to on their own
const toBundle = selection === undefined ? [] : [...new Set([...selection, ...(await companionModules()).filter(m => known.has(m))])]
const {built, skipped} = await bundleModules(toBundle, false)
console.log(`bundled ${built}, skipped ${skipped} already current`)
console.log(selection === undefined ? "testing every module" : `testing: ${selection.join(", ")}`)

const env: Record<string, string> = {}
if (selection !== undefined) {
    env["VTD_MODULES"] = selection.join(",")
}
const test = await new Deno.Command(Deno.execPath(), {
    args: ["test", "--allow-read", "--allow-net", "--allow-sys", "--allow-env", "--allow-write", "--allow-run"],
    cwd: root, env, stdout: "inherit", stderr: "inherit",
}).output()
Deno.exit(test.code)
