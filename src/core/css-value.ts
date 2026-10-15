import type { JSX } from "./velotype.ts"

type StyleObject = NonNullable<JSX.IntrinsicElements["div"]["style"]>

/**
 * The values velotype's `style` object accepts for one CSS property - `CSSPropertyValue<"width">`
 * is `"2.5em" | "100%" | "auto" | "calc(...)" | ...`, not `string`.
 *
 * **An attr that ends up in a `style` object is typed with this, never `string`.** velotype checks
 * every style value against the property it is assigned to, so a `string` attr cannot be passed
 * through without a cast - and a cast would hand the consumer exactly the unchecked value velotype
 * exists to reject. Typed this way, `<Avatar size="2.5"/>` (no unit, so no size at all) is a
 * compile error at the consumer's call site instead of a silently unsized avatar.
 *
 * Derived from velotype's own attribute types rather than restated, so it cannot drift from what
 * velotype accepts.
 */
export type CSSPropertyValue<Property extends keyof StyleObject> = NonNullable<StyleObject[Property]>
