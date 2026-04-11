# Universal Dashboard Design

## Problem

The current dashboard shows recruitment-specific data (Open Positions, Pending Requests, Onboarding, Interview Candidates, Recent Approvals) which is inaccessible to the Employee role (roleId=2). Employees can view `/dashboard` but cannot access `/employee-request`, `/recruitment`, or `/onboarding` routes. This creates a data visibility mismatch.

## Decision

Replace the dashboard with a universal design that only displays data accessible to all roles. Content is sourced exclusively from `/employees` and `/organization/*` endpoints which every role can access.

## Design

### Layout

Three sections, top to bottom:

1. **Welcome Card** — full-width, navy gradient
2. **Organization Summary** — 4 stat cards in a row
3. **Employee Distribution** — single card with 3 tabs

### Section 1: Welcome Card

Personalized greeting card with navy gradient background.

- Time-based greeting: "Good Morning/Afternoon/Evening, {displayName}"
- Date: formatted as "EEEE, MMMM d, yyyy" (e.g., "Thursday, April 10, 2026")
- Summary text: "There are currently **{total} active employees** across **{deptCount} departments**."
- User name from `useAuthStore((s) => s.user)`
- TUV styling: `var(--hsd-ui-color-navy-500/400/300)` gradient, `var(--hsd-ui-radii-md)` border-radius

### Section 2: Organization Summary

Four stat cards in a `grid sm:grid-cols-2 lg:grid-cols-4` layout:

| Card | Label | Icon | Data Source | Color |
|------|-------|------|-------------|-------|
| 1 | Active Employees | `Users` | `employeeService.getAll(1,1)` → `pagination.total` | navy |
| 2 | Departments | `Building2` | `departmentService.getAll(1,1)` → `pagination.total` | amber |
| 3 | Divisions | `Network` | `divisionService.getAll(1,1)` → `pagination.total` | purple |
| 4 | Job Titles | `BadgeCheck` | `jobTitleService.getAll(1,1)` → `pagination.total` | green |

Each card shows:
- Uppercase label (12px, gray-500 text)
- Large number (20px, fontWeight 500)
- Icon in a tinted square (8px radius via `var(--hsd-ui-radii-md)`)
- Skeleton loader while fetching

All four counts fetched in a single `Promise.all`.

### Section 3: Employee Distribution

Single card with Tabs component. Three tabs: Department, Employment Type, Gender.

- **Data source**: `employeeService.getAll()` with pagination to fetch all employees, then aggregate client-side
- **Chart library**: Recharts BarChart (already installed)
- **Chart height**: 260px for Department tab, 220px for Employment Type and Gender
- **Bar color**: `var(--hsd-ui-color-navy-500)` = `rgb(0, 30, 210)`
- **Empty state**: "No data available" centered text
- **Loading state**: Skeleton bars

Tab triggers include icons: Building2 (Department), UserCheck (Employment Type), Users (Gender).

### What is removed

All recruitment-specific content from the previous dashboard:

- KPI cards: "Open Positions", "Pending Requests", "Onboarding in Progress"
- Activity lists: "Recent Hires", "In Interview", "Recent Approvals"
- Service imports: `employeeRequestService`, `onboardingService`, `candidateService`
- Type imports: `CandidateWithRelations`, `EmployeeRequestWithRelations`

### Data Fetching

Two `useEffect` hooks:

1. **Org Summary** — fetches 4 counts via `Promise.all([employeeService.getAll(1,1), departmentService.getAll(1,1), divisionService.getAll(1,1), jobTitleService.getAll(1,1)])`. Cancellation via `isCancelled` flag.

2. **Employee Distribution** — fetches all employees via pagination (page 1 with limit 100, then remaining pages in parallel). Aggregates into 3 chart datasets. Cancellation via `isCancelled` flag.

The SLA notification `useEffect` is preserved as-is (it runs silently and fails gracefully).

### Styling

- All cards use TUV design tokens: `var(--hsd-ui-radii-md)` (8px) border-radius
- Font weights follow TUV convention: 300=normal, 400=medium, 500=semibold
- Colors use TUV CSS variables where applicable
- Hover states on list items use `var(--hsd-ui-radii-xs)` (4px)
- All text in English

### File Changes

- **Modify**: `src/app/(protected)/dashboard/page.tsx` — rewrite to universal content
- No new files created

## Out of Scope

- Role-specific dashboard sections (future consideration)
- Real-time data / WebSocket updates
- Date range filters on charts
- Export/download functionality
