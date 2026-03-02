"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  UserCheck,
  Briefcase,
  CalendarDays,
  Pencil,
  Plus,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { employeeBudgetService } from "@/services/employee-budget.service";
import { departmentService } from "@/services/department.service";
import { employeeService } from "@/services/employee.service";
import { EmployeeBudget, Department, EmployeeWithRelations } from "@/types";
import { showToast } from "@/lib/utils/toast-messages";

// --- Constants ---
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + 1 - i);

// --- Helper Functions ---
function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// --- Budget Form Dialog ---
interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: EmployeeBudget | null;
  departmentId: string;
  onSuccess: () => void;
}

function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
  departmentId,
  onSuccess,
}: BudgetFormDialogProps) {
  const isEdit = !!budget;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    year: CURRENT_YEAR + 1,
    technical: 0,
    admin: 0,
  });

  React.useEffect(() => {
    if (open) {
      if (budget) {
        setFormData({
          year: budget.year,
          technical: budget.technical,
          admin: budget.admin,
        });
      } else {
        setFormData({
          year: CURRENT_YEAR + 1,
          technical: 0,
          admin: 0,
        });
      }
    }
  }, [open, budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      department_id: Number(departmentId),
      year: formData.year,
      technical: formData.technical,
      admin: formData.admin,
    };

    const response = isEdit
      ? await employeeBudgetService.update(budget.id, payload)
      : await employeeBudgetService.create(payload);

    if (response.success) {
      showToast.success(isEdit ? "Budget updated successfully" : "Budget created successfully");
      onOpenChange(false);
      onSuccess();
    } else {
      showToast.error(response.message || "Failed to save budget");
    }

    setIsSubmitting(false);
  };

  const totalBudget = formData.technical + formData.admin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Budget" : "Add Budget"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the budget allocation for this year."
              : "Set the budget allocation for a new year."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="year">Budget Year *</Label>
            <Select
              value={String(formData.year)}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, year: Number(value) }))
              }
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="technical">Technical Staff</Label>
              <Input
                id="technical"
                type="number"
                min="0"
                value={formData.technical}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    technical: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin">Admin Staff</Label>
              <Input
                id="admin"
                type="number"
                min="0"
                value={formData.admin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    admin: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
            </div>
          </div>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Budget</span>
                <span className="text-2xl font-bold text-accent">{totalBudget}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Page ---
export default function EmployeeBudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.departmentId as string;

  // State
  const [department, setDepartment] = React.useState<Department | null>(null);
  const [budgets, setBudgets] = React.useState<EmployeeBudget[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeWithRelations[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Dialog state
  const [isFormDialogOpen, setIsFormDialogOpen] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<EmployeeBudget | null>(null);

  // Fetch data
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [deptRes, budgetsRes, employeesRes] = await Promise.all([
      departmentService.getById(departmentId),
      employeeBudgetService.fetchAll(),
      employeeService.getByDepartmentId(departmentId),
    ]);

    if (deptRes.success && deptRes.data) {
      setDepartment(deptRes.data);
    } else {
      setError("Department not found");
      setIsLoading(false);
      return;
    }

    if (budgetsRes.success && budgetsRes.data) {
      // Filter budgets for this department
      const deptBudgets = budgetsRes.data.filter((b) => b.departmentId === departmentId);
      setBudgets(deptBudgets);
    }

    if (employeesRes.success && employeesRes.data) {
      setEmployees(employeesRes.data);
    }

    setIsLoading(false);
  }, [departmentId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate current employee stats
  const employeeStats = React.useMemo(() => {
    const technicalMale = employees.filter(
      (e) => e.jobTitle?.type === "Technical" && e.gender === "male"
    ).length;
    const technicalFemale = employees.filter(
      (e) => e.jobTitle?.type === "Technical" && e.gender === "female"
    ).length;
    const adminMale = employees.filter(
      (e) => e.jobTitle?.type === "Administration" && e.gender === "male"
    ).length;
    const adminFemale = employees.filter(
      (e) => e.jobTitle?.type === "Administration" && e.gender === "female"
    ).length;

    // Handle employees without job title type
    const unknownType = employees.filter((e) => !e.jobTitle?.type);

    return {
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
      unknown: unknownType.length,
      total: employees.length,
    };
  }, [employees]);

  // Get budget by year
  const getBudgetByYear = (year: number) => {
    return budgets.find((b) => b.year === year);
  };

  // Current year budget
  const currentYearBudget = getBudgetByYear(CURRENT_YEAR);
  const nextYearBudget = getBudgetByYear(CURRENT_YEAR + 1);

  // Calculate rest budget
  const restBudget = React.useMemo(() => {
    if (!currentYearBudget) return { technical: 0, admin: 0, total: 0 };
    return {
      technical: currentYearBudget.technical - employeeStats.technical.total,
      admin: currentYearBudget.admin - employeeStats.admin.total,
      total:
        currentYearBudget.technical +
        currentYearBudget.admin -
        employeeStats.total,
    };
  }, [currentYearBudget, employeeStats]);

  const handleAddClick = () => {
    setSelectedBudget(null);
    setIsFormDialogOpen(true);
  };

  const handleEditClick = (budget: EmployeeBudget) => {
    setSelectedBudget(budget);
    setIsFormDialogOpen(true);
  };

  if (isLoading) {
    return (
      <>
        <Header title="Employee Budget" />
        <PageContainer>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !department) {
    return (
      <>
        <Header title="Employee Budget" />
        <PageContainer>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">{error || "Department not found"}</p>
              <Button variant="outline" onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title={`Budget - ${department.name}`} />
      <PageContainer>
        <div className="space-y-6">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/employee-budget">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Budget List
              </Link>
            </Button>
            <Button size="sm" onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Year Budget
            </Button>
          </div>

          {/* Department Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Briefcase className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <CardTitle>{department.name}</CardTitle>
                  <CardDescription>
                    Code: {department.code} | Category: {department.category}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Current Employee Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Total Employees
                    </p>
                    <p className="mt-1 text-3xl font-semibold">{employeeStats.total}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Current headcount</p>
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
                      Technical Staff
                    </p>
                    <p className="mt-1 text-3xl font-semibold">{employeeStats.technical.total}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      M: {employeeStats.technical.male} | F: {employeeStats.technical.female}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Admin Staff
                    </p>
                    <p className="mt-1 text-3xl font-semibold">{employeeStats.admin.total}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      M: {employeeStats.admin.male} | F: {employeeStats.admin.female}
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={restBudget.total >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Rest Budget
                    </p>
                    <p className={`mt-1 text-3xl font-semibold ${restBudget.total >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {restBudget.total >= 0 ? "+" : ""}{restBudget.total}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Available positions ({CURRENT_YEAR})
                    </p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${restBudget.total >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                    {restBudget.total >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget by Year Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Budget History
              </CardTitle>
              <CardDescription>
                Year-by-year budget allocation and comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              {budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No budget records found for this department.</p>
                  <Button variant="outline" onClick={handleAddClick} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Budget
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead className="text-center">Technical</TableHead>
                      <TableHead className="text-center">Admin</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">vs Previous</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets
                      .sort((a, b) => b.year - a.year)
                      .map((budget, index) => {
                        const prevBudget = budgets.find((b) => b.year === budget.year - 1);
                        const prevTotal = prevBudget
                          ? prevBudget.technical + prevBudget.admin
                          : 0;
                        const currentTotal = budget.technical + budget.admin;
                        const growth = calculateGrowth(currentTotal, prevTotal);

                        return (
                          <TableRow key={budget.id}>
                            <TableCell>
                              <Badge
                                variant={budget.year === CURRENT_YEAR ? "default" : "outline"}
                                className="font-mono"
                              >
                                {budget.year}
                                {budget.year === CURRENT_YEAR && " (Current)"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {budget.technical}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {budget.admin}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-mono">
                                {currentTotal}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {prevBudget ? (
                                <Badge
                                  variant={
                                    growth > 0
                                      ? "success"
                                      : growth < 0
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="gap-1"
                                >
                                  {growth > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : growth < 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  {growth > 0 ? "+" : ""}
                                  {growth}%
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditClick(budget)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Current Year Budget vs Actual */}
          {currentYearBudget && (
            <Card>
              <CardHeader>
                <CardTitle>{CURRENT_YEAR} Budget vs Actual</CardTitle>
                <CardDescription>
                  Comparison between approved budget and current employee count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Budget</TableHead>
                      <TableHead className="text-center">Actual</TableHead>
                      <TableHead className="text-center">Remaining</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Technical</TableCell>
                      <TableCell className="text-center">{currentYearBudget.technical}</TableCell>
                      <TableCell className="text-center">{employeeStats.technical.total}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            restBudget.technical >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {restBudget.technical >= 0 ? "+" : ""}
                          {restBudget.technical}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            restBudget.technical >= 0 ? "success" : "destructive"
                          }
                        >
                          {restBudget.technical >= 0 ? "Under Budget" : "Over Budget"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Admin</TableCell>
                      <TableCell className="text-center">{currentYearBudget.admin}</TableCell>
                      <TableCell className="text-center">{employeeStats.admin.total}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            restBudget.admin >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {restBudget.admin >= 0 ? "+" : ""}
                          {restBudget.admin}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={restBudget.admin >= 0 ? "success" : "destructive"}
                        >
                          {restBudget.admin >= 0 ? "Under Budget" : "Over Budget"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-center">
                        {currentYearBudget.technical + currentYearBudget.admin}
                      </TableCell>
                      <TableCell className="text-center">{employeeStats.total}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            restBudget.total >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {restBudget.total >= 0 ? "+" : ""}
                          {restBudget.total}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={restBudget.total >= 0 ? "success" : "destructive"}
                        >
                          {restBudget.total >= 0 ? "Under Budget" : "Over Budget"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>

      {/* Form Dialog */}
      <BudgetFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        budget={selectedBudget}
        departmentId={departmentId}
        onSuccess={fetchData}
      />
    </>
  );
}
