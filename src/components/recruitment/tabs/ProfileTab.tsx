"use client";

import {
  Briefcase,
  User,
  MapPin,
  IdCard,
  GraduationCap,
  Building2,
  Users,
  Award,
  ClipboardList,
} from "lucide-react";

import { TuvBadge } from "@/components/shared/tuv-badge";
import { formatShortDate } from "@/lib/utils";
import type {
  CandidateWithRelations,
  CandidateBiodata,
} from "@/services/candidate.service";

// --- TUV button style helpers ---

const btnPrimary = {
  backgroundColor: "var(--hsd-ui-background-color-primary)",
  borderColor: "var(--hsd-ui-border-color-primary)",
  color: "var(--hsd-ui-text-color-primary)",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

const btnSecondary = {
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
  borderColor: "rgba(120,134,127,0.2)",
} as const;

const btnDanger = {
  backgroundColor: "rgba(250, 55, 70, 1)",
  borderColor: "rgba(250, 55, 70, 1)",
  color: "#fff",
  borderRadius: "4px",
  height: "38px",
  padding: "0 16px",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

// --- TUV reusable sub-components ---

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--hsd-ui-color-gray-500)",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: value ? "var(--hsd-ui-color-gray-900)" : "var(--hsd-ui-color-gray-400)",
          margin: "2px 0 0",
        }}
      >
        {value || "No Data"}
      </p>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border"
      style={{
        borderRadius: "8px",
        backgroundColor: "#fff",
        borderColor: "rgba(120, 134, 127, 0.2)",
      }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid rgba(120, 134, 127, 0.15)" }}
      >
        <h2
          style={{
            fontSize: "0.9375rem",
            fontWeight: 600,
            color: "var(--hsd-ui-color-gray-900)",
            margin: 0,
          }}
        >
          {title}
        </h2>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--hsd-ui-color-gray-100)" }}
        >
          <Icon
            style={{ width: "16px", height: "16px", color: "var(--hsd-ui-color-gray-500)" }}
          />
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

// --- TUV Table sub-components ---

const tableStyles = {
  wrapper: {
    borderRadius: "8px",
    border: "1px solid rgba(120, 134, 127, 0.2)",
    overflow: "hidden",
  } as React.CSSProperties,
  th: {
    textAlign: "left" as const,
    padding: "12px 16px",
    fontSize: "0.6875rem",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: "var(--hsd-ui-color-gray-500)",
    backgroundColor: "var(--hsd-ui-color-gray-50)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.15)",
  } as React.CSSProperties,
  td: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    color: "var(--hsd-ui-color-gray-600)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.1)",
  } as React.CSSProperties,
  tdBold: {
    padding: "12px 16px",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--hsd-ui-color-gray-900)",
    borderBottom: "1px solid rgba(120, 134, 127, 0.1)",
  } as React.CSSProperties,
};

const emptyText: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "var(--hsd-ui-color-gray-400)",
  margin: 0,
  fontStyle: "italic",
};

// --- Verification badge mapping ---

const VERIFY_BADGE_VARIANT: Record<string, "success" | "dark"> = {
  VERIFIED: "success",
};

// --- Main component ---

interface ProfileTabProps {
  candidate: CandidateWithRelations;
  biodata: CandidateBiodata | null;
  isBiodataLoading: boolean;
}

