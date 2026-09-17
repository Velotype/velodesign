import { consoleError } from "./utilities.ts"

/**
 * A collection of useful functions to manage browser History
 */
export const History = {
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
            globalThis.history.pushState(null,"",newLocation)
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
        globalThis.location.href = newLocation
    }
}
