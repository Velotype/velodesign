/// <reference lib="deno.ns" />

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd"
import { fail, assertEquals } from "@std/assert"

import {App} from "@velotype/veloserver"

import { launch } from "@astral/astral"
import type { Browser, ElementHandle, Page } from "@astral/astral"
import { startAppServer } from "./base_server.ts"

const server_port = 3000
const baseUrl = `http://localhost:${server_port}`

describe('basic component rendering', () => {
    let server: App
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
        const panel = await page.waitForSelector("#default-tabs [role='tabpanel']")
        if (!panel) {fail("ERROR: tab panel not found")}
        assertEquals(await panel.innerText(), "Content of the first tab.")

        const secondTabButton = await page.$("#default-tabs .vtd-tabs-tab:nth-child(2)")
        if (!secondTabButton) {fail("ERROR: second tab button not found")}
        await secondTabButton.click()

        const updatedPanel = await page.waitForSelector("#default-tabs [role='tabpanel']")
        if (!updatedPanel) {fail("ERROR: updated tab panel not found")}
        assertEquals(await updatedPanel.innerText(), "Content of the second tab.")
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

})
