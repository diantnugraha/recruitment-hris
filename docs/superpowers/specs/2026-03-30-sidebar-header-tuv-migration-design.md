# Sidebar & Header TUV Migration Design

**Date:** 2026-03-30
**Status:** Draft
**Scope:** Migrate `sidebar.tsx` and `header.tsx` from shadcn/ui to TUV design system (`@tuv-indo/admin`)

---

## Context

The HRIS frontend currently uses shadcn/ui (Radix UI primitives) for its component library. The company design system is `@tuv-indo/admin`, and the project needs to migrate to it for consistency across TUV applications.

This spec covers the **first migration step**: sidebar and header — the two layout components visible on every page. Lucide icons are retained; only structural/UI components are replaced.

## Approach

**Full TUV Replace (Approach A):** Replace all shadcn/ui components in both `sidebar.tsx` and `header.tsx` with TUV equivalents. This creates a clean reference pattern for migrating the rest of the app.

## Files Changed

| File | Action |
|------|--------|
| `src/components/layout/sidebar.tsx` | Full rewrite — shadcn to TUV |
| `src/components/layout/header.tsx` | Full rewrite — shadcn to TUV |

## Component Mapping

### Sidebar (`sidebar.tsx`)

| Current (shadcn/ui) | Replacement (TUV) | Notes |
|---|---|---|
| `<aside>` raw HTML | `Box variant="aside"` | Semantic HTML via variant prop |
| `<nav>` raw HTML | `Box variant="nav"` | Semantic HTML via variant prop |
| `<div>` containers | `Box` | Layout via props (display, direction, gap, etc.) |
| `ScrollArea` | `Box overflow="overflow-y-auto"` | Native scroll, no custom scrollbar |
| `Button` (ghost, icon-sm) | `Button primary={false} tertiary` | Collapse/expand toggle. TUV Button requires `primary` prop — set `primary={false}` when using other variants |
| `Tooltip` + `TooltipProvider` + `TooltipTrigger` + `TooltipContent` | `Tooltip` (single component) | `label` + `position="right"` props |
| `<span>` text elements | `Text` | Typed fontSize, fontWeight, color |

**Imports removed:**
- `Button` from `@/components/ui/button`
- `ScrollArea` from `@/components/ui/scroll-area`
- `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` from `@/components/ui/tooltip`

**Imports added:**
- `Box`, `Text`, `Tooltip` from `@tuv-indo/admin`
- `Button` from `@tuv-indo/admin` (replaces shadcn Button)

**Lucide icons retained:** `LayoutDashboard`, `Users`, `UserPlus`, `ChevronRight`, `ChevronLeft`, `Network`, `Layers`, `Building`, `Award`, `Briefcase`, `Wallet`, `ClipboardList`, `Shield`

### Header (`header.tsx`)

| Current (shadcn/ui) | Replacement (TUV) | Notes |
|---|---|---|
| `<header>` raw HTML | `Box variant="header"` | Semantic HTML via variant prop |
| `<div>` containers | `Box` | Layout via props |
| `Button` (ghost, icon) | `Button primary={false} tertiary` | Hamburger, logout buttons. `primary={false}` required |
| `DropdownMenu` + Trigger + Content + Items + Label + Separator | `Menu` + `MenuButton` + `MenuLists` + `MenuHeading` + `MenuBody` | User profile dropdown |
| `Dialog` + Content + Header + Title + Description + Footer | `Dialog` (isShow/onHide) + `DialogTitle` + `DialogBody` + `DialogFooter` | Logout confirmation. `DialogContent` eliminated (TUV Dialog wraps children directly). `DialogHeader` eliminated (`DialogTitle` stands alone). `DialogDescription` content moves into `DialogBody`. |
| `Avatar` + `AvatarFallback` | `Box` (rounded-full + bg) + `Text` | TUV has no Avatar component |
| `<h1>`, `<p>`, `<span>` text | `Text` | Typed variant, fontSize, color |

**Imports removed:**
- `Button` from `@/components/ui/button`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu`
- `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog`
- `Avatar`, `AvatarFallback` from `@/components/ui/avatar`

**Imports added:**
- `Box`, `Text`, `Button` from `@tuv-indo/admin`
- `Menu`, `MenuButton`, `MenuLists`, `MenuHeading`, `MenuBody`, `MenuFooter` from `@tuv-indo/admin`
- `Dialog`, `DialogTitle`, `DialogBody`, `DialogFooter` from `@tuv-indo/admin`

**Lucide icons retained:** `Menu` as `MenuIcon` (aliased to avoid collision with TUV `Menu`), `LogOut`

**Name collision note:** Lucide exports `Menu` (hamburger icon) and TUV exports `Menu` (dropdown component). The Lucide import must be aliased:
```typescript
import { Menu as MenuIcon, LogOut } from "lucide-react";
```

## Detailed Design

### Sidebar Structure

```
Box (aside, fixed, full height, border-r)
├── Box (header area, flex, border-b)
│   ├── Link
│   │   ├── Box (logo circle, rounded-full, bg primary)
│   │   │   └── Users icon (Lucide)
│   │   └── Box (text area, conditional on !collapsed)
│   │       ├── Text "HRIS System" (bold, gray-900)
│   │       └── Text "PT TÜV Nord Indonesia" (xs, gray-400)
│   └── Button tertiary (ChevronLeft, conditional on !collapsed)
├── Box (expand button, conditional on collapsed, border-b)
│   └── Button tertiary (ChevronLeft rotated)
└── Box (nav area, flex-1, overflow-y-auto)
    └── Box (nav, flex column, gap)
        └── [sections].map
            ├── Text (section title, conditional on !collapsed)
            └── [items].map
                └── Tooltip (label, position="right", conditional wrap on collapsed)
                    └── Link
                        ├── item.icon (Lucide)
                        ├── Text (item title, conditional on !collapsed)
                        └── ChevronRight (conditional on active)
