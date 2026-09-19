# velodesign

A themed UI component library for [velotype](https://jsr.io/@velotype/velotype), wrapping native
HTML elements rather than reimplementing them. 78 components across 10 categories, and no runtime
JavaScript framework dependency.

```ts
import { Button, Stack } from "@velotype/velodesign"
```

- **Package**: [`@velotype/velodesign` on JSR](https://jsr.io/@velotype/velodesign)
- **Showcase**: `cd showcase && deno task dev` - every component, its attributes, live examples and
  a theme builder

## Working on it

`main` is protected. Every change goes through a pull request, and since there is no second
developer, **the required checks are the review**: a pull request merges itself once they pass and
sits open until they do.

```sh
git switch -c my-change
# ...
git push -u origin my-change
gh pr create --fill          # auto-merge arms itself; CI decides
```

| Command | What it does |
|---|---|
| `deno task test` | The full Astral suite - bundles all 72 gallery modules, then drives them in headless Chrome |
| `deno task size` | Measures the whole library bundled and minified, raw and gzipped |
| `deno lint` / `deno check src/index.ts` | Both are CI gates |

⚠️ The suite's summary line always reads `0 passed | 0 failed`, whatever happened - something in
its teardown calls `Deno.exit(0)`. The **exit code** is honest, so `deno task test` is a real gate;
count the `... ok (` lines if you want a number.

`CLAUDE.md` is the style guide, and it explains *why* each convention exists rather than only
stating it. Read it before adding a component.

## Before 1.0, consistency beats compatibility

Nothing is published against these names yet, so an inconsistency gets renamed rather than
preserved - class names, exported symbols, attributes and theme-option fields alike. That inverts
at 1.0, after which a rename needs a deprecation path.
