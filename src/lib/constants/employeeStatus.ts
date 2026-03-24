import { EmployeeStatus } from "@/types";

export const EMPLOYEE_STATUSES: { value: EmployeeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "permanent", label: "Permanent" },
  { value: "contract", label: "Contract" },
  { value: "probation", label: "Probation" },
  { value: "outsource", label: "Outsource" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
  { value: "exit", label: "Exit" },
];

export const EMPLOYEE_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "success" }
> = {
  active: { label: "Active", variant: "success" },
  permanent: { label: "Permanent", variant: "success" },
  contract: { label: "Contract", variant: "default" },
  probation: { label: "Probation", variant: "secondary" },
  outsource: { label: "Outsource", variant: "secondary" },
  on_leave: { label: "On Leave", variant: "secondary" },
  inactive: { label: "Inactive", variant: "outline" },
  terminated: { label: "Terminated", variant: "outline" },
  exit: { label: "Exit", variant: "outline" },
};

export function getEmployeeStatusConfig(status: string) {
  return (
    EMPLOYEE_STATUS_CONFIG[status] ?? {
      label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      variant: "secondary" as const,
    }
  );
}

export const ACTIVE_STATUSES = new Set<string>([
  "active",
  "permanent",
  "contract",
  "probation",
  "outsource",
]);