```

### Header Structure

```
Box (header, sticky, flex, border-b)
├── Box (left side, flex)
│   ├── Box (hamburger, hide="desktop")
│   │   └── Button tertiary (Menu icon)
│   └── Box (title area)
│       ├── Text (title, sub-h2, semibold)
│       └── Text (subtitle, sm, text-muted)
├── Box (right side, flex)
│   ├── NotificationBell (unchanged)
│   ├── Menu (user dropdown)
│   │   ├── MenuButton
│   │   │   └── Box (flex, avatar + name)
│   │   │       ├── Box (avatar circle, rounded-full, bg primary)
│   │   │       │   └── Text (initials)
│   │   │       └── Box (name/email, hide="mobile")
│   │   └── MenuLists
│   │       ├── MenuHeading (name + email)
│   │       ├── MenuBody
│   │       │   ├── Box (Profile Settings)
│   │       │   └── Box (Preferences)
│   │       └── MenuFooter
│   │           └── Box (Sign out + LogOut icon, visually separated)
│   ├── Button tertiary (LogOut icon)
│   └── Dialog (logout confirmation)
│       ├── DialogTitle danger
│       ├── DialogBody
│       └── DialogFooter (Cancel + Sign out buttons)
```

## Key API Differences

| Concept | shadcn/ui | TUV |
|---|---|---|
| Button variant | `variant="ghost"` | `primary={false} tertiary` — `primary` is required, set false for other variants |
| Button destructive | `variant="destructive"` | `primary={false} danger` — same pattern |
| Dialog open state | `open={bool} onOpenChange={fn}` | `isShow={bool} onHide={fn}` |
| Tooltip | 4 compound components | Single `<Tooltip label="..." position="right">` |
| Dropdown menu | Compound: Trigger + Content + Items | Compound: `MenuButton` + `MenuLists` + `MenuBody` |
| Avatar | `Avatar` + `AvatarFallback` | `Box` (rounded-full) + `Text` |
| Semantic elements | Raw HTML tags | `Box variant="aside/header/nav"` |
| Scroll container | `ScrollArea` component | `Box overflow="overflow-y-auto"` |

## Transition & Animation Strategy

TUV Box does not natively support CSS transitions. For animated width/margin changes:

- **Sidebar width:** Use `style` prop with inline transition: `style={{ width: sidebarCollapsed ? "64px" : "256px", transition: "width 300ms ease" }}`
- **Header margin-left:** Use `style` prop: `style={{ marginLeft: sidebarCollapsed ? "64px" : "256px", transition: "margin-left 300ms ease" }}`
- **PageContainer margin-left:** Same pattern as header

This avoids dependency on TUV Box accepting `className` (which is unverified).

## `cn()` Usage Scope After Migration

`cn()` remains needed only for:
1. **Link elements** — active state conditional classes (Link is Next.js, not TUV)
2. **Lucide icon elements** — conditional `className` for size/color (e.g. `cn("h-5 w-5", isActive ? "text-accent" : "text-gray-400")`)

`cn()` is **no longer needed** for:
- `<aside>`, `<header>`, `<nav>`, `<div>` containers (replaced by TUV Box props)
- Text styling (replaced by TUV Text props)
- Button variants (replaced by TUV Button boolean props)

## Unchanged Dependencies

- `next/link`, `next/navigation` — routing
- `lucide-react` — all icons
- `@/lib/utils` — `cn()` utility (for Link active classes and Lucide icon className)
- `@/stores/app-store` — sidebar collapse state
- `@/stores/auth-store` — user data, logout
- `@/lib/constants/routeAccess` — role-based nav filtering
- `@/components/layout/NotificationBell` — notification bell in header

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| TUV Box `customWidth` transition may not animate like Tailwind `transition-all` | Add CSS transition via `style` prop or minimal Tailwind class on the Box |
| TUV Menu dropdown positioning may differ from shadcn DropdownMenu | Test with `position="bottom-left"` and adjust as needed |
| Native scroll (no ScrollArea) may look different across browsers | Acceptable for test drive; can add custom scrollbar CSS later |
| `cn()` still needed for Link active state classes | Keep `cn()` import — Link is a Next.js component, not TUV |
| TUV components may not accept `className` prop or forward refs | Use only TUV props for styling. Use `style` prop for transitions. Keep `className` only on non-TUV elements (Link, Lucide icons) |
| TUV Button may not pass through `onClick`/`disabled` HTML attributes | Verify during implementation; fallback to wrapping in `<button>` if needed |

## Success Criteria

1. Sidebar renders identically to current — collapsible, sections, active state, tooltips on collapse
2. Header renders identically — title, user dropdown, logout dialog, notification bell
3. Zero shadcn/ui imports in `sidebar.tsx` and `header.tsx`
4. All TUV components imported from `@tuv-indo/admin`
5. Lucide icons unchanged
6. No TypeScript errors
7. Role-based nav filtering still works