export function ProfileTab({ candidate, biodata, isBiodataLoading: _isBiodataLoading }: ProfileTabProps) {
  return (
    <div className="mt-6 space-y-5">
      {/* Application Details */}
      <SectionCard title="Application Details" icon={Briefcase}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          <DetailItem label="Candidate Code" value={candidate.detail?.candidateCode || ""} />
          <DetailItem label="Employee Request" value={candidate.employeeRequest?.code || ""} />
          <DetailItem label="Position Applied" value={candidate.jobTitle?.name || ""} />
          <div>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--hsd-ui-color-gray-500)",
                margin: 0,
              }}
            >
              Verification Status
            </p>
            <div style={{ marginTop: "4px" }}>
              <TuvBadge
                text={candidate.verify}
                variant={VERIFY_BADGE_VARIANT[candidate.verify] || "dark"}
                size="sm"
                border
              />
            </div>
          </div>
          <DetailItem
            label="Applied Date"
            value={candidate.createdAt ? formatShortDate(candidate.createdAt) : ""}
          />
        </div>
      </SectionCard>

      {/* Personal Information */}
      <SectionCard title="Personal Information" icon={User}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          <DetailItem
            label="Birth Date"
            value={candidate.birthDate ? formatShortDate(candidate.birthDate) : ""}
          />
          <DetailItem label="Birth Place" value={candidate.birthPlace || ""} />
          <DetailItem label="Religion" value={candidate.religion || ""} />
          <DetailItem label="Marital Status" value={candidate.marritalStatus || ""} />
          <DetailItem label="Citizenship" value={candidate.citizenship || ""} />
        </div>
      </SectionCard>

      {/* Contact Information */}
      <SectionCard title="Contact Information" icon={MapPin}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-3">
            <DetailItem label="Address" value={candidate.address || ""} />
          </div>
          <DetailItem label="Resident Status" value={candidate.residentStatus || ""} />
          <DetailItem label="Mobile Phone" value={candidate.mobilePhone || ""} />
          <DetailItem label="Email" value={candidate.email} />
        </div>
      </SectionCard>

      {/* Identity Documents */}
      <SectionCard title="Identity Documents" icon={IdCard}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <DetailItem label="ID Number (KTP)" value={candidate.idNo || ""} />
          <DetailItem label="Tax ID (NPWP)" value={candidate.taxId || ""} />
          <DetailItem label="BPJS ID" value={candidate.bpjsId || ""} />
          <DetailItem label="Driving License" value={candidate.drivingLicense || ""} />
        </div>
      </SectionCard>

      {/* Educational Background */}
      <SectionCard title="Educational Background" icon={GraduationCap}>
        {biodata?.education && biodata.education.length > 0 ? (
          <div className="overflow-x-auto" style={tableStyles.wrapper}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>School / University</th>
                  <th style={tableStyles.th}>City</th>
                  <th style={tableStyles.th}>Degree</th>
                  <th style={tableStyles.th}>Major</th>
                  <th style={tableStyles.th}>Year</th>
                </tr>
              </thead>
              <tbody>
                {biodata.education.map((edu, index) => (
                  <tr
                    key={edu.id}
                    style={
                      index === biodata.education.length - 1
                        ? { borderBottom: "none" }
                        : undefined
                    }
                  >
                    <td style={tableStyles.tdBold}>{edu.schoolUniversity}</td>
                    <td style={tableStyles.td}>{edu.city}</td>
                    <td style={tableStyles.td}>{edu.degree}</td>
                    <td style={tableStyles.td}>{edu.major}</td>
                    <td style={tableStyles.td}>{edu.yearGraduate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={emptyText}>No educational background data available</p>
        )}
      </SectionCard>

      {/* Work Experience */}
      <SectionCard title="Work Experience" icon={Building2}>
        {biodata?.workExperience && biodata.workExperience.length > 0 ? (
          <div className="overflow-x-auto" style={tableStyles.wrapper}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Company</th>
                  <th style={tableStyles.th}>City</th>
                  <th style={tableStyles.th}>Job Title</th>
                  <th style={tableStyles.th}>Period</th>
                  <th style={tableStyles.th}>Length</th>
                </tr>
              </thead>
              <tbody>
                {biodata.workExperience.map((exp, index) => (
                  <tr
                    key={exp.id}
                    style={
                      index === biodata.workExperience.length - 1
                        ? { borderBottom: "none" }
                        : undefined
                    }
                  >
                    <td style={tableStyles.tdBold}>{exp.company}</td>
                    <td style={tableStyles.td}>{exp.city}</td>
                    <td style={tableStyles.td}>{exp.jobTitle}</td>
                    <td style={tableStyles.td}>{exp.period}</td>
                    <td style={tableStyles.td}>{exp.lengthOfWorking}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={emptyText}>No work experience data available</p>
        )}
      </SectionCard>

      {/* Family Members */}
      <SectionCard title="Family Members" icon={Users}>
        {biodata?.family && biodata.family.length > 0 ? (
          <div className="overflow-x-auto" style={tableStyles.wrapper}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Name</th>
                  <th style={tableStyles.th}>Relation</th>
                  <th style={tableStyles.th}>Age</th>
                  <th style={tableStyles.th}>Education</th>
                  <th style={tableStyles.th}>Work</th>
                </tr>
              </thead>
              <tbody>
                {biodata.family.map((member, index) => (
                  <tr
                    key={member.id}
                    style={
                      index === biodata.family.length - 1
                        ? { borderBottom: "none" }
                        : undefined
                    }
                  >
                    <td style={tableStyles.tdBold}>{member.name}</td>
                    <td style={tableStyles.td}>{member.relation}</td>
                    <td style={tableStyles.td}>{member.age}</td>
                    <td style={tableStyles.td}>{member.education}</td>
                    <td style={tableStyles.td}>{member.work}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={emptyText}>No family member data available</p>
        )}
      </SectionCard>

      {/* Course / Training Experience */}
      <SectionCard title="Course / Training Experience" icon={Award}>
        {biodata?.training && biodata.training.length > 0 ? (
          <div className="overflow-x-auto" style={tableStyles.wrapper}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Course Topic</th>
                  <th style={tableStyles.th}>Provider</th>
                  <th style={tableStyles.th}>Year</th>
                  <th style={tableStyles.th}>City</th>
                  <th style={tableStyles.th}>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {biodata.training.map((course, index) => (
                  <tr
                    key={course.id}
                    style={
                      index === biodata.training.length - 1
                        ? { borderBottom: "none" }
                        : undefined
                    }
                  >
                    <td style={tableStyles.tdBold}>{course.courseTopic}</td>
                    <td style={tableStyles.td}>{course.provider}</td>
                    <td style={tableStyles.td}>{course.year}</td>
                    <td style={tableStyles.td}>{course.city}</td>
                    <td style={tableStyles.td}>{course.certificate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={emptyText}>No course/training data available</p>
        )}
      </SectionCard>

      {/* Self Assessment */}
      <SectionCard title="Self Assessment" icon={ClipboardList}>
        {biodata?.selfAssessment ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { question: "What caused you to leave your last job?", answer: biodata.selfAssessment.reasonLeavingLastJob },
              { question: "Describe your last job description!", answer: biodata.selfAssessment.lastJobDescription },
              { question: "What is your reason/purpose for applying to this company?", answer: biodata.selfAssessment.reasonApplying },
              { question: "What tasks/jobs are you good at, related to the position you are applying for?", answer: biodata.selfAssessment.relevantSkills },
              { question: "Last salary received?", answer: biodata.selfAssessment.lastSalary },
              { question: "What salary do you expect?", answer: biodata.selfAssessment.expectedSalary },
              { question: "Active language?", answer: biodata.selfAssessment.activeLanguage },
              { question: "Are you willing to transfer/rotate at work?", answer: biodata.selfAssessment.willingToTransfer },
              { question: "Are you willing to do double work for the company due to limited personnel?", answer: biodata.selfAssessment.willingToDoubleWork },
              { question: "Who are the employees you know at this company?", answer: biodata.selfAssessment.knownEmployees },
              { question: "When are you ready to work?", answer: biodata.selfAssessment.readyToWork },
              { question: "What is your relationship with the employee?", answer: biodata.selfAssessment.employeeRelationship },
              { question: "Your reference contact name", answer: biodata.selfAssessment.referenceContactName },
              { question: "Your reference contact phone no", answer: biodata.selfAssessment.referenceContactPhone },
            ].map((item, index) => (
              <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--hsd-ui-color-gray-700)",
                    margin: 0,
                  }}
                >
                  {item.question}
                </p>
                <div
                  style={{
                    backgroundColor: "rgba(120, 134, 127, 0.06)",
                    border: "1px solid rgba(120, 134, 127, 0.2)",
                    borderRadius: "4px",
                    padding: "10px 12px",
                    minHeight: "38px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: item.answer
                        ? "var(--hsd-ui-color-gray-900)"
                        : "var(--hsd-ui-color-gray-400)",
                      margin: 0,
                      lineHeight: 1.5,
                      fontStyle: item.answer ? "normal" : "italic",
                    }}
                  >
                    {item.answer || "No Data"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={emptyText}>No self assessment data available</p>
        )}
      </SectionCard>
    </div>
  );
}
