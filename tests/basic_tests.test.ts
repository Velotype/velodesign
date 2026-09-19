/// <reference lib="deno.ns" />

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd"
import { fail, assertEquals } from "@std/assert"

import type {Server} from "@velotype/veloserver"

import { launch } from "@astral/astral"
import type { Browser, ElementHandle, Page } from "@astral/astral"
import { startAppServer } from "./base_server.ts"
import type { ServerContextMetadata } from "./base_server.ts"

const server_port = 3000
const baseUrl = `http://localhost:${server_port}`

describe('basic component rendering', () => {
    let server: Server<ServerContextMetadata>
    let browser: Browser
    let page: Page

    beforeAll(async () => {
        server = await startAppServer(server_port)
        browser = await launch({
            headless: true,
            args: ['--no-sandbox']
        })
        page = await browser.newPage()
        await page.setViewportSize({ width: 400, height: 200 })
    })
    afterAll(async () => {
        await page?.close()
        await browser?.close()
        await server?.close('End basic tests')
    })

    /**
     * Polls an in-page expression until it is truthy.
     *
     * `page.evaluate` with a *string* does not await a promise the expression returns, so anything
     * that takes time in the page (an animation, a sampling loop) has to store its result and be
     * polled for rather than awaited directly - two tests here hung for a full minute before this.
     */
    const waitUntil = async (probe: () => Promise<unknown>, description: string, timeoutMs = 5000) => {
        const start = Date.now()
        while (Date.now() - start < timeoutMs) {
            if (await probe()) {
                return
            }
            await new Promise(resolve => setTimeout(resolve, 50))
        }
        fail(`ERROR: timed out after ${timeoutMs}ms waiting for ${description}`)
    }

    const itWrap = (name: string, module: string, selector: string, testFn: (selection: ElementHandle) => void | Promise<void>) => {
        it({name,
            fn: async () => {
                try {
                    await page.goto(`${baseUrl}/${module}`, {waitUntil: 'networkidle2'})
                    const selection = await page.waitForSelector(selector)
                    if (selection) {
                        await testFn(selection)
                    } else {
                        fail(`ERROR: Selector not found`)
                    }
                } catch (e) {
                    console.log("Exception",e)
                    fail("ERROR: Thrown exception")
                }
            }
        })
    }

    type TestVariation = {
        selector: string
        text?: string
        html?: string
        attributes?: {
            name: string
            value: string
        }[]
    }
    const testVariations = async (setOfVariations: TestVariation[]) => {
        for (const variant of setOfVariations) {
            console.log("testing variant:", variant)
            const selection = await page.waitForSelector(variant.selector)
            if (selection) {
                if (variant.text) {
                    assertEquals(await selection.innerText(),variant.text)
                }
                if (variant.html) {
                    assertEquals(await selection.innerHTML(),variant.html)
                }
                if (variant.attributes) {
                    for (const attribute of variant.attributes) {
                        assertEquals(await selection.getAttribute(attribute.name),attribute.value)
                    }
                }
            } else {
                fail(`ERROR: Selector not found: #${variant}`)
            }
        }
    }

    itWrap("render default button", "button", "#default-button", async (selection: ElementHandle) => {
        assertEquals(await selection.innerText(),"default button")
    })

    itWrap("set of time-ago tests", "time-ago", "#timeago-page", async (_pageLoadSelection: ElementHandle) => {
        const setOfVariations = [
            {selector: "#now", text: "now"},
            {selector: "#less-1", text: "now"},
            {selector: "#less-10", text: "now"},
            {selector: "#less-30", text: "now"},
            {selector: "#less-62", text: "1 minute ago"},
            {selector: "#less-160", text: "2 minutes ago"},
            {selector: "#less-4000", text: "1 hour ago"},
            {selector: "#less-40000", text: "11 hours ago"},
            {selector: "#less-100000", text: "1 day ago"},
            {selector: "#less-400000", text: "4 days ago"},
            {selector: "#less-4000000", text: "46 days ago"},
        ]
        await testVariations(setOfVariations)
    })

    itWrap("checkbox click toggles change count", "checkbox", "#clickable-checkbox", async (selection: ElementHandle) => {
        assertEquals(await selection.innerText(), "clickable checkbox (changed 0 times)")
        await selection.click()
        assertEquals(await selection.innerText(), "clickable checkbox (changed 1 times)")
    })

    itWrap("toggle click toggles change count", "toggle", "#clickable-toggle", async (selection: ElementHandle) => {
        assertEquals(await selection.innerText(), "clickable toggle (changed 0 times)")
        await selection.click()
        assertEquals(await selection.innerText(), "clickable toggle (changed 1 times)")
    })

    itWrap("tabs switches panel on click", "tabs", "#default-tabs", async (_pageLoadSelection: ElementHandle) => {
        const panel = await page.waitForSelector("#default-tabs .vtd-tabs-panel-active")
        if (!panel) {fail("ERROR: tab panel not found")}
        assertEquals(await panel.innerText(), "High-level summary content goes here.")

        const secondTabButton = await page.$("#default-tabs .vtd-tabs-tab:nth-child(2)")
        if (!secondTabButton) {fail("ERROR: second tab button not found")}
        await secondTabButton.click()

        // Re-query rather than reusing `panel` - switching tabs doesn't tear down and rebuild
        // any panel anymore (that's the whole point), but the *previously active* panel is now
        // the inactive one, so the active-panel selector needs to be re-evaluated regardless.
        const updatedPanel = await page.waitForSelector("#default-tabs .vtd-tabs-panel-active")
        if (!updatedPanel) {fail("ERROR: updated tab panel not found")}
        const hasTeamInput = await page.evaluate(() => !!document.querySelector("#default-tabs .vtd-tabs-panel-active #team-tab-input"))
        if (!hasTeamInput) {fail("ERROR: expected the visible panel to be the Team Members tab (containing #team-tab-input)")}
    })

    itWrap("tabs label text position doesn't shift when a tab becomes active", "tabs", "#default-tabs", async (_pageLoadSelection: ElementHandle) => {
        const firstTabLeftBefore = await page.evaluate(() => document.querySelector("#default-tabs .vtd-tabs-tab:nth-child(1)")!.getBoundingClientRect().left)

        const secondTabButton = await page.$("#default-tabs .vtd-tabs-tab:nth-child(2)")
        if (!secondTabButton) {fail("ERROR: second tab button not found")}
        await secondTabButton.click()
        await page.waitForSelector("#default-tabs .vtd-tabs-panel-active")

        const firstTabLeftAfter = await page.evaluate(() => document.querySelector("#default-tabs .vtd-tabs-tab:nth-child(1)")!.getBoundingClientRect().left)
        const secondTabLeftAfter = await page.evaluate(() => document.querySelector("#default-tabs .vtd-tabs-tab:nth-child(2)")!.getBoundingClientRect().left)
        if (firstTabLeftBefore != firstTabLeftAfter) {fail(`ERROR: expected the first tab's position to stay put when a later tab becomes active, was ${firstTabLeftBefore} -> ${firstTabLeftAfter}`)}

        // Re-select the first tab and confirm the second tab (now inactive again) also lands back where it started
        const firstTabButton = await page.$("#default-tabs .vtd-tabs-tab:nth-child(1)")
        if (!firstTabButton) {fail("ERROR: first tab button not found")}
        await firstTabButton.click()
        await page.waitForSelector("#default-tabs .vtd-tabs-panel-active")
        const secondTabLeftInactive = await page.evaluate(() => document.querySelector("#default-tabs .vtd-tabs-tab:nth-child(2)")!.getBoundingClientRect().left)
        if (secondTabLeftAfter != secondTabLeftInactive) {fail(`ERROR: expected the second tab's position to be the same whether active or not, was ${secondTabLeftAfter} (active) vs ${secondTabLeftInactive} (inactive)`)}
    })

    itWrap("tabs keep an inactive panel's content (and its state) mounted instead of rebuilding it", "tabs", "#default-tabs", async (_selection: ElementHandle) => {
        // Switch to the "Team Members" tab (which holds a real TextBox) and type into it.
        await page.evaluate(() => (document.querySelector("#default-tabs .vtd-tabs-tab:nth-child(2)") as HTMLElement)?.click())
        await page.evaluate(() => {
            const input = document.querySelector("#team-tab-input") as HTMLInputElement
            input.value = "typed value"
            input.dispatchEvent(new Event("input", {bubbles: true}))
        })

        // Switch away to another tab and back.
        await page.evaluate(() => (document.querySelector("#default-tabs .vtd-tabs-tab:nth-child(1)") as HTMLElement)?.click())
        const stillMountedButInactive = await page.evaluate(() => {
            const panel = document.getElementById("team-tab-input")?.closest(".vtd-tabs-panel")
            return !!panel && !panel.classList.contains("vtd-tabs-panel-active")
        })
        if (!stillMountedButInactive) {fail("ERROR: expected the inactive panel to still be mounted (just not active), not removed")}
        await page.evaluate(() => (document.querySelector("#default-tabs .vtd-tabs-tab:nth-child(2)") as HTMLElement)?.click())

        const valueAfterSwitchingBack = await page.evaluate(() => (document.getElementById("team-tab-input") as HTMLInputElement)?.value)
        if (valueAfterSwitchingBack != "typed value") {fail(`ERROR: expected the typed value to survive switching tabs away and back, got: ${valueAfterSwitchingBack}`)}
    })

    itWrap("nav-link highlights the active route and updates on navigation", "nav-link", "#navlink-home", async (selection: ElementHandle) => {
        const initialClass = await selection.getAttribute("class")
        if (!initialClass?.includes("vtd-nav-link-active")) {
            fail(`ERROR: expected home NavLink to start active, class was: ${initialClass}`)
        }

        const otherLink = await page.$("a[href='/nav-link/other']")
        if (!otherLink) {fail("ERROR: other nav-link not found")}
        await otherLink.click()

        const updatedHome = await page.waitForSelector("#navlink-home")
        if (!updatedHome) {fail("ERROR: home nav-link not found after navigation")}
        const updatedClass = await updatedHome.getAttribute("class")
        if (updatedClass?.includes("vtd-nav-link-active")) {
            fail(`ERROR: expected home NavLink to no longer be active, class was: ${updatedClass}`)
        }

        const updatedOtherLink = await page.$("a[href='/nav-link/other']")
        if (!updatedOtherLink) {fail("ERROR: other nav-link not found after navigation")}
        const otherClass = await updatedOtherLink.getAttribute("class")
        if (!otherClass?.includes("vtd-nav-link-active")) {
            fail(`ERROR: expected other NavLink to become active, class was: ${otherClass}`)
        }
    })

    itWrap("pagination clicking a page number updates current page", "pagination", "#pagination-current-3", async (selection: ElementHandle) => {
        assertEquals(await selection.innerText(), "Current page: 1")

        const pageThreeButton = await page.$("#default-pagination .vtd-pagination button:nth-child(4)")
        if (!pageThreeButton) {fail("ERROR: page 3 button not found")}
        assertEquals(await pageThreeButton.innerText(), "3")
        await pageThreeButton.click()

        const updated = await page.waitForSelector("#pagination-current-3")
        if (!updated) {fail("ERROR: current-page display not found after click")}
        assertEquals(await updated.innerText(), "Current page: 3")
    })

    itWrap("pagination doesn't duplicate a page number when totalPages is small", "pagination", "#two-pages-pagination", async (_selection: ElementHandle) => {
        const twoPageLabels = await page.evaluate(() => Array.from(document.getElementById("two-pages-pagination")!.querySelectorAll(".vtd-pagination button")).map(b => b.textContent))
        if (JSON.stringify(twoPageLabels) != JSON.stringify(["‹", "1", "2", "›"])) {fail(`ERROR: expected exactly one "2" button with totalPages=2, got: ${JSON.stringify(twoPageLabels)}`)}

        const onePageLabels = await page.evaluate(() => Array.from(document.getElementById("one-page-pagination")!.querySelectorAll(".vtd-pagination button")).map(b => b.textContent))
        if (JSON.stringify(onePageLabels) != JSON.stringify(["‹", "1", "›"])) {fail(`ERROR: expected no page-2 button at all with totalPages=1, got: ${JSON.stringify(onePageLabels)}`)}
    })

    itWrap("menu opens on trigger click and closes after picking an item", "menu", "#actions-menu", async (selection: ElementHandle) => {
        const initialOpen = await selection.getAttribute("open")
        if (initialOpen !== null) {fail(`ERROR: expected menu to start closed, open was: ${initialOpen}`)}

        const summary = await page.$("#actions-menu summary")
        if (!summary) {fail("ERROR: summary not found")}
        await summary.click()

        const openedMenu = await page.waitForSelector("#actions-menu[open]")
        if (!openedMenu) {fail("ERROR: menu did not open after clicking trigger")}

        const firstItem = await page.$("#actions-menu .vtd-menu-item")
        if (!firstItem) {fail("ERROR: menu item not found")}
        await firstItem.click()

        const closedMenu = await page.waitForSelector("#actions-menu")
        if (!closedMenu) {fail("ERROR: menu not found after clicking item")}
        const openAfterClick = await closedMenu.getAttribute("open")
        if (openAfterClick !== null) {fail(`ERROR: expected menu to close after picking an item, open was: ${openAfterClick}`)}

        const clickCount = await page.waitForSelector("#menu-click-count")
        if (!clickCount) {fail("ERROR: click count element not found")}
        assertEquals(await clickCount.innerText(), "clicked 1 times")
    })

    itWrap("menu closes when clicking outside of it", "menu", "#actions-menu", async (_selection: ElementHandle) => {
        const summary = await page.$("#actions-menu summary")
        if (!summary) {fail("ERROR: summary not found")}
        await summary.click()

        const openedMenu = await page.waitForSelector("#actions-menu[open]")
        if (!openedMenu) {fail("ERROR: menu did not open after clicking trigger")}

        const outsideElement = await page.$("#menu-click-count")
        if (!outsideElement) {fail("ERROR: outside element not found")}
        await outsideElement.click()

        const closedMenu = await page.waitForSelector("#actions-menu")
        if (!closedMenu) {fail("ERROR: menu not found after outside click")}
        const openAfterOutsideClick = await closedMenu.getAttribute("open")
        if (openAfterOutsideClick !== null) {
            fail(`ERROR: expected menu to close after an outside click, open was: ${openAfterOutsideClick}`)
        }
    })

    itWrap("menu with closeOnOutsideClick={false} stays open on an outside click", "menu", "#stays-open-menu", async (_selection: ElementHandle) => {
        const summary = await page.$("#stays-open-menu summary")
        if (!summary) {fail("ERROR: summary not found")}
        await summary.click()

        const openedMenu = await page.waitForSelector("#stays-open-menu[open]")
        if (!openedMenu) {fail("ERROR: menu did not open after clicking trigger")}

        await page.evaluate(() => { document.body.click() })

        const stillOpen = await page.$("#stays-open-menu[open]")
        if (!stillOpen) {fail("ERROR: expected menu with closeOnOutsideClick={false} to stay open after an outside click")}
    })

    itWrap("toast appears on trigger click and auto-dismisses after its duration", "toast", "#toast-quick-btn", async (selection: ElementHandle) => {
        await selection.click()

        const toast = await page.waitForSelector(".vtd-toast")
        if (!toast) {fail("ERROR: toast did not appear after clicking trigger")}
        assertEquals(await toast.innerText(), "Gone in a flash\nx")

        await new Promise(resolve => setTimeout(resolve, 800))
        const stillThere = await page.$(".vtd-toast")
        if (stillThere) {fail("ERROR: expected toast to have auto-dismissed after its duration elapsed")}
    })

    itWrap("accordion exclusive group closes the other section when one is opened", "accordion", "#exclusive-accordion", async (_selection: ElementHandle) => {
        // Everything here runs through page.evaluate() rather than holding onto
        // ElementHandles across the clicks: querying/clicking via ElementHandle intermittently
        // throws here ("unable to get stable box model" / a destroyed remote object) later in
        // this suite's run, even though the same element is clickable via ElementHandle in
        // isolation - a plain in-page evaluate sidesteps whatever that Astral/Deno-test
        // interaction is, since it never keeps a handle alive across a click.
        const readOpenStates = () => page.evaluate(() => {
            const details = document.querySelectorAll("#exclusive-accordion details")
            return {first: (details[0] as HTMLDetailsElement | undefined)?.open, second: (details[1] as HTMLDetailsElement | undefined)?.open}
        })
        const clickSummary = (index: number) => page.evaluate((i: number) => {
            const summaries = document.querySelectorAll("#exclusive-accordion summary")
            ;(summaries[i] as HTMLElement | undefined)?.click()
        }, {args: [index]})

        const beforeClicks = await readOpenStates()
        if (beforeClicks.first) {fail("ERROR: expected first section to start closed")}

        await clickSummary(0)
        const afterFirstClick = await readOpenStates()
        if (!afterFirstClick.first) {fail("ERROR: expected first section to open after clicking its summary")}

        await clickSummary(1)
        const afterSecondClick = await readOpenStates()
        if (!afterSecondClick.second) {fail("ERROR: expected second section to open after clicking its summary")}
        // The displaced section is animated closed, so `open` stays true until that finishes -
        // it is no longer removed synchronously with the click (see disclosure-view.tsx)
        await waitUntil(
            async () => !(await readOpenStates()).first,
            "the displaced section to finish closing")
        const afterClosing = await readOpenStates()
        if (afterClosing.first) {fail("ERROR: expected first section to close once a sibling in the exclusive group opened")}
    })

    itWrap("drawer opens on trigger click and closes on its close button", "drawer", "#open-drawer-btn", async (selection: ElementHandle) => {
        await selection.click()

        const openedDrawer = await page.waitForSelector(".vtd-drawer[open]")
        if (!openedDrawer) {fail("ERROR: drawer did not open after clicking trigger")}

        const closed = await page.evaluate(() => {
            const dialog = document.querySelector(".vtd-drawer") as HTMLDialogElement | null
            const closeButton = dialog?.querySelector("button") as HTMLElement | undefined
            closeButton?.click()
            return !dialog?.open
        })
        if (!closed) {fail("ERROR: expected drawer to close after clicking its close button")}
    })

    itWrap("drawer placement and enterFrom apply independently", "drawer", "#open-bottom-drawer-btn", async (selection: ElementHandle) => {
        await selection.click()
        await page.waitForSelector(".vtd-drawer[open]")

        const classInfo = await page.evaluate(() => {
            const dialog = Array.from(document.querySelectorAll(".vtd-drawer[open]"))[0] as HTMLDialogElement
            return {
                hasPosition: dialog.classList.contains("vtd-drawer-position-bottom"),
                hasEnter: dialog.classList.contains("vtd-drawer-enter-right"),
            }
        })
        if (!classInfo.hasPosition) {fail("ERROR: expected placement=\"bottom\" to apply the vtd-drawer-position-bottom class")}
        if (!classInfo.hasEnter) {fail("ERROR: expected enterFrom=\"right\" to apply the vtd-drawer-enter-right class, independent of placement")}
    })

    itWrap("popover opens on trigger click and closes on an outside click", "popover", "#default-popover", async (_selection: ElementHandle) => {
        const trigger = await page.$("#default-popover .vtd-popover-trigger")
        if (!trigger) {fail("ERROR: trigger not found")}
        await trigger.click()

        const opened = await page.waitForSelector("#default-popover .vtd-popover-content.vtd-popover-open")
        if (!opened) {fail("ERROR: popover did not open after clicking trigger")}

        await page.evaluate(() => { document.body.click() })

        const stillOpen = await page.$("#default-popover .vtd-popover-content.vtd-popover-open")
        if (stillOpen) {fail("ERROR: expected popover to close after an outside click")}
    })

    itWrap("popconfirm opens on trigger click and calls onConfirm when confirmed", "popconfirm", "#default-popconfirm", async (_selection: ElementHandle) => {
        const trigger = await page.$("#default-popconfirm .vtd-popconfirm-trigger")
        if (!trigger) {fail("ERROR: trigger not found")}
        await trigger.click()

        const opened = await page.waitForSelector("#default-popconfirm .vtd-popconfirm-content.vtd-popconfirm-open")
        if (!opened) {fail("ERROR: popconfirm did not open after clicking trigger")}

        const confirmClosed = await page.evaluate(() => {
            const buttons = document.querySelectorAll("#default-popconfirm .vtd-popconfirm-actions button")
            const confirmButton = buttons[buttons.length - 1] as HTMLElement | undefined
            confirmButton?.click()
            return !document.querySelector("#default-popconfirm .vtd-popconfirm-content.vtd-popconfirm-open")
        })
        if (!confirmClosed) {fail("ERROR: expected popconfirm to close after clicking confirm")}
    })

    itWrap("collapse toggles open on its header click", "collapse", "#default-collapse", async (_selection: ElementHandle) => {
        const isOpen = () => page.evaluate(() => (document.querySelector("#default-collapse details") as HTMLDetailsElement | null)?.open)
        const clickHeader = () => page.evaluate(() => (document.querySelector("#default-collapse summary") as HTMLElement | null)?.click())

        if (await isOpen()) {fail("ERROR: expected collapse to start closed")}
        await clickHeader()
        if (!(await isOpen())) {fail("ERROR: expected collapse to open after clicking its header")}
    })

    itWrap("carousel advances to the next slide on the next-arrow click", "carousel", "#default-carousel", async (_selection: ElementHandle) => {
        const slideText = () => page.evaluate(() => document.querySelector("#default-carousel .vtd-carousel-slide:not([hidden])")?.textContent)
        const clickNext = () => page.evaluate(() => (document.querySelector("#default-carousel .vtd-carousel-nav-next") as HTMLElement | null)?.click())

        const before = await slideText()
        if (before != "Slide 1") {fail(`ERROR: expected carousel to start on Slide 1, was: ${before}`)}
        await clickNext()
        const after = await slideText()
        if (after != "Slide 2") {fail(`ERROR: expected carousel to advance to Slide 2, was: ${after}`)}
    })

    itWrap("carousel keeps an off-screen slide's content (and its state) mounted instead of rebuilding it", "carousel", "#default-carousel", async (_selection: ElementHandle) => {
        // Navigate to the 4th slide (index 3, which holds a real TextBox) and type into it.
        await page.evaluate(() => {
            const dots = document.querySelectorAll("#default-carousel .vtd-carousel-dot")
            ;(dots[3] as HTMLElement)?.click()
        })
        await page.evaluate(() => {
            const input = document.querySelector("#slide-4-input") as HTMLInputElement
            input.value = "typed value"
            input.dispatchEvent(new Event("input", {bubbles: true}))
        })

        // Navigate away and back.
        await page.evaluate(() => {
            const dots = document.querySelectorAll("#default-carousel .vtd-carousel-dot")
            ;(dots[0] as HTMLElement)?.click()
        })
        const hiddenWhileOffScreen = await page.evaluate(() => document.getElementById("slide-4-input")?.closest(".vtd-carousel-slide")?.hasAttribute("hidden"))
        if (!hiddenWhileOffScreen) {fail("ERROR: expected the off-screen slide to be hidden, not removed")}
        await page.evaluate(() => {
            const dots = document.querySelectorAll("#default-carousel .vtd-carousel-dot")
            ;(dots[3] as HTMLElement)?.click()
        })

        const valueAfterNavigatingBack = await page.evaluate(() => (document.getElementById("slide-4-input") as HTMLInputElement)?.value)
        if (valueAfterNavigatingBack != "typed value") {fail(`ERROR: expected the typed value to survive navigating away and back, got: ${valueAfterNavigatingBack}`)}
    })

    itWrap("command palette filters by search and selects the highlighted item on Enter", "command", "#open-command-btn", async (selection: ElementHandle) => {
        await selection.click()

        const opened = await page.waitForSelector(".vtd-command[open]")
        if (!opened) {fail("ERROR: command palette did not open after clicking trigger")}

        await page.evaluate(() => {
            const input = document.querySelector(".vtd-command-input") as HTMLInputElement
            input.value = "settings"
            input.dispatchEvent(new Event("input", {bubbles: true}))
        })

        const filteredCount = await page.evaluate(() => document.querySelectorAll(".vtd-command-item").length)
        if (filteredCount != 1) {fail(`ERROR: expected search for "settings" to filter to 1 item, got: ${filteredCount}`)}

        await page.evaluate(() => {
            const input = document.querySelector(".vtd-command-input") as HTMLInputElement
            input.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true}))
        })

        const lastPicked = await page.waitForSelector("#last-picked-command")
        if (!lastPicked) {fail("ERROR: last-picked-command element not found")}
        assertEquals(await lastPicked.innerText(), "Last picked: Open settings")

        const stillOpen = await page.$(".vtd-command[open]")
        if (stillOpen) {fail("ERROR: expected command palette to close after picking an item")}
    })

    itWrap("data-table sorts on header click through the asc/desc/cleared cycle", "data-table", "#default-data-table", async (_selection: ElementHandle) => {
        const firstColumnValues = () => page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            return Array.from(root.querySelectorAll("tbody tr")).map(row => row.querySelector("td")?.textContent)
        })
        const clickFirstHeader = () => page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            ;(root.querySelector(".vtd-data-table-sort-button") as HTMLElement).click()
        })

        const unsorted = await firstColumnValues()
        await clickFirstHeader()
        const ascending = await firstColumnValues()
        if (JSON.stringify(ascending) == JSON.stringify(unsorted)) {fail("ERROR: expected row order to change after clicking a sortable header")}
        if (JSON.stringify(ascending) != JSON.stringify([...ascending].sort())) {fail(`ERROR: expected ascending order, got: ${JSON.stringify(ascending)}`)}

        await clickFirstHeader()
        const descending = await firstColumnValues()
        // Page 1 of the full 27-row sort, not just a reversal of page 1 of the ascending sort
        // (this is a different, larger-valued subset once pagination only shows 5 of 27 rows) -
        // so check descending's own internal order rather than comparing it against `ascending`.
        if (JSON.stringify(descending) != JSON.stringify([...descending].sort().reverse())) {fail(`ERROR: expected descending order, got: ${JSON.stringify(descending)}`)}

        await clickFirstHeader()
        const cleared = await firstColumnValues()
        if (JSON.stringify(cleared) != JSON.stringify(unsorted)) {fail("ERROR: expected a 3rd header click to clear sorting back to original row order")}
    })

    itWrap("data-table column-visibility menu stays open across a checkbox click and closes on an outside click", "data-table", "#default-data-table", async (_selection: ElementHandle) => {
        // Regression test: the "Columns" button used to call a full refresh() to open the menu,
        // which tore down and rebuilt the wrapper element *while its own click event was still
        // bubbling* to the outside-click listener - so the listener compared the click's
        // (now-disconnected) target against the *new* wrapper, read that as "outside", and
        // closed the menu immediately after opening it.
        await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            // Found by class, not by text: the button's content is consumer-supplied (the library
            // defaults it to a language-agnostic symbol), so matching on "Columns" would couple
            // this test to the gallery's demo copy.
            const columnsButton = root.querySelector(".vtd-data-table-column-menu-wrapper button") as HTMLElement | undefined
            columnsButton?.click()
        })
        const openRightAfterClick = await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            return root.querySelector(".vtd-data-table-column-menu")?.classList.contains("vtd-data-table-column-menu-open")
        })
        if (!openRightAfterClick) {fail("ERROR: expected the column menu to stay open immediately after clicking its trigger")}

        const headerCountBefore = await page.evaluate(() => document.getElementById("default-data-table")!.querySelectorAll("th").length)
        await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            // The first column ("Name") is non-hideable and renders a disabled, always-checked
            // entry here - so target the first *toggleable* checkbox instead of just the first one.
            ;(root.querySelector(".vtd-data-table-column-menu input[type=checkbox]:not(:disabled)") as HTMLInputElement).click()
        })
        const headerCountAfter = await page.evaluate(() => document.getElementById("default-data-table")!.querySelectorAll("th").length)
        if (headerCountAfter >= headerCountBefore) {fail(`ERROR: expected unchecking a hideable column to remove a header, was ${headerCountBefore} -> ${headerCountAfter}`)}
        const stillOpenAfterCheckbox = await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            return root.querySelector(".vtd-data-table-column-menu")?.classList.contains("vtd-data-table-column-menu-open")
        })
        if (!stillOpenAfterCheckbox) {fail("ERROR: expected the column menu to stay open after toggling a column checkbox")}

        await page.evaluate(() => { document.body.click() })
        const openAfterOutsideClick = await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            return root.querySelector(".vtd-data-table-column-menu")?.classList.contains("vtd-data-table-column-menu-open")
        })
        if (openAfterOutsideClick) {fail("ERROR: expected the column menu to close on an outside click")}
    })

    itWrap("data-table non-hideable column shows as a disabled, checked entry that can't be unchecked", "data-table", "#default-data-table", async (_selection: ElementHandle) => {
        await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            // Found by class, not by text: the button's content is consumer-supplied (the library
            // defaults it to a language-agnostic symbol), so matching on "Columns" would couple
            // this test to the gallery's demo copy.
            const columnsButton = root.querySelector(".vtd-data-table-column-menu-wrapper button") as HTMLElement | undefined
            columnsButton?.click()
        })
        const firstCheckboxState = await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            const checkbox = root.querySelector(".vtd-data-table-column-menu input[type=checkbox]") as HTMLInputElement
            return {checked: checkbox.checked, disabled: checkbox.disabled}
        })
        if (!firstCheckboxState.checked || !firstCheckboxState.disabled) {fail(`ERROR: expected the non-hideable column's entry to be checked and disabled, got: ${JSON.stringify(firstCheckboxState)}`)}

        const headerCountBefore = await page.evaluate(() => document.getElementById("default-data-table")!.querySelectorAll("th").length)
        await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            ;(root.querySelector(".vtd-data-table-column-menu input[type=checkbox]") as HTMLInputElement).click()
        })
        const headerCountAfter = await page.evaluate(() => document.getElementById("default-data-table")!.querySelectorAll("th").length)
        if (headerCountAfter != headerCountBefore) {fail(`ERROR: expected clicking the disabled entry to leave the header count unchanged, was ${headerCountBefore} -> ${headerCountAfter}`)}
    })

    itWrap("data-table page-size control changes how many rows are displayed per page", "data-table", "#default-data-table", async (_selection: ElementHandle) => {
        const bodyRowCount = () => page.evaluate(() => document.getElementById("default-data-table")!.querySelectorAll("tbody tr").length)

        const initialRowCount = await bodyRowCount()
        if (initialRowCount != 5) {fail(`ERROR: expected the initial pageSize of 5 to show 5 rows, got ${initialRowCount}`)}

        await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            const select = root.querySelector(".vtd-data-table-page-size select") as HTMLSelectElement
            select.value = "10"
            select.dispatchEvent(new Event("change", {bubbles: true}))
        })
        const updatedRowCount = await bodyRowCount()
        if (updatedRowCount != 10) {fail(`ERROR: expected choosing a page size of 10 to show 10 rows, got ${updatedRowCount}`)}
    })

    itWrap("select-menu opens on trigger click, selects a rich option by click, and closes", "select-menu", "#default-select-menu .vtd-select-menu-trigger", async (selection: ElementHandle) => {
        await selection.click()
        const isOpen = await page.evaluate(() => document.querySelector("#default-select-menu .vtd-select-menu-panel")?.classList.contains("vtd-select-menu-panel-open"))
        if (!isOpen) {fail("ERROR: expected panel to open after clicking trigger")}

        await page.evaluate(() => {
            const options = Array.from(document.querySelectorAll("#default-select-menu .vtd-select-menu-option"))
            const casey = options.find(el => el.textContent?.includes("Casey Diaz")) as HTMLElement | undefined
            casey?.click()
        })

        const valueText = await page.evaluate(() => document.querySelector("#default-select-menu .vtd-select-menu-value")?.textContent)
        if (!valueText?.includes("Casey Diaz")) {fail(`ERROR: expected the trigger to show the selected option's rendered content, got: ${valueText}`)}

        const stillOpen = await page.evaluate(() => document.querySelector("#default-select-menu .vtd-select-menu-panel")?.classList.contains("vtd-select-menu-panel-open"))
        if (stillOpen) {fail("ERROR: expected panel to close after selecting an option")}
    })

    itWrap("select-menu keyboard navigation (ArrowDown + Enter) changes selection", "select-menu", "#preselected-select-menu .vtd-select-menu-trigger", async (selection: ElementHandle) => {
        await selection.click()

        await page.evaluate(() => {
            const trigger = document.querySelector("#preselected-select-menu .vtd-select-menu-trigger") as HTMLElement
            trigger.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true}))
        })
        await page.evaluate(() => {
            const trigger = document.querySelector("#preselected-select-menu .vtd-select-menu-trigger") as HTMLElement
            trigger.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true}))
        })

        const valueText = await page.evaluate(() => document.querySelector("#preselected-select-menu .vtd-select-menu-value")?.textContent)
        if (!valueText?.includes("Casey Diaz")) {fail(`ERROR: expected ArrowDown+Enter from the preselected "Alex Baker" to select "Casey Diaz", got: ${valueText}`)}
    })

    itWrap("select-menu disabled option can't be selected by click", "select-menu", "#default-select-menu .vtd-select-menu-trigger", async (selection: ElementHandle) => {
        await selection.click()
        await page.evaluate(() => {
            const options = Array.from(document.querySelectorAll("#default-select-menu .vtd-select-menu-option"))
            const morgan = options.find(el => el.textContent?.includes("Morgan Lee")) as HTMLElement | undefined
            morgan?.click()
        })

        const valueText = await page.evaluate(() => document.querySelector("#default-select-menu .vtd-select-menu-value")?.textContent)
        if (valueText?.includes("Morgan Lee")) {fail("ERROR: expected clicking a disabled option not to select it")}

        const stillOpen = await page.evaluate(() => document.querySelector("#default-select-menu .vtd-select-menu-panel")?.classList.contains("vtd-select-menu-panel-open"))
        if (!stillOpen) {fail("ERROR: expected the panel to remain open after clicking a disabled option")}
    })

    itWrap("select-menu closes on an outside click", "select-menu", "#default-select-menu .vtd-select-menu-trigger", async (selection: ElementHandle) => {
        await selection.click()
        const openedRightAfterClick = await page.evaluate(() => document.querySelector("#default-select-menu .vtd-select-menu-panel")?.classList.contains("vtd-select-menu-panel-open"))
        if (!openedRightAfterClick) {fail("ERROR: expected panel to open after clicking trigger")}

        await page.evaluate(() => { document.body.click() })
        const openAfterOutsideClick = await page.evaluate(() => document.querySelector("#default-select-menu .vtd-select-menu-panel")?.classList.contains("vtd-select-menu-panel-open"))
        if (openAfterOutsideClick) {fail("ERROR: expected panel to close on an outside click")}
    })

    /**
     * Polls an in-page predicate until it holds, instead of sleeping a fixed amount.
     *
     * The async-data-table tests assert on state that arrives after a network-ish round trip, and
     * a fixed sleep tuned on a single test is simply wrong inside the full suite, where everything
     * runs slower - two of these failed that way before this helper existed. Returns false on
     * timeout so the caller can `fail()` with a useful message rather than a bare timeout.
     */
    const waitForCondition = async (expression: string, timeoutMs = 5000): Promise<boolean> => {
        const deadline = Date.now() + timeoutMs
        while (Date.now() < deadline) {
            if (await page.evaluate(expression)) {
                return true
            }
            await new Promise(resolve => setTimeout(resolve, 50))
        }
        return false
    }

    /**
     * Rows that actually hold data in one gallery table - the loading/empty/error status row is a
     * single spanning cell, so it's filtered out.
     *
     * `getElementById`, never `querySelectorAll("#id ...")`: every gallery page renders its
     * component twice, once in a light container and once in a dark one, so each id genuinely
     * exists twice in the document. A `querySelectorAll` id selector matches *both* copies, which
     * silently mixes the copy the test is driving with the untouched one - it looks like a
     * component bug and is a test bug.
     */
    const dataRowsExpression = (id: string) =>
        `Array.from(document.getElementById("${id}").querySelectorAll("tbody tr"))
            .filter(row => !row.querySelector(".vtd-data-table-empty"))
            .map(row => row.innerText.replace(/\\s+/g, " ").trim())`

    itWrap("async-data-table discards a stale response that resolves after a newer one", "async-data-table", "#race-async-table", async (_selection: ElementHandle) => {
        // The gallery's loader for this table makes *shorter* searches slower on purpose, so the
        // request for "e" is still in flight when "riley" resolves and lands after it. Without the
        // sequence guard in AsyncDataTable the stale answer wins and the table contradicts its own
        // input box. This is the whole reason the component exists rather than each caller
        // hand-rolling the fetch, and it is invisible against a fast local backend.
        //
        // The two search strings must return genuinely *different* rows or the race is untestable:
        // an earlier draft used "ja" then "jam", which match exactly the same people in this data
        // set, so a stale response was indistinguishable from a fresh one and the test passed with
        // the guard deleted. "e" matches most rows; "riley" matches one person.
        const setSearch = (value: string) => page.evaluate(`(() => {
            const input = document.getElementById("race-async-table").querySelector(".vtd-data-table-search")
            input.value = ${JSON.stringify(value)}
            input.dispatchEvent(new Event("input", {bubbles: true}))
        })()`)

        // Let the initial load (search "", and therefore the slowest of all) settle first, so the
        // thing under test is the typed-query race rather than a straggling first paint.
        const booted = await waitForCondition(`${dataRowsExpression("race-async-table")}.length > 0`)
        if (!booted) {fail("ERROR: the race table never completed its initial load")}


        // 200ms apart, comfortably more than the 0ms debounce plus dispatch jitter, so the slow
        // request is definitely issued rather than being cancelled before it leaves.
        await setSearch("e")
        await new Promise(resolve => setTimeout(resolve, 200))
        await setSearch("riley")
        // Asserting once after a fixed sleep is fragile: how much of the initial (slowest) load is
        // still outstanding when the test starts depends on how long the page took to boot, which
        // differs between running this file alone and running it after thirty other tests. So
        // assert the property itself in two steps instead of guessing a timestamp.
        //
        // Step 1: wait for the *newest* query's answer to land ("riley" resolves fastest).
        const rowsMatch = `(rows => rows.length > 0 && rows.every(row => row.toLowerCase().includes("riley")))(${dataRowsExpression("race-async-table")})`
        const landed = await waitForCondition(rowsMatch)
        if (!landed) {
            const rows = await page.evaluate(dataRowsExpression("race-async-table"))
            fail(`ERROR: the newest query's rows never rendered, got: ${JSON.stringify(rows)}`)
        }

        // Step 2: wait past the slower, staler request's resolution and confirm it did *not*
        // overwrite what is on screen. This is the assertion the component exists to satisfy, and
        // it is the one that fails when the sequence guard is removed.
        // Wait for the *slow* query to actually come back, rather than sleeping a guessed amount.
        // A fixed sleep is unsound here: this runs in a headless browser that throttles timers
        // unpredictably - a 720ms fixture delay was measured taking 1476ms - so a sleep tuned to
        // pass locally reads the DOM just *before* the stale response lands and the test silently
        // stops testing anything. The fixture records each resolved query for exactly this.
        const staleLanded = await waitForCondition(`(window.__resolvedQueries || []).includes("e")`, 10000)
        if (!staleLanded) {fail("ERROR: the slow 'e' query never resolved, so the race was never exercised")}
        // Give the render that would follow it a moment to happen
        await new Promise(resolve => setTimeout(resolve, 150))
        const state = await page.evaluate(`(() => ({
            value: document.getElementById("race-async-table").querySelector(".vtd-data-table-search").value,
            rows: ${dataRowsExpression("race-async-table")}
        }))()`) as {value: string, rows: string[]}
        if (state.value != "riley") {fail(`ERROR: expected the input to hold "riley", got "${state.value}"`)}
        if (state.rows.length == 0) {fail("ERROR: expected rows matching 'riley' to still be shown")}
        const offenders = state.rows.filter(row => !row.toLowerCase().includes("riley"))
        if (offenders.length > 0) {fail(`ERROR: a stale response overwrote the newest - rows not matching "riley": ${JSON.stringify(offenders)}`)}
    })

    itWrap("async-data-table keeps the search input focused across a reload", "async-data-table", "#default-async-table", async (_selection: ElementHandle) => {
        await page.evaluate(() => {
            const input = document.querySelector("#default-async-table .vtd-data-table-search") as HTMLInputElement
            input.focus()
            input.value = "eng"
            input.dispatchEvent(new Event("input", {bubbles: true}))
        })
        // Wait for the reload to actually land - asserting focus before anything re-rendered would
        // pass even if the component tore its own input down on every update.
        const reloaded = await waitForCondition(`${dataRowsExpression("default-async-table")}.every(row => row.toLowerCase().includes("eng"))
            && ${dataRowsExpression("default-async-table")}.length > 0`)
        if (!reloaded) {fail("ERROR: the table never reloaded for the 'eng' search")}
        const focused = await page.evaluate(() => document.activeElement == document.querySelector("#default-async-table .vtd-data-table-search"))
        if (!focused) {fail("ERROR: expected the search input to keep focus across an async reload")}
    })

    itWrap("async-data-table shows an error state when its loader rejects", "async-data-table", "#error-async-table", async (_selection: ElementHandle) => {
        // A rejected load that isn't caught renders as a convincing *empty* table, which reads as
        // "no results" rather than "this is broken" - so the distinction is worth a test.
        await page.evaluate(() => {
            const input = document.querySelector("#error-async-table .vtd-data-table-search") as HTMLInputElement
            input.value = "boom"
            input.dispatchEvent(new Event("input", {bubbles: true}))
        })
        const errored = await waitForCondition(`document.getElementById("error-async-table").querySelector("tbody").innerText.includes("Could not load")`)
        if (!errored) {
            const text = await page.evaluate(() => (document.querySelector("#error-async-table tbody") as HTMLElement).innerText)
            fail(`ERROR: expected the rendered error state, got: ${JSON.stringify(text)}`)
        }
    })

    itWrap("charts draw a line per series, with axis ticks and a legend", "charts", "#default-line-chart", async (_selection: ElementHandle) => {
        const state = await page.evaluate(() => {
            const root = document.getElementById("default-line-chart") as HTMLElement
            return {
                lines: root.querySelectorAll("path.vtd-chart-line").length,
                legend: root.querySelectorAll(".vtd-chart-legend-item").length,
                ticks: Array.from(root.querySelectorAll("text.vtd-chart-tick-y")).map(t => t.textContent),
                categories: Array.from(root.querySelectorAll("text.vtd-chart-tick-x")).map(t => t.textContent)
            }
        })
        if (state.lines != 2) {fail(`ERROR: expected one path per series, got ${state.lines}`)}
        if (state.legend != 2) {fail(`ERROR: expected a legend entry per series, got ${state.legend}`)}
        // niceTicks must produce round numbers through the caller's formatValue, not raw maxima
        if (!state.ticks.includes("$0k") || !state.ticks.includes("$40k")) {
            fail(`ERROR: expected rounded ticks spanning the data, got ${JSON.stringify(state.ticks)}`)
        }
        if (!state.categories.includes("Jan")) {fail(`ERROR: expected category labels, got ${JSON.stringify(state.categories)}`)}
    })

    itWrap("charts show a tooltip naming every series at the hovered category", "charts", "#default-line-chart", async (_selection: ElementHandle) => {
        // The hit target is one rect over the whole plot, so a pointer near a column is enough -
        // this is the interaction that decides whether a line chart is usable at all.
        await page.evaluate(() => {
            const root = document.getElementById("default-line-chart") as HTMLElement
            const hit = root.querySelector("rect.vtd-chart-hit") as SVGRectElement
            const box = hit.getBoundingClientRect()
            hit.dispatchEvent(new PointerEvent("pointermove", {
                bubbles: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2
            }))
        })
        await new Promise(resolve => setTimeout(resolve, 150))
        const tip = await page.evaluate(() => {
            const root = document.getElementById("default-line-chart") as HTMLElement
            const el = root.querySelector(".vtd-chart-tooltip") as HTMLElement
            return {
                visible: el.classList.contains("vtd-chart-tooltip-visible"),
                rows: el.querySelectorAll(".vtd-chart-tooltip-row").length,
                text: el.innerText.replace(/\s+/g, " ").trim()
            }
        })
        if (!tip.visible) {fail("ERROR: expected the tooltip to appear on pointermove over the plot")}
        if (tip.rows != 2) {fail(`ERROR: expected one tooltip row per series, got ${tip.rows}`)}
        if (!tip.text.includes("Revenue") || !tip.text.includes("Costs")) {
            fail(`ERROR: expected both series named in the tooltip, got ${JSON.stringify(tip.text)}`)
        }
    })

    itWrap("charts stack bars rather than overlaying them", "charts", "#stacked-bar-chart", async (_selection: ElementHandle) => {
        // A stacked bar's two segments must sit on top of each other and together reach the
        // category total. Overlaid bars look plausible and are simply wrong, so check the geometry.
        const first = await page.evaluate(() => {
            const root = document.getElementById("stacked-bar-chart") as HTMLElement
            const bars = Array.from(root.querySelectorAll("rect.vtd-chart-bar")) as SVGRectElement[]
            const jan = bars.slice(0, 2).map(b => ({
                x: Number(b.getAttribute("x")), y: Number(b.getAttribute("y")), h: Number(b.getAttribute("height"))
            }))
            return jan
        })
        if (first.length != 2) {fail(`ERROR: expected two segments in the first category, got ${first.length}`)}
        if (first[0].x != first[1].x) {fail("ERROR: stacked segments must share an x, otherwise they are side by side")}
        // The second segment sits directly on top of the first, within a rounding pixel
        const gap = Math.abs((first[1].y + first[1].h) - first[0].y)
        if (gap > 1.5) {fail(`ERROR: expected the segments to stack flush, gap was ${gap}`)}
    })

    itWrap("charts show an empty state instead of an axis when there is no data", "charts", "#empty-line-chart", async (_selection: ElementHandle) => {
        const state = await page.evaluate(() => {
            const root = document.getElementById("empty-line-chart") as HTMLElement
            const empty = root.querySelector(".vtd-chart-empty") as HTMLElement
            return {svgs: root.querySelectorAll("svg").length, emptyShown: !empty.hidden, text: empty.innerText.trim()}
        })
        if (state.svgs != 0) {fail("ERROR: expected no drawing at all for empty data")}
        if (!state.emptyShown) {fail("ERROR: expected the empty state to be visible")}
        if (state.text.length == 0) {fail("ERROR: expected the empty state to render its symbol")}
    })

    itWrap("charts render a donut's hole and centre label", "charts", "#donut-pie-chart", async (_selection: ElementHandle) => {
        const state = await page.evaluate(() => {
            const root = document.getElementById("donut-pie-chart") as HTMLElement
            return {
                slices: root.querySelectorAll("path.vtd-chart-arc").length,
                text: Array.from(root.querySelectorAll("text")).map(t => t.textContent),
                // A ring segment's path has two arcs; a filled wedge has one and starts at the centre
                firstPath: (root.querySelector("path.vtd-chart-arc") as SVGPathElement).getAttribute("d") ?? ""
            }
        })
        if (state.slices != 5) {fail(`ERROR: expected a path per slice, got ${state.slices}`)}
        if (!state.text.includes("76")) {fail(`ERROR: expected the centre label, got ${JSON.stringify(state.text)}`)}
        if ((state.firstPath.match(/A /g) ?? []).length < 2) {
            fail("ERROR: expected a ring segment (two arcs) for a donut, not a filled wedge")
        }
    })

    itWrap("charts place the tooltip clear of the point it describes", "charts", "#default-line-chart", async (_selection: ElementHandle) => {
        // Regression: the tooltip's top-left used to be placed *at* the highest data point and
        // centred on the hovered column, so it covered exactly what the reader was pointing at.
        // It now sits beside the whole cursor-to-marker span and flips near the right edge.
        for (const fraction of [0.1, 0.4, 0.6, 0.95]) {
            const state = await page.evaluate(`(() => {
                const root = document.getElementById("default-line-chart")
                const hit = root.querySelector("rect.vtd-chart-hit")
                const box = hit.getBoundingClientRect()
                const cx = box.left + box.width * ${fraction}
                const cy = box.top + box.height * 0.5
                hit.dispatchEvent(new PointerEvent("pointermove", {bubbles: true, clientX: cx, clientY: cy}))
                const tip = root.querySelector(".vtd-chart-tooltip").getBoundingClientRect()
                const marker = root.querySelector("line[visibility=visible]")
                const markerX = marker ? marker.getBoundingClientRect().left : null
                const container = root.getBoundingClientRect()
                return {
                    coversCursor: cx >= tip.left && cx <= tip.right && cy >= tip.top && cy <= tip.bottom,
                    coversMarker: markerX !== null && markerX >= tip.left && markerX <= tip.right,
                    // Placed beside the cursor (rather than above/below it) when it shares the
                    // cursor's vertical band - which is the case the marker check applies to.
                    placedBeside: cy >= tip.top && cy <= tip.bottom,
                    overflows: tip.left < container.left - 1 || tip.right > container.right + 1,
                    visible: tip.width > 0
                }
            })()`) as {coversCursor: boolean, coversMarker: boolean, placedBeside: boolean, overflows: boolean, visible: boolean}
            if (!state.visible) {fail(`ERROR: no tooltip at ${fraction * 100}% across the plot`)}
            // The invariant that always holds, whatever the container width
            if (state.coversCursor) {fail(`ERROR: tooltip sits under the cursor at ${fraction * 100}%`)}
            if (state.overflows) {fail(`ERROR: tooltip escapes the chart container at ${fraction * 100}%`)}
            // When there was room beside the cursor, it must also clear the marker line. In a
            // container too narrow for that the tooltip goes above instead, and merely crosses the
            // marker's x - the line stays visible either side of it, so this doesn't apply.
            if (state.placedBeside && state.coversMarker) {
                fail(`ERROR: tooltip placed beside the cursor still covers the marker line at ${fraction * 100}%`)
            }
        }
    })

    itWrap("charts expose their data as a hidden table, and never as an SVG title", "charts", "#default-line-chart", async (_selection: ElementHandle) => {
        // Regression: the frame used to set an SVG <title> alongside aria-label. The title added
        // nothing - aria-label already wins the accessible-name computation - and made browsers pop
        // their own native tooltip on hover, competing with the chart's.
        const titles = await page.evaluate(() => document.querySelectorAll(".vtd-chart svg title").length)
        if (titles != 0) {fail(`ERROR: found ${titles} SVG <title> elements; they trigger the native hover tooltip`)}

        const state = await page.evaluate(() => {
            const root = document.getElementById("default-line-chart") as HTMLElement
            const svg = root.querySelector("svg") as SVGSVGElement
            const sr = root.querySelector(".vtd-chart-sr") as HTMLElement
            const table = sr.querySelector("table") as HTMLTableElement
            return {
                svgHidden: svg.getAttribute("aria-hidden"),
                caption: table?.querySelector("caption")?.textContent ?? null,
                headers: Array.from(table?.querySelectorAll("thead th") ?? []).map(t => t.textContent),
                rows: table?.querySelectorAll("tbody tr").length ?? 0,
                firstRow: (table?.querySelector("tbody tr") as HTMLElement)?.innerText.replace(/\s+/g, " ").trim() ?? "",
                // Hidden from sight, not from assistive tech
                boxWidth: Math.round(sr.getBoundingClientRect().width)
            }
        })
        if (state.svgHidden != "true") {fail("ERROR: expected the drawing to be aria-hidden once a data table carries the content")}
        if (state.caption != "Revenue and costs by month") {fail(`ERROR: expected the ariaLabel as the table caption, got ${JSON.stringify(state.caption)}`)}
        if (state.rows != 8) {fail(`ERROR: expected a row per category, got ${state.rows}`)}
        if (!state.headers.includes("Revenue") || !state.headers.includes("Costs")) {
            fail(`ERROR: expected a column per series, got ${JSON.stringify(state.headers)}`)
        }
        // Values must go through the caller's formatValue, so what is read aloud matches the axis
        if (!state.firstRow.includes("$12k")) {fail(`ERROR: expected formatted values in the table, got ${JSON.stringify(state.firstRow)}`)}
        if (state.boxWidth > 1) {fail(`ERROR: the table must be visually hidden, its box is ${state.boxWidth}px wide`)}
    })

    itWrap("charts do no DOM work for a hover that changes nothing", "charts", "#default-line-chart", async (_selection: ElementHandle) => {
        // `pointermove` fires up to ~120 times a second. The first cut rebuilt the tooltip's whole
        // subtree on every one: 60 moves inside a single column produced 580 mutation records and
        // 180 new nodes for a reading that never changed. Content is now reused in place, so a
        // repeat hover must be completely inert, and a real category change must not create nodes
        // either - only mutate the text already there.
        const churn = await page.evaluate(() => {
            const root = document.getElementById("default-line-chart") as HTMLElement
            const hit = root.querySelector("rect.vtd-chart-hit") as SVGRectElement
            const box = hit.getBoundingClientRect()
            const move = (x: number) => hit.dispatchEvent(new PointerEvent("pointermove", {
                bubbles: true, clientX: x, clientY: box.top + 40
            }))
            const fixedX = box.left + box.width * 0.5
            move(fixedX) // warm up: the first hover legitimately builds the row pool

            let added = 0, removed = 0
            const observer = new MutationObserver(() => { /* drained synchronously below */ })
            observer.observe(root, {childList: true, subtree: true, attributes: true, characterData: true})
            // A MutationObserver's callback is an async microtask, so it never runs inside this
            // synchronous block - the records have to be drained by hand. A first version of this
            // test read counters the callback would only have filled in later, and so passed
            // against the very implementation it was written to reject.
            const drain = () => {
                for (const record of observer.takeRecords()) {
                    added += record.addedNodes.length
                    removed += record.removedNodes.length
                }
            }

            for (let i = 0; i < 40; i++) { move(fixedX) }
            drain()
            const idle = {added, removed}

            added = 0; removed = 0
            // Sweep the whole plot, genuinely changing category several times
            for (let i = 0; i < 40; i++) { move(box.left + (box.width * i) / 40) }
            drain()
            const sweep = {added, removed}

            observer.disconnect()
            return {idle, sweep}
        })
        if (churn.idle.added != 0 || churn.idle.removed != 0) {
            fail(`ERROR: 40 identical hovers churned the DOM: +${churn.idle.added}/-${churn.idle.removed} nodes`)
        }
        if (churn.sweep.added != 0 || churn.sweep.removed != 0) {
            fail(`ERROR: sweeping the plot created nodes instead of updating text in place: +${churn.sweep.added}/-${churn.sweep.removed}`)
        }
    })

    itWrap("typography renders real heading elements whose size follows the level", "typography", "#typography-gallery", async (_selection: ElementHandle) => {
        // The point of Heading is that the outline and the visual hierarchy cannot disagree, so the
        // tag and the size both have to come from `level` - a styled <div> would pass a screenshot.
        const state = await page.evaluate(() => {
            const root = document.getElementById("typography-gallery") as HTMLElement
            const heads = Array.from(root.querySelectorAll("h1,h2,h3,h4,h5,h6")).slice(0, 6)
            return {
                tags: heads.map(h => h.tagName),
                sizes: heads.map(h => parseFloat(getComputedStyle(h).fontSize)),
                codeTag: (root.querySelector("#code-text") as HTMLElement).tagName,
                numeric: getComputedStyle(root.querySelector("#numeric-text") as HTMLElement).fontVariantNumeric,
                lastParaMargin: getComputedStyle(root.querySelector("#last-paragraph") as HTMLElement).marginBottom
            }
        })
        if (state.tags.join(",") != "H1,H2,H3,H4,H5,H6") {fail(`ERROR: expected real h1-h6, got ${state.tags}`)}
        for (let i = 1; i < state.sizes.length; i++) {
            if (state.sizes[i] > state.sizes[i - 1]) {
                fail(`ERROR: heading sizes must not increase with level, got ${JSON.stringify(state.sizes)}`)
            }
        }
        if (state.codeTag != "CODE") {fail(`ERROR: Text code should render a <code> element, got ${state.codeTag}`)}
        if (!state.numeric.includes("tabular-nums")) {fail(`ERROR: Text numeric should set tabular figures, got ${state.numeric}`)}
        if (state.lastParaMargin != "0px") {fail(`ERROR: a container's last Paragraph should drop its bottom margin, got ${state.lastParaMargin}`)}
    })

    itWrap("typography muted text is legible in both themes", "typography", "#typography-gallery", async (_selection: ElementHandle) => {
        // The trap this component exists to close: --text-alt is the *inverse* text colour, so
        // muted text styled with it is nearly invisible in dark mode. Check muted sits between the
        // page background and the body text in BOTH themes rather than collapsing into either.
        const luminance = (rgb: string) => {
            const parts = rgb.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0]
            const [r, g, b] = parts[0] <= 1 ? parts.map(v => v * 255) : parts
            return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        for (const theme of ["light", "dark"]) {
            const colors = await page.evaluate(`(() => {
                const scope = document.querySelector('#showcase-theme-${theme}')
                const muted = scope.querySelector('#muted-text')
                const body = scope.querySelector('.vtd-paragraph')
                return {
                    muted: getComputedStyle(muted).color,
                    body: getComputedStyle(body).color,
                    background: getComputedStyle(scope).backgroundColor
                }
            })()`) as {muted: string, body: string, background: string}
            const m = luminance(colors.muted), b = luminance(colors.body), bg = luminance(colors.background)
            // Muted must be dimmer than body text but still clearly off the background
            if (Math.abs(m - bg) < 40) {
                fail(`ERROR: ${theme} muted text is too close to the background (${colors.muted} on ${colors.background})`)
            }
            if (Math.abs(m - b) < 10) {
                fail(`ERROR: ${theme} muted text is indistinguishable from body text (${colors.muted} vs ${colors.body})`)
            }
        }
    })

    itWrap("layout Stack and Grid apply the spacing scale", "layout", "#row-stack", async (_selection: ElementHandle) => {
        const state = await page.evaluate(() => {
            const inner = (id: string) => getComputedStyle(document.getElementById(id)!.firstElementChild as HTMLElement)
            return {
                rowDirection: inner("row-stack").flexDirection,
                columnDirection: inner("column-stack").flexDirection,
                justify: inner("between-stack").justifyContent,
                startAlign: inner("column-start-stack").alignItems,
                fixedColumns: inner("fixed-grid").gridTemplateColumns.split(" ").length,
                // An auto-fill Grid's whole point is that its track count follows its width, so
                // measure it at two widths rather than asserting a number - at the suite's 400px
                // viewport (split into two theme columns) one track is the *correct* answer.
                tracksWide: (() => {
                    const host = document.getElementById("auto-grid") as HTMLElement
                    host.style.width = "900px"
                    const n = getComputedStyle(host.firstElementChild as HTMLElement).gridTemplateColumns.split(" ").length
                    host.style.width = "180px"
                    const narrow = getComputedStyle(host.firstElementChild as HTMLElement).gridTemplateColumns.split(" ").length
                    host.style.width = ""
                    return {wide: n, narrow}
                })()
            }
        })
        if (state.rowDirection != "row") {fail(`ERROR: expected a row, got ${state.rowDirection}`)}
        if (state.columnDirection != "column") {fail(`ERROR: expected a column, got ${state.columnDirection}`)}
        if (state.justify != "space-between") {fail(`ERROR: justify="between" should be space-between, got ${state.justify}`)}
        if (state.startAlign != "flex-start") {fail(`ERROR: align="start" should be flex-start, got ${state.startAlign}`)}
        if (state.fixedColumns != 3) {fail(`ERROR: columns={3} should produce 3 tracks, got ${state.fixedColumns}`)}
        if (!(state.tracksWide.wide > state.tracksWide.narrow)) {
            fail(`ERROR: an auto-fill Grid must add tracks as it widens, got ${JSON.stringify(state.tracksWide)}`)
        }
    })

    itWrap("layout gap scale is strictly increasing", "layout", "#row-stack", async (_selection: ElementHandle) => {
        // A scale whose steps are not ordered is worse than no scale: "lg" reading smaller than
        // "md" would make every consumer guess.
        const gaps = await page.evaluate(() => {
            const stacks = Array.from(document.querySelectorAll("#showcase-theme-light .vtd-stack"))
            // The gap demo renders one stack per scale step, each labelled with the step's name
            const found: Record<string, number> = {}
            for (const stack of stacks) {
                const label = stack.querySelector(".vtd-badge")?.textContent ?? ""
                if (["none", "xs", "sm", "md", "lg", "xl"].includes(label)) {
                    found[label] = parseFloat(getComputedStyle(stack as HTMLElement).gap) || 0
                }
            }
            return found
        })
        const order = ["none", "xs", "sm", "md", "lg", "xl"]
        const values = order.map(k => gaps[k])
        if (values.some(v => v === undefined)) {fail(`ERROR: expected a stack per scale step, got ${JSON.stringify(gaps)}`)}
        for (let i = 1; i < values.length; i++) {
            if (!(values[i] > values[i - 1])) {
                fail(`ERROR: gap scale must increase; "${order[i]}" (${values[i]}px) is not larger than "${order[i-1]}" (${values[i-1]}px)`)
            }
        }
    })

    itWrap("code block highlights without losing a character of the source", "code-block", "#code-tsx", async (_selection: ElementHandle) => {
        // The property that matters most is not the colours - it is that the rendered block is a
        // faithful copy of the input. A tokenizer that drops the gap between two matches looks
        // perfectly fine until someone copies the snippet and it does not compile.
        const state = await page.evaluate(() => {
            const scope = document.querySelector("#showcase-theme-light")!
            const block = (id: string) => scope.querySelector(`#${id} .vtd-code-block`) as HTMLElement
            const kinds = (id: string) => {
                const seen = new Set<string>()
                for (const span of block(id).querySelectorAll("span")) {
                    for (const cls of span.classList) {
                        if (cls.startsWith("vtd-code-block-")) {seen.add(cls.replace("vtd-code-block-", ""))}
                    }
                }
                return [...seen]
            }
            return {
                text: block("code-tsx").innerText,
                kinds: kinds("code-tsx"),
                plainKinds: kinds("code-plain"),
                // A multi-line comment straddles newlines, so tokens and lines do not line up -
                // regrouping for the number gutter must split those runs rather than drop them
                straddleLines: block("code-straddle").querySelectorAll(".vtd-code-block-line").length,
                straddleText: block("code-straddle").innerText,
                // Markup in the source must be shown, never rendered
                renderedMarkup: !!block("code-escaped").querySelector("script,b"),
                escapedText: block("code-escaped").innerText,
            }
        }) as {text: string, kinds: string[], plainKinds: string[], straddleLines: number, straddleText: string, renderedMarkup: boolean, escapedText: string}

        if (!state.text.includes(`import { Button, Stack } from "@velotype/velodesign"`)) {
            fail(`ERROR: CodeBlock dropped source text, got: ${state.text.slice(0, 120)}`)
        }
        if (!state.text.includes("        <Button type=\"text\">Cancel</Button>")) {
            fail("ERROR: CodeBlock did not preserve leading indentation")
        }
        for (const kind of ["comment", "string", "keyword", "tag", "attr", "number", "punct"]) {
            if (!state.kinds.includes(kind)) {
                fail(`ERROR: tsx highlighting produced no ${kind} token (got ${state.kinds.join(",")})`)
            }
        }
        if (state.plainKinds.length > 0) {
            fail(`ERROR: language="plain" should highlight nothing, got ${state.plainKinds.join(",")}`)
        }
        if (state.straddleLines != 6) {
            fail(`ERROR: a 6-line sample numbered as ${state.straddleLines} lines`)
        }
        if (!state.straddleText.includes("three source lines")) {
            fail("ERROR: the middle of a multi-line comment was dropped when numbering lines")
        }
        if (state.renderedMarkup || !state.escapedText.includes("<script>")) {
            fail(`ERROR: markup in the source was rendered instead of shown: ${state.escapedText}`)
        }
    })

    itWrap("code block does not treat prose between JSX tags as code", "code-block", "#code-jsx-text", async (_selection: ElementHandle) => {
        // Three bugs met here, and each looked like the other two. The words `of`, `set` and `as`
        // in a sentence inside <Paragraph> were coloured as keywords because they are also
        // TypeScript keywords. `getComponent<Command>` was counted as an opening tag, inflating
        // the JSX depth so every keyword *after* it became prose. And the `=>` in an attribute
        // ended its tag early, after which the real `/>` no longer closed the element - same
        // outcome, different cause.
        const state = await page.evaluate(() => {
            const scope = document.querySelector("#showcase-theme-light")!
            const pre = scope.querySelector("#code-jsx-text .vtd-code-block") as HTMLElement
            const kinds = (selector: string) =>
                [...pre.querySelectorAll(selector)].map(e => (e as HTMLElement).innerText)
            return {
                keywords: kinds(".vtd-code-block-keyword"),
                tags: kinds(".vtd-code-block-tag"),
                strings: kinds(".vtd-code-block-string"),
                text: pre.innerText,
            }
        }) as {keywords: string[], tags: string[], strings: string[], text: string}

        // Prose words must not be keywords, however keyword-shaped they are
        for (const word of ["of", "set", "as"]) {
            if (state.keywords.includes(word)) {
                fail(`ERROR: the prose word "${word}" was highlighted as a keyword`)
            }
        }
        // ...and real statements still must be
        for (const word of ["const", "return"]) {
            if (!state.keywords.includes(word)) {
                fail(`ERROR: the statement keyword "${word}" lost its highlighting (got ${state.keywords.join(",")})`)
            }
        }
        // A generic argument is not a tag, but every real tag is - open and close alike
        if (state.tags.includes("Command") && state.tags.filter(t => t == "Command").length > 1) {
            fail(`ERROR: the generic argument was counted as a tag: ${state.tags.join(",")}`)
        }
        for (const tag of ["div", "Paragraph", "Button"]) {
            if (state.tags.filter(t => t == tag).length != 2) {
                fail(`ERROR: <${tag}> should appear twice as a tag (open and close), got ${state.tags.join(",")}`)
            }
        }
        // A lone apostrophe in prose must not open a string
        if (state.strings.length > 0) {
            fail(`ERROR: prose was highlighted as a string: ${state.strings.join(" | ")}`)
        }
        if (!state.text.includes("package's line height")) {
            fail("ERROR: the sample text did not survive tokenizing")
        }
    })

    itWrap("code block token colours stay distinct in both themes", "code-block", "#code-tsx", async (_selection: ElementHandle) => {
        // Token colours come from the theme ramps, which invert between themes - a step that
        // reads well on one background can collapse into it on the other.
        for (const theme of ["light", "dark"]) {
            const colors = await page.evaluate(`(() => {
                const scope = document.querySelector('#showcase-theme-${theme}')
                const out = {}
                for (const kind of ["comment","string","keyword","tag","attr","number","punct"]) {
                    const el = scope.querySelector('.vtd-code-block-' + kind)
                    out[kind] = el ? getComputedStyle(el).color : null
                }
                return out
            })()`) as Record<string, string | null>
            const missing = Object.entries(colors).filter(([, v]) => v == null).map(([k]) => k)
            if (missing.length > 0) {
                fail(`ERROR: ${theme} is missing token kinds: ${missing.join(",")}`)
            }
            const distinct = new Set(Object.values(colors)).size
            if (distinct < 5) {
                fail(`ERROR: ${theme} renders only ${distinct} distinct token colours: ${JSON.stringify(colors)}`)
            }
        }
    })

    itWrap("table column widths bind, and only then", "table", "#default-table", async (_selection: ElementHandle) => {
        // A width is only a hint under the browser's default auto layout - a wide cell still wins,
        // which is exactly the bug this attr exists to fix. It has to switch the table to fixed
        // layout to bind, and must not do that to a table that declared no widths.
        const state = await page.evaluate(() => {
            const scope = document.querySelector("#showcase-theme-light")!
            const table = (id: string) => scope.querySelector(`#${id} table`) as HTMLTableElement
            const sized = table("sized-table")
            const headers = [...sized.querySelectorAll("th")] as HTMLElement[]
            return {
                plainLayout: getComputedStyle(table("default-table")).tableLayout,
                sizedLayout: getComputedStyle(sized).tableLayout,
                plainHasColgroup: !!table("default-table").querySelector("colgroup"),
                cols: [...sized.querySelectorAll("col")].map(c => (c as HTMLElement).style.width),
                tableWidth: sized.getBoundingClientRect().width,
                headerWidths: headers.map(h => h.getBoundingClientRect().width),
            }
        }) as {plainLayout: string, sizedLayout: string, plainHasColgroup: boolean, cols: string[], tableWidth: number, headerWidths: number[]}

        if (state.sizedLayout != "fixed") {
            fail(`ERROR: a table with declared widths must use fixed layout, got ${state.sizedLayout}`)
        }
        if (state.plainLayout == "fixed" || state.plainHasColgroup) {
            fail("ERROR: a table that declares no widths must be left on auto layout with no colgroup")
        }
        if (state.cols.join(",") != "50%,90px,") {
            fail(`ERROR: colgroup widths are ${JSON.stringify(state.cols)}, want ["50%","90px",""]`)
        }
        // The percentage column must actually take its share, and the px column its pixels -
        // a column whose content is far wider must not steal the space
        const half = state.tableWidth / 2
        if (Math.abs(state.headerWidths[0] - half) > 4) {
            fail(`ERROR: the 50% column measured ${state.headerWidths[0]}px of a ${state.tableWidth}px table`)
        }
        if (Math.abs(state.headerWidths[1] - 90) > 4) {
            fail(`ERROR: the 90px column measured ${state.headerWidths[1]}px`)
        }
    })

    itWrap("Collapse and Accordion render the same disclosure widget", "collapse", "#default-collapse", async (_selection: ElementHandle) => {
        // They share `disclosure-view.tsx` precisely so they cannot drift apart again. They had a
        // stylesheet each, five rules byte-identical between them, and had already diverged where
        // it showed: Accordion animated open over 200ms and Collapse snapped, so a consumer
        // choosing a component on the shape of its API silently chose an open/close behaviour too.
        const measure = (root: string) => `(() => {
            const scope = document.querySelector('#showcase-theme-light')
            const details = scope.querySelector('${root}')
            const content = details.querySelector('.vtd-disclosure-content')
            const header = details.querySelector('.vtd-disclosure-header')
            const chevron = details.querySelector('.vtd-disclosure-chevron')
            const cs = getComputedStyle(content), hs = getComputedStyle(header)
            const vs = getComputedStyle(chevron), ds = getComputedStyle(details)
            return {
                transition: cs.transitionProperty + '|' + cs.transitionDuration,
                display: cs.display,
                headerPadding: hs.padding,
                chevronSize: vs.width + 'x' + vs.height,
                border: ds.borderTopWidth + ' ' + ds.borderTopColor,
                radius: ds.borderTopLeftRadius
            }
        })()`
        const collapse = await page.evaluate(measure(".vtd-collapse")) as Record<string, string>
        await page.goto(`${baseUrl}/accordion`, {waitUntil: "networkidle2"})
        await page.waitForSelector(".vtd-accordion-item")
        const accordion = await page.evaluate(measure(".vtd-accordion-item")) as Record<string, string>

        for (const key of Object.keys(collapse)) {
            if (collapse[key] != accordion[key]) {
                fail(`ERROR: ${key} differs - Collapse "${collapse[key]}" vs Accordion "${accordion[key]}"`)
            }
        }
        // The shared open animation is the property that had actually drifted
        if (!collapse.transition.includes("grid-template-rows") || !collapse.transition.includes("0.2s")) {
            fail(`ERROR: the shared animated open is missing: ${collapse.transition}`)
        }

        // An open section must look open: the header takes a divider and a fill, or it reads as
        // the first line of the content rather than as its header
        const openState = await page.evaluate(() => {
            const scope = document.querySelector("#showcase-theme-light")!
            const details = scope.querySelector(".vtd-accordion-item") as HTMLDetailsElement
            const header = details.querySelector(".vtd-disclosure-header") as HTMLElement
            const inner = details.querySelector(".vtd-disclosure-content-inner") as HTMLElement
            const closed = {
                border: getComputedStyle(header).borderBottomColor,
                background: getComputedStyle(header).backgroundColor,
            }
            header.click()
            const open = {
                border: getComputedStyle(header).borderBottomColor,
                background: getComputedStyle(header).backgroundColor,
            }
            const padding = getComputedStyle(inner)
            return {closed, open, padding: [padding.paddingTop, padding.paddingRight, padding.paddingBottom, padding.paddingLeft]}
        }) as {closed: {border: string, background: string}, open: {border: string, background: string}, padding: string[]}

        if (openState.open.border == openState.closed.border) {
            fail(`ERROR: an open header shows no divider - border is ${openState.open.border} either way`)
        }
        if (openState.open.background == openState.closed.background) {
            fail(`ERROR: an open header shows no fill - background is ${openState.open.background} either way`)
        }
        // Equal padding all round: a zero top inset pushed the content against the header
        if (new Set(openState.padding).size != 1) {
            fail(`ERROR: content padding is uneven: ${openState.padding.join(" ")}`)
        }
    })

    itWrap("a disclosure animates every toggle, not just the first", "collapse", "#default-collapse", async (_selection: ElementHandle) => {
        // The bug this guards: removing `open` stops the browser rendering that subtree, so the
        // close transition never gets a start time - it sits at playState "running", startTime
        // null, *forever* - which also pins the computed style at the open values. The first open
        // animated and every toggle after it snapped. Nothing caught it because every other test
        // here toggles a disclosure exactly once.
        //
        // What is asserted here is the frame-independent half of the contract: that the close is
        // intercepted, that it takes the transition's own time rather than happening instantly,
        // and that it works on every cycle rather than only the first. The *visual* half - that
        // intermediate heights are actually painted - cannot be asserted in this suite, where
        // transitions never progress at all (requestAnimationFrame does not tick, and computed
        // grid-template-rows stays at its start value); it was verified separately against a real
        // browser session, which measured 12-13 distinct heights on every open and close.
        const read = () => page.evaluate(() => {
            const details = document.querySelector("#showcase-theme-light .vtd-collapse") as HTMLDetailsElement
            const content = details.querySelector(".vtd-disclosure-content") as HTMLElement
            const animations = content.getAnimations()
            return {
                open: details.open,
                closing: details.classList.contains("vtd-disclosure-closing"),
                running: animations.length,
                unstarted: animations.filter(a => a.startTime == null).length,
            }
        })
        const click = () => page.evaluate(() => {
            const details = document.querySelector("#showcase-theme-light .vtd-collapse") as HTMLDetailsElement
            ;(details.querySelector(".vtd-disclosure-header") as HTMLElement).click()
        })

        const before = await read()
        if (before.open) {fail("ERROR: expected the collapse to start closed")}

        for (let cycle = 1; cycle <= 3; cycle++) {
            await click()
            await waitUntil(async () => (await read()).open, `open ${cycle} to take effect`)

            // Closing is intercepted: `open` is held set while the transition runs, which is the
            // whole fix - without it the subtree stops rendering and the transition never starts.
            const closeClickedAt = Date.now()
            await click()
            const during = await read()
            if (!during.open || !during.closing) {
                fail(`ERROR: close ${cycle} was not intercepted - open=${during.open} closing=${during.closing}`)
            }
            await waitUntil(async () => {
                const state = await read()
                return !state.open && !state.closing
            }, `close ${cycle} to settle`)
            const elapsed = Date.now() - closeClickedAt

            const closed = await read()
            if (closed.open) {fail(`ERROR: close ${cycle} left the section open`)}
            if (closed.unstarted > 0) {
                fail(`ERROR: close ${cycle} left ${closed.unstarted} transition(s) stuck with a null startTime`)
            }
            // The close must take the transition's own time rather than happening instantly.
            // Throttling can only stretch this, never shorten it.
            if (elapsed < 150) {
                fail(`ERROR: close ${cycle} completed in ${elapsed}ms - it closed instantly instead of animating`)
            }
        }
    })

    itWrap("an exclusive Accordion keeps one section open, and the displaced one animates", "accordion", "#exclusive-accordion", async (_selection: ElementHandle) => {
        // Exclusivity is ours rather than the native `<details name>` grouping: the browser closes
        // a grouped sibling itself, instantly and before any handler runs, so with `name` the
        // clicked section animated while the one it displaced snapped shut.
        const read = () => page.evaluate(() => {
            const group = document.querySelector("#showcase-theme-light #exclusive-accordion")!
            const items = [...group.querySelectorAll(".vtd-accordion-item")] as HTMLDetailsElement[]
            return {
                open: items.filter(d => d.open).length,
                closing: items.filter(d => d.classList.contains("vtd-disclosure-closing")).length,
                running: items.reduce((total, d) =>
                    total + (d.querySelector(".vtd-disclosure-content") as HTMLElement).getAnimations().length, 0),
                nativeNames: items.filter(d => d.hasAttribute("name")).length,
                firstOpen: items[0].open,
            }
        })
        const click = (index: number) => page.evaluate((i: number) => {
            const group = document.querySelector("#showcase-theme-light #exclusive-accordion")!
            const items = [...group.querySelectorAll(".vtd-accordion-item")]
            ;(items[i].querySelector(".vtd-disclosure-header") as HTMLElement).click()
        }, {args: [index]})

        if ((await read()).nativeNames != 0) {
            fail("ERROR: sections still use native <details name> grouping, which cannot animate its close")
        }

        await click(0)
        await waitUntil(async () => (await read()).firstOpen, "the first section to open")
        if ((await read()).open != 1) {fail("ERROR: expected exactly one open section")}

        // Opening a sibling must close the first one *through the animation*, not instantly
        await click(1)
        const mid = await read()
        if (!mid.firstOpen || mid.closing != 1) {
            fail(`ERROR: the displaced section should still be open and marked closing, got open=${mid.firstOpen} closing=${mid.closing}`)
        }
        await waitUntil(async () => {
            const state = await read()
            return !state.firstOpen && state.closing == 0
        }, "the displaced section to finish closing")

        const after = await read()
        if (after.open != 1) {fail(`ERROR: after the swap ${after.open} sections were open, expected 1`)}
        if (after.firstOpen) {fail("ERROR: the displaced section never closed")}
    })

    itWrap("table of contents renders indented in-page anchors", "table-of-contents", "#toc-nav", async (_selection: ElementHandle) => {
        // Scroll tracking itself is NOT asserted here. IntersectionObserver does not deliver in
        // this suite's reused tab, the same way requestAnimationFrame does not tick - verified by
        // loading the same page standalone at this suite's own 400x200 viewport, where the
        // highlight lands correctly. A scroll assertion here would either time out or, worse,
        // pass for the wrong reason: "no DOM work while scrolling" is trivially true when the
        // observer never fires. What is asserted here is everything that does not depend on it.
        const state = await page.evaluate(() => {
            const scope = document.querySelector("#showcase-theme-light")!
            const nav = scope.querySelector(".vtd-table-of-contents") as HTMLElement
            const links = [...scope.querySelectorAll(".vtd-table-of-contents-link")] as HTMLAnchorElement[]
            return {
                navRole: nav.tagName.toLowerCase(),
                navLabel: nav.getAttribute("aria-label"),
                header: (scope.querySelector(".vtd-table-of-contents-header") as HTMLElement | null)?.innerText.trim(),
                count: links.length,
                hrefs: links.map(l => l.getAttribute("href") ?? ""),
                indents: links.map(l => Math.round(parseFloat(getComputedStyle(l).paddingInlineStart))),
                targetsPresent: links.filter(l => !!document.getElementById((l.getAttribute("href") ?? "#").slice(1))).length,
            }
        }) as {navRole: string, navLabel: string | null, header?: string, count: number, hrefs: string[], indents: number[], targetsPresent: number}

        if (state.navRole != "nav") {fail(`ERROR: expected a <nav> landmark, got <${state.navRole}>`)}
        if (!state.navLabel) {fail("ERROR: the nav landmark has no accessible name")}
        // innerText is the *rendered* text, and the header is uppercased by text-transform
        if (state.header?.toLowerCase() != "on this page") {fail(`ERROR: header renders as ${state.header}`)}
        if (state.count != 9) {fail(`ERROR: expected 9 entries, got ${state.count}`)}
        if (state.hrefs.some(href => !href.startsWith("#"))) {
            fail(`ERROR: every entry must be an in-page anchor, got ${state.hrefs.join(",")}`)
        }
        // Every entry must actually point at something, or the highlight can never resolve
        if (state.targetsPresent != state.count) {
            fail(`ERROR: only ${state.targetsPresent} of ${state.count} entries point at an element that exists`)
        }
        // Indent follows level: entries 0/1 are level 1, entry 2 level 2, entry 7 level 3
        if (!(state.indents[2] > state.indents[1])) {
            fail(`ERROR: a level-2 entry is not indented past level 1 (${state.indents.join(",")})`)
        }
        if (!(state.indents[7] > state.indents[2])) {
            fail(`ERROR: a level-3 entry is not indented past level 2 (${state.indents.join(",")})`)
        }
    })

    itWrap("clicking a table of contents entry highlights it, and re-clicking does nothing", "table-of-contents", "#toc-nav", async (_selection: ElementHandle) => {
        // The click path is independent of the observer, so it is assertable here - and it covers
        // the early return in #setActive, which is what keeps scrolling through a long section
        // from touching the DOM at all.
        const result = await page.evaluate(() => {
            const scope = document.querySelector("#showcase-theme-light")!
            const nav = scope.querySelector(".vtd-table-of-contents")!
            const links = [...scope.querySelectorAll(".vtd-table-of-contents-link")] as HTMLAnchorElement[]
            const activeHref = () => {
                const link = scope.querySelector(".vtd-table-of-contents-link-active") as HTMLAnchorElement | null
                return link ? link.getAttribute("href") : null
            }
            links[4].click()
            const afterFirst = {href: activeHref(), current: scope.querySelectorAll("[aria-current]").length}

            const observer = new MutationObserver(() => {})
            observer.observe(nav, {childList: true, subtree: true, attributes: true, characterData: true})
            for (let i = 0; i < 20; i++) {
                links[4].click()
            }
            // Drain by hand - the callback is an async microtask and has not run in this block
            const records = observer.takeRecords().length
            observer.disconnect()

            links[7].click()
            return {
                afterFirst,
                repeatRecords: records,
                afterSecond: {href: activeHref(), current: scope.querySelectorAll("[aria-current]").length},
                expectedFirst: links[4].getAttribute("href"),
                expectedSecond: links[7].getAttribute("href"),
            }
        }) as {
            afterFirst: {href: string | null, current: number}
            repeatRecords: number
            afterSecond: {href: string | null, current: number}
            expectedFirst: string | null
            expectedSecond: string | null
        }

        if (result.afterFirst.href != result.expectedFirst) {
            fail(`ERROR: clicking an entry highlighted ${result.afterFirst.href}, expected ${result.expectedFirst}`)
        }
        if (result.afterFirst.current != 1) {
            fail(`ERROR: ${result.afterFirst.current} elements carry aria-current, expected 1`)
        }
        if (result.repeatRecords != 0) {
            fail(`ERROR: re-clicking the already-current entry produced ${result.repeatRecords} mutation record(s); it should produce none`)
        }
        if (result.afterSecond.href != result.expectedSecond) {
            fail(`ERROR: clicking a second entry highlighted ${result.afterSecond.href}, expected ${result.expectedSecond}`)
        }
        if (result.afterSecond.current != 1) {
            fail(`ERROR: after moving the highlight, ${result.afterSecond.current} elements carry aria-current, expected 1`)
        }
    })

    itWrap("tree nodes use the shared disclosure animation without its chrome", "tree", "#default-tree", async (_selection: ElementHandle) => {
        // Tree takes the mechanism from disclosure-view.tsx and not the look: a tree row is not a
        // header, so it keeps its own hover, chevron and indentation and must never pick up the
        // border box, header fill or content padding that Collapse and Accordion draw. The
        // animation itself is only assertable standalone here - see the Collapse test for why -
        // so this asserts the interception, which is what makes it work at all.
        const state = await page.evaluate(() => {
            const scope = document.querySelector("#showcase-theme-light")!
            const node = scope.querySelector(".vtd-tree-node") as HTMLDetailsElement
            const content = node.querySelector(".vtd-disclosure-content") as HTMLElement
            const inner = node.querySelector(".vtd-disclosure-content-inner") as HTMLElement
            const summary = node.querySelector(".vtd-tree-label") as HTMLElement
            const label = node.querySelector(".vtd-tree-label-text") as HTMLElement
            const nodeStyle = getComputedStyle(node)
            const before = {
                transition: getComputedStyle(content).transitionProperty,
                display: getComputedStyle(content).display,
                border: nodeStyle.borderTopWidth,
                radius: nodeStyle.borderTopLeftRadius,
                innerPadding: getComputedStyle(inner).paddingTop,
                open: node.open,
            }
            summary.click()
            const duringClose = {open: node.open, closing: node.classList.contains("vtd-disclosure-closing")}
            // A click on the label selects the node; it must not toggle or start a close
            const openBeforeLabel = node.open
            label.click()
            const afterLabel = {open: node.open, closing: node.classList.contains("vtd-disclosure-closing")}
            return {before, duringClose, openBeforeLabel, afterLabel}
        }) as {
            before: {transition: string, display: string, border: string, radius: string, innerPadding: string, open: boolean}
            duringClose: {open: boolean, closing: boolean}
            openBeforeLabel: boolean
            afterLabel: {open: boolean, closing: boolean}
        }

        if (!state.before.transition.includes("grid-template-rows") || state.before.display != "grid") {
            fail(`ERROR: a tree node's content is not set up to animate: ${state.before.display} / ${state.before.transition}`)
        }
        // The chrome must not have come along with the mechanism
        if (state.before.border != "0px" || state.before.radius != "0px") {
            fail(`ERROR: a tree node picked up the disclosure chrome - border ${state.before.border}, radius ${state.before.radius}`)
        }
        if (state.before.innerPadding != "0px") {
            fail(`ERROR: a tree node picked up the disclosure content padding (${state.before.innerPadding})`)
        }
        if (!state.before.open) {fail("ERROR: expected the first tree node to start open")}
        if (!state.duringClose.open || !state.duringClose.closing) {
            fail(`ERROR: the close was not intercepted - open=${state.duringClose.open} closing=${state.duringClose.closing}`)
        }
        // Selecting a label is not toggling
        if (state.afterLabel.open != state.openBeforeLabel || state.afterLabel.closing != state.duringClose.closing) {
            fail("ERROR: clicking a node's label changed its open state instead of only selecting it")
        }
    })

    itWrap("breadcrumbs show leading content and collapse a long trail", "breadcrumbs", "#collapsed-breadcrumbs", async (_selection: ElementHandle) => {
        const state = await page.evaluate(() => {
            const scope = document.querySelector("#showcase-theme-light")!
            const items = (id: string) => [...scope.querySelector("#" + id)!.querySelectorAll(".vtd-breadcrumbs-item")]
            const collapsed = scope.querySelector("#collapsed-breadcrumbs")!
            const expander = collapsed.querySelector(".vtd-menu-trigger") as HTMLElement
            const details = expander.closest("details") as HTMLDetailsElement
            const before = details.open
            expander.click()
            return {
                // Seven crumbs at maxItems 4 render as first + expander + the last two
                collapsedCount: items("collapsed-breadcrumbs").length,
                collapsedTexts: items("collapsed-breadcrumbs").map(li =>
                    (li as HTMLElement).innerText.replace(/\s+/g, " ").replace(/ \/ $/, "").trim()),
                separators: collapsed.querySelectorAll(".vtd-breadcrumbs-separator").length,
                current: collapsed.querySelectorAll("[aria-current='page']").length,
                expanderLabel: expander.getAttribute("aria-label"),
                openBefore: before,
                openAfter: details.open,
                hidden: [...details.querySelectorAll(".vtd-menu-item")].map(a => (a as HTMLElement).innerText.trim()),
                // A trail short enough to fit must not collapse even with maxItems set
                shortCount: items("uncollapsed-breadcrumbs").length,
                shortHasExpander: !!scope.querySelector("#uncollapsed-breadcrumbs .vtd-menu-trigger"),
                // The leading slot renders real components, not just a string
                leadingSlots: scope.querySelectorAll("#leading-breadcrumbs .vtd-breadcrumbs-leading").length,
                leadingHasAvatar: !!scope.querySelector("#leading-breadcrumbs .vtd-breadcrumbs-leading .vtd-avatar"),
                leadingKeepsLabel: (scope.querySelector("#leading-breadcrumbs .vtd-breadcrumbs-crumb") as HTMLElement).innerText.includes("Acme"),
            }
        }) as {
            collapsedCount: number, collapsedTexts: string[], separators: number, current: number
            expanderLabel: string | null, openBefore: boolean, openAfter: boolean, hidden: string[]
            shortCount: number, shortHasExpander: boolean
            leadingSlots: number, leadingHasAvatar: boolean, leadingKeepsLabel: boolean
        }

        if (state.collapsedCount != 4) {
            fail(`ERROR: seven crumbs at maxItems 4 rendered ${state.collapsedCount} slots: ${state.collapsedTexts.join(" | ")}`)
        }
        // The two ends of the trail are the ones that survive
        if (!state.collapsedTexts[0].startsWith("Home")) {fail(`ERROR: the root crumb was collapsed away (${state.collapsedTexts.join(" | ")})`)}
        if (state.collapsedTexts[3] != "Current page") {fail(`ERROR: the current page is not last (${state.collapsedTexts.join(" | ")})`)}
        if (state.current != 1) {fail(`ERROR: ${state.current} crumbs marked aria-current, expected 1`)}
        // One separator after every crumb except the very last
        if (state.separators != state.collapsedCount - 1) {
            fail(`ERROR: ${state.collapsedCount} crumbs but ${state.separators} separators`)
        }
        if (!state.expanderLabel) {fail("ERROR: the expander has no accessible name")}
        if (state.openBefore || !state.openAfter) {
            fail(`ERROR: the expander did not open on click (${state.openBefore} -> ${state.openAfter})`)
        }
        if (state.hidden.join(",") != "Level two,Level three,Level four,Level five") {
            fail(`ERROR: the expander hides the wrong crumbs: ${state.hidden.join(",")}`)
        }
        if (state.shortCount != 3 || state.shortHasExpander) {
            fail(`ERROR: a trail that fits inside maxItems collapsed anyway (${state.shortCount} slots, expander=${state.shortHasExpander})`)
        }
        if (state.leadingSlots != 2 || !state.leadingHasAvatar) {
            fail(`ERROR: leading content did not render (${state.leadingSlots} slots, avatar=${state.leadingHasAvatar})`)
        }
        if (!state.leadingKeepsLabel) {fail("ERROR: a crumb's leading content replaced its label instead of preceding it")}
    })


    /**
     * One assignment to `CommonThemeOptions` has to reach every component that means the same thing
     * by that symbol, and a per-component assignment has to beat it for that component alone.
     *
     * Two of these assertions would have been impossible to write before the shared object existed:
     * `Steps`' completed-step check and `Pagination`'s gap were literal glyphs in the markup with no
     * override of any kind, so no consumer could have changed them at all. Deleting the delegation
     * (capturing `CommonThemeOptions[field]` when the component's module is evaluated instead of
     * reading it on every access) makes every `after` value below stay at the package default,
     * because the page sets these long after `pagination.tsx` and friends were evaluated.
     */
    itWrap("one shared symbol reaches every component that means the same thing by it", "theme-options", "#symbols-close", async (_selection: ElementHandle) => {
        const read = () => page.evaluate(() => {
            const scope = document.getElementById("showcase-theme-light") as HTMLElement
            const text = (selector: string) => (scope.querySelector(selector) as HTMLElement | null)?.innerText.trim() ?? "(missing)"
            return {
                alertDismiss: text("#symbols-close .vtd-alert-dismiss"),
                tagRemove: text("#symbols-close .vtd-tag-remove"),
                // The first pagination button is previous; Steps' first marker is a completed step
                pagerPrev: text("#symbols-prev-next .vtd-pagination button"),
                stepsDone: text("#symbols-confirm .vtd-steps-marker"),
                crumbsCollapse: text("#symbols-collapse .vtd-menu-trigger"),
            }
        }) as Promise<Record<string, string>>

        const before = await read()
        if (before.alertDismiss != "x" || before.tagRemove != "x") {
            fail(`ERROR: the close glyph did not start at the package default: ${JSON.stringify(before)}`)
        }
        if (before.pagerPrev != "\u2039" || before.stepsDone != "\u2713" || before.crumbsCollapse != "\u2026") {
            fail(`ERROR: a shared glyph did not start at its package default: ${JSON.stringify(before)}`)
        }

        for (const id of ["set-common-close", "set-common-prev", "set-common-confirm", "set-common-collapse"]) {
            await page.evaluate(`document.getElementById("${id}").click()`)
        }
        const after = await read()
        // Two components, two different field names (dismissSymbol/removeSymbol), one assignment
        if (after.alertDismiss != "CLOSE" || after.tagRemove != "CLOSE") {
            fail(`ERROR: CommonThemeOptions.closeSymbol did not reach both components: ${JSON.stringify(after)}`)
        }
        if (after.pagerPrev != "PREV") {fail(`ERROR: prevSymbol did not reach Pagination: ${after.pagerPrev}`)}
        if (after.stepsDone != "YES") {fail(`ERROR: confirmSymbol did not reach Steps, which had it hardcoded: ${after.stepsDone}`)}
        if (after.crumbsCollapse != "MORE") {fail(`ERROR: collapseSymbol did not reach the Breadcrumbs expander: ${after.crumbsCollapse}`)}

        // A per-component override wins, and only for that component
        await page.evaluate(`document.getElementById("set-pagination-prev").click()`)
        const overridden = await read()
        if (overridden.pagerPrev != "PAGER-ONLY") {
            fail(`ERROR: PaginationThemeOptions.prevSymbol did not beat the shared one: ${overridden.pagerPrev}`)
        }
        if (overridden.alertDismiss != "CLOSE") {
            fail(`ERROR: a per-component override leaked into another component: ${JSON.stringify(overridden)}`)
        }

        // resetThemeOptions restores the package defaults, which nothing else can once a field has
        // been assigned over - the original function is gone unless the accessor kept it
        await page.evaluate(`document.getElementById("reset-symbols").click()`)
        const reset = await read()
        if (JSON.stringify(reset) != JSON.stringify(before)) {
            fail(`ERROR: reset left ${JSON.stringify(reset)}, expected ${JSON.stringify(before)}`)
        }
    })


    /**
     * A no-match state must not be English, and must be overridable.
     *
     * `Combobox` rendered a baked-in "No matches" with no attr and no theme option, which survived
     * an audit that claimed to have swept the whole package - it was invisible because it is not a
     * *default* anywhere, just a literal inside a `replaceChildren` in a private method. The
     * assertion is deliberately "contains no latin letters" rather than "is not the string
     * \u0022No matches\u0022", so swapping one English phrase for another cannot make it pass.
     */
    itWrap("a no-match state is language-agnostic and overridable", "combobox", "#default-combobox", async (_selection: ElementHandle) => {
        const noMatchIn = (containerId: string) => page.evaluate(`(() => {
            const scope = document.getElementById(${JSON.stringify(containerId)})
            const input = scope.querySelector("input.vtd-combobox")
            input.focus()
            input.value = "zzzznothingmatchesthis"
            input.dispatchEvent(new Event("input", {bubbles: true}))
            const empty = scope.querySelector(".vtd-combobox-empty")
            return empty ? empty.innerText.trim() : "(no empty node rendered)"
        })()`) as Promise<string>

        const fallback = await noMatchIn("default-combobox")
        if (/[A-Za-z]/.test(fallback)) {
            fail(`ERROR: the default no-match state renders language-specific text: ${JSON.stringify(fallback)}`)
        }
        if (fallback != "\u2205") {
            fail(`ERROR: expected the shared empty symbol for an unset noMatchMessage, got ${JSON.stringify(fallback)}`)
        }

        const worded = await noMatchIn("worded-combobox")
        if (worded != "Rien ne correspond") {
            fail(`ERROR: noMatchMessage was ignored, got ${JSON.stringify(worded)}`)
        }
    })


    /**
     * `Tree`'s open/closed state has to be readable and drivable from outside, which is what makes
     * a filterable tree possible at all: reveal the branch holding a match, then put the reader's
     * own expansions back when the filter clears.
     *
     * The subtle one is `onToggle` firing *after* the state has changed. It is driven by the
     * element's own `toggle` event for that reason - reporting from the click handler instead
     * looks correct and is a frame early, so the obvious `onToggle` handler (read `getOpenKeys()`)
     * silently sees the previous state. The showcase's sidebar lost every expansion that way.
     */
    itWrap("tree open state can be read and driven from outside", "tree", "#default-tree", async (_selection: ElementHandle) => {
        const read = () => page.evaluate(`(() => {
            const scope = document.getElementById("showcase-theme-light")
            return {
                reported: scope.querySelector("#tree-open-keys").innerText.trim(),
                open: [...scope.querySelectorAll("#default-tree .vtd-tree-node")]
                    .filter((d) => d.open && !d.classList.contains("vtd-disclosure-closing"))
                    .map((d) => d.querySelector(".vtd-tree-label").innerText.trim()),
            }
        })()`) as Promise<{reported: string, open: string[]}>

        const click = (id: string) => page.evaluate(`document.getElementById("showcase-theme-light").querySelector("#${id}").click()`)

        // defaultOpen puts one branch open before anything is clicked
        const initial = await read()
        if (initial.open.join(",") != "src") {
            fail(`ERROR: expected only the defaultOpen branch open, got ${JSON.stringify(initial.open)}`)
        }

        // setOpenKeys over every branch key, then none
        await click("tree-expand-all")
        const expanded = await read()
        if (expanded.open.length != 2) {
            fail(`ERROR: expand-all left ${expanded.open.length} branches open, expected 2: ${JSON.stringify(expanded.open)}`)
        }
        // onToggle reports after the change, so what it saw must match what is actually open
        if (expanded.reported != "Open: src,components") {
            fail(`ERROR: onToggle reported stale state after expand-all: ${JSON.stringify(expanded.reported)}`)
        }

        await click("tree-collapse-all")
        const collapsed = await read()
        if (collapsed.open.length != 0) {
            fail(`ERROR: collapse-all left branches open: ${JSON.stringify(collapsed.open)}`)
        }
        if (collapsed.reported != "Open: (none)") {
            fail(`ERROR: onToggle reported stale state after collapse-all: ${JSON.stringify(collapsed.reported)}`)
        }

        // reveal() opens a leaf's whole ancestor chain. setOpen("components") alone would leave it
        // open inside a closed "src" - on screen that is indistinguishable from nothing happening.
        await click("tree-reveal-card")
        const revealed = await read()
        if (!revealed.open.includes("src") || !revealed.open.includes("components")) {
            fail(`ERROR: reveal did not open the leaf's whole ancestor chain: ${JSON.stringify(revealed.open)}`)
        }
    })

    /**
     * A leaf with no `onSelect` must not claim to be a button.
     *
     * It used to render `role="button" tabindex="0"` whether or not anything was listening, so a
     * keyboard user could focus it and press Enter to no effect - and a `Link` in `label` ended up
     * as a link inside a button. Leaving `onSelect` unset is how the showcase's sidebar nav lets
     * its `NavLink`s own their own clicks.
     */
    itWrap("a tree leaf is only a button when something is listening", "tree", "#linked-tree", async (_selection: ElementHandle) => {
        const shapes = await page.evaluate(`(() => {
            const scope = document.getElementById("showcase-theme-light")
            const describe = (selector) => {
                const leaf = scope.querySelector(selector + " .vtd-tree-leaf")
                return {role: leaf.getAttribute("role"), tabindex: leaf.getAttribute("tabindex"), links: leaf.querySelectorAll("a").length}
            }
            return {selectable: describe("#default-tree"), linked: describe("#linked-tree")}
        })()`) as {selectable: {role: string | null, tabindex: string | null, links: number}, linked: {role: string | null, tabindex: string | null, links: number}}

        if (shapes.selectable.role != "button" || shapes.selectable.tabindex != "0") {
            fail(`ERROR: a leaf with onSelect is not focusable as a button: ${JSON.stringify(shapes.selectable)}`)
        }
        if (shapes.linked.role != null || shapes.linked.tabindex != null) {
            fail(`ERROR: a leaf without onSelect still claims to be a button: ${JSON.stringify(shapes.linked)}`)
        }
        if (shapes.linked.links != 1) {
            fail(`ERROR: expected the link in the label to be the only control: ${JSON.stringify(shapes.linked)}`)
        }
    })

})
