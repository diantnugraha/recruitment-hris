import { create } from "zustand";
import { Organization, Division, Department, JobLevel, JobTitle } from "@/types";

interface OrganizationState {
  // Organizations (OBS)
  organizations: Organization[];
  selectedOrganization: Organization | null;

  // Divisions
  divisions: Division[];
  selectedDivision: Division | null;

  // Departments
  departments: Department[];
  selectedDepartment: Department | null;

  // Job Levels
  jobLevels: JobLevel[];
  selectedJobLevel: JobLevel | null;

  // Job Titles
  jobTitles: JobTitle[];
  selectedJobTitle: JobTitle | null;

  isLoading: boolean;
  error: string | null;

  // Organization actions
  setOrganizations: (orgs: Organization[]) => void;
  addOrganization: (org: Organization) => void;
  updateOrganization: (id: string, org: Partial<Organization>) => void;
  deleteOrganization: (id: string) => void;
  setSelectedOrganization: (org: Organization | null) => void;

  // Division actions
  setDivisions: (divisions: Division[]) => void;
  addDivision: (division: Division) => void;
  updateDivision: (id: string, division: Partial<Division>) => void;
  deleteDivision: (id: string) => void;
  setSelectedDivision: (division: Division | null) => void;

  // Department actions
  setDepartments: (departments: Department[]) => void;
  addDepartment: (department: Department) => void;
  updateDepartment: (id: string, department: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  setSelectedDepartment: (department: Department | null) => void;

  // Job Level actions
  setJobLevels: (levels: JobLevel[]) => void;
  addJobLevel: (level: JobLevel) => void;
  updateJobLevel: (id: string, level: Partial<JobLevel>) => void;
  deleteJobLevel: (id: string) => void;
  setSelectedJobLevel: (level: JobLevel | null) => void;

  // Job Title actions
  setJobTitles: (titles: JobTitle[]) => void;
  addJobTitle: (title: JobTitle) => void;
  updateJobTitle: (id: string, title: Partial<JobTitle>) => void;
  deleteJobTitle: (id: string) => void;
  setSelectedJobTitle: (title: JobTitle | null) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  selectedOrganization: null,
  divisions: [],
  selectedDivision: null,
  departments: [],
  selectedDepartment: null,
  jobLevels: [],
  selectedJobLevel: null,
  jobTitles: [],
  selectedJobTitle: null,
  isLoading: false,
  error: null,

  // Organization actions
  setOrganizations: (organizations) => set({ organizations }),
  addOrganization: (org) =>
    set((state) => ({ organizations: [...state.organizations, org] })),
  updateOrganization: (id, updated) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === id ? { ...org, ...updated } : org
      ),
    })),
  deleteOrganization: (id) =>
    set((state) => ({
      organizations: state.organizations.filter((org) => org.id !== id),
    })),
  setSelectedOrganization: (org) => set({ selectedOrganization: org }),

  // Division actions
  setDivisions: (divisions) => set({ divisions }),
  addDivision: (division) =>
    set((state) => ({ divisions: [...state.divisions, division] })),
  updateDivision: (id, updated) =>
    set((state) => ({
      divisions: state.divisions.map((div) =>
        div.id === id ? { ...div, ...updated } : div
      ),
    })),
  deleteDivision: (id) =>
    set((state) => ({
      divisions: state.divisions.filter((div) => div.id !== id),
    })),
  setSelectedDivision: (division) => set({ selectedDivision: division }),

  // Department actions
  setDepartments: (departments) => set({ departments }),
  addDepartment: (department) =>
    set((state) => ({ departments: [...state.departments, department] })),
  updateDepartment: (id, updated) =>
    set((state) => ({
      departments: state.departments.map((dept) =>
        dept.id === id ? { ...dept, ...updated } : dept
      ),
    })),
  deleteDepartment: (id) =>
    set((state) => ({
      departments: state.departments.filter((dept) => dept.id !== id),
    })),
  setSelectedDepartment: (department) => set({ selectedDepartment: department }),

  // Job Level actions
  setJobLevels: (jobLevels) => set({ jobLevels }),
  addJobLevel: (level) =>
    set((state) => ({ jobLevels: [...state.jobLevels, level] })),
  updateJobLevel: (id, updated) =>
    set((state) => ({
      jobLevels: state.jobLevels.map((lvl) =>
        lvl.id === id ? { ...lvl, ...updated } : lvl
      ),
    })),
  deleteJobLevel: (id) =>
    set((state) => ({
      jobLevels: state.jobLevels.filter((lvl) => lvl.id !== id),
    })),
  setSelectedJobLevel: (level) => set({ selectedJobLevel: level }),

  // Job Title actions
  setJobTitles: (jobTitles) => set({ jobTitles }),
  addJobTitle: (title) =>
    set((state) => ({ jobTitles: [...state.jobTitles, title] })),
  updateJobTitle: (id, updated) =>
    set((state) => ({
      jobTitles: state.jobTitles.map((ttl) =>
        ttl.id === id ? { ...ttl, ...updated } : ttl
      ),
    })),
  deleteJobTitle: (id) =>
    set((state) => ({
      jobTitles: state.jobTitles.filter((ttl) => ttl.id !== id),
    })),
  setSelectedJobTitle: (title) => set({ selectedJobTitle: title }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
