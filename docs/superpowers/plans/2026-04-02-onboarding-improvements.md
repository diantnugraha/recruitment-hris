# Onboarding Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve onboarding tab with auto inventory numbers, PIC employee multi-select, job placement pre-fill, join date bug fix, and PIC email notifications.

**Architecture:** Backend-first approach. Add new DB tables and API changes first (BE), then update FE components to consume the new API shape. The FE changes center on `OnboardingContent.tsx` — modifying facility/program dialogs, job placement section, and send onboarding flow.

**Tech Stack:** Next.js (FE), Fastify + Prisma (BE), Mailgun (email), shadcn/ui + TUV tokens (UI)

**Spec:** `docs/superpowers/specs/2026-04-02-onboarding-improvements-design.md`

---

## File Map

### Backend (recruitment-hris-api)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `prisma/schema.prisma` | Add `facility_pics`, `program_pics` tables; rename `pic` → `pic_legacy` on OnboardingProgram; add `join_date` column |
| Create | `prisma/migrations/XXXXXX_onboarding_pic_tables/migration.sql` | Migration for new tables + join_date column |
| Modify | `src/repositories/onboardingRepository.ts` | Add PIC CRUD, auto-generate inventory_no, include pics in queries |
| Modify | `src/services/candidateService.ts` | Update facility/program creation to handle pic_employee_ids, update sendOnboarding to include join_date/work_location and send PIC emails |
| Modify | `src/controllers/candidateController.ts` | Update request body validation for facilities/programs |
| Modify | `src/routes/candidateRoutes.ts` | Update body schemas for facility/program endpoints |
| Modify | `src/services/emailService.ts` | Add `sendFacilityPicEmail()` and `sendProgramPicEmail()` templates |

### Frontend (recruitment-hris)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/shared/employee-multi-select.tsx` | Reusable searchable multi-select for employees |
| Modify | `src/services/candidate.service.ts` | Update facility/program types to include `pics[]`, update addFacility/addProgram to send `pic_employee_ids`, update sendOnboarding to include `join_date` + `work_location` |
| Modify | `src/components/onboarding/OnboardingContent.tsx` | Remove inventory_no/unit/status from facility dialog, add PIC multi-select to both dialogs, fix join date bug, remove Save button, pre-fill work location, update send flow |
| Modify | `src/services/employee.service.ts` | Add `search()` method for PIC dropdown (lightweight search endpoint) |

---

## Task 1: Backend — Database Migration (PIC tables + pic_legacy)

**Files:**
- Modify: `recruitment-hris-api/prisma/schema.prisma`
- Create: migration via `npx prisma migrate dev`

- [ ] **Step 1: Update Prisma schema — add facility_pics and program_pics models**

In `prisma/schema.prisma`, add after the `facillities` model:

```prisma
model facility_pics {
  id          BigInt   @id @default(autoincrement()) @db.UnsignedBigInt
  facility_id BigInt   @db.UnsignedBigInt
  employee_id Int
  created_at  DateTime? @default(now()) @db.Timestamp(0)

  facility    facillities @relation(fields: [facility_id], references: [id], onDelete: Cascade)

  @@index([facility_id])
  @@index([employee_id])
  @@map("facility_pics")
}

model program_pics {
  id         BigInt   @id @default(autoincrement()) @db.UnsignedBigInt
  program_id BigInt   @db.UnsignedBigInt
  employee_id Int
  created_at DateTime? @default(now()) @db.Timestamp(0)

  program    OnboardingProgram @relation(fields: [program_id], references: [id], onDelete: Cascade)

  @@index([program_id])
  @@index([employee_id])
  @@map("program_pics")
}
```

Add relations to existing models:

In `facillities` model, add:
```prisma
pics facility_pics[]
```

In `OnboardingProgram` model:
- Rename field `pic` to `pic_legacy` (keep the column mapping `@map("pic")`)
- Add:
```prisma
pics program_pics[]
```

Also add `inventory_no` unique constraint to `facillities`:
```prisma
@@unique([inventory_no])
```

Add `join_date` column to `candidate_recruitment_onboarding` model:
```prisma
join_date String? @db.VarChar(20)
```

Add raw SQL FK constraints for `employee_id` in the migration (after Prisma generates it):
```sql
-- Add RESTRICT FK on employee_id to prevent deleting employees assigned as PIC
ALTER TABLE facility_pics ADD CONSTRAINT fk_facility_pics_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT;

ALTER TABLE program_pics ADD CONSTRAINT fk_program_pics_employee
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT;
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris-api
npx prisma migrate dev --name onboarding_pic_tables
```

