# Dashboard Redesign — Design Spec

**Date:** 2026-04-10
**Scope:** Replace current static/hardcoded dashboard with API-driven dashboard containing 3 sections

---

## Overview

Redesign the existing dashboard page (`/dashboard`) to show real, live data from the backend APIs. The dashboard is a single unified view accessible to all roles (data filtered by backend based on user's role/permissions).

### Sections

1. **Headline KPI Cards** — 4 stat cards with key metrics
2. **Employee Composition** — 3 bar charts showing workforce distribution
3. **Recent Activity & Upcoming** — 3 list cards with latest events

---

## Section 1: Headline KPI Cards

Four cards displayed in a responsive grid (`grid-cols-2 lg:grid-cols-4`).

| Card | Label | Data Source | Icon |
|------|-------|-------------|------|
| 1 | Total Karyawan Aktif | `employeeService.getAll(1, 1)` → `pagination.total` | `Users` |
| 2 | Open Positions | `employeeRequestService.getAll(1, 1, { status: 'in_recruitment' })` → `pagination.total` | `Briefcase` |
| 3 | Pending Requests | `employeeRequestService.getAll(1, 1, { status: 'created' })` → `pagination.total` + repeat for `hod_reviewed`, `reviewed` statuses and sum | `FileText` |
| 4 | Onboarding in Progress | `onboardingService.getAll(1, 1, { status: 'in_progress' })` → `pagination.total` | `UserPlus` |

**Design:**
- Each card shows: icon (top-left), label (subtitle), value (large number)
- No trend/percentage indicators (no historical comparison endpoint available)
- Use TUV navy color for the primary card accent
- Cards use shadcn `Card` component with hover-lift effect

**API Strategy:**
- Fetch with `limit=1` to minimize payload — we only need the `pagination.total` count
- For Pending Requests: 3 parallel calls (status=created, hod_reviewed, reviewed), sum the totals
- All 4 KPI fetches run in parallel via `Promise.all`

---

## Section 2: Employee Composition (3 Bar Charts)

Three bar charts displayed in a responsive grid (`grid-cols-1 lg:grid-cols-3`).

### Chart 2a: By Department

- **Type:** Vertical bar chart
- **X-axis:** Department name
- **Y-axis:** Employee count
- **Data source:** `employeeService.getAll(1, 100)` → iterate all pages, group by `department?.name`
- **Colors:** TUV navy-500 for all bars

### Chart 2b: By Employment Type

- **Type:** Vertical bar chart
- **X-axis:** Employment type (Permanent, Contract, Probation, Outsource)
- **Y-axis:** Employee count
- **Data source:** Same employee data as 2a, group by `employeeType`
- **Colors:** TUV navy-500

### Chart 2c: By Gender

- **Type:** Vertical bar chart
- **X-axis:** Gender (Male, Female)
- **Y-axis:** Employee count
- **Data source:** Same employee data as 2a, group by `gender`
- **Colors:** TUV navy-500 for Male, navy-300 for Female

### Data Strategy

Fetch all employees once (paginated, all pages), then compute all 3 aggregations client-side. This avoids 3 separate API calls and ensures consistent data.

**Implementation:**
```
1. Fetch page 1 with limit=100 to get pagination.totalPages
2. Fetch remaining pages in parallel
3. Concatenate all employee arrays
4. Compute 3 group-by aggregations:
   - byDepartment: Record<string, number>
   - byType: Record<string, number>
   - byGender: Record<string, number>
```

**Concern:** For large employee counts (1000+), this could be slow. If the backend provides a `/v1/employee/stats` or `/v1/dashboard/summary` endpoint in the future, switch to that. For now, paginated fetch is the only option.

**Chart Library:** Recharts (already installed — used by current dashboard).

---

## Section 3: Recent Activity & Upcoming (3 List Cards)

Three cards displayed in a responsive grid (`grid-cols-1 lg:grid-cols-3`).

### List 3a: Recent Hires

- **Data source:** `employeeService.getAll(1, 5)` — sorted by `hireDate` desc (or `createdAt` desc)
- **Display per item:** Avatar initials, full name, department name, hire date (relative: "2d ago")
- **Empty state:** "No recent hires"

### List 3b: Upcoming Interviews

- **Data source:** `candidateService.getAll(1, 5)` — filter candidates where assessment has `interview1.status === 'PENDING'` or `interview2.status === 'PENDING'`
- **Display per item:** Status dot (green=confirmed, yellow=pending), candidate name, job title, assessment stage
- **Empty state:** "No upcoming interviews"
- **Note:** The current API does not have a dedicated "upcoming interviews" endpoint with date/time. We'll show candidates at interview stage instead, labeled "In Interview Stage" rather than "Upcoming Interviews"

### List 3c: Recent Approvals

- **Data source:** `employeeRequestService.getAll(1, 5, { status: 'approved' })` — sorted by `approvedAt` desc
- **Display per item:** Request code, job title name, department name, approved date (relative)
- **Empty state:** "No recent approvals"

### Shared Design

- Each list card has: subtitle label, title, "View All" button linking to the respective list page
- Items are hover-highlighted rows with subtle background transition
- Max 5 items per list
- Uses shadcn Card + Avatar components

---

## Layout Structure

```
Page: Header("Dashboard") + PageContainer

Row 1: Welcome Card (lg:col-span-8) + Highlight Stat (lg:col-span-4)
  — REMOVED. Replace with simpler KPI row below.

Row 1 (new): 4 KPI Cards
  grid gap-4 sm:grid-cols-2 lg:grid-cols-4

Row 2: 3 Bar Charts
  grid gap-6 lg:grid-cols-3
  Each chart in a Card with header + ResponsiveContainer (h-[280px])

Row 3: 3 Activity Lists
  grid gap-6 lg:grid-cols-3
  Each list in a Card with header + list items
```

The existing welcome hero card and employee growth area chart will be removed — they used hardcoded data and don't align with the selected sections.

---

## State Management

All dashboard data lives in local component state (not Zustand) — per CLAUDE.md guidelines for server data.

```typescript
// State shape
interface DashboardState {
  kpiLoading: boolean;
  chartsLoading: boolean;
  listsLoading: boolean;
  error: string | null;

  // KPIs
  totalEmployees: number;
  openPositions: number;
  pendingRequests: number;
  onboardingInProgress: number;

  // Charts
  byDepartment: Array<{ name: string; count: number }>;
  byType: Array<{ name: string; count: number }>;
  byGender: Array<{ name: string; count: number }>;

  // Lists
  recentHires: EmployeeWithRelations[];
  interviewCandidates: CandidateWithRelations[];
  recentApprovals: EmployeeRequestWithRelations[];
}
```

---

## Loading & Error States

| Section | Loading State | Error State |
|---------|-------------|-------------|
| KPI Cards | 4 skeleton cards (pulsing) | Show "—" as value, toast error |
| Bar Charts | 3 skeleton rectangles | Show empty chart with "Failed to load" message |
| Activity Lists | 3 skeleton lists (3 rows each) | Show "Failed to load" with retry button |

Each section loads independently — KPIs show first (fastest), then charts, then lists.

---

## Component Structure

```
src/app/(protected)/dashboard/page.tsx  — Main page (rewrite existing)
  ├── KPI section (inline, 4 Cards)
  ├── Charts section (inline, 3 Cards with Recharts BarChart)
  └── Activity section (inline, 3 Cards with list items)
```

No new component files needed. Everything stays in the single page file since:
- No component is reused elsewhere
- The page is already a self-contained dashboard
- Extracting sub-components adds file overhead without reuse benefit

Helper functions (aggregation logic) will be defined at module level outside the component.

---

## Styling

- **Brand color:** TUV navy via `var(--hsd-ui-color-navy-500)` for chart fills and accents
- **Card borders:** `var(--hsd-ui-color-gray-300)` or shadcn default
- **Background:** page uses `gray-100` (already set by layout)
- **Typography:** TUV font weights (300=normal, 400=medium, 500=semibold)
- **Chart tooltip:** Styled to match current dashboard tooltip (card background, border, rounded)

---

## Constraints & Trade-offs

1. **No dedicated dashboard API** — Must aggregate from existing CRUD endpoints. This means more API calls on page load. If a backend summary endpoint is added later, swap out the fetch logic.

2. **Employee pagination for charts** — Fetching all employees for composition charts could be slow with 1000+ records. Acceptable for now; consider backend aggregation endpoint as optimization.

3. **No interview schedule data** — The API tracks assessment status (PASSED/FAILED/PENDING) but not interview dates/times. The "Upcoming Interviews" list will instead show "Candidates in Interview Stage."

4. **No historical/trend data** — No endpoint provides month-over-month comparisons. KPI cards will not show trend percentages (unlike the current hardcoded dashboard).

---

## What Gets Removed

The current dashboard page has these elements that will be removed:
- Welcome hero card with greeting message
- Employee Growth area chart (hardcoded monthly data)
- Department Distribution bar chart (will be replaced with API-driven version)
- Static stat cards (will be replaced with API-driven version)
- Static recent hires list (will be replaced with API-driven version)
- Static upcoming interviews list (will be replaced with API-driven version)

All hardcoded mock data arrays (`stats`, `employeeGrowth`, `departmentData`, `recentHires`, `upcomingInterviews`) will be deleted.

The SLA notification useEffect will be **preserved** — it's useful and already API-driven.
