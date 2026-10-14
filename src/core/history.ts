import { consoleError } from "./utilities.ts"

let basePath = ""

/**
 * A collection of useful functions to manage browser History
 */
export const History = {
    /**
     * Declares the root-relative prefix the app is deployed under - `"/velodesign"` for a site
     * served at `https://example.com/velodesign/`, or `""` (the default) for one served at the
     * domain root. Every `to`/`href` a consumer writes elsewhere in the library (`NavLink`,
     * `Link`, `Sidebar`, `Menu`, ...) stays a plain root-relative path like `/components/x` -
     * this is the one place that knows about the deployment's own prefix, so a consumer never
     * threads it through every route by hand. Call it once, before the app's first render.
     */
    configureBasePath: function(newBasePath: string): void {
        const trimmed = newBasePath.replace(/\/+$/, "")
        basePath = trimmed == "" || trimmed == "/" ? "" : (trimmed.startsWith("/") ? trimmed : `/${trimmed}`)
    },
    /**
     * The current `location.pathname` with the configured base path removed, so route-matching
     * code can keep comparing against plain root-relative paths regardless of where the app is
     * deployed. Returns `"/"` rather than `""` for the bare base path itself.
     */
    getPathname: function(): string {
        const raw = globalThis.location.pathname
        if (!basePath) {
            return raw
        }
        if (raw == basePath) {
            return "/"
        }
        if (raw.startsWith(`${basePath}/`)) {
            return raw.slice(basePath.length)
        }
        return raw
    },
    /**
     * Prefixes a root-relative `to` (one starting with `/`) with the configured base path, for
     * an actual `href` or `history.pushState` URL. Left alone otherwise - an external URL, a
     * fragment like `#`, or a `to` that is already prefixed - so it is safe to call on anything
     * `changeLocation` itself is handed.
     */
    resolveHref: function(to: string): string {
        if (!basePath || !to.startsWith("/") || to == basePath || to.startsWith(`${basePath}/`)) {
            return to
        }
        return `${basePath}${to}`
    },
    /**
     * Change the current URL to the `newLocation` without reloading the page (unless there is an error)
     *
     * Will first try with `history.pushState()` and fallback to `location.href =` on error
     */
    changeLocation: function(newLocation: string): void {
        // TODO, test if iOS still has a limitation at 100 pushState events
        // https://github.com/remix-run/history/issues/291
        // https://jdurand.com/blog/2016/05/03/ember-history-pushstate-dom-exception-18/
        try {
            globalThis.history.pushState(null,"",History.resolveHref(newLocation))
            globalThis.dispatchEvent(new Event('locationchange'))
        } catch (error) {
            consoleError(error)
            History.loadNewPageLocation(newLocation)
        }
    },
    /**
     * Change the current URL to the `newLocation` by reloading the page
     */
    loadNewPageLocation: function(newLocation: string): void {
        globalThis.location.href = History.resolveHref(newLocation)
    }
}
