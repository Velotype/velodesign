
import { passthroughAttrsToElement, setStylesheet } from "@velotype/velotype"
import type { FunctionComponent, IdAttr, RenderableElements, StylePassthroughAttrs } from "@velotype/velotype"

/**
 * Which grammar `CodeBlock` highlights with.
 *
 * Deliberately a short list rather than a long one that works badly: `tsx` covers TypeScript,
 * JavaScript, JSX and JSON (a JSON document is strings, numbers and punctuation, plus
 * true/false/null, all of which it already knows), `css` has its own shape, and `plain` opts out
 * of highlighting entirely - the right answer for a shell session, a log, or a language this
 * doesn't know, where wrong colours are worse than none.
 */
export type CodeLanguage = "tsx" | "css" | "plain"

/**
 * Attrs type for `<CodeBlock/>`
 */
export type CodeBlockAttrsType = {
    /** The source to display, verbatim (required). Rendered as text, never as markup. */
    code: string
    /** Grammar to highlight with (default: `"tsx"`) */
    language?: CodeLanguage
    /** Show a gutter of line numbers down the left (default: `false`) */
    showLineNumbers?: boolean
    /**
     * Wrap long lines instead of scrolling them horizontally (default: `false`).
     *
     * Off by default because code's line breaks are meaningful - a wrapped line reads as two
     * statements. The block scrolls in its own container either way, so the page itself never
     * scrolls sideways.
     */
    wrap?: boolean
    /**
     * Accessible label for the block's scroll region, e.g. "Button usage example".
     *
     * No default, like every other ARIA label in this package - see CLAUDE.md's
     * language-agnostic rule. A horizontally scrollable region is focusable for keyboard users,
     * so a name here is worth setting.
     */
    ariaLabel?: string
} & IdAttr & StylePassthroughAttrs

/** One highlighted run of source text */
type Token = {
    /** Class suffix, e.g. `"string"` for `vtd-codeblock-string`; empty for unstyled text */
    kind: string
    text: string
}

const KEYWORDS = new Set([
    "abstract", "as", "async", "await", "break", "case", "catch", "class", "const", "continue",
    "declare", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally",
    "for", "from", "function", "get", "if", "implements", "import", "in", "instanceof", "interface",
    "is", "keyof", "let", "new", "null", "of", "override", "private", "protected", "public",
    "readonly", "return", "satisfies", "set", "static", "super", "switch", "this", "throw", "true",
    "try", "type", "typeof", "undefined", "var", "void", "while", "yield",
])

/*
 * One scanner, alternation in priority order - comments before strings (a `//` inside a string is
 * not a comment, and a quote inside a comment is not a string, so whichever matches at the current
 * position wins and the other never sees those characters).
 *
 * Every branch is a named group, so the matched kind is whichever group is defined. Note `[\s\S]`
 * rather than `.` in the block-comment and template branches: `.` does not cross a newline, and
 * both of those legitimately do.
 */
const TSX_SCANNER = new RegExp([
    "(?<comment>\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)",
    "(?<string>\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*'|`(?:[^`\\\\]|\\\\.)*`)",
    // A tag name only after < or </, so a less-than comparison is not mistaken for one
    "(?<tagOpen><\\/?)(?<tag>[A-Za-z][\\w.]*)",
    "(?<number>\\b\\d[\\d_]*(?:\\.\\d+)?\\b)",
    // An identifier immediately followed by `=` is an attribute wherever it appears
    "(?<attr>\\b[A-Za-z_$][\\w$]*(?=\\s*=[^=]))",
    "(?<word>\\b[A-Za-z_$][\\w$]*\\b)",
    "(?<punct>[{}()\\[\\];:,.<>/=+\\-*!?&|%^~]+)",
].join("|"), "g")

const CSS_SCANNER = new RegExp([
    "(?<comment>\\/\\*[\\s\\S]*?\\*\\/)",
    "(?<string>\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*')",
    // A custom property or a declaration's property name: an identifier before a colon
    "(?<attr>--?[\\w-]+(?=\\s*:)|\\b[a-zA-Z-]+(?=\\s*:))",
    "(?<number>#[0-9a-fA-F]{3,8}\\b|\\b\\d[\\d._]*(?:px|em|rem|%|vh|vw|s|ms|fr|deg)?\\b)",
    "(?<tag>[.#]?[\\w-]+(?=[^;{}]*\\{))",
    "(?<word>\\b[A-Za-z-][\\w-]*\\b)",
    "(?<punct>[{}();:,>+~*]+)",
].join("|"), "g")

/**
 * Splits source into highlighted runs.
 *
 * Every character of `code` ends up in exactly one token, including the ones no branch matches -
 * the gap between the previous match and this one is emitted as unstyled text first. That is what
 * makes the rendered block a faithful copy of the input rather than a lossy approximation, which
 * matters more here than the colours do: this component's whole job is showing code someone will
 * copy.
 */
