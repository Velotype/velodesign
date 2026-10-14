import { replaceElementWithRoot } from "@velotype/velotype"

import { History, Theme } from "@velotype/velodesign"
import { AppShell } from "./app-shell.tsx"
import { loadSavedTheme } from "./pages/theme-builder.tsx"
import { applySymbols, loadSavedSymbols } from "./data/theme-symbols.ts"
import { registerCategoryIcons } from "./data/category-icons.ts"

// Local dev (showcase/server.ts) serves this app at the domain root, same as any consumer's own
// site, so there's nothing to configure there. The GitHub Pages build is the one deployment that
// serves it under a path prefix (a project site's own repo-name subdirectory) - its own index.html
// sets this global before main.js runs, and it's absent everywhere else.
History.configureBasePath((globalThis as unknown as {__VELODESIGN_BASE_PATH__?: string}).__VELODESIGN_BASE_PATH__ ?? "")

Theme.injectStyles(loadSavedTheme())
// Before anything renders: a theme-option symbol is read when a component is *built*, not resolved
// from CSS, so applying these after the first render would leave the page showing the old glyphs.
// This is the contract velodesign asks of every consumer - set them at startup - and the showcase
// is a consumer like any other. Only the theme builder needs more than this, and it does the extra
// work itself.
applySymbols(loadSavedSymbols())
// Same reason, same moment: <I i="..."/> renders nothing for a key that has not been
// registered yet, and the sidebar draws one on its very first render
registerCategoryIcons()

const mainPage = document.getElementById("main-page")
if (mainPage) {
    replaceElementWithRoot(<AppShell/>, mainPage)
}
