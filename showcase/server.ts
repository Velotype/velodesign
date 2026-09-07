import { App, Router } from "@velotype/veloserver"

const port = Number(Deno.env.get("PORT")) || Number(Deno.args[0]) || 4000
const hostname = Deno.env.get("HOST") || "0.0.0.0"

const pageShell = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>velodesign</title>
<link rel="icon" href="data:,"/>
</head>
<body>
<div id="main-page"></div>
<script src="/build/main.js" type="module"></script>
</body>
</html>`

function shellHandler() {
    const response = new Response(pageShell, {status: 200})
    response.headers.set("content-type", "text/html; charset=utf-8")
    return response
}

const router = new Router()

// The app does its own client-side routing (History.changeLocation + popstate/locationchange,
// same mechanism `PageSelector`/`NavLink` use), so every app route serves the same shell and
// the client picks the right page from `location.pathname` once it boots.
router.get("/", shellHandler)
router.get("/components/:name", shellHandler)

await router.mountFiles("/build/", `${Deno.cwd()}/build/`)

const app = new App(router)
app.addServerListenCallback(() => {
    console.log(`velodesign showcase running at http://${hostname}:${port}`)
})
app.serve(hostname, port)
