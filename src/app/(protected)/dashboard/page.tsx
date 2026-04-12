"use client";

import * as React from "react";
import { Users, Building2, Network, UserCheck, BadgeCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import notificationService from "@/services/notification.service";
import employeeService from "@/services/employee.service";
import departmentService from "@/services/department.service";
import divisionService from "@/services/division.service";
import jobTitleService from "@/services/job-title.service";

// ── Org Summary Config ──────────────────────────────────────────────────────

const ORG_CARDS = [
  {
    key: "employees",
    label: "Active Employees",
    icon: Users,
    color: "var(--hsd-ui-color-navy-500)",
    bgColor: "var(--hsd-ui-color-navy-50)",
  },
  {
    key: "departments",
    label: "Departments",
    icon: Building2,
    color: "rgb(217, 119, 6)",
    bgColor: "rgba(217, 119, 6, 0.08)",
  },
  {
    key: "divisions",
    label: "Divisions",
    icon: Network,
    color: "rgb(124, 58, 237)",
    bgColor: "rgba(124, 58, 237, 0.08)",
  },
  {
    key: "jobTitles",
    label: "Job Titles",
    icon: BadgeCheck,
    color: "var(--hsd-ui-color-green-600)",
    bgColor: "rgba(5, 150, 105, 0.08)",
  },
] as const;

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
  M: "Male",
  F: "Female",
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
    const deptName = emp.department?.name || "Unknown";
    byDepartment[deptName] = (byDepartment[deptName] || 0) + 1;

    const typeKey = emp.employeeType || "permanent";
    byType[typeKey] = (byType[typeKey] || 0) + 1;

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

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: 13,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
};

const NAVY_500 = "rgb(0, 30, 210)";
const DEPT_CHART_HEIGHT = 380;

// ── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const displayName = user?.displayName || user?.name || "there";

  // ── SLA Notification (preserved) ──
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

  // ── Org Summary State ──
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [summaryData, setSummaryData] = React.useState({
    employees: 0,
    departments: 0,
    divisions: 0,
    jobTitles: 0,
  });

  React.useEffect(() => {
    let isCancelled = false;

    async function fetchSummary() {
      try {
        const [empRes, deptRes, divRes, jtRes] = await Promise.all([
          employeeService.getAll(1, 1),
          departmentService.getAll(1, 1),
          divisionService.getAll(1, 1),
          jobTitleService.getAll(1, 1),
        ]);

        if (isCancelled) return;

        setSummaryData({
          employees: empRes.success && empRes.data ? empRes.data.pagination.total : 0,
          departments: deptRes.success && deptRes.data ? deptRes.data.pagination.total : 0,
          divisions: divRes.success && divRes.data ? divRes.data.pagination.total : 0,
          jobTitles: jtRes.success && jtRes.data ? jtRes.data.pagination.total : 0,
        });
      } catch {
        toast.error("Failed to load organization summary");
      } finally {
        if (!isCancelled) setSummaryLoading(false);
      }
    }

    fetchSummary();
    return () => { isCancelled = true; };
  }, []);

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
        const firstPage = await employeeService.getAll(1, 100);
        if (!firstPage.success || !firstPage.data || isCancelled) {
          if (!isCancelled) setChartsLoading(false);
          return;
        }

        let allEmployees = [...firstPage.data.data];
        const { totalPages } = firstPage.data.pagination;

        if (totalPages > 1) {
          const pagePromises = [];
          for (let page = 2; page <= totalPages; page++) {
            pagePromises.push(employeeService.getAll(page, 100));
          }
          const results = await Promise.all(pagePromises);
          if (isCancelled) return;

          for (const res of results) {
            if (res.success && res.data) {
              allEmployees = allEmployees.concat(res.data.data);
            }
          }
        }

        setChartData(aggregateEmployees(allEmployees));
      } catch {
        toast.error("Failed to load employee distribution data");
      } finally {
        if (!isCancelled) setChartsLoading(false);
      }
    }

    fetchChartData();
    return () => { isCancelled = true; };
  }, []);

  return (
    <>
      <Header title="Dashboard" />
      <PageContainer>
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card
            className="border-0 overflow-hidden"
            style={{
              borderRadius: "var(--hsd-ui-radii-md)",
              background: "linear-gradient(135deg, var(--hsd-ui-color-navy-500) 0%, var(--hsd-ui-color-navy-400) 50%, var(--hsd-ui-color-navy-300) 100%)",
            }}
          >
            <CardContent className="relative p-6 sm:p-8">
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm tracking-wide" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 300 }}>
                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                  </p>
                  <h1 className="text-2xl sm:text-3xl text-white" style={{ fontWeight: 500 }}>
                    {getGreeting()}, {displayName}
                  </h1>
                  <p className="max-w-lg text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)", fontWeight: 300 }}>
                    {summaryLoading ? (
                      "Loading today\u2019s summary..."
                    ) : (
                      <>
                        There are currently <span className="text-white" style={{ fontWeight: 500 }}>{summaryData.employees.toLocaleString()} active employees</span> across <span className="text-white" style={{ fontWeight: 500 }}>{summaryData.departments} departments</span>. Everything looks good today.
                      </>
                    )}
                  </p>
                </div>
                <div
                  className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center backdrop-blur-sm"
                  style={{ borderRadius: "var(--hsd-ui-radii-md)", background: "rgba(255,255,255,0.1)" }}
                >
                  <Users className="h-7 w-7 text-white/80" />
                </div>
              </div>
              <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="absolute -top-8 right-24 h-24 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
            </CardContent>
          </Card>

          {/* Organization Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORG_CARDS.map((card) => (
              <Card key={card.key} className="hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {card.label}
                      </p>
                      {summaryLoading ? (
                        <Skeleton className="mt-2 h-8 w-20" />
                      ) : (
                        <p className="mt-2 text-2xl" style={{ fontWeight: 500 }}>
                          {summaryData[card.key].toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex h-10 w-10 items-center justify-center"
                      style={{ backgroundColor: card.bgColor, borderRadius: "var(--hsd-ui-radii-md)" }}
                    >
                      <card.icon className="h-5 w-5" style={{ color: card.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Employee Distribution */}
          <Card>
            <CardHeader className="pb-0">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Composition</p>
                <CardTitle className="mt-1 text-xl" style={{ fontWeight: 500 }}>Employee Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {chartsLoading ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </div>
              ) : (
                <Tabs defaultValue="department">
                  <TabsList>
                    <TabsTrigger value="department" className="gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      Department
                    </TabsTrigger>
                    <TabsTrigger value="type" className="gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" />
                      Employment Type
                    </TabsTrigger>
                    <TabsTrigger value="gender" className="gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Gender
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="department">
                    {chartData.byDepartment.length === 0 ? (
                      <p className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No data available</p>
                    ) : (
                      <div style={{ height: DEPT_CHART_HEIGHT }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.byDepartment} margin={{ bottom: 4, left: 4, right: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                              dataKey="name"
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              interval={0}
                              angle={-40}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              width={30}
                            />
                            <Tooltip {...CHART_TOOLTIP_STYLE} />
                            <Bar dataKey="count" fill={NAVY_500} radius={[3, 3, 0, 0]} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="type">
                    {chartData.byType.length === 0 ? (
                      <p className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No data available</p>
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
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              width={30}
                            />
                            <Tooltip {...CHART_TOOLTIP_STYLE} />
                            <Bar dataKey="count" fill={NAVY_500} radius={[3, 3, 0, 0]} maxBarSize={48} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="gender">
                    {chartData.byGender.length === 0 ? (
                      <p className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">No data available</p>
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
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              width={30}
                            />
                            <Tooltip {...CHART_TOOLTIP_STYLE} />
                            <Bar dataKey="count" fill={NAVY_500} radius={[3, 3, 0, 0]} maxBarSize={64} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
