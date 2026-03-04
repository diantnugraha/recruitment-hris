"use client";

import * as React from "react";
import {
  Users,
  UserPlus,
  Briefcase,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const stats = [
  { title: "Total Employees", value: "1,284", change: "+12.5%", trend: "up", icon: Users },
  { title: "New Hires", value: "45", change: "+8.2%", trend: "up", icon: UserPlus },
  { title: "Open Positions", value: "23", change: "-3.1%", trend: "down", icon: Briefcase },
  { title: "Avg. Tenure", value: "3.2y", change: "+0.4", trend: "up", icon: Clock },
];

const employeeGrowth = [
  { month: "Jan", value: 1120 },
  { month: "Feb", value: 1145 },
  { month: "Mar", value: 1168 },
  { month: "Apr", value: 1195 },
  { month: "May", value: 1228 },
  { month: "Jun", value: 1256 },
  { month: "Jul", value: 1284 },
];

const departmentData = [
  { name: "Engineering", value: 420, fill: "hsl(var(--accent))" },
  { name: "Sales", value: 280, fill: "hsl(var(--foreground))" },
  { name: "Product", value: 180, fill: "hsl(var(--foreground) / 0.8)" },
  { name: "Operations", value: 164, fill: "hsl(var(--foreground) / 0.6)" },
  { name: "Marketing", value: 145, fill: "hsl(var(--foreground) / 0.4)" },
  { name: "Design", value: 95, fill: "hsl(var(--foreground) / 0.3)" },
];

const recentHires = [
  { name: "Sarah Johnson", role: "Senior Developer", dept: "Engineering", date: "2d ago" },
  { name: "Michael Chen", role: "Product Manager", dept: "Product", date: "3d ago" },
  { name: "Emily Davis", role: "UX Designer", dept: "Design", date: "5d ago" },
  { name: "James Wilson", role: "Sales Executive", dept: "Sales", date: "1w ago" },
];

const upcomingInterviews = [
  { name: "Alex Thompson", role: "Frontend Developer", time: "Today, 10:00 AM", status: "confirmed" },
  { name: "Maria Garcia", role: "Marketing Manager", time: "Today, 2:30 PM", status: "pending" },
  { name: "David Kim", role: "Data Analyst", time: "Tomorrow, 11:00 AM", status: "confirmed" },
];

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <PageContainer>
        <div className="space-y-8">
          {/* Hero Section with Featured Stat */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Main welcome card */}
            <div className="lg:col-span-8 animate-fade-in">
              <Card className="relative overflow-hidden border-0 bg-foreground text-background">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm uppercase tracking-widest opacity-60">
                          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </p>
                        <h1 className="mt-2 font-semibold text-4xl font-medium tracking-tight">
                          Good morning, Admin
                        </h1>
                      </div>
                      <p className="max-w-md text-base opacity-70">
                        Your workforce is growing steadily. You have{" "}
                        <span className="font-semibold text-accent-foreground">3 interviews</span> scheduled today
                        and <span className="font-semibold text-accent-foreground">5 pending applications</span> to review.
                      </p>
                      <Button variant="outline" className="mt-2 border-background/20 bg-transparent text-background hover:bg-background/10 hover:border-background/30">
                        View Today&apos;s Tasks
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <div className="hidden md:block">
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-accent">
                        <Users className="h-12 w-12 text-accent-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                {/* Decorative element */}
                <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-accent/20" />
              </Card>
            </div>

            {/* Quick stats sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <div className="animate-fade-in stagger-1">
                <Card className="border-accent/20 bg-accent/5">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Employees</p>
                        <p className="mt-1 font-semibold text-3xl font-medium text-accent">1,284</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-accent">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">+12.5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="animate-fade-in stagger-2">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">New This Month</p>
                        <p className="mt-1 font-semibold text-3xl font-medium">45</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>+8.2%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.slice(2).map((stat, index) => (
              <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${(index + 3) * 50}ms` }}>
                <Card className="hover-lift">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.title}</p>
                        <p className="mt-2 font-semibold text-2xl font-medium">{stat.value}</p>
                        <div className="mt-2 flex items-center gap-1.5 text-sm">
                          {stat.trend === "up" ? (
                            <TrendingUp className="h-3.5 w-3.5 text-accent" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className={stat.trend === "up" ? "text-accent" : "text-muted-foreground"}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                        <stat.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 animate-fade-in stagger-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Analytics</p>
                    <CardTitle className="mt-1 font-semibold text-xl">Employee Growth</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    View Report
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={employeeGrowth}>
                        <defs>
                          <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={45}
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: 13,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          fill="url(#fillGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="animate-fade-in stagger-5">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Distribution</p>
                  <CardTitle className="mt-1 font-semibold text-xl">By Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentData} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <XAxis
                          type="number"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={85}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: 13,
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lists */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="animate-fade-in stagger-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Team</p>
                    <CardTitle className="mt-1 font-semibold text-xl">Recent Hires</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    View All
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-1">
                  {recentHires.map((hire, i) => (
                    <div
                      key={i}
                      className="group flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/50"
                    >
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-secondary font-semibold text-sm">
                          {hire.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hire.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {hire.role} <span className="opacity-50">·</span> {hire.dept}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        {hire.date}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="animate-fade-in stagger-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Schedule</p>
                    <CardTitle className="mt-1 font-semibold text-xl">Upcoming Interviews</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Calendar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-1">
                  {upcomingInterviews.map((interview, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-2 w-2 rounded-full ${interview.status === "confirmed" ? "bg-accent" : "bg-muted-foreground/40"}`} />
                        <div>
                          <p className="font-medium">{interview.name}</p>
                          <p className="text-sm text-muted-foreground">{interview.role}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">{interview.time}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
