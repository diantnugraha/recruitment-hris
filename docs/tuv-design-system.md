# TUV Design System Reference

> **Source**: `@tuv-indo/css` v0.0.2-beta.19 + central-invoicing implementation
> **Usage**: Import `@tuv-indo/css/dist/style.css` in `globals.css`. Use CSS variables via `style={{}}` or `var()` in CSS.
> **Components**: Use shadcn/ui for behavior, TUV CSS tokens for styling.

---

## Why Option D (CSS Tokens Only)

`@tuv-indo/admin` v0.0.165 is **NOT compatible** with React 19 + Next.js 15 (SSR):
- Accesses `document` at module level (breaks SSR)
- Bundles React 18 jsx-runtime (`Symbol.for("react.element")` vs React 19's `"react.transitional.element"`)
- Uses removed `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`

**Solution**: Use `@tuv-indo/css` for design tokens (colors, spacing, typography), shadcn/ui for component behavior.

---

## Colors

### Primary Brand — Navy

| Token | CSS Variable | RGB |
|-------|-------------|-----|
| navy-50 | `var(--hsd-ui-color-navy-50)` | `rgb(230, 233, 251)` |
| navy-100 | `var(--hsd-ui-color-navy-100)` | `rgb(176, 185, 241)` |
| navy-200 | `var(--hsd-ui-color-navy-200)` | `rgb(138, 152, 234)` |
| navy-300 | `var(--hsd-ui-color-navy-300)` | `rgb(84, 104, 225)` |
| navy-400 | `var(--hsd-ui-color-navy-400)` | `rgb(51, 75, 219)` |
| **navy-500** | `var(--hsd-ui-color-navy-500)` | **`rgb(0, 30, 210)`** — Primary default |
| navy-600 | `var(--hsd-ui-color-navy-600)` | `rgb(0, 27, 191)` |
| navy-700 | `var(--hsd-ui-color-navy-700)` | `rgb(0, 21, 149)` |
| navy-800 | `var(--hsd-ui-color-navy-800)` | `rgb(0, 17, 116)` |
| navy-900 | `var(--hsd-ui-color-navy-900)` | `rgb(0, 0, 60)` |

### Gray (UI Foundation)

| Token | CSS Variable | RGB | Usage |
|-------|-------------|-----|-------|
| gray-50 | `var(--hsd-ui-color-gray-50)` | `rgb(255, 254, 255)` | White/text-white |
| **gray-100** | `var(--hsd-ui-color-gray-100)` | **`rgb(239, 243, 248)`** | **Document background** |
| gray-200 | `var(--hsd-ui-color-gray-200)` | `rgb(201, 206, 204)` | Disabled text |
| gray-300 | `var(--hsd-ui-color-gray-300)` | `rgb(174, 182, 178)` | Dividers |
| gray-400 | `var(--hsd-ui-color-gray-400)` | `rgb(147, 158, 153)` | Muted text (email) |
| **gray-500** | `var(--hsd-ui-color-gray-500)` | **`rgb(120, 134, 127)`** | **Icon color, tertiary text** |
| gray-600 | `var(--hsd-ui-color-gray-600)` | `rgb(96, 107, 102)` | Dark utility |
| **gray-700** | `var(--hsd-ui-color-gray-700)` | **`rgb(72, 80, 76)`** | **Secondary text** |
| gray-800 | `var(--hsd-ui-color-gray-800)` | `rgb(48, 53, 51)` | |
| **gray-900** | `var(--hsd-ui-color-gray-900)` | **`rgb(35, 41, 51)`** | **Default text** |

### Utility Colors

| Semantic | Default | Secondary | Tertiary |
|----------|---------|-----------|----------|
| **Success** | green-600 `rgb(40,172,110)` | green-200 | green-50 |
| **Danger** | red-600 `rgb(201,24,74)` | red-200 | red-50 |
| **Warning** | orange-600 `rgb(179,130,10)` | orange-200 | orange-50 |
| **Info** | blue-600 `rgb(30,136,229)` | blue-200 | blue-50 |

### Brand Utility Colors (used for Button success/danger/warning)

| Semantic | Default | Secondary | Tertiary |
|----------|---------|-----------|----------|
| **Success Brand** | lime-300 `rgb(140,240,0)` | lime-200 | lime-50 |
| **Danger Brand** | carmine-300 `rgb(250,55,70)` | carmine-200 | carmine-50 |
| **Warning Brand** | yellow-300 `rgb(255,235,0)` | yellow-200 | yellow-50 |

### Other Color Palettes

Available: `blue`, `pink`, `purple`, `red`, `orange`, `aloha` (teal), `green`, `navy`, `lime`, `carmine`, `yellow` — each with 50-900 shades.

---

## Typography

### Font Family

```css
font-family: Poppins, sans-serif;
```

### Font Sizes

| Token | CSS Variable | Value |
|-------|-------------|-------|
| xs | `--hsd-ui-fontSizes-xs` | 0.625rem (10px) |
| sm | `--hsd-ui-fontSizes-sm` | 0.75rem (12px) |
| **md** | `--hsd-ui-fontSizes-md` | **0.875rem (14px)** — Body default |
| **lg** | `--hsd-ui-fontSizes-lg` | **1rem (16px)** — Sub-headings |
| xl | `--hsd-ui-fontSizes-xl` | 1.125rem (18px) |
| 2xl | `--hsd-ui-fontSizes-2xl` | 1.25rem (20px) |
| 3xl | `--hsd-ui-fontSizes-3xl` | 1.5rem (24px) |
| 4xl | `--hsd-ui-fontSizes-4xl` | 1.875rem (30px) |
| 5xl | `--hsd-ui-fontSizes-5xl` | 2.25rem (36px) |
| 6xl | `--hsd-ui-fontSizes-6xl` | 3rem (48px) |

### Font Weights

> **IMPORTANT**: TUV weights are different from standard CSS/Tailwind weights!

| Token | CSS Variable | Value | Standard CSS equivalent |
|-------|-------------|-------|------------------------|
| hairline | `--hsd-ui-fontWeights-hairline` | 50 | — |
| thin | `--hsd-ui-fontWeights-thin` | 100 | thin |
| light | `--hsd-ui-fontWeights-light` | 200 | extra-light |
| **normal** | `--hsd-ui-fontWeights-normal` | **300** | light |
| **medium** | `--hsd-ui-fontWeights-medium` | **400** | normal |
| **semibold** | `--hsd-ui-fontWeights-semibold` | **500** | medium |
| **bold** | `--hsd-ui-fontWeights-bold` | **600** | semibold |
| extrabold | `--hsd-ui-fontWeights-extrabold` | 700 | bold |
| black | `--hsd-ui-fontWeights-black` | 800 | extrabold |

### Text Variants (from TUV Text component)

| Variant | Typical usage |
|---------|--------------|
| h1 — h6 | Headings |
| sub-h1, sub-h2, sub-h3 | Sub-headings (sub-h2 = 16px on 2xl, 14px on md) |
| body-1, body-2, body-3 | Body text (body-1 = 14px) |

### Line Heights

| Token | Value |
|-------|-------|
| none | 1 |
| tight | 1.25 |
| snug | 1.375 |
| **normal** | **1.5** |
| relaxed | 1.625 |
| loose | 2 |

---

## Spacing

### Named Sizes

| Token | CSS Variable | Value |
|-------|-------------|-------|
| xs | `--hsd-ui-spacing-xs` | 0.25rem (4px) |
| **sm** | `--hsd-ui-spacing-sm` | **0.5rem (8px)** |
| **md** | `--hsd-ui-spacing-md` | **0.75rem (12px)** |
| **lg** | `--hsd-ui-spacing-lg` | **1rem (16px)** |
| xl | `--hsd-ui-spacing-xl` | 1.5rem (24px) |
| 2xl | `--hsd-ui-spacing-2xl` | 2rem (32px) |
| 3xl | `--hsd-ui-spacing-3xl` | 4rem (64px) |

### Numeric Sizes (commonly used)

| Token | Value |
|-------|-------|
| spacing-8 | 0.5rem (8px) |
| spacing-12 | 0.75rem (12px) |
| spacing-14 | 0.875rem (14px) |
| spacing-16 | 1rem (16px) |
| spacing-20 | 1.25rem (20px) |
| spacing-24 | 1.5rem (24px) |
| spacing-32 | 2rem (32px) |
| spacing-40 | 2.5rem (40px) |
| spacing-48 | 3rem (48px) |
| spacing-64 | 4rem (64px) |

---

## Border Radius

| Token | CSS Variable | Value |
|-------|-------------|-------|
| none | `--hsd-ui-radii-none` | 0 |
| **xs** | `--hsd-ui-radii-xs` | **0.25rem (4px)** — Nav items, buttons |
| sm | `--hsd-ui-radii-sm` | 0.375rem (6px) — Badges |
| base | `--hsd-ui-radii-base` | 0.25rem (4px) |
| **md** | `--hsd-ui-radii-md` | **0.5rem (8px)** — Cards, dialogs |
| lg | `--hsd-ui-radii-lg` | 0.75rem (12px) |
| xl | `--hsd-ui-radii-xl` | 0.875rem (14px) |
| 2xl | `--hsd-ui-radii-2xl` | 1rem (16px) |
| full | `--hsd-ui-radii-full` | 12rem — Circles |

---

## Shadows

| Token | Value |
|-------|-------|
| sm | `0 1px 2px 0 rgb(0 0 0 / .05)` |
| md | `0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1)` |
| lg | `0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1)` |
| xl | `0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1)` |
| 2xl | `0 25px 50px -12px rgb(0 0 0 / .25)` |
| inner | `inset 0 2px 4px 0 rgb(0 0 0 / .05)` |
| default | `0px 4px 35px 0px rgba(112, 144, 176, .25)` |

---

## Layout Dimensions (from central-invoicing)

### Header

| Property | Value |
|----------|-------|
| Height | 75px (2xl), 58px (md), 73px (mobile) |
| Background | white |
| Border | `1px solid #d0d6dd` |
| Padding | `0 24px` (spacing-24) |
| Z-index | 50 (fixed) |
| Logo | `140 x 40` px, `objectPosition: "left center"` |
| Hamburger icon | 24px, color `rgba(120, 134, 127)` |
| Element gap | 16px (spacing-lg) |

### Sidebar

| Property | Value |
|----------|-------|
| Width expanded | 256px (16rem) |
| Width collapsed | 96px (6rem) |
| Top offset | Below header (75px) |
| Background | white |
| Border | `1px solid #d0d6dd` |
| Nav padding | 16px top/bottom, 12px left/right |
| Section gap | 8px (spacing-sm) |

### Nav Item

| Property | Expanded | Collapsed |
|----------|----------|-----------|
| Height | 40px | 48 x 48px square |
| Padding-left | 14px | 0 (centered) |
| Padding-right | 16px | 0 |
| Icon-text gap | 8px | — |
| Border-radius | 4px (radii-xs) | 4px |
| Font-size | 14px (fontSizes-md) | — |
| Font-weight | 500 active / 400 normal | — |
| Active bg | navy-50 `rgba(230,233,251)` | same |
| Active icon | navy-500 `rgba(0,30,210)` | same |
| Inactive icon | gray-500 `rgba(120,134,127)` | same |
| Section title | 12px, weight 400, gray-900 | hidden |

### User Profile (Header)

| Property | Value |
|----------|-------|
| Avatar size | 40px circle |
| Avatar background | blue-200 `rgba(144,202,249)` |
| Avatar text | 16px, weight 600, gray-900, Poppins |
| Name | 16px (sub-h2), weight 400 |
| Email | 14px (body-1), weight 300, gray-400 |
| Chevron | 20px, gray-500 |
| Divider | 1.3px width, 56px height, gray-300 |

### Page Container

| Property | Value |
|----------|-------|
| Background | gray-100 `rgb(239,243,248)` |
| Margin-left | matches sidebar width |
| Padding-top | matches header height |
| Content padding | 24px (p-6) |

---

## Button Styles (apply to shadcn Button via TUV tokens)

### Variants

| Variant | Background | Text | Border | Hover bg |
|---------|-----------|------|--------|----------|
| **Primary** | navy-500 | gray-50 (white) | navy-500 | navy-600 |
| **Secondary** | gray-50 | gray-900 | gray-500/20% | gray-100 |
| **Tertiary** | navy-50 | navy-500 | navy-50 | navy-100/47% |
| **Quaternary** | transparent | navy-600 | navy-600 | transparent |
| **Link** | transparent | navy-500 | none | transparent |
| **Success** | lime-300 | gray-900 | lime-300 | lime-400 |
| **Danger** | carmine-300 | gray-50 | carmine-300 | carmine-400 |
| **Warning** | yellow-300 | gray-900 | yellow-300 | yellow-400 |

### Disabled State (all variants)

- Background: `rgba(gray-500, 0.2)`
- Text: `gray-500`
- Border: transparent

### Active Focus Ring

- Primary: `0px 0px 0px 3px rgba(blue-300, 0.28)`
- Danger: `0px 0px 0px 2px rgba(red-800, 0.28)`
- Tertiary: `0px 0px 0px 3px rgba(navy-300, 0.28)`

### Sizes

| Size | Height (approx) | Font-size | Padding |
|------|-----------------|-----------|---------|
| sm | 32px | 12px (sm) | 8px 12px |
| md | 40px | 14px (md) | 10px 16px |
| lg | 48px | 16px (lg) | 12px 24px |

### Button border-radius

Default: `--hs-ui-border-rounded: 8px` / `--hs-ui-border-circular: 192px`

---

## Form Components (apply to shadcn via TUV tokens)

### Input

| Property | Value |
|----------|-------|
| Sizes | sm / md / lg |
| Variants | outline / filled / flushed |
| Status | default / error / warning / disable |
| Border radius | 8px (rounded) |
| Border color default | gray-500/20% |
| Border color error | red-600 |
| Border color warning | orange-600 |
| Focus ring | navy-500 border |
| Supports | leftIcon, rightIcon, leftAddons, rightAddons, currency formatting |

### Dropdown (Select)

| Property | Value |
|----------|-------|
| Sizes | sm / md / lg |
| Supports | searchable, multiSelect, icons, position (top/bottom) |
| Border style | same as Input |

### Checkbox / Radio / Toggle

Standard form controls with TUV brand colors (navy-500 for checked state).

---

## Data Display (apply to shadcn via TUV tokens)

### Table

Two sources: `@tuv-indo/table` CSS for base primitives, and `central-invoicing/TableMaster` for real-world usage.

#### Base CSS Variables (`@tuv-indo/table`)

```css
--hsd-ui-table-font-weight-semibold: 500;
--hsd-ui-table-font-weight-normal: 300;
--hsd-ui-table-font-size-md: 14px;
--hsd-ui-table-spacing-sm: 8px;
--hsd-ui-table-spacing-ms: 12px;
--hsd-ui-table-border-width: 1px;
--hsd-ui-table-border-color: rgba(120, 134, 127, 0.2);
```

#### Variants

| Variant | Description |
|---------|-------------|
| `simple` | Bottom border only per row |
| `unstyled` | No borders |
| `striped` | Odd rows blue-50 bg, thead blue-700 bg + white text |

#### TableMaster (central-invoicing implementation — primary reference)

**Thead:**

| Property | Value | Source |
|----------|-------|--------|
| Background | `#F8F9FB` | `TableMaster.tsx:228` |
| Height | `50px` | `TableMaster.tsx:234` |
| Text transform | `uppercase` | `TableMaster.tsx:230` |
| White space | `nowrap` | `TableMaster.tsx:231` |
| Font weight | `bold` (outer), `semibold` = 500 (Text) | `TableMaster.tsx:229,273` |

**Th (via TUV Text component):**

| Property | Value | Source |
|----------|-------|--------|
| Font size | `sm` = **12px** | `Text fontSize="sm"` |
| Font weight | `semibold` = **500** | `Text fontWeight="semibold"` |
| Font family | Poppins | `Text fontFamily="Poppins"` |
| Color (default) | `text` = **gray-900** | `Text color="text"` |
| Color (sorted) | `primary` = **navy-500** | `Text color="primary"` |
| Padding | `12px 8px` | TUV Th default |
| First column | `padding-left: 16px` | `TableMaster.tsx:254` |
| Letter spacing | `0.03em` | Uppercase styling |

**Sort icon:**

| Property | Value |
|----------|-------|
| Size | `16px x 16px` |
| Color (default) | `var(--hsd-ui-color-gray-500)` |
| Color (active) | `var(--hsd-ui-color-blue-700)` |
| Icon name | `Vertical` |

**Td (via TUV Text component):**

| Property | Value | Source |
|----------|-------|--------|
| Font size | `sm` = **12px** | `Text fontSize="sm"` |
| Font weight | `medium` = **400** | `Text fontWeight="medium"` |
| Font family | Poppins | `Text fontFamily="Poppins"` |
| Padding | `16px 8px` (more vertical space than th) | Measured from screenshot |
| First column | `padding-left: 16px` | `TableMaster.tsx:356` |
| Width | `fit-content` | `TableMaster.tsx:354` |

**Tr (rows):**

| Property | Value | Source |
|----------|-------|--------|
| Border | `1px solid rgba(var(--hsd-ui-raw-color-gray-500), 0.2)` | `TableMaster.tsx:321` |
| Last row | No border | `TableMaster.tsx:325` |
| Transition | `background-color 0.3s ease` | `TableMaster.tsx:322` |
| Hover bg | `#EDF0F2` | `onMouseOver` handler |
| Default bg | `#fff` | `onMouseOut` handler |

**Container (in our DataTable):**

| Property | Value |
|----------|-------|
| Background | white |
| Border | `1px solid rgba(120, 134, 127, 0.2)` |
| Border radius | `8px` |
| Overflow | `overflow-x: auto` |

### Badges (exact from `@tuv-indo/badges` CSS)

**Shared component: `components/shared/tuv-badge.tsx`**

**Sizes:**

| Size | Height | Font-size | Padding-inline | Border-radius |
|------|--------|-----------|----------------|---------------|
| xs | 20px | 10px | 8px | 4px |
| sm | 24px | 12px | 8px | 4px |
| md | 28px | 12px | 12px | 4px |
| lg | 32px | 14px | 12px | 4px |

**Variants:**

| Variant | Background | Text color | Border (with `border`) |
|---------|-----------|------------|------------------------|
| **success** | lime-50 `#f4fee6` | green-700 `#186742` | green-300 `#75dead` |
| **danger** | carmine-50 `#ffebed` | carmine-600 `#bc2935` | red-300 `#ff8fa3` |
| **info** | blue-50 `#e3f2fd` | blue-800 `#1565c0` | blue-300 `#64b5f6` |
| **warning** | yellow-50 `#fffde6` | gray-700 `#48504c` | orange-300 `#ffcb69` |
| **dark** | gray-100 `#eff3f8` | gray-700 `#48504c` | gray-300 `#aeb6b2` |
| **brand** | navy-50 `#e6e9fb` | navy-500 `#001ed2` | navy-200 `#8a98ea` |
| **purple** | purple-50 `#e9def5` | purple-500 `#7f39c5` | purple-500 |
| **rose** | pink-50 | pink-500 | pink-200 |

**Props:** `text` (required), `variant`, `size`, `border` (boolean), `dot` (boolean — shows colored dot before text)

**Font:** Poppins, weight 500, `border-radius: 4px`, `width: max-content`

**Usage:**
```tsx
import { TuvBadge } from "@/components/shared/tuv-badge";
<TuvBadge text="Active" variant="success" size="sm" border dot />
<TuvBadge text="Pending" variant="warning" size="sm" border dot />
<TuvBadge text="Overdue" variant="danger" size="sm" border dot />
<TuvBadge text="Info" variant="info" size="sm" border />
<TuvBadge text="Draft" variant="dark" size="sm" border />
```

### Tabs

| Property | Value |
|----------|-------|
| Variants | solid / overlay / underline / secondary |
| Active tab | navy-500 text + bottom border (underline) or navy-50 bg (solid) |
| Inactive tab | gray-500 text |
| Sizes | xs / sm / md / lg |

### Pagination

| Property | Value |
|----------|-------|
| Active page | navy-500 bg, white text |
| Inactive page | transparent, gray-700 text |
| Sizes | sm / md |

### Card

| Property | Value |
|----------|-------|
| Background | white |
| Border | 1px solid gray-200 |
| Border-radius | 8px (md) |
| Shadow | sm or md |
| Sub-components | CardHeader, CardBody, CardFooter |

---

## Dialog

| Property | Value |
|----------|-------|
| Backdrop | blur (white or black variant) |
| Border-radius | 8px |
| Title variants | default / info / success / danger |
| Footer layout | flex, justify center or flex-end |
| Cancel button | secondary variant |
| Confirm button | primary variant |

### Logout Dialog Pattern (from central-invoicing)

```
Title: "Confirmation Logout"
Body: "Are you sure you want to end the session and exit the page?"
Cancel: Button secondary → "Cancel"
Confirm: Button primary → "Yes, Sure"
```

---

## Alert

| Variant | Icon color | Border color |
|---------|-----------|-------------|
| info | blue-600 | blue-200 |
| success | green-600 | green-200 |
| warning | orange-600 | orange-200 |
| danger | red-600 | red-200 |

---

## Admin Layout Variables

| Variable | Value |
|----------|-------|
| `--hsd-admin-base-border-color` | `rgba(229, 231, 235, 1)` |
| `--hsd-admin-base-text-color` | `rgba(35, 41, 51, 1)` |
| `--hsd-admin-base-icon-color` | `rgba(120, 134, 127)` |
| `--hsd-admin-base-placeholder-color` | `rgba(208, 214, 221, 1)` |
| `--hsd-admin-document-bg-color` | gray-100 |
| `--hsd-admin-sidebar-bg-color` | white |
| `--hsd-admin-sidebar-width` | 15rem (240px) |
| `--hsd-admin-sidebar-large-max-width` | 16rem (256px) |
| `--hsd-admin-sidebar-collapse-width` | 6rem (96px) |

---

## How to Apply TUV Tokens to shadcn Components

### Example: Button Primary

```tsx
<Button
  style={{
    backgroundColor: "var(--hsd-ui-background-color-primary)",
    color: "var(--hsd-ui-text-color-primary)",
    borderColor: "var(--hsd-ui-border-color-primary)",
  }}
>
  Submit
</Button>
```

### Example: Input with TUV Border

```tsx
<Input
  className="focus:ring-0"
  style={{
    borderColor: "rgba(var(--hsd-ui-raw-color-gray-500), 0.2)",
    borderRadius: "8px",
  }}
/>
```

### Example: Badge Success

```tsx
<Badge
  style={{
    backgroundColor: "var(--hsd-ui-color-green-50)",
    color: "var(--hsd-ui-color-green-600)",
    borderRadius: "6px",
  }}
>
  Active
</Badge>
```

### Example: Table Header

```tsx
<th
  style={{
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--hsd-ui-color-gray-700)",
    textTransform: "uppercase",
    padding: "12px 16px",
  }}
>
```

---

## CSS Import

In `globals.css`:

```css
@import "@tuv-indo/css/dist/style.css";
```

This loads all `--hsd-ui-*` CSS variables into `:root`. No JavaScript, no React version dependency.
