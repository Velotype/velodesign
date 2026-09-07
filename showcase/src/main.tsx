import { replaceElementWithRoot } from "@velotype/velotype"

import { Theme } from "../../src/index.ts"
import { AppShell } from "./app-shell.tsx"

Theme.injectStyles()

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<AppShell/>, mainPage)
}
