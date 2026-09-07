import { Component } from "@velotype/velotype"
import type { EmptyAttrs } from "@velotype/velotype"

import { Button, Empty, History } from "../../../src/index.ts"

/** Shown when `location.pathname` doesn't match any known route */
export class NotFoundPage extends Component<EmptyAttrs> {
    override render() {
        return <div style={{padding: "3em"}}>
            <Empty title="Page not found" description="That component doesn't exist in this showcase.">
                <Button type="secondary" onClick={() => History.changeLocation("/")}>Back to home</Button>
            </Empty>
        </div>
    }
}
