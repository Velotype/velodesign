import { createElement, createFragment } from "@velotype/velotype"
import type { Component } from "@velotype/velotype"
import type { JSX as VelotypeJSX } from "@velotype/velotype/jsx-runtime"

/**
 * The JSX factory and fragment factory for every `.tsx` file in the package.
 *
 * `deno.json` sets `"jsx": "react"` with `jsxFactory` `h` and `jsxFragmentFactory` `f`, and each
 * `.tsx` file imports them from here. This is the only module that names `@velotype/velotype`
 * for JSX, so a bundle with velotype held out has one import statement for it from here, instead
 * of one per `.tsx` file, which is what the automatic transform writes. (`velotype.ts` is the
 * other, for everything that is not JSX.)
 *
 * It is not the automatic transform with `jsxImportSource` pointing at this package, which is
 * what this replaced: JSR's server cannot build the module graph for a package whose
 * `jsxImportSource` is its own export ("export 'jsx-runtime' not found"), even once that export
 * is published, so such a package cannot be published.
 *
 * Not exported from `index.ts`: a consumer has no reason to use it.
 */
// deno-lint-ignore no-explicit-any
export function h(tag: any, attrs: any, ...children: any[]): any {
    return createElement(tag, attrs, ...children)
}

/**
 * The JSX namespace that TypeScript looks for on the factory. Without it every intrinsic element
 * is untyped. It restates the three members of velotype's, because a type-only import of a
 * namespace cannot be aliased into one.
 */
// deno-lint-ignore no-namespace
export namespace h {
    // deno-lint-ignore no-namespace
    export namespace JSX {
        // deno-lint-ignore no-explicit-any
        export type ElementType<C extends Component<any>> = VelotypeJSX.ElementType<C>
        export type Element = VelotypeJSX.Element
        export interface IntrinsicElements extends VelotypeJSX.IntrinsicElements {}
    }
}

// deno-lint-ignore no-explicit-any
export const f: (attrs: any, ...children: any[]) => any = createFragment
