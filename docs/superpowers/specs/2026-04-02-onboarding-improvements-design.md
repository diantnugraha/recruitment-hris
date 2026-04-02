# Onboarding Tab Improvements & Bug Fixes

**Date:** 2026-04-02
**Status:** Draft
**Scope:** Frontend (recruitment-hris) + Backend (recruitment-hris-api)

---

## Overview

Improvements and bug fixes for the Onboarding tab in the recruitment flow. Covers facility form simplification, PIC (Person In Charge) integration with employee list, program defaults, job placement auto-fill, join date bug fix, Save button removal, and enhanced email notifications to PICs.

---

## Changes Summary

| # | Item | Type |
|---|------|------|
| 1 | Auto-generate Inventory Number, hide from FE | Enhancement |
| 2 | Add multi-select PIC field to Facility (from employee list) | Feature |
| 3 | Add multi-select PIC field to Program (from employee list) | Feature |
| 4 | Default Program status to "Scheduled" | Enhancement |
| 5 | Pre-fill Work Location from Employee Request | Enhancement |
| 6 | Fix Join Date picker not saving/displaying | Bug fix |
| 7 | Remove Save button from Job Placement | Enhancement |
| 8 | Send email notifications to PIC Facility & PIC Program | Feature |

---

## 1. Facility Form Changes

### Current State
- Form fields: Inventory No (manual text), Item (select), Quantity (number), Unit (fixed "Unit"), Condition (select), Status (fixed "Assigned")
- Inventory Number is manually entered by user

### New Behavior
- **Remove** Inventory Number from the form dialog entirely
- **Remove** Unit field (always "Unit") and Status field (always "Assigned") — these are set by BE
- **Add** PIC field: searchable multi-select dropdown from employee list
- BE auto-generates Inventory Number with format `INV-TNI-001` (global counter, zero-padded 3 digits)

### New Form Fields

| Field | Type | Required |
|-------|------|----------|
| Item | Select (Laptop CTO, Laptop NCTO, Starter Kit) | Yes |
| Quantity | Number (min 1) | Yes |
| Condition | Select (New, Used) | Yes |
| PIC | Searchable multi-select (employee name + email) | Yes |

### Table Display
- Columns: Inventory No (from BE), Item, Qty, Condition, PIC (comma-separated names), Actions
- Inventory No displayed as read-only from API response

---

## 2. Program Form Changes

### Current State
- Form fields: Program Name (text), Date (date input), Location (text), PIC (plain text input), Status (select, no default)

### New Behavior
- **Replace** PIC text input with searchable multi-select dropdown from employee list
- **Default** Status to "Scheduled" when opening add dialog

### New Form Fields

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Program Name | Text | Yes | — |
| Date | Date picker | No | — |
| Location | Text | No | — |
| PIC | Searchable multi-select (employee name + email) | Yes | — |
| Status | Select (Scheduled, In Progress, Completed, Cancelled) | Yes | "Scheduled" |

---

## 3. Job Placement Changes

### Current State
- Work Location: free text input
- Join Date: date picker (bug: value not persisting)
- Save button below both fields

### New Behavior
- **Work Location**: pre-filled from Employee Request's work location, still editable
- **Join Date**: fix bug where selected date is not saved/displayed
- **Remove Save button**: data saved when user clicks "Send Onboarding"

### Join Date Bug
- Root cause to be investigated during implementation (state binding or API payload issue)
- Fix must ensure: date picker onChange updates state, state is displayed correctly, and value is included in the send onboarding API call

---

## 4. Send Onboarding (Enhanced)

### Current State
- Sends email only to **candidate** with portal link
- Saves job placement before sending

### New Behavior
When user clicks "Send Onboarding":

1. **Save** join date + work location to API
2. **Send email to candidate** (existing behavior — portal link)
3. **Send email to PIC Facility** — one email per unique PIC across all facilities
   - Subject: "Persiapan Fasilitas Karyawan Baru - {candidateName}"
   - Content: candidate name, join date, work location, list of facility items assigned to this PIC
4. **Send email to PIC Program** — one email per unique PIC across all programs
   - Subject: "Persiapan Program Onboarding - {candidateName}"
   - Content: candidate name, join date, list of programs assigned to this PIC

### Email Deduplication
- If an employee is PIC in both facility and program, they receive **two separate emails** (different themes/content)
- If an employee is PIC in multiple facilities, they receive **one email** listing all their assigned facilities

---

## 5. Database Changes (Backend)

### New Tables

