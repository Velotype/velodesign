/**
 * Every name velodesign takes from velotype, in one place - and the only module in `src/` that
 * names `@velotype/velotype` at all.
 *
 * **This exists for the bytes, not for tidiness.** esbuild emits one `import` statement per source
 * module that imports an external package, each binding its own alias, and never merges them - and
 * it keeps that statement for every module it *scanned*, tree-shaken or not, because an external
 * module might have side effects it cannot rule out. Importing velotype directly from 87 files
 * therefore cost 150 statements and 9,415 bytes in every consumer bundle regardless of how little
 * of the package they used: a Button-only bundle measured 15,964 bytes, of which 9,415 were import
 * statements for components that had been shaken out. Through this barrel the same bundle is 6,605.
 *
 * So the rule is: **nothing in `src/` imports `@velotype/velotype` except this file and its
 * `jsx-runtime.ts` sibling.** A new component imports from here.
 *
 * ⚠️ **It has to be an explicit list - never `export *`.** Against an external package esbuild
 * cannot enumerate the names, so it falls back to a namespace import plus a `__reExport` helper and
 * rewrites every call site to `(0, ns.foo)()`, which is an indirect property access that defeats
 * tree-shaking outright. The explicit list costs nothing to maintain: a name that is missing is a
 * compile error, so it cannot silently drift the way a hand-written stand-in would.
 */
export { Component, getComponent, passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
export type {
    AnchorElement,
    ChildrenAttr,
    EmptyAttrs,
    FunctionComponent,
    IdAttr,
    RenderBasic,
    RenderObject,
    RenderableElements,
    StylePassthroughAttrs,
    TargetedEvent,
    TargetedInputEvent,
    TargetedMouseEvent,
} from "@velotype/velotype"
