import { Server, Context, Inspector, RequestInspectorResponse, Router } from "@velotype/veloserver"

export type ServerContextMetadata = {
    /** Request start time (`performance.now()`), set by the timing inspector below */
    st?: number
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
    const setOfModules = ['button','icon','page-selector','textbox','modal','textformfield','radiobutton','showcase','timeago',
        'checkbox','toggle','textarea','select','select-menu','badge','card','alert','tooltip','spinner','tabs','divider',
        'navlink','breadcrumbs','pagination','navbar','sidebar','menu',
        'toast','accordion','avatar',
        'progress','skeleton','tag','empty','collapse','statistic','list','timeline','aspect-ratio','scroll-area',
        'datepicker','datetimepicker','datetimerangepicker','slider','input-number','colorpicker','combobox','upload',
        'drawer','popover','popconfirm','steps','rate',
        'table','form','context-menu','resizable','carousel','calendar','calendar-range','tree','command','button-group','data-table']
    setOfModules.forEach((module) => {
        router.get(`/${module}`, function() {
            const response = new Response(`<!DOCTYPE html><html><body>
<div id="main-page"></div>
<script src="/build/${module}.js" type="module" ></script>
</body></html>`,{status:200})
            response.headers.set("content-type", "text/html; charset=utf-8")
            return response
        })
    })
    router.get('/', function() {
        const response = new Response(`<!DOCTYPE html><html><body>
<div id="main-page"></div>
<script src="/build/explorer.js" type="module" ></script>
</body></html>`,{status:200})
        response.headers.set("content-type", "text/html; charset=utf-8")
        return response
    })
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
