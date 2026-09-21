import { Server, Router } from "@velotype/veloserver"

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
<!--
  The showcase loads three modules, the way a consumer's page does: the framework, the library, and
  the application. Nothing is bundled into main.js that a consumer would download separately - it
  imports "@velotype/velodesign" by name like any other consumer, and the bundle task holds both
  velotype and velodesign out with --external, so main.js ships bare specifiers a browser cannot
  resolve on its own. This import map is what resolves them.

  It is worth having rather than simpler: it is the only place the library is exercised as a
  separate module, so a mistake that only shows up across a module boundary - a duplicated
  framework, a stylesheet mounted from two registries - shows up here rather than in a consumer's
  application.

  Both velotype specifiers point at one file because velotype's "." and "./jsx-runtime" exports are
  the same module. They must stay one entry between them: two files would be two module instances,
  and velotype keeps module-level state - the adopted-stylesheet registry behind setStylesheet - so
  a second copy would mount every stylesheet twice and break the cascade order the layers depend on.

  The preload tags ahead of main.js are not required, since the import map alone resolves it. They
  just start the framework and library fetches without waiting for main.js to be parsed first.
-->
<script type="importmap">{"imports": {
"@velotype/velotype": "/build/velotype.js",
"@velotype/velotype/jsx-runtime": "/build/velotype.js",
"@velotype/velodesign": "/build/velodesign.js"
}}</script>
<script src="/build/velotype.js" type="module"></script>
<script src="/build/velodesign.js" type="module"></script>
<script src="/build/main.js" type="module"></script>
</body>
</html>`

function shellHandler() {
    const response = new Response(pageShell, {status: 200})
    response.headers.set("content-type", "text/html; charset=utf-8")
    return response
}

const router = new Router<never>({})

// Mount the static build output FIRST: this Router resolves sibling routes at each node in
// registration order (first match wins, wildcard included) rather than by specificity, so the
// exact /build/main.js route has to be registered before the catch-all below or the wildcard
// would win and the browser would get index.html back when it asked for the JS bundle.
await router.mountFiles("/build/", `${Deno.cwd()}/build/`)

// The app does its own client-side routing (History.changeLocation + popstate/locationchange,
// same mechanism `PageSelector`/`NavLink` use), so every other route serves the same shell and
// the client picks the right page from `location.pathname` once it boots. A single splat
// catch-all - rather than enumerating each client route here too - means a new page added to
// the client router (src/app-shell.tsx's ContentArea) never needs a matching change here.
router.get("/*", shellHandler)

const app = new Server(router)
app.addServerListenCallback(() => {
    console.log(`velodesign showcase running at http://${hostname}:${port}`)
})
app.serve(hostname, port)
