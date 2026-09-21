/**
 * velodesign's JSX runtime: velotype's, re-exported, so that the import the compiler writes into
 * every `.tsx` file names one module instead of 72.
 *
 * `jsxImportSource` in `deno.json` points at `@velotype/velodesign`, which resolves here through
 * the package's own `./jsx-runtime` export - so the compiler emits
 * `import {jsx} from "@velotype/velodesign/jsx-runtime"` and every one of those collapses into a
 * single statement at bundle time. See `velotype.ts` beside this for why that matters and what it
 * is worth; this half was the larger share of it.
 *
 * **It is reached through a real published export rather than a config-local alias** (a `#name`
 * entry in `imports` works when building here, but a published package is resolved by the
 * consumer, and the fewer things that have to survive that the better). That is the only reason
 * `./jsx-runtime` appears in `exports` - a consumer has no reason to import it, and setting their
 * own `jsxImportSource` to velodesign would only get them velotype's runtime one level removed.
 *
 * ⚠️ **`JSX` has to be re-exported too, and it is a type.** `jsxImportSource` resolves
 * `JSX.IntrinsicElements` through this module, so re-exporting only the three functions leaves
 * every intrinsic element untyped - 616 errors, all of them `TS7026`, none of them pointing here.
 */
export { Fragment, jsx, jsxs } from "@velotype/velotype/jsx-runtime"
export type { JSX } from "@velotype/velotype/jsx-runtime"