Expected: Migration created and applied successfully.

- [ ] **Step 3: Verify generated Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add facility_pics and program_pics tables, rename pic to pic_legacy"
```

---

## Task 2: Backend — Repository Layer (PIC CRUD + Inventory Auto-Gen)

**Files:**
- Modify: `recruitment-hris-api/src/repositories/onboardingRepository.ts`

- [ ] **Step 1: Update findOnboardingByCandidateId to include pics**

In the `findOnboardingByCandidateId` function, update the Prisma query to include PIC relations:

```typescript
// In the include for facilities:
include: {
  facilities: {
    include: {
      pics: {
        select: {
          id: true,
          employee_id: true,
        }
      }
    }
  },
  programs: {
    include: {
      pics: {
        select: {
          id: true,
          employee_id: true,
        }
      }
    }
  }
}
```

Do the same for `findOnboardingById`.

- [ ] **Step 2: Add auto-generate inventory number function**

Add to onboardingRepository.ts:

```typescript
export async function generateInventoryNo(): Promise<string> {
  const prefix = 'INV-TNI-';

  // Get the max existing inventory_no
  const lastFacility = await prisma.facillities.findFirst({
    where: {
      inventory_no: { startsWith: prefix }
    },
    orderBy: { inventory_no: 'desc' },
    select: { inventory_no: true },
  });

  let nextNumber = 1;
  if (lastFacility?.inventory_no) {
    const currentNum = parseInt(lastFacility.inventory_no.replace(prefix, ''), 10);
    if (!isNaN(currentNum)) {
      nextNumber = currentNum + 1;
    }
  }

  const paddedNum = nextNumber.toString().padStart(3, '0');
  return `${prefix}${paddedNum}`;
}
```

- [ ] **Step 3: Update createFacility to auto-generate inventory_no and handle PICs**

```typescript
export async function createFacility(data: {
  candidate_recruitment_onboarding_id: number;
  item: string;
  qty: number;
  unit: string;
  condition: string;
  status: string;
  pic_employee_ids: number[];
}): Promise<Result<FacilityWithPics>> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const inventoryNo = await generateInventoryNo();

      const facility = await prisma.facillities.create({
        data: {
          inventory_no: inventoryNo,
          item: data.item,
          qty: data.qty,
          unit: data.unit,
          condition: data.condition,
          status: data.status,
          candidate_recruitment_onboarding_id: data.candidate_recruitment_onboarding_id,
          pics: {
            create: data.pic_employee_ids.map(empId => ({
              employee_id: empId,
            })),
          },
        },
        include: {
          pics: { select: { id: true, employee_id: true } },
        },
      });

      return { success: true, data: facility };
    } catch (err: unknown) {
      // Unique constraint violation on inventory_no — retry
      const prismaErr = err as { code?: string };
      if (prismaErr.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        continue;
      }
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errMsg };
    }
  }

  return { success: false, error: 'Failed to generate unique inventory number after retries' };
}
```

- [ ] **Step 4: Update updateFacility to handle PICs**

```typescript
export async function updateFacility(
  id: number,
  data: {
    item?: string;
    qty?: number;
    condition?: string;
    pic_employee_ids?: number[];
  }
): Promise<Result<FacilityWithPics>> {
  try {
    const { pic_employee_ids, ...facilityData } = data;

    const facility = await prisma.facillities.update({
      where: { id },
      data: {
        ...facilityData,
        ...(pic_employee_ids !== undefined && {
          pics: {
            deleteMany: {},
            create: pic_employee_ids.map(empId => ({
              employee_id: empId,
            })),
          },
        }),
      },
      include: {
        pics: { select: { id: true, employee_id: true } },
      },
    });

    return { success: true, data: facility };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errMsg };
  }
}
```

- [ ] **Step 5: Update createProgram and updateProgram similarly for PICs**

Same pattern as facility — accept `pic_employee_ids: number[]`, create/replace `program_pics` records. Default status to "Scheduled" if not provided.

- [ ] **Step 6: Commit**

```bash
git add src/repositories/onboardingRepository.ts
git commit -m "feat: add PIC CRUD and inventory auto-gen to onboarding repository"
```

---

## Task 3: Backend — Service Layer (Send Onboarding with PIC Emails)

**Files:**
- Modify: `recruitment-hris-api/src/services/candidateService.ts`
- Modify: `recruitment-hris-api/src/services/emailService.ts`

- [ ] **Step 1: Add PIC email templates to emailService.ts**

Add two new functions:

```typescript
export interface FacilityPicEmailData {
  picName: string;
  picEmail: string;
  candidateName: string;
  joinDate: string;
  workLocation: string;
  facilities: Array<{ item: string; qty: number; condition: string }>;
}

