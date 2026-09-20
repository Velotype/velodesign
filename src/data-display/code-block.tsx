
import {passthroughAttrsToElement} from "@velotype/velotype"
import { mountStyles } from "../core/styles.ts"
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
    /** Class suffix, e.g. `"string"` for `vtd-code-block-string`; empty for unstyled text */
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
    /*
     * Closing and opening tags are separate branches, because only one of them is ambiguous.
     *
     * `</` is never anything but a closing tag, and it routinely follows text with no space -
     * `Open</Button>` - so it takes no lookbehind. A bare `<` does: where it directly follows an
     * identifier, a `)` or a `]` it is a generic argument or a comparison rather than a tag
     * (`getComponent<Command>`, `Array<string>`, `a<b`), and counting one of those as an opening
     * element inflated the JSX depth below, turning every keyword after it into prose.
     */
    "(?<closeAngle><\\/)(?<closeTag>[A-Za-z][\\w.]*)",
    "(?<openAngle><)(?<openTag>[A-Za-z][\\w.]*)",
    "(?<number>\\b\\d[\\d_]*(?:\\.\\d+)?\\b)",
    // An identifier immediately followed by `=` is an attribute wherever it appears
    "(?<attr>\\b[A-Za-z_$][\\w$]*(?=\\s*=[^=]))",
    "(?<word>\\b[A-Za-z_$][\\w$]*\\b)",
    /*
     * `<` is NOT in this class. A greedy punctuation run would otherwise swallow the `</` that the
     * tag branch above needs, so `text.</Paragraph>` tokenized as punct(".</") plus a plain word -
     * the closing tag simply lost its colour. Any `<` the tag branch did not take is punctuation
     * on its own, which is the `a < b` case.
     */
    "(?<punct>[{}()\\[\\];:,.>/=+\\-*!?&|%^~]+|<)",
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
    const tsx = language != "css"
    const tokens: Token[] = []
    let last = 0
    scanner.lastIndex = 0

    /*
     * Just enough state to know whether we are looking at code or at the prose between JSX tags.
     *
     * Without it, a sentence sitting inside <Paragraph>...</Paragraph> got the code treatment: "so
     * two blocks of prose set side by side" highlighted `of`, `set` and `as` as keywords, because
     * they are also TypeScript keywords. An apostrophe in "package's" can likewise pair with a
     * later one and paint half a sentence as a string.
     *
     * This is not a parser - it tracks element depth, whether we are inside a tag's angle brackets,
     * and `{}` nesting within text (an expression is code again). That covers the snippets this
     * package actually shows; anything more would be a JSX parser, which a syntax highlighter in a
     * design system has no business being.
     */
    let elementDepth = 0
    let insideTag = false
    let braceDepth = 0
    const inJsxText = () => tsx && elementDepth > 0 && !insideTag && braceDepth == 0

    let match: RegExpExecArray | null
    while ((match = scanner.exec(code)) !== null) {
        if (match.index > last) {
            tokens.push({kind: "", text: code.slice(last, match.index)})
        }
        const groups = match.groups ?? {}
        const text = match[0]

        const tagName = groups.closeTag ?? groups.openTag
        if (tagName !== undefined && !isOpeningTag(match.index, groups.closeTag !== undefined)) {
            // A generic argument or a comparison, not an element. Give back the same two tokens the
            // scanner would have produced without the tag branch: the angle on its own, then an
            // ordinary identifier.
            tokens.push({kind: "punct", text: "<"})
            tokens.push({kind: !inJsxText() && KEYWORDS.has(tagName) ? "keyword" : "", text: tagName})
        } else if (tagName !== undefined) {
            const closing = groups.closeTag !== undefined
            if (tsx) {
                // `</Foo` closes the element `<Foo` opened; a self-close is handled at its `/>`
                elementDepth = Math.max(0, elementDepth + (closing ? -1 : 1))
                insideTag = true
            }
            // `<`/`</` is punctuation and the name is the tag - two tokens from one match
            tokens.push({kind: "punct", text: closing ? "</" : "<"})
            tokens.push({kind: "tag", text: tagName})
        } else if (groups.word !== undefined) {
            // A keyword is only a keyword in code - in prose it is just a word
            const keyword = !inJsxText() && KEYWORDS.has(groups.word)
            tokens.push({kind: keyword ? "keyword" : "", text: groups.word})
        } else {
            const kind = ["comment", "string", "number", "attr", "punct"].find(k => groups[k] !== undefined)
            // Strings and numbers are code constructs too: an apostrophe or a digit in a sentence
            // is neither
            const suppressed = inJsxText() && (kind == "string" || kind == "number")
            tokens.push({kind: suppressed ? "" : (kind ?? ""), text})
            if (tsx && kind == "punct") {
                trackPunctuation(text)
            }
        }
        last = match.index + text.length
    }
    if (last < code.length) {
        tokens.push({kind: "", text: code.slice(last)})
    }
    return tokens

    /**
     * Is this `<` opening an element, or is it a generic argument or a comparison?
     *
     * The test used to be a lookbehind in the pattern itself - a `<` directly after an identifier,
     * `)` or `]` is `getComponent<Command>` or `Array<string>`, not a tag. That is right in code
     * and wrong in JSX text, where an element routinely butts straight up against the words beside
     * it: `<div>Above<Divider/>Below</div>` lost `Divider` entirely, and worse, with no opening tag
     * recognised there was no `insideTag` for the following `/>` to close - so the element depth
     * never came back down and every keyword for the rest of the snippet was treated as prose.
     *
     * This is the same case `</` already had its own branch for (`Open</Button>` follows text with
     * no space too); the opening half was simply missed. A lookbehind cannot decide it because the
     * answer depends on state the pattern cannot see, so the guard moved here, where the JSX state
     * is known: inside JSX text a `<Name` is always a tag, because a generic cannot appear there.
     */
    function isOpeningTag(index: number, closing: boolean): boolean {
        if (closing || !tsx || inJsxText()) {
            return true
        }
        const previous = index > 0 ? code[index - 1] ?? "" : ""
        return !/[\w$)\]]/.test(previous)
    }

    /**
     * Advances the JSX state across a run of punctuation, character by character.
     *
     * Braces are counted everywhere, including inside a tag's own angle brackets, because an
     * attribute's expression is full of punctuation that means nothing to JSX. The `>` of an
     * arrow function in `onClick={() => ...}` was ending the tag early, after which the real `/>`
     * no longer closed the element - the depth stayed up and every keyword past it was treated as
     * prose. Only a `>` at brace depth zero actually closes a tag.
     */
    function trackPunctuation(run: string): void {
        for (let index = 0; index < run.length; index++) {
            const character = run[index]
            if (character == "{") {
                braceDepth++
            } else if (character == "}") {
                braceDepth = Math.max(0, braceDepth - 1)
            } else if (character == ">" && insideTag && braceDepth == 0) {
                // `/>` closes the element that its own `<Foo` opened
                if (index > 0 && run[index - 1] == "/") {
                    elementDepth = Math.max(0, elementDepth - 1)
                }
                insideTag = false
            }
        }
    }
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
        mountStyles(`
.vtd-code-block{
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
.vtd-code-block-wrap{white-space:pre-wrap;overflow-wrap:break-word;}
.vtd-code-block code{font:inherit;background:none;padding:0;border-radius:0;}

/*
 * Token colours come from the theme's four hues, never a literal - the same rule the charts
 * follow. Each hue is taken at a step that keeps contrast against --background-1 in both themes,
 * since that ramp inverts between them.
 */
.vtd-code-block-comment{color:var(--background-6);font-style:italic;}
.vtd-code-block-string{color:var(--secondary-7);}
.vtd-code-block-keyword{color:var(--primary-7);}
.vtd-code-block-tag{color:var(--accent-7);}
.vtd-code-block-attr{color:var(--warning-7);}
.vtd-code-block-number{color:var(--secondary-8);}
.vtd-code-block-punct{color:var(--background-8);}

/*
 * Line numbers are a counter on each line rather than a second column of text, so selecting the
 * block copies the code alone - a gutter built from real text puts "1 2 3" into the clipboard.
 */
.vtd-code-block-numbered code{counter-reset:vtd-code-block-line;}
.vtd-code-block-numbered .vtd-code-block-line::before{
counter-increment:vtd-code-block-line;
content:counter(vtd-code-block-line);
display:inline-block;
width:2.5em;
margin-inline-end:1em;
text-align:right;
color:var(--background-5);
user-select:none;
}
.vtd-code-block-line{display:block;min-height:1.6em;}
/*
 * A hanging indent, so wrap and showLineNumbers work together: without it a wrapped line's
 * continuation starts at the left edge, underneath the number, and reads as its own line. The
 * outdent is the gutter's own width (2.5em) plus its trailing gap (1em), which puts the number in
 * the outdented space and aligns every continuation with the first line's code.
 */
.vtd-code-block-numbered.vtd-code-block-wrap .vtd-code-block-line{padding-inline-start:3.5em;text-indent:-3.5em;}
`, "vtd/CodeBlock")
    }

    const classes = ["vtd-code-block"]
    if (attrs.wrap) {
        classes.push("vtd-code-block-wrap")
    }
    if (attrs.showLineNumbers) {
        classes.push("vtd-code-block-numbered")
    }

    /*
     * No tabindex and no role, deliberately - both used to be set unconditionally and both were
     * wrong for most blocks.
     *
     * A code block is worth focusing only when it actually scrolls, and most do not: a static
     * tabindex made every snippet on a page its own tab stop with nothing to do there, which is a
     * worse outcome for a keyboard reader than the one it was trying to fix. `role="region"` is a
     * landmark, so a page of ten examples announced ten landmarks named after their captions.
     *
     * The platform already gets this exactly right: Chrome, Edge and Firefox make a scroll
     * container focusable precisely when it overflows and has no focusable children, so the block
     * that needs a stop gets one and the nine that do not are skipped. Safari does not, which is a
     * real gap - but it is the same gap every scrolling element on the web has there, and closing
     * it here would mean measuring overflow on every block and re-measuring on every resize.
     */
    return passthroughAttrsToElement<HTMLPreElement>(<pre
        class={classes.join(" ")}
        aria-label={attrs.ariaLabel}>
        <code>{attrs.showLineNumbers ? renderNumberedLines(tokens) : renderTokens(tokens)}</code>
    </pre>, attrs)
}

/** Each token as its own span, unstyled runs as bare text */
function renderTokens(tokens: Token[]): RenderableElements[] {
    return tokens.map(token => token.kind
        ? <span class={`vtd-code-block-${token.kind}`}>{token.text}</span>
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
    return lines.map(line => <span class="vtd-code-block-line">{renderTokens(line)}</span>)
}
