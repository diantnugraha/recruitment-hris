"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  Building,
  Download,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { employeeBudgetService } from "@/services/employee-budget.service";
import { departmentService } from "@/services/department.service";
import { employeeService } from "@/services/employee.service";
import { EmployeeBudget, Department, EmployeeWithRelations } from "@/types";

// --- Constants ---
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + 1 - i);

// --- Helper Functions ---
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Department budget summary interface
interface DepartmentBudgetSummary {
  department: Department;
  previousYear: {
    technical: number;
    admin: number;
    total: number;
  };
  currentYear: {
    technical: number;
    admin: number;
    total: number;
  };
  employees: {
    technical: { male: number; female: number; total: number };
    admin: { male: number; female: number; total: number };
    total: number;
  };
  restBudget: {
    technical: number;
    admin: number;
    total: number;
  };
  growth: {
    technical: number;
    admin: number;
    total: number;
  };
}

export default function BudgetSummaryPage() {
  // State
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [budgets, setBudgets] = React.useState<EmployeeBudget[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedYear, setSelectedYear] = React.useState(CURRENT_YEAR);

  // Fetch all data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [deptsRes, budgetsRes, employeesRes] = await Promise.all([
      departmentService.fetchAll(),
      employeeBudgetService.fetchAll(),
      employeeService.getAll(1, 100), // Fetch first page, will paginate if needed
    ]);

    if (deptsRes.success && deptsRes.data) {
      setDepartments(deptsRes.data);
    } else {
      setError("Failed to fetch departments");
    }

    if (budgetsRes.success && budgetsRes.data) {
      setBudgets(budgetsRes.data);
    }

    if (employeesRes.success && employeesRes.data) {
      // If there are more pages, fetch them all
      const allEmployees = [...employeesRes.data.data];
      const totalPages = employeesRes.data.pagination.totalPages;

      if (totalPages > 1) {
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const remainingResponses = await Promise.all(
          remainingPages.map((page) => employeeService.getAll(page, 100))
        );

        for (const res of remainingResponses) {
          if (res.success && res.data) {
            allEmployees.push(...res.data.data);
          }
        }
      }

      setEmployees(allEmployees);
    }

    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate summary for each department
  const summaryData = React.useMemo((): DepartmentBudgetSummary[] => {
    return departments.map((dept) => {
      // Get budgets for this department
      const deptBudgets = budgets.filter((b) => b.departmentId === dept.id);
      const currentYearBudget = deptBudgets.find((b) => b.year === selectedYear);
      const previousYearBudget = deptBudgets.find((b) => b.year === selectedYear - 1);

      // Get employees for this department
      const deptEmployees = employees.filter((e) => e.departmentId === dept.id);

      // Calculate employee stats by type and gender
      const technicalMale = deptEmployees.filter(
        (e) => e.jobTitle?.type === "Technical" && e.gender === "male"
      ).length;
      const technicalFemale = deptEmployees.filter(
        (e) => e.jobTitle?.type === "Technical" && e.gender === "female"
      ).length;
      const adminMale = deptEmployees.filter(
        (e) => e.jobTitle?.type === "Administration" && e.gender === "male"
      ).length;
      const adminFemale = deptEmployees.filter(
        (e) => e.jobTitle?.type === "Administration" && e.gender === "female"
      ).length;

      const employeeStats = {
        technical: {
          male: technicalMale,
          female: technicalFemale,
          total: technicalMale + technicalFemale,
        },
        admin: {
          male: adminMale,
          female: adminFemale,
          total: adminMale + adminFemale,
        },
        total: deptEmployees.length,
      };

      // Current year budget
      const currentYear = {
        technical: currentYearBudget?.technical || 0,
        admin: currentYearBudget?.admin || 0,
        total: (currentYearBudget?.technical || 0) + (currentYearBudget?.admin || 0),
      };

      // Previous year budget
      const previousYear = {
        technical: previousYearBudget?.technical || 0,
        admin: previousYearBudget?.admin || 0,
        total: (previousYearBudget?.technical || 0) + (previousYearBudget?.admin || 0),
      };

      // Rest budget (budget - current employees)
      const restBudget = {
        technical: currentYear.technical - employeeStats.technical.total,
        admin: currentYear.admin - employeeStats.admin.total,
        total: currentYear.total - employeeStats.total,
      };

      // Growth percentage
      const growth = {
        technical: calculateGrowth(currentYear.technical, previousYear.technical),
        admin: calculateGrowth(currentYear.admin, previousYear.admin),
        total: calculateGrowth(currentYear.total, previousYear.total),
      };

      return {
        department: dept,
        previousYear,
        currentYear,
        employees: employeeStats,
        restBudget,
        growth,
      };
    });
  }, [departments, budgets, employees, selectedYear]);

  // Filter departments with budgets
  const departmentsWithBudgets = summaryData.filter(
    (s) => s.currentYear.total > 0 || s.previousYear.total > 0
  );

  // Calculate totals
  const totals = React.useMemo(() => {
    return summaryData.reduce(
      (acc, curr) => ({
        previousYear: {
          technical: acc.previousYear.technical + curr.previousYear.technical,
          admin: acc.previousYear.admin + curr.previousYear.admin,
          total: acc.previousYear.total + curr.previousYear.total,
        },
        currentYear: {
          technical: acc.currentYear.technical + curr.currentYear.technical,
          admin: acc.currentYear.admin + curr.currentYear.admin,
          total: acc.currentYear.total + curr.currentYear.total,
        },
        employees: {
          technical: {
            male: acc.employees.technical.male + curr.employees.technical.male,
            female: acc.employees.technical.female + curr.employees.technical.female,
            total: acc.employees.technical.total + curr.employees.technical.total,
          },
          admin: {
            male: acc.employees.admin.male + curr.employees.admin.male,
            female: acc.employees.admin.female + curr.employees.admin.female,
            total: acc.employees.admin.total + curr.employees.admin.total,
          },
          total: acc.employees.total + curr.employees.total,
        },
        restBudget: {
          technical: acc.restBudget.technical + curr.restBudget.technical,
          admin: acc.restBudget.admin + curr.restBudget.admin,
          total: acc.restBudget.total + curr.restBudget.total,
        },
      }),
      {
        previousYear: { technical: 0, admin: 0, total: 0 },
        currentYear: { technical: 0, admin: 0, total: 0 },
        employees: {
          technical: { male: 0, female: 0, total: 0 },
          admin: { male: 0, female: 0, total: 0 },
          total: 0,
        },
        restBudget: { technical: 0, admin: 0, total: 0 },
      }
    );
  }, [summaryData]);

  if (isLoading) {
    return (
      <>
        <Header title="Budget Summary" />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Budget Summary" />
      <PageContainer>
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/employee-budget">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Budget List
              </Link>
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Year:</Label>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-5">
            <Card className="border-accent/20 bg-accent/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Departments
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-accent">
                      {departmentsWithBudgets.length}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">With budget</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                    <Building className="h-5 w-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total Budget
                    </p>
                    <p className="mt-1 text-3xl font-semibold">
                      {totals.currentYear.total}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedYear}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total Employees
                    </p>
                    <p className="mt-1 text-3xl font-semibold">{totals.employees.total}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Current</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Rest Budget
                    </p>
                    <p
                      className={`mt-1 text-3xl font-semibold ${
                        totals.restBudget.total >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {totals.restBudget.total >= 0 ? "+" : ""}
                      {totals.restBudget.total}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Available</p>
                  </div>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      totals.restBudget.total >= 0 ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {totals.restBudget.total >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      YoY Growth
                    </p>
                    <p className="mt-1 text-3xl font-semibold">
                      {calculateGrowth(totals.currentYear.total, totals.previousYear.total) > 0
                        ? "+"
                        : ""}
                      {calculateGrowth(totals.currentYear.total, totals.previousYear.total)}%
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">vs {selectedYear - 1}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Department Budget Overview</CardTitle>
              <CardDescription>
                Budget allocation and employee count for {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2} className="align-middle">
                        Department
                      </TableHead>
                      <TableHead colSpan={3} className="text-center border-l">
                        {selectedYear - 1} Budget
                      </TableHead>
                      <TableHead colSpan={3} className="text-center border-l">
                        {selectedYear} Budget
                      </TableHead>
                      <TableHead colSpan={3} className="text-center border-l">
                        Current Employees
                      </TableHead>
                      <TableHead colSpan={3} className="text-center border-l">
                        Rest Budget
                      </TableHead>
                      <TableHead colSpan={3} className="text-center border-l">
                        Growth %
                      </TableHead>
                    </TableRow>
                    <TableRow>
                      {/* Previous Year */}
                      <TableHead className="text-center border-l text-xs">Tech</TableHead>
                      <TableHead className="text-center text-xs">Admin</TableHead>
                      <TableHead className="text-center text-xs">Total</TableHead>
                      {/* Current Year */}
                      <TableHead className="text-center border-l text-xs">Tech</TableHead>
                      <TableHead className="text-center text-xs">Admin</TableHead>
                      <TableHead className="text-center text-xs">Total</TableHead>
                      {/* Employees */}
                      <TableHead className="text-center border-l text-xs">Tech</TableHead>
                      <TableHead className="text-center text-xs">Admin</TableHead>
                      <TableHead className="text-center text-xs">Total</TableHead>
                      {/* Rest */}
                      <TableHead className="text-center border-l text-xs">Tech</TableHead>
                      <TableHead className="text-center text-xs">Admin</TableHead>
                      <TableHead className="text-center text-xs">Total</TableHead>
                      {/* Growth */}
                      <TableHead className="text-center border-l text-xs">Tech</TableHead>
                      <TableHead className="text-center text-xs">Admin</TableHead>
                      <TableHead className="text-center text-xs">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentsWithBudgets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={16} className="text-center py-8 text-muted-foreground">
                          No budget data found for {selectedYear}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {departmentsWithBudgets.map((summary) => (
                          <TableRow key={summary.department.id}>
                            <TableCell>
                              <Link
                                href={`/employee-budget/${summary.department.id}`}
                                className="font-medium text-accent hover:underline"
                              >
                                {summary.department.name}
                              </Link>
                            </TableCell>
                            {/* Previous Year */}
                            <TableCell className="text-center border-l">
                              {summary.previousYear.technical}
                            </TableCell>
                            <TableCell className="text-center">
                              {summary.previousYear.admin}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {summary.previousYear.total}
                            </TableCell>
                            {/* Current Year */}
                            <TableCell className="text-center border-l">
                              {summary.currentYear.technical}
                            </TableCell>
                            <TableCell className="text-center">
                              {summary.currentYear.admin}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {summary.currentYear.total}
                            </TableCell>
                            {/* Employees */}
                            <TableCell className="text-center border-l">
                              {summary.employees.technical.total}
                            </TableCell>
                            <TableCell className="text-center">
                              {summary.employees.admin.total}
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {summary.employees.total}
                            </TableCell>
                            {/* Rest */}
                            <TableCell
                              className={`text-center border-l ${
                                summary.restBudget.technical >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {summary.restBudget.technical >= 0 ? "+" : ""}
                              {summary.restBudget.technical}
                            </TableCell>
                            <TableCell
                              className={`text-center ${
                                summary.restBudget.admin >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {summary.restBudget.admin >= 0 ? "+" : ""}
                              {summary.restBudget.admin}
                            </TableCell>
                            <TableCell
                              className={`text-center font-medium ${
                                summary.restBudget.total >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {summary.restBudget.total >= 0 ? "+" : ""}
                              {summary.restBudget.total}
                            </TableCell>
                            {/* Growth */}
                            <TableCell className="text-center border-l">
                              {summary.growth.technical !== 0 && (
                                <Badge
                                  variant={summary.growth.technical > 0 ? "success" : "destructive"}
                                  className="text-xs"
                                >
                                  {summary.growth.technical > 0 ? "+" : ""}
                                  {summary.growth.technical}%
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {summary.growth.admin !== 0 && (
                                <Badge
                                  variant={summary.growth.admin > 0 ? "success" : "destructive"}
                                  className="text-xs"
                                >
                                  {summary.growth.admin > 0 ? "+" : ""}
                                  {summary.growth.admin}%
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {summary.growth.total !== 0 && (
                                <Badge
                                  variant={summary.growth.total > 0 ? "success" : "destructive"}
                                  className="text-xs"
                                >
                                  {summary.growth.total > 0 ? "+" : ""}
                                  {summary.growth.total}%
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Totals Row */}
                        <TableRow className="bg-muted/50 font-semibold">
                          <TableCell>Total</TableCell>
                          {/* Previous Year */}
                          <TableCell className="text-center border-l">
                            {totals.previousYear.technical}
                          </TableCell>
                          <TableCell className="text-center">
                            {totals.previousYear.admin}
                          </TableCell>
                          <TableCell className="text-center">
                            {totals.previousYear.total}
                          </TableCell>
                          {/* Current Year */}
                          <TableCell className="text-center border-l">
                            {totals.currentYear.technical}
                          </TableCell>
                          <TableCell className="text-center">
                            {totals.currentYear.admin}
                          </TableCell>
                          <TableCell className="text-center">
                            {totals.currentYear.total}
                          </TableCell>
                          {/* Employees */}
                          <TableCell className="text-center border-l">
                            {totals.employees.technical.total}
                          </TableCell>
                          <TableCell className="text-center">
                            {totals.employees.admin.total}
                          </TableCell>
                          <TableCell className="text-center">
                            {totals.employees.total}
                          </TableCell>
                          {/* Rest */}
                          <TableCell
                            className={`text-center border-l ${
                              totals.restBudget.technical >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {totals.restBudget.technical >= 0 ? "+" : ""}
                            {totals.restBudget.technical}
                          </TableCell>
                          <TableCell
                            className={`text-center ${
                              totals.restBudget.admin >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {totals.restBudget.admin >= 0 ? "+" : ""}
                            {totals.restBudget.admin}
                          </TableCell>
                          <TableCell
                            className={`text-center ${
                              totals.restBudget.total >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {totals.restBudget.total >= 0 ? "+" : ""}
                            {totals.restBudget.total}
                          </TableCell>
                          {/* Growth */}
                          <TableCell className="text-center border-l">
                            <Badge
                              variant={
                                calculateGrowth(
                                  totals.currentYear.technical,
                                  totals.previousYear.technical
                                ) >= 0
                                  ? "success"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {calculateGrowth(
                                totals.currentYear.technical,
                                totals.previousYear.technical
                              ) > 0
                                ? "+"
                                : ""}
                              {calculateGrowth(
                                totals.currentYear.technical,
                                totals.previousYear.technical
                              )}
                              %
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                calculateGrowth(
                                  totals.currentYear.admin,
                                  totals.previousYear.admin
                                ) >= 0
                                  ? "success"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {calculateGrowth(
                                totals.currentYear.admin,
                                totals.previousYear.admin
                              ) > 0
                                ? "+"
                                : ""}
                              {calculateGrowth(
                                totals.currentYear.admin,
                                totals.previousYear.admin
                              )}
                              %
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={
                                calculateGrowth(
                                  totals.currentYear.total,
                                  totals.previousYear.total
                                ) >= 0
                                  ? "success"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {calculateGrowth(
                                totals.currentYear.total,
                                totals.previousYear.total
                              ) > 0
                                ? "+"
                                : ""}
                              {calculateGrowth(
                                totals.currentYear.total,
                                totals.previousYear.total
                              )}
                              %
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </>
  );
}
