/**
 * The entrypoint for the separately-bundled velotype module, which `server.ts`'s import map points
 * both `@velotype/velotype` and `@velotype/velotype/jsx-runtime` at.
 *
 * It exists so the version stays declared in exactly one place. `deno bundle` resolves an
 * entrypoint as a file path rather than through the import map, so bundling velotype directly would
 * mean writing `jsr:@velotype/velotype@0.0.30` into a task and keeping that in step with the
 * `imports` entry by hand. A one-line local module is resolved the ordinary way instead.
 *
 * `export *` is enough because velotype has no default export, and its `.` and `./jsx-runtime`
 * exports are the same module - which is why one file can serve both specifiers.
 */
export * from "@velotype/velotype"
