# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static/hardcoded dashboard with an API-driven dashboard showing KPI cards, employee composition charts, and recent activity lists.

**Architecture:** Single-page rewrite of `src/app/(protected)/dashboard/page.tsx`. All data fetched from existing API services in parallel. Employee data fetched once and aggregated client-side for 3 bar charts. No new components or files — everything inline in the page. SLA notification effect preserved.

**Tech Stack:** Next.js App Router, React 18, Recharts (already installed), date-fns (already installed), shadcn/ui Card + Skeleton + Avatar, TUV design tokens

---

## File Structure

Only one file is modified:

- **Modify:** `src/app/(protected)/dashboard/page.tsx` — Complete rewrite replacing hardcoded data with API-driven dashboard

No new files created. All helper functions (aggregation, fetch logic) defined at module level in the same file.

---

### Task 1: Strip existing dashboard and scaffold empty sections

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Replace the entire file with the new scaffold**

Replace the full contents of `src/app/(protected)/dashboard/page.tsx` with:

```tsx
"use client";

import * as React from "react";
import { Users, UserPlus, Briefcase, FileText } from "lucide-react";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import notificationService from "@/services/notification.service";

// ── KPI Config ──────────────────────────────────────────────────────────────

const KPI_CARDS = [
  { key: "totalEmployees", label: "Total Karyawan Aktif", icon: Users },
  { key: "openPositions", label: "Open Positions", icon: Briefcase },
  { key: "pendingRequests", label: "Pending Requests", icon: FileText },
  { key: "onboardingInProgress", label: "Onboarding in Progress", icon: UserPlus },
] as const;

// ── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // ── SLA Notification (preserved from original) ──
  React.useEffect(() => {
    let isCancelled = false;

    async function checkSlaNotifications() {
      try {
        const res = await notificationService.getNotifications({
          page: 1,
          limit: 5,
          type: "sla_approaching,sla_overdue",
        });

        if (isCancelled) return;

        const unread = res.data.filter((n) => !n.isRead);
        if (unread.length > 0) {
          toast.warning("Recruitment SLA Warning", {
            description: `You have ${unread.length} recruitment${unread.length > 1 ? "s" : ""} approaching or past SLA deadline.`,
          });
        }
      } catch {
        // silently fail
      }
    }

    checkSlaNotifications();
    return () => { isCancelled = true; };
  }, []);

  return (
    <>
      <Header title="Dashboard" />
      <PageContainer>
        <div className="space-y-8">
          {/* Section 1: KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPI_CARDS.map((card) => (
              <Card key={card.key} className="hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="mt-2 text-2xl" style={{ fontWeight: 500 }}>
                        —
                      </p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                      <card.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Section 2: Employee Composition Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            {["By Department", "By Employment Type", "By Gender"].map((title) => (
              <Card key={title}>
                <CardHeader className="pb-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Distribution</p>
                  <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Section 3: Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            {["Recent Hires", "In Interview Stage", "Recent Approvals"].map((title) => (
              <Card key={title}>
                <CardHeader className="pb-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Activity</p>
                  <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    </>
  );
}
```

- [ ] **Step 2: Verify the page loads**

Run: `npm run dev` and navigate to `/dashboard`.
Expected: Page renders with 4 KPI cards showing "—", 3 chart placeholders showing "Loading...", and 3 list placeholders showing "Loading...". No console errors. SLA notification still fires.

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "refactor(dashboard): strip hardcoded data and scaffold API-driven layout"
```

---

### Task 2: Implement KPI Cards with API data

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add service imports and KPI state + fetch logic**

At the top of the file, add these imports after the existing ones:

```tsx
import { employeeService } from "@/services/employee.service";
import { employeeRequestService } from "@/services/employee-request.service";
import { onboardingService } from "@/services/onboarding.service";
```

Inside the `DashboardPage` component, add KPI state and fetch effect **after** the SLA notification effect:

```tsx
  // ── KPI State ──
  const [kpiLoading, setKpiLoading] = React.useState(true);
  const [kpiData, setKpiData] = React.useState({
    totalEmployees: 0,
    openPositions: 0,
    pendingRequests: 0,
    onboardingInProgress: 0,
  });

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchKpis() {
      try {
        const [employeesRes, statsRes, onboardingRes] = await Promise.all([
          employeeService.getAll(1, 1),
          employeeRequestService.getStats(),
          onboardingService.getAll(1, 1, { status: "in_progress" }),
        ]);

        if (isCancelled) return;

        const totalEmployees = employeesRes.success
          ? employeesRes.data.pagination.total
          : 0;

        let openPositions = 0;
        let pendingRequests = 0;
        if (statsRes.success && statsRes.data) {
          openPositions = statsRes.data.in_recruitment;
          pendingRequests =
            statsRes.data.created +
            statsRes.data.hod_reviewed +
            statsRes.data.reviewed;
        }

        const onboardingInProgress = onboardingRes.success
          ? onboardingRes.data.pagination.total
          : 0;

        setKpiData({ totalEmployees, openPositions, pendingRequests, onboardingInProgress });
      } catch {
        toast.error("Failed to load dashboard statistics");
      } finally {
        if (!isCancelled) setKpiLoading(false);
      }
    }

    fetchKpis();
    return () => { isCancelled = true; };
  }, []);