export async function sendFacilityPicEmail(data: FacilityPicEmailData): Promise<void> {
  // Build HTML template with TUV styling (same pattern as existing sendOnboardingEmail)
  // Subject: "Persiapan Fasilitas Karyawan Baru - {candidateName}"
  // Body: list of facility items assigned to this PIC
  const html = getFacilityPicEmailTemplate(data);
  await sendEmail({
    to: data.picEmail,
    subject: `Persiapan Fasilitas Karyawan Baru - ${data.candidateName}`,
    html,
  });
}

export interface ProgramPicEmailData {
  picName: string;
  picEmail: string;
  candidateName: string;
  joinDate: string;
  programs: Array<{ program: string; date: string; location: string }>;
}

export async function sendProgramPicEmail(data: ProgramPicEmailData): Promise<void> {
  const html = getProgramPicEmailTemplate(data);
  await sendEmail({
    to: data.picEmail,
    subject: `Persiapan Program Onboarding - ${data.candidateName}`,
    html,
  });
}
```

Add `getFacilityPicEmailTemplate()` and `getProgramPicEmailTemplate()` functions using the same HTML pattern as the existing `getOnboardingEmailTemplate()` — TUV navy styling, card layout with detail list.

- [ ] **Step 2: Update sendOnboarding in candidateService.ts**

Modify the `sendOnboardingEmail` function to:
1. Accept `join_date` and `work_location` in addition to `portalBaseUrl`
2. Save `job_placement` (work_location) and a new `join_date` field before sending
3. After sending candidate email, collect unique PICs from facilities and programs
4. Send facility PIC emails (one per unique employee, listing all their facilities)
5. Send program PIC emails (one per unique employee, listing all their programs)
6. PIC emails are best-effort (catch errors, log, don't fail the operation)

```typescript
async sendOnboarding(
  candidateId: number,
  portalBaseUrl: string,
  joinDate: string,
  workLocation: string
): Promise<Result<void>> {
  // 1. Save job placement + join date
  await onboardingRepository.updateOnboarding(onboardingId, {
    job_placement: workLocation,
    // join_date needs to be added to the onboarding table or passed differently
  });

  // 2. Send candidate email (existing)
  await sendOnboardingEmailToCandidate({ ... });

  // 3. Fetch onboarding with PIC details
  const onboarding = await onboardingRepository.findOnboardingByCandidateId(candidateId);

  // 4. Collect facility PICs — group facilities by employee_id
  const facilityPicMap = new Map<number, { empId: number; facilities: Facility[] }>();
  for (const facility of onboarding.facilities) {
    for (const pic of facility.pics) {
      if (!facilityPicMap.has(pic.employee_id)) {
        facilityPicMap.set(pic.employee_id, { empId: pic.employee_id, facilities: [] });
      }
      facilityPicMap.get(pic.employee_id)!.facilities.push(facility);
    }
  }

  // 5. Send facility PIC emails (best-effort)
  for (const [empId, data] of facilityPicMap) {
    try {
      const employee = await employeeRepository.findById(empId);
      await sendFacilityPicEmail({
        picName: employee.name,
        picEmail: employee.email,
        candidateName: candidate.fullname,
        joinDate,
        workLocation: formatJobPlacement(workLocation),
        facilities: data.facilities.map(f => ({ item: f.item, qty: f.qty, condition: f.condition })),
      });
    } catch (err) {
      console.error(`Failed to send facility PIC email to employee ${empId}:`, err);
    }
  }

  // 6. Same pattern for program PICs
  // ... (group programs by employee_id, send programPicEmail per unique PIC)
}
```

- [ ] **Step 3: Update addFacility/updateFacility/addProgram/updateProgram in service layer**

Update these service functions to:
- Remove `inventory_no` from facility input (BE generates it)
- Accept `pic_employee_ids: number[]` instead of `pic: string`
- Pass to repository layer

- [ ] **Step 4: Commit**

```bash
git add src/services/candidateService.ts src/services/emailService.ts
git commit -m "feat: add PIC email notifications and update onboarding service layer"
```

---

## Task 4: Backend — Controller & Routes Update

**Files:**
- Modify: `recruitment-hris-api/src/controllers/candidateController.ts`
- Modify: `recruitment-hris-api/src/routes/candidateRoutes.ts`

- [ ] **Step 1: Update facility route body schema**

In `candidateRoutes.ts`, update the facility POST/PUT body schema:
- Remove `inventory_no` from required/optional fields
- Add `pic_employee_ids: { type: 'array', items: { type: 'number' } }`
- Keep `item`, `qty`, `condition` (unit and status are set by BE)

- [ ] **Step 2: Update program route body schema**

- Remove `pic: string`
- Add `pic_employee_ids: { type: 'array', items: { type: 'number' } }`
- Default `status` to "Scheduled" if not provided

- [ ] **Step 3: Update send onboarding route body schema**

Add `join_date` and `work_location` to the send endpoint body:
```typescript
body: {
  type: 'object',
  required: ['portal_base_url', 'join_date', 'work_location'],
  properties: {
    portal_base_url: { type: 'string' },
    join_date: { type: 'string' },
    work_location: { type: 'string' },
  }
}
```

- [ ] **Step 4: Update controller handlers**

Update `addFacility`, `updateFacility`, `addProgram`, `updateProgram` controllers to:
- Extract `pic_employee_ids` from request body
- Pass to service layer
- Return response including `pics` array

Update `sendOnboarding` controller to:
- Extract `join_date` and `work_location` from body
- Pass to service layer

- [ ] **Step 5: Update GET onboarding response to include PIC employee details**

In the `getOnboarding` controller, after fetching onboarding with pics, enrich each PIC with employee name and email:

```typescript
// For each facility.pics and program.pics, fetch employee details
const enrichedFacilities = await Promise.all(
  onboarding.facilities.map(async (f) => ({
    ...f,
    pics: await Promise.all(
      f.pics.map(async (p) => {
        const emp = await employeeRepository.findById(p.employee_id);
        return { id: p.employee_id, name: emp?.name || '', email: emp?.email || '' };
      })
    ),
  }))
);
```

- [ ] **Step 6: Commit**

```bash
git add src/controllers/candidateController.ts src/routes/candidateRoutes.ts
git commit -m "feat: update onboarding routes and controllers for PIC and send improvements"
```

---

## Task 5: Frontend — Employee Multi-Select Component

**Files:**
- Create: `src/components/shared/employee-multi-select.tsx`
- Modify: `src/services/employee.service.ts`

- [ ] **Step 1: Add search method to employee service**

In `src/services/employee.service.ts`, add to `employeeService`:

```typescript
async search(query: string, limit: number = 20): Promise<ApiResponse<Array<{ id: string; name: string; email: string }>>> {
  try {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }
    const response = await get<unknown>(`/v1/employee?name=${encodeURIComponent(query)}&limit=${limit}`);
    const res = response as { success?: boolean; data?: ApiEmployee[] };

    if (res.success && res.data) {
      return {
        success: true,
        data: res.data.map(emp => ({
          id: String(emp.employee_id ?? emp.id),
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.nickname || '',
          email: emp.email || '',
        })),
      };
    }

    if (Array.isArray(res.data)) {
      return {
        success: true,
        data: (res.data as ApiEmployee[]).map(emp => ({
          id: String(emp.employee_id ?? emp.id),
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.nickname || '',
          email: emp.email || '',
        })),
      };
    }

    return { success: false, message: 'Unexpected response' };
  } catch {
    return { success: false, message: 'Failed to search employees' };
  }
},
```

- [ ] **Step 2: Create employee-multi-select.tsx component**

Create `src/components/shared/employee-multi-select.tsx`:

```tsx
"use client";

