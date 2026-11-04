// Server, Router, Inspector and RequestInspectorResponse are all constructed below, so they are
// value imports; only Context is used purely as a type.
import { Server, Router, Inspector, RequestInspectorResponse } from "@velotype/veloserver"
import type { Context } from "@velotype/veloserver"

/** Closes a test server. Use this rather than `server.close()` in test teardown. */
export async function closeAppServer(server: Server<ServerContextMetadata>, reason: string): Promise<void> {
    server.close(reason)
    // The shutdown callbacks run from a `finished` handler, so let that settle before the caller
    // carries on
    await new Promise((resolve) => setTimeout(resolve, 0))
}

export type ServerContextMetadata = {
    /** Request start time (`performance.now()`), set by the timing inspector below */
    st?: number
}

/** Every gallery module the server serves */
export const setOfModules: string[] = ['button','icon','page-selector','text-box','modal','text-form-field','radio-button','choice-cards','lightbox','showcase','time-ago',
    'checkbox','toggle','textarea','select','select-menu','badge','card','alert','tooltip','spinner','tabs','divider',
    'nav-link','breadcrumbs','pagination','navbar','sidebar','menu',
    'toast','accordion','avatar',
    'progress','skeleton','tag','empty','collapse','statistic','list','timeline','aspect-ratio','scroll-area',
    'date-picker','date-time-picker','date-time-range-picker','slider','input-number','color-picker','combobox','upload',
    'drawer','popover','popconfirm','steps','rate',
    'table','form','context-menu','resizable','carousel','calendar','calendar-range','event-calendar','tree','command','button-group','data-table','async-data-table','charts','typography','layout','code-block','table-of-contents','theme-options']

/**
 * A gallery page. Every page runs under a strict Trusted Types policy, so any test that reaches
 * code assigning an HTML string sees it throw. Violations are also collected for the sweep in the
 * suite, which catches one that the code swallows.
 */
function galleryPage(script: string): Response {
    const response = new Response(`<!DOCTYPE html><html><body>
<div id="main-page"></div>
<script>
window.cspViolations = []
document.addEventListener("securitypolicyviolation", (e) => window.cspViolations.push(e.sample))
</script>
<script src="/build/${script}.js" type="module" ></script>
</body></html>`,{status:200})
    response.headers.set("content-type", "text/html; charset=utf-8")
    response.headers.set("content-security-policy", "require-trusted-types-for 'script'")
    return response
}

export async function startAppServer(server_port: number): Promise<Server<ServerContextMetadata>> {
    const router: Router<ServerContextMetadata> = new Router<ServerContextMetadata>({
        context_metadata_constructor: () => ({}),
    })
    router.addAllInspector("", new Inspector<ServerContextMetadata>(
        (request: Request, context: Context<ServerContextMetadata>) => {
            console.log(`START ${request.method} ${request.url}`)
            context.meta.st = performance.now()
            return new RequestInspectorResponse()
        },
        (request: Request, response: Response, context: Context<ServerContextMetadata>) => {
            const startTime = context.meta.st
            if (startTime != undefined) {
                const ms = (performance.now() - startTime).toFixed(2)
                response.headers.set("X-Response-Time", `${ms}ms`);
                console.log(`END ${response.status} ${request.method} ${request.url} ${ms}ms`)
            } else {
                console.error(`END ${response.status} ${request.method} ${request.url} ERROR could not calculate elapsed time`)
            }
        }
    ))
    setOfModules.forEach((module) => {
        router.get(`/${module}`, () => galleryPage(module))
    })
    router.get('/', () => galleryPage('explorer'))
    await router.mountFiles("/build/", `${Deno.cwd()}/tests/build/`)
    const app = new Server<ServerContextMetadata>(router)
    const prom = new Promise<Server<ServerContextMetadata>>((resolve) => {
        app.addServerListenCallback(() => {
            resolve(app)
        })
    })
    app.serve('localhost', server_port)
    return prom
}
