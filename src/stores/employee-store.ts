import { create } from "zustand";
import { Employee, EmployeeWithRelations, FilterState } from "@/types";

interface EmployeeState {
  employees: EmployeeWithRelations[];
  selectedEmployee: EmployeeWithRelations | null;
  isLoading: boolean;
  error: string | null;
  filters: FilterState;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  setEmployees: (employees: EmployeeWithRelations[]) => void;
  addEmployee: (employee: EmployeeWithRelations) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  setSelectedEmployee: (employee: EmployeeWithRelations | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setPagination: (pagination: Partial<EmployeeState["pagination"]>) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  search: "",
  status: undefined,
  department: undefined,
  division: undefined,
};

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  selectedEmployee: null,
  isLoading: false,
  error: null,
  filters: initialFilters,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  setEmployees: (employees) => set({ employees }),
  addEmployee: (employee) =>
    set((state) => ({ employees: [...state.employees, employee] })),
  updateEmployee: (id, updatedData) =>
    set((state) => ({
      employees: state.employees.map((emp) =>
        emp.id === id ? { ...emp, ...updatedData } : emp
      ),
    })),
  deleteEmployee: (id) =>
    set((state) => ({
      employees: state.employees.filter((emp) => emp.id !== id),
    })),
  setSelectedEmployee: (employee) => set({ selectedEmployee: employee }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setPagination: (pagination) =>
    set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
  resetFilters: () => set({ filters: initialFilters }),
}));