import * as React from "react";
import { X, Search, Loader2 } from "lucide-react";
import { employeeService } from "@/services/employee.service";

interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

interface EmployeeMultiSelectProps {
  value: EmployeeOption[];
  onChange: (employees: EmployeeOption[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function EmployeeMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Search employees...",
}: EmployeeMultiSelectProps) {
  const [search, setSearch] = React.useState("");
  const [options, setOptions] = React.useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search with AbortController
  React.useEffect(() => {
    if (search.length < 2) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await employeeService.search(search);
      if (!controller.signal.aborted && res.success && res.data) {
        const selectedIds = new Set(value.map((v) => v.id));
        setOptions(res.data.filter((emp) => !selectedIds.has(emp.id)));
      }
      if (!controller.signal.aborted) setIsLoading(false);
    }, 300);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, value]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (emp: EmployeeOption) => {
    onChange([...value, emp]);
    setSearch("");
    setOptions([]);
    inputRef.current?.focus();
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 rounded border px-3 py-2 min-h-[38px] cursor-text"
        style={{
          borderColor: "rgba(120, 134, 127, 0.3)",
          backgroundColor: disabled ? "var(--hsd-ui-color-gray-50)" : "#fff",
        }}
        onClick={() => { if (!disabled) { setIsOpen(true); inputRef.current?.focus(); } }}
      >
        {value.map((emp) => (
          <span
            key={emp.id}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5"
            style={{
              fontSize: "0.75rem",
              fontWeight: 500,
              backgroundColor: "var(--hsd-ui-color-gray-100)",
              color: "var(--hsd-ui-color-gray-700)",
            }}
          >
            {emp.name}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleRemove(emp.id); }}
                className="hover:opacity-70"
              >
                <X style={{ width: "12px", height: "12px" }} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none bg-transparent"
            style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-900)" }}
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (search.length >= 2 || isLoading) && (
        <div
          className="absolute z-50 mt-1 w-full rounded border shadow-lg"
          style={{
            backgroundColor: "#fff",
            borderColor: "rgba(120, 134, 127, 0.2)",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin" style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-400)" }} />
            </div>
          ) : options.length === 0 ? (
            <div className="py-3 px-4" style={{ fontSize: "0.875rem", color: "var(--hsd-ui-color-gray-400)" }}>
              No employees found
            </div>
          ) : (
            options.map((emp) => (
              <button
                key={emp.id}
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                onClick={() => handleSelect(emp)}
              >
                <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-900)" }}>
                  {emp.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--hsd-ui-color-gray-500)" }}>
                  {emp.email}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/employee-multi-select.tsx src/services/employee.service.ts
git commit -m "feat: add EmployeeMultiSelect component and employee search service"
```

---

## Task 6: Frontend — Update Candidate Service Types

**Files:**
- Modify: `src/services/candidate.service.ts`

- [ ] **Step 1: Update Facility and OnboardingProgram types**

In the `Onboarding` type mapping (around line 948-1012), update the response parsing:

Add `pics` to facility and program types:

```typescript
// In the getOnboarding response mapping, update the type:
facilities: Array<{
  id: number;
  inventory_no: string;
  item: string;
  qty: number;
  unit: string;
  condition: string;
  status: string;
  pics?: Array<{ id: number; name: string; email: string }>;
}>;
programs: Array<{
  id: number;
  program: string;
  date: string;
  location: string;
  pic: string;         // legacy
  pic_legacy?: string; // renamed
  status: string;
  pics?: Array<{ id: number; name: string; email: string }>;
}>;
```

Update the `Facility` and `OnboardingProgram` exported types to include `pics`:

```typescript
export interface Facility {
  id: number;
  inventoryNo: string;
  item: string;
  qty: number;
  unit: string;
  condition: string;
  status: string;
  pics: Array<{ id: number; name: string; email: string }>;
}

export interface OnboardingProgram {
  id: number;
  program: string;
  date: string;
  location: string;
  pic: string;        // legacy fallback
  picLegacy?: string;
  status: string;
  pics: Array<{ id: number; name: string; email: string }>;
}
```

- [ ] **Step 2: Update addFacility to remove inventory_no, add pic_employee_ids**

```typescript
async addFacility(
  candidateId: string | number,
  data: {
    item: string;
    qty: number;
    condition: string;
    pic_employee_ids: number[];
  }
): Promise<ApiResponse<Facility>> {
  // POST with { item, qty, unit: "Unit", condition, status: "Assigned", pic_employee_ids }
  const payload = {
    item: data.item,
    qty: data.qty,
    unit: "Unit",
    condition: data.condition,
    status: "Assigned",
    pic_employee_ids: data.pic_employee_ids,
  };
  // ... rest of the API call, map response including pics
}
```

- [ ] **Step 3: Update updateFacility similarly**

Remove `inventory_no` from update payload, add `pic_employee_ids`.

- [ ] **Step 4: Update addProgram and updateProgram**

Replace `pic: string` with `pic_employee_ids: number[]`.

- [ ] **Step 5: Update sendOnboardingEmail to accept join_date and work_location**

```typescript
async sendOnboardingEmail(
  candidateId: string | number,
  portalBaseUrl: string,
  joinDate: string,
  workLocation: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  const response = await post<unknown, { portal_base_url: string; join_date: string; work_location: string }>(
    `/v1/candidate/${candidateId}/onboarding/send`,
    { portal_base_url: portalBaseUrl, join_date: joinDate, work_location: workLocation }
  );
  // ...
}
```

- [ ] **Step 6: Update response mapping for getOnboarding, createOnboarding, updateOnboarding**

Map `pics` from API response. For programs, handle both `pic_legacy` and `pics[]`.

- [ ] **Step 7: Commit**

```bash
git add src/services/candidate.service.ts
git commit -m "feat: update candidate service types and methods for PIC support"
```

---

## Task 7: Frontend — Update OnboardingContent (Facility Dialog)

**Files:**
- Modify: `src/components/onboarding/OnboardingContent.tsx`

- [ ] **Step 1: Add import for EmployeeMultiSelect**

At the top of the file, add:
```typescript
import { EmployeeMultiSelect } from "@/components/shared/employee-multi-select";
```

- [ ] **Step 2: Update facilityForm state — remove inventoryNo/unit/status, add pics**

Change the `facilityForm` state (line 322-329):

```typescript
const [facilityForm, setFacilityForm] = React.useState({
  item: "" as string,
  qty: 1,
  condition: "New",
  pics: [] as Array<{ id: string; name: string; email: string }>,
});
```

- [ ] **Step 3: Update handleOpenFacilityDialog**

Update the form reset in `handleOpenFacilityDialog` (line 470-491):

For edit mode, populate `pics` from `facility.pics`. For add mode, reset to empty.

```typescript
const handleOpenFacilityDialog = (dialogMode: "add" | "edit", facility?: Facility) => {
  if (dialogMode === "edit" && facility) {
    setFacilityForm({
      item: facility.item,
      qty: facility.qty,
      condition: facility.condition,
      pics: facility.pics.map(p => ({ id: String(p.id), name: p.name, email: p.email })),
    });
  } else {
    setFacilityForm({
      item: "",
      qty: 1,
      condition: "New",
      pics: [],
    });
  }
  setFacilityDialog({ open: true, mode: dialogMode, facility });
};
```

- [ ] **Step 4: Update handleSaveFacility to send pic_employee_ids**

In `handleSaveFacility` (line 493-546), update the API calls:

```typescript
// For add:
const response = await candidateService.addFacility(candidateId, {
  item: facilityForm.item,
  qty: facilityForm.qty,
  condition: facilityForm.condition,
  pic_employee_ids: facilityForm.pics.map(p => Number(p.id)),
});

// For edit:
const response = await candidateService.updateFacility(candidateId, facilityDialog.facility.id, {
  item: facilityForm.item,
  qty: facilityForm.qty,
  condition: facilityForm.condition,
  pic_employee_ids: facilityForm.pics.map(p => Number(p.id)),
});
```

- [ ] **Step 5: Update Facility Dialog JSX — remove inventoryNo/unit/status fields, add PIC**

Replace the dialog content (line 1283-1364):

Remove:
- Inventory No input field (lines 1284-1293)
- Unit input field (lines 1324-1333)
- Status input field (lines 1354-1363)
- Change grid layout from `grid-cols-2` to simpler layout

Replace with:
```tsx
<div className="space-y-4 py-4">
  <div className="space-y-2">
    <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
      Item *
    </Label>
    <Select value={facilityForm.item} onValueChange={(v) => setFacilityForm({ ...facilityForm, item: v })}>
      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
      <SelectContent>
        {FACILITY_ITEMS.map((item) => (<SelectItem key={item} value={item}>{item}</SelectItem>))}
      </SelectContent>
    </Select>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
        Quantity
      </Label>
      <Input type="number" min={1} value={facilityForm.qty} onChange={(e) => setFacilityForm({ ...facilityForm, qty: Number(e.target.value) })} />
    </div>
    <div className="space-y-2">
      <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
        Condition
      </Label>
      <Select value={facilityForm.condition} onValueChange={(v) => setFacilityForm({ ...facilityForm, condition: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {FACILITY_CONDITIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  </div>
  <div className="space-y-2">
    <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
      PIC (Person In Charge) *
    </Label>
    <EmployeeMultiSelect
      value={facilityForm.pics}
      onChange={(pics) => setFacilityForm({ ...facilityForm, pics })}
    />
  </div>
</div>
```

Update the save button disabled condition:
```tsx
disabled={!facilityForm.item || facilityForm.pics.length === 0}
```

- [ ] **Step 6: Update facility table to show PIC column**

In the facility table (lines 846-921), add a PIC column header and cell:

```tsx
// In thead after Condition:
<th style={tableStyles.th}>PIC</th>

// In tbody after condition cell:
<td style={tableStyles.td}>
  {facility.pics.length > 0
    ? facility.pics.map(p => p.name).join(", ")
    : "—"}
</td>
```

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/OnboardingContent.tsx
git commit -m "feat: update facility dialog with PIC multi-select, remove inventory_no field"
```

---

## Task 8: Frontend — Update OnboardingContent (Program Dialog)

**Files:**
- Modify: `src/components/onboarding/OnboardingContent.tsx`

- [ ] **Step 1: Update programForm state — replace pic string with pics array**

Change the `programForm` state (line 337-343):

```typescript
const [programForm, setProgramForm] = React.useState({
  program: "",
  date: "",
  location: "",
  pics: [] as Array<{ id: string; name: string; email: string }>,
  status: "Scheduled",
});
```

- [ ] **Step 2: Update handleOpenProgramDialog**

For edit mode, populate `pics` from `program.pics` (with fallback to `program.pic` legacy text display). For add mode, default status to "Scheduled".

```typescript
const handleOpenProgramDialog = (dialogMode: "add" | "edit", program?: OnboardingProgram) => {
  if (dialogMode === "edit" && program) {
    setProgramForm({
      program: program.program,
      date: program.date,
      location: program.location,
      pics: program.pics.map(p => ({ id: String(p.id), name: p.name, email: p.email })),
      status: program.status,
    });
  } else {
    setProgramForm({
      program: "",
      date: "",
      location: "",
      pics: [],
      status: "Scheduled",
    });
  }
  setProgramDialog({ open: true, mode: dialogMode, program });
};
```

- [ ] **Step 3: Update handleSaveProgram to send pic_employee_ids**

```typescript
// For add:
const response = await candidateService.addProgram(candidateId, {
  program: programForm.program,
  date: programForm.date,
  location: programForm.location,
  pic_employee_ids: programForm.pics.map(p => Number(p.id)),
  status: programForm.status,
});

// For edit — same pattern
```

- [ ] **Step 4: Update Program Dialog JSX — replace PIC text input with EmployeeMultiSelect**

Replace the PIC input field (lines 1436-1445):

```tsx
<div className="space-y-2">
  <Label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--hsd-ui-color-gray-700)" }}>
    PIC (Person In Charge) *
  </Label>
  <EmployeeMultiSelect
    value={programForm.pics}
    onChange={(pics) => setProgramForm({ ...programForm, pics })}
  />
</div>
```

Make the PIC field take full width (not in a 2-col grid with Status).

Update save button disabled condition:
```tsx
disabled={!programForm.program || programForm.pics.length === 0}
```

- [ ] **Step 5: Update program table PIC column display**

In the program table PIC cell (line 1008), update to show names from `pics` array with fallback to legacy `pic` string:

```tsx
<td style={tableStyles.td}>
  {program.pics && program.pics.length > 0
    ? program.pics.map(p => p.name).join(", ")
    : program.pic || "No Data"}
</td>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/onboarding/OnboardingContent.tsx
git commit -m "feat: update program dialog with PIC multi-select, default Scheduled status"
```

---

## Task 9: Frontend — Job Placement (Pre-fill, Join Date Bug Fix, Remove Save)

**Files:**
- Modify: `src/components/onboarding/OnboardingContent.tsx`

- [ ] **Step 1: Pre-fill work location from Employee Request**

In the `fetchData` function (line 368-397), after fetching candidate data, if onboarding doesn't have `jobPlacement` set yet, fetch the employee request to get `job_placement`:

```typescript
// After setting candidate and onboarding...
if (onboardingRes.data) {
  setJobPlacement(onboardingRes.data.jobPlacement || "");
  // joinDate should also be set from onboarding data if available
  // (this is part of the bug fix)
} else if (candidateRes.data) {
  // No onboarding yet — pre-fill work location from employee request
  // The candidate has employeeRequestId from the recruitment flow
  // We need to fetch employee request to get job_placement
  try {
    const erRes = await employeeRequestService.getById(/* employeeRequestId from candidate */);
    if (erRes.success && erRes.data?.jobPlacement) {
      setJobPlacement(erRes.data.jobPlacement);
    }
  } catch {
    // Silently fail — user can manually enter
  }
}
```

The `CandidateWithRelations` type already includes `employeeRequest?: { id: number; code: string; jobPlacement?: string }`. So `candidate.employeeRequest?.jobPlacement` provides the work location directly — no extra API call needed.

```typescript
// In fetchData, after setting candidate:
if (!onboardingRes.data && candidateRes.data?.employeeRequest?.jobPlacement) {
  setJobPlacement(candidateRes.data.employeeRequest.jobPlacement);
}
```

- [ ] **Step 2: Fix Join Date bug**

The join date bug: `joinDate` state is set on change (line 1089) but never initialized from onboarding data. In `fetchData`, after setting `jobPlacement`, also set `joinDate`:

```typescript
if (onboardingRes.data) {
  setJobPlacement(onboardingRes.data.jobPlacement || "");
  // BUG FIX: Also restore joinDate from onboarding data
  // Check if the onboarding response includes join_date
  // If not in current API response, it may need to be added to the BE response
}
```

The root cause is likely that `joinDate` is never persisted to the API response. The current `updateOnboarding` only saves `job_placement`, not `join_date`. Two approaches:

**Option A:** Add `join_date` column to `candidate_recruitment_onboarding` table (requires BE migration)
**Option B:** Store join date in the send payload only, not persistently

Since the spec says "simpan join date" and the checklist requires it, **Option A** is correct. The `join_date` column is already included in the Task 1 migration (added to Prisma schema as `join_date String? @db.VarChar(20)`).

In the FE `fetchData`, set `joinDate` from the API response:
```typescript
if (onboardingRes.data) {
  setJobPlacement(onboardingRes.data.jobPlacement || "");
  setJoinDate(onboardingRes.data.joinDate || "");
}
```

Also update the candidate service `getOnboarding` response mapping to include `joinDate` from `join_date`.

- [ ] **Step 3: Remove Save button from Job Placement section**

Delete the Save button block (lines 1098-1112):

```tsx
{/* DELETE THIS ENTIRE BLOCK */}
{mode === "edit" && !isOnboardingAccepted && (
  <Button className="w-full" onClick={handleSaveJobPlacement} disabled={isSaving} style={btnPrimary}>
    ...
  </Button>
)}
```

Also remove the `Save` icon from lucide-react imports (line 18) and the `handleSaveJobPlacement` function can be simplified since it's only called from `handleSendOnboarding` now.

- [ ] **Step 4: Update handleSendOnboarding to pass join_date and work_location**

Update the send handler (line 662-695):

```typescript
const handleSendOnboarding = async () => {
  setIsConverting(true);
  try {
    const hasOnboarding = await ensureOnboarding();
    if (!hasOnboarding) { setIsConverting(false); return; }

    // Send onboarding with join_date and work_location
    const portalBaseUrl = window.location.origin;
    const response = await candidateService.sendOnboardingEmail(
      candidateId,
      portalBaseUrl,
      joinDate,
      jobPlacement
    );

    if (response.success) {
      showToast.success("Onboarding sent successfully!");
      setShowSendDialog(false);
      const onboardingRes = await candidateService.getOnboarding(candidateId);
      if (onboardingRes.success && onboardingRes.data) {
        setOnboarding(onboardingRes.data);
      }
      onRefresh?.();
    } else {
      showToast.error(response.message || "Failed to send onboarding");
    }
  } catch (err) {
    showToast.error("Failed to send onboarding");
  } finally {
    setIsConverting(false);
  }
};
```

- [ ] **Step 5: Commit**

```bash
git add src/components/onboarding/OnboardingContent.tsx
git commit -m "feat: pre-fill work location, fix join date bug, remove Save button"
```

---

## Task 10: Frontend — Clean Up and Final Polish

**Files:**
- Modify: `src/components/onboarding/OnboardingContent.tsx`

- [ ] **Step 1: Remove unused imports and state**

- Remove `Save` from lucide-react imports
- Remove `inventoryNo`, `unit`, `status` from facilityForm if any references remain
- Remove `isSaving` state if no longer used (was for Save button)
- Remove `handleSaveJobPlacement` if fully replaced by send flow

- [ ] **Step 2: Verify all TODO items addressed**

Run through the 8 requirements checklist:
1. Auto inventory number — FE removed field, BE generates ✓
2. PIC multi-select in facility — EmployeeMultiSelect added ✓
3. PIC multi-select in program — EmployeeMultiSelect added ✓
4. Default program status "Scheduled" — set in handleOpenProgramDialog ✓
5. Work location pre-fill from Employee Request — fetchData updated ✓
6. Join date bug fix — state initialized from API, join_date column added ✓
7. Save button removed — deleted from JSX ✓
8. Send emails to PIC — BE sends facility/program PIC emails ✓

- [ ] **Step 3: Run type check**

```bash
cd /Users/diantnugraha/Documents/Documents/Development/recruitment-hris
npx tsc --noEmit
```

Fix any TypeScript errors.

- [ ] **Step 4: Test manually**

1. Open a candidate's onboarding tab
2. Add a facility — verify no inventory_no field, PIC multi-select works
3. Check facility table shows auto-generated inventory number and PIC names
4. Add a program — verify PIC multi-select, status defaults to "Scheduled"
5. Check Job Placement — work location pre-filled, join date persists after refresh
6. No Save button visible
7. Click Send Onboarding — verify all emails sent (check Mailgun logs)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "refactor: clean up onboarding improvements, fix type errors"
```
