import { create } from "zustand";
import {
  JobPosting,
  Candidate,
  Application,
  ApplicationWithRelations,
  FilterState,
} from "@/types";

interface RecruitmentState {
  // Job Postings
  jobPostings: JobPosting[];
  selectedJobPosting: JobPosting | null;

  // Candidates
  candidates: Candidate[];
  selectedCandidate: Candidate | null;

  // Applications
  applications: ApplicationWithRelations[];
  selectedApplication: ApplicationWithRelations | null;

  isLoading: boolean;
  error: string | null;
  filters: FilterState;

  // Job Posting actions
  setJobPostings: (postings: JobPosting[]) => void;
  addJobPosting: (posting: JobPosting) => void;
  updateJobPosting: (id: string, posting: Partial<JobPosting>) => void;
  deleteJobPosting: (id: string) => void;
  setSelectedJobPosting: (posting: JobPosting | null) => void;

  // Candidate actions
  setCandidates: (candidates: Candidate[]) => void;
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (id: string, candidate: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
  setSelectedCandidate: (candidate: Candidate | null) => void;

  // Application actions
  setApplications: (applications: ApplicationWithRelations[]) => void;
  addApplication: (application: ApplicationWithRelations) => void;
  updateApplication: (id: string, application: Partial<Application>) => void;
  deleteApplication: (id: string) => void;
  setSelectedApplication: (application: ApplicationWithRelations | null) => void;
  updateApplicationStatus: (id: string, status: Application["status"]) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const initialFilters: FilterState = {
  search: "",
  status: undefined,
  department: undefined,
};

export const useRecruitmentStore = create<RecruitmentState>((set) => ({
  jobPostings: [],
  selectedJobPosting: null,
  candidates: [],
  selectedCandidate: null,
  applications: [],
  selectedApplication: null,
  isLoading: false,
  error: null,
  filters: initialFilters,

  // Job Posting actions
  setJobPostings: (jobPostings) => set({ jobPostings }),
  addJobPosting: (posting) =>
    set((state) => ({ jobPostings: [...state.jobPostings, posting] })),
  updateJobPosting: (id, updated) =>
    set((state) => ({
      jobPostings: state.jobPostings.map((p) =>
        p.id === id ? { ...p, ...updated } : p
      ),
    })),
  deleteJobPosting: (id) =>
    set((state) => ({
      jobPostings: state.jobPostings.filter((p) => p.id !== id),
    })),
  setSelectedJobPosting: (posting) => set({ selectedJobPosting: posting }),

  // Candidate actions
  setCandidates: (candidates) => set({ candidates }),
  addCandidate: (candidate) =>
    set((state) => ({ candidates: [...state.candidates, candidate] })),
  updateCandidate: (id, updated) =>
    set((state) => ({
      candidates: state.candidates.map((c) =>
        c.id === id ? { ...c, ...updated } : c
      ),
    })),
  deleteCandidate: (id) =>
    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== id),
    })),
  setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),

  // Application actions
  setApplications: (applications) => set({ applications }),
  addApplication: (application) =>
    set((state) => ({ applications: [...state.applications, application] })),
  updateApplication: (id, updated) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, ...updated } : a
      ),
    })),
  deleteApplication: (id) =>
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
    })),
  setSelectedApplication: (application) =>
    set({ selectedApplication: application }),
  updateApplicationStatus: (id, status) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: initialFilters }),
}));
