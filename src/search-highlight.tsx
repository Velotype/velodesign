import type { RenderableElements } from "@velotype/velotype"

/**
 * Splits `text` around the first case-insensitive occurrence of `query`, wrapping the matched
 * substring in a `<mark class="vtd-search-highlight">` so a filtered list visually shows *why*
 * each result matched, not just that it did. Only the first occurrence is marked - filtering
 * itself (`.toLowerCase().includes(query)`, everywhere this is used) only ever needs one to
 * exist, so highlighting just that one is enough to show the user where it was found without
 * highlighting look busier than the match logic actually is.
 *
 * Returns `[text]` unchanged (as a single-element array, so every call site can just spread the
 * result into its JSX the same way regardless) if `query` is blank or doesn't occur in `text`.
 */
export function highlightMatch(text: string, query: string): RenderableElements[] {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
        return [text]
    }
    const matchIndex = text.toLowerCase().indexOf(trimmedQuery.toLowerCase())
    if (matchIndex == -1) {
        return [text]
    }
    const before = text.slice(0, matchIndex)
    const match = text.slice(matchIndex, matchIndex + trimmedQuery.length)
    const after = text.slice(matchIndex + trimmedQuery.length)
    return [before, <mark class="vtd-search-highlight">{match}</mark>, after].filter(part => part !== "")
}

/** Shared CSS for `.vtd-search-highlight` - append this into any component's own `setStylesheet`
 * call that uses `highlightMatch` (see CLAUDE.md's Styling section on why each component keeps
 * its own complete, independently-keyed stylesheet rather than importing a shared one). */
export const searchHighlightCss = `
.vtd-search-highlight{background-color:var(--warning-3);color:inherit;border-radius:0.2em;}
`
