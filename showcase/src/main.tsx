import { replaceElementWithRoot } from "@velotype/velotype"

import { Theme } from "../../src/index.ts"
import { AppShell } from "./app-shell.tsx"
import { loadSavedTheme } from "./pages/theme-builder.tsx"

Theme.injectStyles(loadSavedTheme())

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<AppShell/>, mainPage)
}