function tokenize(code: string, language: CodeLanguage): Token[] {
    if (language == "plain") {
        return [{kind: "", text: code}]
    }
    const scanner = language == "css" ? CSS_SCANNER : TSX_SCANNER
    const tokens: Token[] = []
    let last = 0
    scanner.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = scanner.exec(code)) !== null) {
        if (match.index > last) {
            tokens.push({kind: "", text: code.slice(last, match.index)})
        }
        const groups = match.groups ?? {}
        if (groups.tag !== undefined) {
            // `<`/`</` is punctuation and the name is the tag - two tokens from one match
            tokens.push({kind: "punct", text: groups.tagOpen ?? ""})
            tokens.push({kind: "tag", text: groups.tag})
        } else if (groups.word !== undefined) {
            tokens.push({kind: KEYWORDS.has(groups.word) ? "keyword" : "", text: groups.word})
        } else {
            const kind = ["comment", "string", "number", "attr", "punct"].find(k => groups[k] !== undefined)
            tokens.push({kind: kind ?? "", text: match[0]})
        }
        last = match.index + match[0].length
    }
    if (last < code.length) {
        tokens.push({kind: "", text: code.slice(last)})
    }
    return tokens
}

let areCodeBlockStylesMounted = false

/**
 * A block of source code, highlighted and horizontally scrollable.
 *
 * Highlighting is a small scanner in this file rather than a highlighting library, because a
 * library is a runtime dependency and this package has none - see CLAUDE.md. That buys a grammar
 * that is good enough to read and honest about its limits (`CodeLanguage` is three values, not
 * thirty) rather than one that is comprehensive and 200KB.
 *
 * The code is rendered as **text nodes**, never as markup, so a snippet containing tags shows
 * those tags instead of rendering them.
 */
export const CodeBlock: FunctionComponent<CodeBlockAttrsType> = function(attrs: CodeBlockAttrsType): HTMLElement {
    const language = attrs.language ?? "tsx"
    const tokens = tokenize(attrs.code, language)

    if (!areCodeBlockStylesMounted) {
        areCodeBlockStylesMounted = true
        setStylesheet(`
.vtd-codeblock{
width:100%;
box-sizing:border-box;
margin:0;
padding:1em;
border:1px solid var(--background-4);
border-radius:0.5rem;
background-color:var(--background-1);
/* Code's own line breaks are the content, so this scrolls rather than reflowing */
overflow-x:auto;
font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
font-size:0.85em;
line-height:1.6;
tab-size:4;
}
/* A scrollable region is focusable, so it needs a visible focus ring like any other control */
.vtd-codeblock:focus-visible{outline:2px solid var(--primary);outline-offset:2px;}
.vtd-codeblock-wrap{white-space:pre-wrap;overflow-wrap:break-word;}
.vtd-codeblock code{font:inherit;background:none;padding:0;border-radius:0;}

/*
 * Token colours come from the theme's four hues, never a literal - the same rule the charts
 * follow. Each hue is taken at a step that keeps contrast against --background-1 in both themes,
 * since that ramp inverts between them.
 */
.vtd-codeblock-comment{color:var(--background-6);font-style:italic;}
.vtd-codeblock-string{color:var(--secondary-7);}
.vtd-codeblock-keyword{color:var(--primary-7);}
.vtd-codeblock-tag{color:var(--accent-7);}
.vtd-codeblock-attr{color:var(--warning-7);}
.vtd-codeblock-number{color:var(--secondary-8);}
.vtd-codeblock-punct{color:var(--background-8);}

/*
 * Line numbers are a counter on each line rather than a second column of text, so selecting the
 * block copies the code alone - a gutter built from real text puts "1 2 3" into the clipboard.
 */
.vtd-codeblock-numbered code{counter-reset:vtd-codeblock-line;}
.vtd-codeblock-numbered .vtd-codeblock-line::before{
counter-increment:vtd-codeblock-line;
content:counter(vtd-codeblock-line);
display:inline-block;
width:2.5em;
margin-inline-end:1em;
text-align:right;
color:var(--background-5);
user-select:none;
}
.vtd-codeblock-line{display:block;min-height:1.6em;}
`, "vtd/CodeBlock")
    }

    const classes = ["vtd-codeblock"]
    if (attrs.wrap) {
        classes.push("vtd-codeblock-wrap")
    }
    if (attrs.showLineNumbers) {
        classes.push("vtd-codeblock-numbered")
    }

    return passthroughAttrsToElement<HTMLPreElement>(<pre
        class={classes.join(" ")}
        tabindex={0}
        role="region"
        aria-label={attrs.ariaLabel}>
        <code>{attrs.showLineNumbers ? renderNumberedLines(tokens) : renderTokens(tokens)}</code>
    </pre>, attrs)
}

/** Each token as its own span, unstyled runs as bare text */
function renderTokens(tokens: Token[]): RenderableElements[] {
    return tokens.map(token => token.kind
        ? <span class={`vtd-codeblock-${token.kind}`}>{token.text}</span>
        : token.text)
}

/**
 * The same tokens, regrouped so every source line is one block element the line-number counter can
 * increment on.
 *
 * A token can straddle a newline (a block comment, a template literal), so this splits those runs
 * at each newline and keeps the pieces in their own lines rather than assuming tokens and lines
 * line up - they don't, and assuming so drops the second half of every multi-line comment.
 */
function renderNumberedLines(tokens: Token[]): RenderableElements[] {
    const lines: Token[][] = [[]]
    for (const token of tokens) {
        const pieces = token.text.split("\n")
        pieces.forEach((piece, index) => {
            if (index > 0) {
                lines.push([])
            }
            if (piece.length > 0) {
                lines[lines.length - 1].push({kind: token.kind, text: piece})
            }
        })
    }
    return lines.map(line => <span class="vtd-codeblock-line">{renderTokens(line)}</span>)
}
