import { consoleError } from "./utilities.ts"

export const History = {
    changeLocation: function(newLocation: string ) {
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
    loadNewPageLocation: function(newLocation: string) {
        globalThis.location.href = newLocation
    },
    replaceState: function(href: string) {
        globalThis.history.replaceState(null,"",href)
    }
}