```sql
-- PIC for facilities (many-to-many)
CREATE TABLE facility_pics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  facility_id BIGINT NOT NULL,
  employee_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (facility_id) REFERENCES facillities(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- PIC for programs (many-to-many)
CREATE TABLE program_pics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  program_id BIGINT NOT NULL,
  employee_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES onboarding_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

### Inventory Number Auto-Generation
- Use a **unique constraint** on `inventory_no` column + **retry loop** (max 3 retries) to handle concurrency
- On facility creation: query `SELECT MAX(inventory_no) FROM facillities`, parse counter, increment by 1
- Format: `INV-TNI-{counter}` zero-padded to 3 digits. If counter > 999, simply use 4+ digits (e.g., `INV-TNI-1000`)
- Inventory numbers are **never reused** — deleted facilities do not free up their numbers
- Wrap in a transaction: generate number → insert → if unique constraint fails, retry with fresh MAX query

### Data Migration for Existing PIC Text Values
- The existing `pic` text column on `onboarding_programs` table is **kept** as `pic_legacy` (renamed) for reference
- Existing program records with text PIC values will display the legacy text in the UI as a fallback
- FE logic: if `program.pics[]` array is empty but `program.pic_legacy` exists, display the legacy text (read-only)
- No automatic migration from text to employee references — HR can manually edit existing programs to assign proper PICs

### Employee Deletion / Deactivation
- `facility_pics` and `program_pics` use `ON DELETE RESTRICT` for `employee_id` FK
- If an employee is assigned as PIC, they cannot be deleted until removed from PIC assignments
- Inactive/terminated employees are filtered out from the PIC search dropdown but still displayed if already assigned

---

## 6. API Changes (Backend)

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `POST /candidates/:id/onboarding/facilities` | Remove `inventory_no` from body, add `pic_employee_ids: number[]`. BE auto-generates inventory_no |
| `PUT /candidates/:id/onboarding/facilities/:fid` | Remove `inventory_no`, add `pic_employee_ids: number[]` |
| `POST /candidates/:id/onboarding/programs` | Change `pic: string` to `pic_employee_ids: number[]`. Default status = "Scheduled" if not provided |
| `PUT /candidates/:id/onboarding/programs/:pid` | Change `pic: string` to `pic_employee_ids: number[]` |
| `GET /candidates/:id/onboarding` | Include `pics: [{id, name, email}]` in facility and program objects |
| `POST /candidates/:id/onboarding/send` | Add logic: send emails to PIC Facility + PIC Program. Accept `join_date` and `work_location` in body |

### Employee List Endpoint (existing)
- `GET /v1/employees?search=...&limit=20` — already available
- FE uses this for searchable PIC dropdown (display: name + email)

---

## 7. Frontend Component Changes

### OnboardingContent.tsx

1. **Facility Dialog**:
   - Remove inventory_no, unit, status fields
   - Add multi-select PIC component with employee search
   - Send `pic_employee_ids` array in API payload

2. **Program Dialog**:
   - Replace PIC text input with multi-select PIC component
   - Set default status to "Scheduled" in `handleOpenProgramDialog('add')`
   - Send `pic_employee_ids` array in API payload

3. **Job Placement Section**:
   - Fetch Employee Request data to pre-fill work location
   - Fix join date state binding (investigate and fix the bug)
   - Remove standalone Save button

4. **Send Onboarding**:
   - Include `join_date` and `work_location` in send payload
   - BE handles saving + sending all emails

### New/Reused Components
- **Employee Multi-Select**: searchable dropdown showing employee name + email, allows multiple selection
  - Can extend existing `SearchableSelect` component or use a multi-select variant
  - API: `GET /employees?search={query}&limit=20`
  - Display: `{name} ({email})`
  - Value: `employee_id`
  - Loading state: show spinner during search
  - Empty state: "No employees found" message
  - Error state: "Failed to load employees" with retry option

---

## 8. Email Templates (Backend - New)

### PIC Facility Email
```
Subject: Persiapan Fasilitas Karyawan Baru - {candidateName}

Yth. {picName},

Akan ada karyawan baru yang bergabung. Mohon disiapkan fasilitas berikut:

Nama Karyawan: {candidateName}
Tanggal Bergabung: {joinDate}
Lokasi Kerja: {workLocation}

Fasilitas yang perlu disiapkan:
- {item} (Qty: {qty}, Kondisi: {condition})
- ...

Terima kasih.
```

### PIC Program Email
```
Subject: Persiapan Program Onboarding - {candidateName}

Yth. {picName},

Akan ada karyawan baru yang bergabung. Mohon disiapkan program onboarding berikut:

Nama Karyawan: {candidateName}
Tanggal Bergabung: {joinDate}

Program yang perlu disiapkan:
- {programName} | Tanggal: {date} | Lokasi: {location}
- ...

Terima kasih.
```

---

## 9. Data Flow

```
┌─ Add Facility ─────────────────────────────────┐
│ FE: item, qty, condition, pic_employee_ids      │
│ BE: auto-generate INV-TNI-XXX                   │
│ BE: create facility + facility_pics records      │
│ BE: return facility with inventory_no + pics     │
└─────────────────────────────────────────────────┘

┌─ Add Program ──────────────────────────────────┐
│ FE: program, date, location, pic_employee_ids   │
│ BE: default status = "Scheduled"                │
│ BE: create program + program_pics records        │
│ BE: return program with pics                     │
└─────────────────────────────────────────────────┘

┌─ Send Onboarding ──────────────────────────────┐
│ FE: click Send → send join_date + work_location │
│ BE: save job placement + join_date               │
│ BE: send email to candidate (existing)           │
│ BE: send email to each unique PIC Facility       │
│ BE: send email to each unique PIC Program        │
│ BE: return success                               │
└─────────────────────────────────────────────────┘
```

---

## 10. Error Handling for Send Onboarding

- Email sending is **best-effort**: if candidate email succeeds but a PIC email fails, the operation still returns success
- BE logs failed email deliveries for debugging
- FE shows a single success toast: "Onboarding sent successfully"
- If the save (join date + work location) fails, the entire operation fails before any emails are sent
- If candidate email fails, the operation fails (this is the primary email)

---

## 11. Out of Scope

- Onboarding candidate portal changes
- Changes to onboarding acceptance flow
- Facility item list management (adding new item types)
- Notification in-app for PIC (only email)
