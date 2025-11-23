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

})
