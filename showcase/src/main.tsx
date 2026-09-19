import { replaceElementWithRoot } from "@velotype/velotype"

import { Theme } from "../../src/index.ts"
import { AppShell } from "./app-shell.tsx"
import { loadSavedTheme } from "./pages/theme-builder.tsx"
import { applySymbols, loadSavedSymbols } from "./data/theme-symbols.ts"

Theme.injectStyles(loadSavedTheme())
// Before anything renders: a theme-option symbol is read when a component is *built*, not resolved
// from CSS, so applying these after the first render would leave the page showing the old glyphs.
// This is the contract velodesign asks of every consumer - set them at startup - and the showcase
// is a consumer like any other. Only the theme builder needs more than this, and it does the extra
// work itself.
applySymbols(loadSavedSymbols())

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<AppShell/>, mainPage)
}