```

- [ ] **Step 2: Update KPI card rendering to use state**

Replace the Section 1 KPI Cards block in the JSX with:

```tsx
          {/* Section 1: KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPI_CARDS.map((card) => (
              <Card key={card.key} className="hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {card.label}
                      </p>
                      {kpiLoading ? (
                        <Skeleton className="mt-2 h-8 w-20" />
                      ) : (
                        <p className="mt-2 text-2xl" style={{ fontWeight: 500 }}>
                          {kpiData[card.key].toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                      <card.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
```

- [ ] **Step 3: Verify KPI cards load from API**

Run: `npm run dev` and navigate to `/dashboard`.
Expected: 4 KPI cards show skeleton loading, then resolve to numbers from the API. If backend is unreachable, toast error appears and cards show "0".

- [ ] **Step 4: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "feat(dashboard): add API-driven KPI cards with loading states"
```

---

### Task 3: Implement Employee Composition bar charts

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add Recharts imports**

Add to the imports at the top of the file:

```tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
```

- [ ] **Step 2: Add aggregation helper at module level**

Add this above the `DashboardPage` component, after the `KPI_CARDS` constant:

```tsx
// ── Chart Helpers ───────────────────────────────────────────────────────────

interface ChartDataPoint {
  name: string;
  count: number;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  permanent: "Permanent",
  contract: "Contract",
  probation: "Probation",
  outsource: "Outsource",
  internship: "Internship",
};

const GENDER_LABELS: Record<string, string> = {
  Male: "Male",
  Female: "Female",
  Any: "Other",
};

function aggregateEmployees(employees: Array<{
  department?: { name: string } | null;
  employeeType?: string;
  gender: string;
}>) {
  const byDepartment: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byGender: Record<string, number> = {};

  for (const emp of employees) {
    // By department
    const deptName = emp.department?.name || "Unknown";
    byDepartment[deptName] = (byDepartment[deptName] || 0) + 1;

    // By employment type
    const typeKey = emp.employeeType || "permanent";
    byType[typeKey] = (byType[typeKey] || 0) + 1;

    // By gender
    const genderKey = emp.gender || "Any";
    byGender[genderKey] = (byGender[genderKey] || 0) + 1;
  }

  const toSorted = (record: Record<string, number>, labels?: Record<string, string>): ChartDataPoint[] =>
    Object.entries(record)
      .map(([key, count]) => ({ name: labels?.[key] || key, count }))
      .sort((a, b) => b.count - a.count);

  return {
    byDepartment: toSorted(byDepartment),
    byType: toSorted(byType, EMPLOYMENT_TYPE_LABELS),
    byGender: toSorted(byGender, GENDER_LABELS),
  };
}
```

- [ ] **Step 3: Add chart state and fetch logic inside the component**

Add after the KPI effect inside `DashboardPage`:

```tsx
  // ── Charts State ──
  const [chartsLoading, setChartsLoading] = React.useState(true);
  const [chartData, setChartData] = React.useState<{
    byDepartment: ChartDataPoint[];
    byType: ChartDataPoint[];
    byGender: ChartDataPoint[];
  }>({ byDepartment: [], byType: [], byGender: [] });

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchChartData() {
      try {
        // Fetch page 1 to get total pages
        const firstPage = await employeeService.getAll(1, 100);
        if (!firstPage.success || isCancelled) {
          if (!isCancelled) setChartsLoading(false);
          return;
        }

        let allEmployees = [...firstPage.data.data];
        const { totalPages } = firstPage.data.pagination;

        // Fetch remaining pages in parallel
        if (totalPages > 1) {
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pagePromises.push(employeeService.getAll(page, 100));
          }
          const results = await Promise.all(pagePromises);
          if (isCancelled) return;

          for (const res of results) {
            if (res.success) {
              allEmployees = allEmployees.concat(res.data.data);
            }
          }
        }

        setChartData(aggregateEmployees(allEmployees));
      } catch {
        toast.error("Failed to load employee composition data");
      } finally {
        if (!isCancelled) setChartsLoading(false);
      }
    }

    fetchChartData();
    return () => { isCancelled = true; };
  }, []);
```

- [ ] **Step 4: Add shared chart tooltip style at module level**

Add after the `aggregateEmployees` function:

```tsx
const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: 13,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
};

// TUV navy-500 = rgb(0, 30, 210) → used as bar fill
const NAVY_500 = "rgb(0, 30, 210)";
const NAVY_300 = "rgb(102, 122, 230)";
```

- [ ] **Step 5: Replace Section 2 placeholder with actual charts**

Replace the Section 2 block in JSX with:

```tsx
          {/* Section 2: Employee Composition Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* By Department */}
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Distribution</p>
                <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>By Department</CardTitle>
              </CardHeader>
              <CardContent>
                {chartsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : chartData.byDepartment.length === 0 ? (
                  <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No data available</p>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.byDepartment}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="count" fill={NAVY_500} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Employment Type */}
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Distribution</p>
                <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>By Employment Type</CardTitle>
              </CardHeader>
              <CardContent>
                {chartsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : chartData.byType.length === 0 ? (
                  <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No data available</p>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.byType}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="count" fill={NAVY_500} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Gender */}
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Distribution</p>
                <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>By Gender</CardTitle>
              </CardHeader>
              <CardContent>
                {chartsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : chartData.byGender.length === 0 ? (
                  <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">No data available</p>
                ) : (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.byGender}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                        />
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                        <Bar
                          dataKey="count"
                          radius={[4, 4, 0, 0]}
                          fill={NAVY_500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
```

- [ ] **Step 6: Verify charts render**

Run: `npm run dev` and navigate to `/dashboard`.
Expected: 3 bar charts load with skeleton states, then show employee data grouped by department, type, and gender. If no employees, shows "No data available".

- [ ] **Step 7: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "feat(dashboard): add employee composition bar charts with API data"
```

---

### Task 4: Implement Recent Activity & Upcoming lists

**Files:**
- Modify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Add remaining imports**

Add to imports at the top:

```tsx
import { ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { candidateService } from "@/services/candidate.service";
import Link from "next/link";
```

Add type imports:

```tsx
import type { EmployeeWithRelations } from "@/types";
import type { CandidateWithRelations } from "@/services/candidate.service";
import type { EmployeeRequestWithRelations } from "@/types/employee-request";
```

- [ ] **Step 2: Add helper function at module level**

Add after the `NAVY_300` constant:

```tsx
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function safeRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}
```

- [ ] **Step 3: Add lists state and fetch logic inside the component**

Add after the charts effect:

```tsx
  // ── Lists State ──
  const [listsLoading, setListsLoading] = React.useState(true);
  const [recentHires, setRecentHires] = React.useState<EmployeeWithRelations[]>([]);
  const [interviewCandidates, setInterviewCandidates] = React.useState<CandidateWithRelations[]>([]);
  const [recentApprovals, setRecentApprovals] = React.useState<EmployeeRequestWithRelations[]>([]);

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchLists() {
      try {
        const [hiresRes, candidatesRes, approvalsRes] = await Promise.all([
          employeeService.getAll(1, 5),
          candidateService.getAll(1, 10),
          employeeRequestService.getAll(1, 5, { status: "approved" }),
        ]);

        if (isCancelled) return;

        if (hiresRes.success) {
          // Sort by hireDate descending, take 5
          const sorted = [...hiresRes.data.data]
            .sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime())
            .slice(0, 5);
          setRecentHires(sorted);
        }

        if (candidatesRes.success) {
          // Filter to candidates in interview stage (PENDING assessment statuses)
          const inInterview = candidatesRes.data.data.filter((c) => {
            const a = c.assessment;
            if (!a) return false;
            return (
              a.interview1Status === "PENDING" ||
              a.interview2Status === "PENDING"
            );
          }).slice(0, 5);
          setInterviewCandidates(inInterview);
        }

        if (approvalsRes.success) {
          // Sort by approvedAt descending
          const sorted = [...approvalsRes.data.data]
            .sort((a, b) => {
              const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0;
              const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5);
          setRecentApprovals(sorted);
        }
      } catch {
        toast.error("Failed to load recent activity");
      } finally {
        if (!isCancelled) setListsLoading(false);
      }
    }

    fetchLists();
    return () => { isCancelled = true; };
  }, []);
```

- [ ] **Step 4: Replace Section 3 placeholder with actual lists**

Replace the Section 3 block in JSX with:

```tsx
          {/* Section 3: Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Hires */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Team</p>
                  <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>Recent Hires</CardTitle>
                </div>
                <Button variant="ghost" className="text-muted-foreground" asChild>
                  <Link href="/employees">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                {listsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : recentHires.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No recent hires</p>
                ) : (
                  recentHires.map((hire) => (
                    <div
                      key={hire.id}
                      className="group flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/50"
                    >
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-secondary text-sm" style={{ fontWeight: 500 }}>
                          {getInitials(`${hire.firstName} ${hire.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate" style={{ fontWeight: 400 }}>
                          {hire.firstName} {hire.lastName}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {hire.department?.name || "—"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {safeRelativeDate(hire.hireDate)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* In Interview Stage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Recruitment</p>
                  <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>In Interview Stage</CardTitle>
                </div>
                <Button variant="ghost" className="text-muted-foreground" asChild>
                  <Link href="/recruitment">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                {listsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : interviewCandidates.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No candidates in interview stage</p>
                ) : (
                  interviewCandidates.map((candidate) => {
                    const stage = candidate.assessment?.interview2Status === "PENDING"
                      ? "Interview User"
                      : "Interview HR";
                    return (
                      <div
                        key={candidate.id}
                        className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-2 w-2 rounded-full bg-amber-400" />
                          <div>
                            <p style={{ fontWeight: 400 }}>{candidate.fullname}</p>
                            <p className="text-sm text-muted-foreground">
                              {candidate.jobTitle?.name || "—"}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{stage}</span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Recent Approvals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Approvals</p>
                  <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>Recent Approvals</CardTitle>
                </div>
                <Button variant="ghost" className="text-muted-foreground" asChild>
                  <Link href="/employee-request">
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1">
                {listsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : recentApprovals.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No recent approvals</p>
                ) : (
                  recentApprovals.map((req) => (
                    <div
                      key={req.id}
                      className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate" style={{ fontWeight: 400 }}>
                          {req.code}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {req.jobTitle?.name || "—"} <span className="opacity-50">·</span> {req.department?.name || "—"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {safeRelativeDate(req.approvedAt)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
```

- [ ] **Step 5: Verify lists render**

Run: `npm run dev` and navigate to `/dashboard`.
Expected: 3 list cards show skeleton loading, then resolve with real data. Empty states show when no data. "View All" buttons link to respective pages.

- [ ] **Step 6: Commit**

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "feat(dashboard): add recent activity lists with API data"
```

---

### Task 5: Final verification and type-check

**Files:**
- Verify: `src/app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors related to the dashboard page.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 3: Visual verification in browser**

Navigate to `/dashboard` and verify:
1. 4 KPI cards at top showing real numbers with skeleton loading
2. 3 bar charts in middle row — department names on X-axis, employee counts on Y-axis
3. 3 activity lists at bottom — recent hires with avatars, interview candidates with status dots, approvals with request codes
4. All "View All" buttons navigate to correct pages
5. Empty states appear when no data
6. SLA warning toast still fires if applicable
7. Page is responsive — cards stack on mobile, 2-col on tablet, full layout on desktop

- [ ] **Step 4: Fix any issues found and commit**

If issues were found in steps 1-3, fix them and commit:

```bash
git add src/app/(protected)/dashboard/page.tsx
git commit -m "fix(dashboard): address type/lint/visual issues"
```

If no issues were found, skip this step.
