/// <reference lib="deno.ns" />

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd"
import { fail, assertEquals } from "@std/assert"

import {Server} from "@velotype/veloserver"

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

    itWrap("set of timeago tests", "timeago", "#timeago-page", async (_pageLoadSelection: ElementHandle) => {
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

    itWrap("navlink highlights the active route and updates on navigation", "navlink", "#navlink-home", async (selection: ElementHandle) => {
        const initialClass = await selection.getAttribute("class")
        if (!initialClass?.includes("vtd-navlink-active")) {
            fail(`ERROR: expected home NavLink to start active, class was: ${initialClass}`)
        }

        const otherLink = await page.$("a[href='/navlink/other']")
        if (!otherLink) {fail("ERROR: other navlink not found")}
        await otherLink.click()

        const updatedHome = await page.waitForSelector("#navlink-home")
        if (!updatedHome) {fail("ERROR: home navlink not found after navigation")}
        const updatedClass = await updatedHome.getAttribute("class")
        if (updatedClass?.includes("vtd-navlink-active")) {
            fail(`ERROR: expected home NavLink to no longer be active, class was: ${updatedClass}`)
        }

        const updatedOtherLink = await page.$("a[href='/navlink/other']")
        if (!updatedOtherLink) {fail("ERROR: other navlink not found after navigation")}
        const otherClass = await updatedOtherLink.getAttribute("class")
        if (!otherClass?.includes("vtd-navlink-active")) {
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

    itWrap("menu closes when clicking outside of it", "menu", "#actions-menu", async (selection: ElementHandle) => {
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
        if (afterSecondClick.first) {fail("ERROR: expected first section to close once a sibling in the exclusive group opened")}
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
            ;(root.querySelector(".vtd-datatable-sort-button") as HTMLElement).click()
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
            const columnsButton = Array.from(root.querySelectorAll("button")).find(b => b.textContent?.trim() == "Columns") as HTMLElement | undefined
            columnsButton?.click()
        })
        const openRightAfterClick = await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            return root.querySelector(".vtd-datatable-column-menu")?.classList.contains("vtd-datatable-column-menu-open")
        })
        if (!openRightAfterClick) {fail("ERROR: expected the column menu to stay open immediately after clicking its trigger")}

        const headerCountBefore = await page.evaluate(() => document.getElementById("default-data-table")!.querySelectorAll("th").length)
        await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            // The first column ("Name") is non-hideable and renders a disabled, always-checked
            // entry here - so target the first *toggleable* checkbox instead of just the first one.
            ;(root.querySelector(".vtd-datatable-column-menu input[type=checkbox]:not(:disabled)") as HTMLInputElement).click()
        })
        const headerCountAfter = await page.evaluate(() => document.getElementById("default-data-table")!.querySelectorAll("th").length)
        if (headerCountAfter >= headerCountBefore) {fail(`ERROR: expected unchecking a hideable column to remove a header, was ${headerCountBefore} -> ${headerCountAfter}`)}
        const stillOpenAfterCheckbox = await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            return root.querySelector(".vtd-datatable-column-menu")?.classList.contains("vtd-datatable-column-menu-open")
        })
        if (!stillOpenAfterCheckbox) {fail("ERROR: expected the column menu to stay open after toggling a column checkbox")}

        await page.evaluate(() => { document.body.click() })
        const openAfterOutsideClick = await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            return root.querySelector(".vtd-datatable-column-menu")?.classList.contains("vtd-datatable-column-menu-open")
        })
        if (openAfterOutsideClick) {fail("ERROR: expected the column menu to close on an outside click")}
    })

    itWrap("data-table non-hideable column shows as a disabled, checked entry that can't be unchecked", "data-table", "#default-data-table", async (_selection: ElementHandle) => {
        await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            const columnsButton = Array.from(root.querySelectorAll("button")).find(b => b.textContent?.trim() == "Columns") as HTMLElement | undefined
            columnsButton?.click()
        })
        const firstCheckboxState = await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            const checkbox = root.querySelector(".vtd-datatable-column-menu input[type=checkbox]") as HTMLInputElement
            return {checked: checkbox.checked, disabled: checkbox.disabled}
        })
        if (!firstCheckboxState.checked || !firstCheckboxState.disabled) {fail(`ERROR: expected the non-hideable column's entry to be checked and disabled, got: ${JSON.stringify(firstCheckboxState)}`)}

        const headerCountBefore = await page.evaluate(() => document.getElementById("default-data-table")!.querySelectorAll("th").length)
        await page.evaluate(() => {
            const root = document.getElementById("default-data-table") as HTMLElement
            ;(root.querySelector(".vtd-datatable-column-menu input[type=checkbox]") as HTMLInputElement).click()
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
            const select = root.querySelector(".vtd-datatable-page-size select") as HTMLSelectElement
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

})
