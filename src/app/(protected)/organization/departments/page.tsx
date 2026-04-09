"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TuvBadge } from "@/components/shared/tuv-badge";
import { useOrganizationStore } from "@/stores/organization-store";
import { departmentService } from "@/services/department.service";
import type { CreateDepartmentRequest } from "@/services/department.service";
import { divisionService } from "@/services/division.service";
import { obsService } from "@/services/obs.service";
import { showToast } from "@/lib/utils/toast-messages";
import { useIsHr } from "@/hooks/useIsHr";
import type { Organization, Division } from "@/types";

const DEPARTMENT_CATEGORIES = ["Profit Center", "Non Profit Center"] as const;

const formatCategory = (category: string) => category.replace(/_/g, " ");

interface FormData {
  name: string;
  code: string;
  category: "Profit Center" | "Non Profit Center" | "";
  description: string;
  obsId: string;
  divisionId: string;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  category: "",
  description: "",
  obsId: "",
  divisionId: "",
};

export default function DepartmentsPage() {
  const router = useRouter();
  const isHr = useIsHr();
  const {
    departments,
    setDepartments,
    addDepartment,
    isLoading,
    setLoading,
  } = useOrganizationStore();

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalItems, setTotalItems] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [divisions, setDivisions] = React.useState<Division[]>([]);
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);

  React.useEffect(() => {
    fetchDepartments(currentPage, pageSize);
  }, [currentPage, pageSize]);

  React.useEffect(() => {
    fetchDivisions();
    fetchOrganizations();
  }, []);

  const fetchDepartments = async (page: number, limit: number) => {
    setLoading(true);
    const response = await departmentService.getAll(page, limit);
    if (response.success && response.data) {
      const deptData = response.data.data || [];
      setDepartments(deptData);
      setTotalItems(response.data.pagination?.total || deptData.length);
    } else {
      showToast.fetchError("departments", response.message);
      setDepartments([]);
    }
    setLoading(false);
  };

  const fetchDivisions = async () => {
    const response = await divisionService.fetchAll();
    if (response.success && response.data) {
      setDivisions(response.data);
    }
  };

  const fetchOrganizations = async () => {
    const response = await obsService.fetchAll();
    if (response.success && response.data) {
      setOrganizations(response.data);
    }
  };

  const filteredData = React.useMemo(() => {
    const deptArray = Array.isArray(departments) ? departments : [];
    if (!searchQuery) return deptArray;
    const query = searchQuery.toLowerCase();
    return deptArray.filter(
      (dept) =>
        dept.name.toLowerCase().includes(query) ||
        (dept.code && dept.code.toLowerCase().includes(query)) ||
        (dept.category && formatCategory(dept.category).toLowerCase().includes(query)) ||
        (dept.division && dept.division.name.toLowerCase().includes(query))
    );
  }, [searchQuery, departments]);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handleAddClick = () => {
    setFormData(initialFormData);
    setIsAddDialogOpen(true);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    const data: CreateDepartmentRequest = {
      name: formData.name,
      code: formData.code,
      category: formData.category as "Profit Center" | "Non Profit Center",
      description: formData.description || undefined,
      obsId: formData.obsId,
      divisionId: formData.divisionId || undefined,
    };
    const response = await departmentService.create(data);
    if (response.success && response.data) {
      addDepartment(response.data);
      setIsAddDialogOpen(false);
      setFormData(initialFormData);
      setTotalItems((prev) => prev + 1);
      showToast.created("Department");
    } else {
      showToast.createError("department", response.message);
    }
    setIsSubmitting(false);
  };

  const getCategoryBadgeVariant = (category: string): "success" | "dark" => {
    return formatCategory(category) === "Profit Center" ? "success" : "dark";
  };


  return (
    <>
      <Header />
      <PageContainer>
        {/* 1. Page Title Row — title + count + action button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--hsd-ui-color-gray-900)",
                  margin: 0,
                }}
              >
                Departments
              </h1>
              <span
                style={{
                  backgroundColor: "var(--hsd-ui-color-blue-50)",
                  color: "var(--hsd-ui-color-blue-600)",
                  padding: "2px 10px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  border: "1px solid var(--hsd-ui-color-blue-200)",
                }}
              >
                {totalItems}
              </span>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 300,
                color: "var(--hsd-ui-color-gray-500)",
                margin: "4px 0 0",
              }}
            >
              Manage departments, categories, and their division assignments.
            </p>
          </div>
          {isHr && (
            <Button
              onClick={handleAddClick}
              style={{
                backgroundColor: "var(--hsd-ui-background-color-primary)",
                borderColor: "var(--hsd-ui-border-color-primary)",
                color: "var(--hsd-ui-text-color-primary)",
                borderRadius: "4px",
                height: "38px",
                padding: "0 16px",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Create Department
            </Button>
          )}
        </div>

        {/* 2. Outer wrapper — white bg, rounded */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid rgba(120, 134, 127, 0.2)",
          }}
        >
          {/* Search — right aligned */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "16px",
            }}
          >
            <div className="relative" style={{ width: "280px" }}>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-400)" }}
              />
              <Input
                placeholder="Search departments"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
                style={{
                  borderColor: "rgba(120, 134, 127, 0.2)",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>

          {/* Inner white card — table + pagination */}
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px solid rgba(120, 134, 127, 0.2)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
          {/* Table */}
          <div>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "48px 0" }}>
              <Loader2
                className="animate-spin"
                style={{ width: "24px", height: "24px", color: "var(--hsd-ui-color-navy-500)" }}
              />
            </div>
          ) : filteredData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "var(--hsd-ui-color-gray-500)",
                fontSize: "0.875rem",
              }}
            >
              No departments found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow
                  onMouseOver={undefined}
                  onMouseOut={undefined}
                  style={{ backgroundColor: "transparent", borderBottom: "1px solid rgba(120, 134, 127, 0.2)" }}
                >
                  <TableHead style={{ width: "15%" }}>Code</TableHead>
                  <TableHead style={{ width: "30%" }}>Department</TableHead>
                  <TableHead style={{ width: "25%" }}>Category</TableHead>
                  <TableHead style={{ width: "30%" }}>Division</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      <TuvBadge
                        text={dept.code || "-"}
                        variant="info"
                        size="sm"
                        border
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="hover:underline text-left"
                        style={{
                          color: "var(--hsd-ui-color-navy-500)",
                          fontWeight: 500,
                          fontSize: "0.875rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onClick={() => router.push(`/organization/departments/${dept.id}`)}
                      >
                        {dept.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <TuvBadge
                        text={formatCategory(dept.category)}
                        variant={getCategoryBadgeVariant(dept.category)}
                        size="sm"
                        border
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 400,
                          color: "var(--hsd-ui-color-gray-700)",
                        }}
                      >
                        {dept.division?.name || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderTop: "1px solid rgba(120, 134, 127, 0.2)",
              borderRadius: "0 0 8px 8px",
            }}
          >
            {/* Left: "X - Y of Z" | divider | "N Per row" */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "var(--hsd-ui-color-gray-400)",
                }}
              >
                {startItem} - {endItem} of {totalItems}
              </span>
              <div style={{ width: "1px", height: "32px", backgroundColor: "rgba(120, 134, 127, 0.15)" }} />
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  style={{
                    width: "auto",
                    minWidth: "145px",
                    height: "38px",
                    border: "1px solid rgba(120, 134, 127, 0.2)",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    color: "var(--hsd-ui-color-gray-700)",
                    padding: "0 12px",
                    gap: "8px",
                    backgroundColor: "#fff",
                  }}
                >
                  <SelectValue placeholder="10 Per row" />
                </SelectTrigger>
                <SelectContent
                  side="top"
                  style={{
                    minWidth: "140px",
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                  }}
                >
                  {[5, 10, 20, 50, 100].map((size) => (
                    <SelectItem
                      key={size}
                      value={String(size)}
                      style={{ fontSize: "0.875rem", padding: "8px 12px" }}
                    >
                      {size} Per row
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right: page numbers */}
            <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
              {(() => {
                // Build page items with dots like TUV Pagination
                const buildPageItems = (): (number | "dots")[] => {
                  if (totalPages <= 7) {
                    return Array.from({ length: totalPages }, (_, i) => i + 1);
                  }
                  const middle = Array.from(
                    { length: Math.min(3, totalPages - 2) },
                    (_, i) => Math.max(2, currentPage - 1) + i
                  ).filter((n) => n >= 2 && n <= totalPages - 1);

                  return [
                    1,
                    ...(middle[0] > 2 ? ["dots" as const] : []),
                    ...middle,
                    ...(middle[middle.length - 1] < totalPages - 1 ? ["dots" as const] : []),
                    totalPages,
                  ];
                };
                const items = buildPageItems();

                const pageBtn = (num: number | "dots", idx: number) => {
                  if (num === "dots") {
                    return (
                      <span
                        key={`dots-${idx}`}
                        style={{
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.875rem",
                          color: "var(--hsd-ui-color-gray-700)",
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  const isActive = currentPage === num;
                  return (
                    <button
                      key={num}
                      onClick={() => setCurrentPage(num)}
                      style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: isActive ? 500 : 400,
                        backgroundColor: isActive ? "var(--hsd-ui-color-navy-500)" : "transparent",
                        color: isActive ? "#fff" : "var(--hsd-ui-color-gray-900)",
                      }}
                    >
                      {num}
                    </button>
                  );
                };

                return (
                  <>
                    <button
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "none",
                        cursor: currentPage === 1 ? "default" : "pointer",
                        color: currentPage === 1 ? "var(--hsd-ui-color-gray-300)" : "var(--hsd-ui-color-gray-700)",
                        fontSize: "1.25rem",
                      }}
                    >
                      &#8249;
                    </button>
                    {items.map((item, idx) => pageBtn(item, idx))}
                    <button
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        background: "none",
                        cursor: currentPage === totalPages ? "default" : "pointer",
                        color: currentPage === totalPages ? "var(--hsd-ui-color-gray-300)" : "var(--hsd-ui-color-gray-700)",
                        fontSize: "1.25rem",
                      }}
                    >
                      &#8250;
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
          )}
          </div>
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Department</DialogTitle>
              <DialogDescription>Create a new department.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" placeholder="Enter department name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code">Code *</Label>
                <Input id="code" placeholder="Enter department code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as "Profit Center" | "Non Profit Center" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="obsId">Organization *</Label>
                <Select
                  value={formData.obsId}
                  onValueChange={(value) => setFormData({ ...formData, obsId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="divisionId">Division</Label>
                <Select
                  value={formData.divisionId}
                  onValueChange={(value) => setFormData({ ...formData, divisionId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((div) => (
                      <SelectItem key={div.id} value={div.id}>
                        {div.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting} style={{ borderRadius: "4px", height: "38px", padding: "0 16px", fontSize: "0.875rem", fontWeight: 500, borderColor: "rgba(120,134,127,0.2)" }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isSubmitting || !formData.name || !formData.code || !formData.category || !formData.obsId} style={{ backgroundColor: "var(--hsd-ui-background-color-primary)", borderColor: "var(--hsd-ui-border-color-primary)", color: "var(--hsd-ui-text-color-primary)", borderRadius: "4px", height: "38px", padding: "0 16px", fontSize: "0.875rem", fontWeight: 500 }}>
                {isSubmitting ? (<><Loader2 className="animate-spin" />Creating...</>) : "Create Department"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </PageContainer>
    </>
  );
}
